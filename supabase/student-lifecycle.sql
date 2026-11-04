-- Additive archive/restore and permanent roll allocation. Run after portal-update.sql.
alter table public.students add column if not exists archived_at timestamptz;
alter table public.students add column if not exists purge_token uuid;
alter table public.students add column if not exists purge_started_at timestamptz;
create index if not exists students_archive_idx on public.students(archived_at) where archived_at is not null;

create table if not exists public.student_roll_counter (
  singleton boolean primary key default true check (singleton),
  last_roll integer not null check (last_roll between 10000 and 99999)
);
alter table public.student_roll_counter enable row level security;
drop policy if exists "admin read roll counter" on public.student_roll_counter;
create policy "admin read roll counter" on public.student_roll_counter for select to authenticated using (public.is_admin());
revoke all on public.student_roll_counter from anon, authenticated;
grant select on public.student_roll_counter to authenticated;
insert into public.student_roll_counter(singleton, last_roll)
select true, greatest(10000, coalesce(max(roll_number::integer), 10000))
from public.students where roll_number ~ '^[0-9]{5}$'
on conflict(singleton) do update set last_roll = greatest(student_roll_counter.last_roll, excluded.last_roll);

create or replace function public.assign_student_roll() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.roll_number is null then
    update student_roll_counter set last_roll = last_roll + 1
      where singleton and last_roll < 99999 returning last_roll::text into new.roll_number;
    if not found then raise exception 'Could not allocate a roll number: five-digit rolls are exhausted'; end if;
  elsif new.roll_number ~ '^[0-9]{5}$' then
    update student_roll_counter set last_roll = greatest(last_roll, new.roll_number::integer) where singleton;
  else raise exception 'Could not allocate a roll number: expected five digits';
  end if;
  return new;
end $$;
revoke all on function public.assign_student_roll() from public, anon, authenticated;
drop trigger if exists student_roll_assigned on public.students;
create trigger student_roll_assigned before insert on public.students for each row execute function public.assign_student_roll();

create or replace function public.protect_student_roll() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.roll_number is distinct from old.roll_number then raise exception 'Roll numbers cannot be changed'; end if;
  return new;
end $$;
drop trigger if exists student_roll_immutable on public.students;
create trigger student_roll_immutable before update on public.students for each row execute function public.protect_student_roll();

create or replace function public.archive_students(p_ids uuid[], p_restore boolean default false) returns integer
language plpgsql security invoker set search_path = public as $$
declare expected integer; affected integer;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  select count(distinct id) into expected from unnest(p_ids) id;
  if expected = 0 or expected > 10000 or expected <> cardinality(p_ids) then raise exception 'Select between 1 and 10000 distinct students'; end if;
  perform 1 from students where id = any(p_ids) order by id for update;
  if p_restore then
    update students set archived_at = null, purge_token = null, purge_started_at = null
      where id = any(p_ids) and archived_at > now() - interval '30 days' and purge_token is null;
  else
    update students set archived_at = now()
      where id = any(p_ids) and archived_at is null;
  end if;
  get diagnostics affected = row_count;
  if affected <> expected then raise exception 'Could not update students: a selected record changed or its restore period expired'; end if;
  return affected;
end $$;
revoke all on function public.archive_students(uuid[],boolean) from public, anon;
grant execute on function public.archive_students(uuid[],boolean) to authenticated;

create or replace function public.archived_students() returns setof jsonb
language plpgsql stable security invoker set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  return query select jsonb_build_object(
    'id', id, 'name', name, 'roll_number', roll_number, 'class', class, 'gender', gender,
    'school', school, 'archived_at', archived_at, 'deletion_pending', purge_token is not null,
    'report_ready', false, 'scores', '[]'::jsonb
  ) from students where archived_at is not null order by archived_at desc, id;
end $$;
revoke all on function public.archived_students() from public, anon;
grant execute on function public.archived_students() to authenticated;

create or replace function public.student_purge_paths(p_id uuid) returns text[]
language sql stable set search_path = public as $$
  select coalesce(array_agg(distinct path), '{}'::text[]) from (
    select unnest(coalesce(image_paths, '{}'::text[])) as path from submissions where student_id = p_id
    union select pdf_path from submissions where student_id = p_id and pdf_path is not null
    union select name from storage.objects where bucket_id = 'sheets' and starts_with(name, p_id::text || '/')
  ) files where path is not null;
