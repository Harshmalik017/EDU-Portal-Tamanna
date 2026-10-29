-- Additive portal update. Run after schema.sql; safe to re-run.
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  category text not null check (category in ('scans','scoring','students','answer_key','settings','account')),
  action text not null,
  actor_id uuid,
  actor_email text,
  student_id uuid,
  detail text,
  source_id uuid unique
);
create index if not exists activity_logs_time_idx on public.activity_logs(created_at desc, id desc);
create index if not exists activity_logs_category_time_idx on public.activity_logs(category, created_at desc, id desc);
alter table public.activity_logs enable row level security;
drop policy if exists "admin read logs" on public.activity_logs;
create policy "admin read logs" on public.activity_logs for select to authenticated using (public.is_admin());
revoke all on public.activity_logs from anon, authenticated;
grant select on public.activity_logs to authenticated;

create or replace function public.record_portal_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare row_data jsonb; category_name text; description text; student uuid; extra text; roll text;
begin
  row_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  case tg_table_name
    when 'students' then
      if tg_op = 'UPDATE' and
        (to_jsonb(new) - array['verification_status','verified_by','verified_at','manual_scores','verification_note','review_issues']) =
        (to_jsonb(old) - array['verification_status','verified_by','verified_at','manual_scores','verification_note','review_issues']) then
        return null;
      end if;
      category_name := 'students'; student := (row_data->>'id')::uuid;
      description := case tg_op when 'INSERT' then 'Student added' when 'DELETE' then 'Student deleted' else 'Student profile updated' end;
      extra := 'Roll ' || coalesce(row_data->>'roll_number', 'not recorded');
    when 'submissions' then
      category_name := 'scans'; student := (row_data->>'student_id')::uuid;
      if tg_op = 'UPDATE' and new.responses is not distinct from old.responses then return null; end if;
      description := case tg_op when 'INSERT' then 'Sheet uploaded' when 'DELETE' then 'Sheet removed' else 'Scan answers corrected' end;
    when 'scores' then
      category_name := 'scoring'; student := (row_data->>'student_id')::uuid;
      description := case tg_op when 'DELETE' then 'Section score cleared' else 'Section scored' end;
      extra := row_data->>'test_code';
    when 'answer_keys' then
      category_name := 'answer_key'; description := 'Answer key ' || lower(tg_op);
      extra := (row_data->>'test_code') || ' question ' || (row_data->>'question_no');
    when 'settings' then
      category_name := 'settings'; description := 'Setting ' || lower(tg_op);
      extra := row_data->>'key';
    else raise exception 'Unsupported activity source';
  end case;
  if student is not null and tg_table_name <> 'students' then
    select roll_number into roll from public.students where id = student;
    extra := concat_ws(' · ', case when roll is not null then 'Roll ' || roll end, extra);
  end if;
  insert into public.activity_logs(category, action, actor_id, actor_email, student_id, detail)
  values(category_name, description, auth.uid(), auth.jwt()->>'email', student, extra);
  return null;
end $$;
revoke all on function public.record_portal_activity() from public, anon, authenticated;
do $$ declare table_name text; begin
  foreach table_name in array array['students','submissions','scores','answer_keys','settings'] loop
    execute format('drop trigger if exists portal_activity on public.%I', table_name);
    execute format('create trigger portal_activity after insert or update or delete on public.%I for each row execute function public.record_portal_activity()', table_name);
  end loop;
end $$;

-- Only historical uploads have trustworthy event timestamps; do not invent older edits.
insert into public.activity_logs(created_at, category, action, student_id, detail, source_id)
select sub.created_at, 'scans', 'Sheet uploaded', sub.student_id, 'Historical upload · Roll ' || s.roll_number, sub.id
from public.submissions sub join public.students s on s.id = sub.student_id
on conflict (source_id) do nothing;

create or replace function public.log_account_activity(p_action text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_action not in ('Profile updated','Password changed') or p_action is null then raise exception 'Invalid account activity'; end if;
  insert into public.activity_logs(category, action, actor_id, actor_email, detail)
  values('account', p_action, auth.uid(), auth.jwt()->>'email', 'Reported by account settings');
end $$;
revoke all on function public.log_account_activity(text) from public, anon;
grant execute on function public.log_account_activity(text) to authenticated;

-- Compact, current-key scan marks. Unreadable answers are counted, never guessed.
-- Provisional marks do not populate final scores or make reports verified.
create index if not exists submissions_latest_idx on public.submissions(student_id, created_at desc, id desc);
create or replace function public.scan_results() returns setof jsonb
language plpgsql stable security invoker set search_path = public as $$
declare fingerprint text;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if (select count(*) from public.answer_keys) <> 240 or exists (
    select 1 from (values ('LA',30),('AR',30),('VR',30),('MR',30),('NA',30),('SA',30),('PA',60)) as tests(code, items)
    cross join lateral generate_series(1, tests.items) as q(n)
    left join public.answer_keys k on k.test_code = tests.code and k.question_no = q.n
    where k.correct_option is null or k.correct_option not in ('A','B','C','D')
  ) then raise exception 'Could not load marks: the official answer key is incomplete'; end if;
  fingerprint := public.answer_key_hash();
  return query
  select jsonb_build_object(
    'id', s.id, 'name', s.name, 'roll_number', s.roll_number, 'class', s.class,
    'gender', s.gender, 'school', s.school, 'block', s.block, 'district', s.district,
    'excluded', s.excluded, 'exclude_reason', s.exclude_reason,
    'report_ready', coalesce(not s.excluded and submission.key_hash = fingerprint
      and jsonb_array_length(marks.sections) = 7
      and not exists(select 1 from jsonb_array_elements(marks.sections) section where (section->>'uncertain')::int > 0)
      and (select count(*) = 7 from public.scores final where final.student_id = s.id
        and final.test_code in ('LA','AR','VR','MR','NA','SA','PA')), false),
    'scores', coalesce(marks.sections, '[]'::jsonb)
  )
  from public.students s
  left join lateral (
    select responses, key_hash from public.submissions where student_id = s.id order by created_at desc, id desc limit 1
  ) submission on true
  left join lateral (
    select jsonb_agg(jsonb_build_object('test_code', test.code, 'correct', counts.correct, 'blank', counts.blank, 'uncertain', counts.uncertain) order by test.code) as sections
    from (values ('LA',30),('AR',30),('VR',30),('MR',30),('NA',30),('SA',30),('PA',60)) as test(code, items)
    cross join lateral (
      select
        count(*) filter (where response.answer = k.correct_option) as correct,
        count(*) filter (where response.present and response.answer is null) as blank,
        count(*) filter (where not response.present or (response.answer is not null and response.answer not in ('A','B','C','D','MULTI'))) as uncertain
      from generate_series(1, test.items) as q(n)
      join public.answer_keys k on k.test_code = test.code and k.question_no = q.n
      cross join lateral (
        select
          case when jsonb_typeof(submission.responses->test.code) = 'array' then submission.responses->test.code->>(q.n-1) end as answer,
          case when jsonb_typeof(submission.responses->test.code) = 'array' then jsonb_array_length(submission.responses->test.code) >= q.n else false end as present
      ) response
    ) counts
    where submission.responses is not null
  ) marks on true
  order by s.roll_number;
end $$;
revoke all on function public.scan_results() from public, anon;
grant execute on function public.scan_results() to authenticated;