$$;
revoke all on function public.student_purge_paths(uuid) from public, anon, authenticated;

-- A lease prevents concurrent cleanup jobs. Expired restores are always rejected.
create or replace function public.claim_student_purges(p_limit integer default 25) returns setof jsonb
language plpgsql security definer set search_path = public as $$
declare person record; token uuid; paths text[];
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'Service access required'; end if;
  if p_limit is null or p_limit < 1 or p_limit > 100 then raise exception 'Invalid cleanup batch size'; end if;
  for person in select id from students
    where archived_at <= now() - interval '30 days'
      and (purge_started_at is null or purge_started_at < now() - interval '15 minutes')
    order by archived_at, id for update skip locked limit p_limit
  loop
    token := gen_random_uuid();
    update students set purge_token = token, purge_started_at = now() where id = person.id;
    paths := public.student_purge_paths(person.id);
    return next jsonb_build_object('id', person.id, 'token', token, 'paths', to_jsonb(paths));
  end loop;
end $$;
revoke all on function public.claim_student_purges(integer) from public, anon, authenticated;
grant execute on function public.claim_student_purges(integer) to service_role;

create or replace function public.claim_selected_student_purges(p_ids uuid[]) returns setof jsonb
language plpgsql security definer set search_path = public as $$
declare expected integer; person record; token uuid;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  select count(distinct id) into expected from unnest(p_ids) id;
  if expected = 0 or expected > 10000 or expected <> cardinality(p_ids) then raise exception 'Select between 1 and 10000 distinct students'; end if;
  perform 1 from students where id = any(p_ids) order by id for update;
  if (select count(*) from students where id = any(p_ids) and archived_at is not null
      and (purge_started_at is null or purge_started_at < now() - interval '15 minutes')) <> expected then
    raise exception 'Could not delete: a selected student is active, missing, or already being deleted';
  end if;
  for person in select id from students where id = any(p_ids) order by id loop
    token := gen_random_uuid();
    update students set purge_token = token, purge_started_at = now() where id = person.id;
    return next jsonb_build_object('id', person.id, 'token', token, 'paths', to_jsonb(public.student_purge_paths(person.id)));
  end loop;
end $$;
revoke all on function public.claim_selected_student_purges(uuid[]) from public, anon;
grant execute on function public.claim_selected_student_purges(uuid[]) to authenticated;

create or replace function public.finish_student_purge(p_id uuid, p_token uuid) returns void
language plpgsql security definer set search_path = public as $$
declare admin_access boolean := public.is_admin();
begin
  if not admin_access and coalesce(auth.role(), '') <> 'service_role' then raise exception 'Admin access required'; end if;
  perform 1 from students where id = p_id and purge_token = p_token
    and archived_at is not null and (admin_access or archived_at <= now() - interval '30 days') for update;
  if not found then raise exception 'Could not delete: cleanup lease changed'; end if;
  if exists(select 1 from storage.objects where bucket_id = 'sheets' and starts_with(name, p_id::text || '/')) then
    raise exception 'Could not delete: student files still exist';
  end if;
  delete from students where id = p_id;
end $$;
revoke all on function public.finish_student_purge(uuid,uuid) from public, anon, authenticated;
grant execute on function public.finish_student_purge(uuid,uuid) to authenticated, service_role;

create or replace function public.release_student_purge(p_id uuid, p_token uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and coalesce(auth.role(), '') <> 'service_role' then raise exception 'Admin access required'; end if;
  -- Keep the token: partial file deletion must never make this copy restorable.
  update students set purge_started_at = null where id = p_id and purge_token = p_token and archived_at is not null;
end $$;
revoke all on function public.release_student_purge(uuid,uuid) from public, anon;
grant execute on function public.release_student_purge(uuid,uuid) to authenticated, service_role;

-- Answer edits and final scoring must not race an archive operation.
create or replace function public.require_active_student() returns trigger
language plpgsql set search_path = public as $$
declare archived timestamptz;
begin
  select archived_at into archived from students where id = new.student_id for update;
  if archived is not null then raise exception 'Could not save: student is archived'; end if;
  return new;
end $$;
drop trigger if exists submission_active_student on public.submissions;
create trigger submission_active_student before insert or update on public.submissions for each row execute function public.require_active_student();
drop trigger if exists score_active_student on public.scores;
create trigger score_active_student before insert or update on public.scores for each row execute function public.require_active_student();
