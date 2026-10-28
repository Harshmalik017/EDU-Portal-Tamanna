-- OMR Portal schema v0.3.1. Safe to re-run on an existing database.
-- Legacy students.name values are migrated to roll_number below.
create extension if not exists "pgcrypto";
create table if not exists students (id uuid primary key default gen_random_uuid(), name text not null, class text, gender text, school text, created_at timestamptz default now());
create table if not exists answer_keys (test_code text, question_no int, correct_option text check (correct_option in ('A','B','C','D')), primary key (test_code, question_no));
create table if not exists submissions (id uuid primary key default gen_random_uuid(), student_id uuid references students on delete cascade, responses jsonb, created_at timestamptz default now());
alter table submissions add column if not exists image_paths text[];
create table if not exists scores (id uuid primary key default gen_random_uuid(), student_id uuid references students on delete cascade, test_code text, correct int, wrong int, blank int, flagged int);
create table if not exists settings (key text primary key, value jsonb);
create table if not exists admins (user_id uuid primary key references auth.users on delete cascade);

create index if not exists scores_student_idx on scores (student_id);
create index if not exists submissions_student_idx on submissions (student_id);
create index if not exists students_created_idx on students (created_at desc);

-- Only users listed in `admins` may touch data (not just any signed-in user).
create or replace function is_admin() returns boolean language sql security definer stable set search_path = public
as $$ select exists (select 1 from admins where user_id = auth.uid()) $$;

alter table admins enable row level security; -- no policies: not readable through the API
do $$ declare t text; begin
  foreach t in array array['students','answer_keys','submissions','scores','settings'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "admin all" on %I', t);
    execute format('create policy "admin all" on %I for all to authenticated using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

insert into storage.buckets (id, name, public) values ('sheets', 'sheets', false) on conflict do nothing;
drop policy if exists "admin sheets" on storage.objects;
create policy "admin sheets" on storage.objects for all to authenticated using (bucket_id = 'sheets' and is_admin()) with check (bucket_id = 'sheets' and is_admin());

-- AFTER creating your login user (Authentication > Users), make yourself an admin:
-- insert into admins (user_id) select id from auth.users where email = 'you@school.org';

-- v0.4.0: Tamanna rules (exclusion of patterned sheets, cross-verification)
alter table students add column if not exists excluded boolean not null default false;
alter table students add column if not exists exclude_reason text;
alter table students add column if not exists verification_status text not null default 'pending' check (verification_status in ('pending','verified','mismatch'));
alter table students add column if not exists verified_by text;
alter table students add column if not exists verified_at timestamptz;
alter table students add column if not exists manual_scores jsonb;
alter table students add column if not exists verification_note text;
create index if not exists students_verification_idx on students (verification_status);
-- Total scores and score-distribution views are not part of the booklet, so they were removed.
drop view if exists test_stats;
drop view if exists student_totals;

-- v0.10: separate names from legacy roll numbers, preserving existing identities.
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'students' and column_name = 'roll_number') then
    alter table public.students add column roll_number text;
    update public.students set roll_number = name, name = '' where id is not null;
  end if;
end $$;
alter table students alter column roll_number set not null;
alter table students add column if not exists block text;
alter table students add column if not exists district text;
alter table students add column if not exists import_hash text;
alter table students add column if not exists source_file text;
alter table students add column if not exists review_issues text[] not null default '{}';
create unique index if not exists students_import_hash_idx on students(import_hash) where import_hash is not null;
-- Legacy duplicates must be resolved explicitly before installing this constraint.
create unique index if not exists students_identity_idx on students(school, class, roll_number);
alter table submissions add column if not exists pdf_path text;
alter table submissions add column if not exists source_sha256 text;
alter table submissions add column if not exists key_hash text;

create or replace function reset_student_verification() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.class is distinct from old.class or new.gender is distinct from old.gender then
    new.verification_status := 'pending';
    new.verified_by := null;
    new.verified_at := null;
    new.manual_scores := null;
    new.verification_note := 'Class or gender changed. Check the report again.';
  end if;
  return new;
end $$;
drop trigger if exists student_demographics_changed on students;
create trigger student_demographics_changed before update on students
for each row execute function reset_student_verification();

-- Atomic per-student import; storage uploads are verified separately by the local script.
create or replace function import_copy(p_student jsonb, p_submission jsonb)
returns uuid language plpgsql security invoker set search_path = public as $$
declare existing_id uuid; new_id uuid;
begin
  if not (is_admin() or auth.role() = 'service_role') then
    raise exception 'Admin access required';
  end if;
  if coalesce(p_student->>'import_hash', '') !~ '^[a-f0-9]{64}$'
     or coalesce(p_student->>'roll_number', '') !~ '^[0-9]{5}$'
     or coalesce(p_submission->>'source_sha256', '') !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid import identity';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_student->>'import_hash', 0));
  select id into existing_id from students where import_hash = p_student->>'import_hash';
  if existing_id is not null then return existing_id; end if;
  new_id := (p_student->>'id')::uuid;
  insert into students(id, name, roll_number, class, gender, school, block, district, import_hash, source_file, review_issues)
  values(new_id, p_student->>'name', p_student->>'roll_number', p_student->>'class', p_student->>'gender',
    p_student->>'school', p_student->>'block', p_student->>'district', p_student->>'import_hash', p_student->>'source_file',
    array(select jsonb_array_elements_text(p_student->'review_issues')));
  insert into submissions(student_id, responses, image_paths, pdf_path, source_sha256, key_hash)
  values(new_id, p_submission->'responses',
    array(select jsonb_array_elements_text(p_submission->'image_paths')),
    p_submission->>'pdf_path', p_submission->>'source_sha256', null);
  return new_id;
end $$;
revoke all on function import_copy(jsonb, jsonb) from public, anon;
grant execute on function import_copy(jsonb, jsonb) to authenticated, service_role;

create or replace function answer_key_hash() returns text
language sql stable set search_path = public, extensions as $$
  select encode(digest(coalesce(string_agg(test_code || ':' || question_no || ':' || correct_option, '|' order by test_code, question_no), ''), 'sha256'), 'hex')
  from answer_keys
$$;

create or replace function invalidate_key_scores() returns trigger
language plpgsql set search_path = public as $$
declare fingerprint text := answer_key_hash(); old_hash text;
begin
  select value #>> '{}' into old_hash from settings where key = 'answer_key_hash';
  if old_hash is not distinct from fingerprint then return null; end if;
  delete from scores where student_id is not null;
  update submissions set key_hash = null where id is not null;
  update students set verification_status = 'pending', manual_scores = null,
    verified_at = null, verified_by = null, verification_note = 'Answer key changed. Re-score and check this sheet.' where id is not null;
  insert into settings(key, value) values('answer_key_hash', to_jsonb(fingerprint))
  on conflict(key) do update set value = excluded.value;
  return null;
end $$;
drop trigger if exists answer_key_changed on answer_keys;
create trigger answer_key_changed after insert or update or delete on answer_keys
for each statement execute function invalidate_key_scores();

create or replace function score_copy(p_student_id uuid, p_expected_key_hash text)
returns text language plpgsql security invoker set search_path = public as $$
declare
  t record; marked jsonb; answer text; correct_answer text; fingerprint text;
  n_correct int; n_wrong int; n_blank int; n_flagged int; i int;
begin
  if not (is_admin() or auth.role() = 'service_role') then raise exception 'Admin access required'; end if;
  -- Prevent a key edit racing the scoring transaction.
  lock table answer_keys in share mode;
  fingerprint := answer_key_hash();
  if fingerprint is distinct from p_expected_key_hash then raise exception 'Answer key changed. Read the key again.'; end if;
  perform 1 from students where id = p_student_id for update;
  if not found then raise exception 'Student not found'; end if;
  select responses into marked from submissions where student_id = p_student_id order by created_at desc limit 1;
  if marked is null then raise exception 'No saved responses'; end if;
  if (select count(*) from answer_keys) <> 240 then raise exception 'Official key needs exactly 240 answers'; end if;
  delete from scores where student_id = p_student_id;
  for t in select * from (values ('LA',30),('AR',30),('VR',30),('MR',30),('NA',30),('SA',30),('PA',60)) as tests(code, items) loop
    if jsonb_typeof(marked->t.code) is distinct from 'array' or jsonb_array_length(marked->t.code) <> t.items then
      raise exception 'Incomplete responses for %', t.code;
    end if;
    n_correct := 0; n_wrong := 0; n_blank := 0; n_flagged := 0;
    for i in 1..t.items loop
      select correct_option into correct_answer from answer_keys where test_code = t.code and question_no = i;
      if correct_answer is null then raise exception 'Incomplete official key for %', t.code; end if;
      answer := marked->t.code->>(i-1);
      if answer is null then n_blank := n_blank + 1;
      elsif answer = 'MULTI' then n_flagged := n_flagged + 1;
      elsif answer not in ('A','B','C','D') then raise exception 'Uncertain response in % question %', t.code, i;
      elsif answer = correct_answer then n_correct := n_correct + 1;
      else n_wrong := n_wrong + 1;
      end if;
    end loop;
    insert into scores(student_id,test_code,correct,wrong,blank,flagged)
    values(p_student_id,t.code,n_correct,n_wrong,n_blank,n_flagged);
  end loop;
  update submissions set key_hash = fingerprint where student_id = p_student_id;
  update students set verification_status = 'pending', manual_scores = null, verified_by = null, verified_at = null,
    verification_note = 'Scored with the current official key. Pending hand check.' where id = p_student_id;
  return fingerprint;
end $$;
revoke all on function score_copy(uuid,text) from public, anon;
grant execute on function score_copy(uuid,text) to authenticated, service_role;

create or replace function review_copy(p_student_id uuid, p_responses jsonb, p_expected_key_hash text)
returns text language plpgsql security invoker set search_path = public as $$
begin
  if not (is_admin() or auth.role() = 'service_role') then raise exception 'Admin access required'; end if;
  lock table answer_keys in share mode;
  perform 1 from students where id = p_student_id for update;
  if not found then raise exception 'Student not found'; end if;
  update submissions set responses = p_responses where id = (
    select id from submissions where student_id = p_student_id order by created_at desc limit 1
  );
  perform score_copy(p_student_id, p_expected_key_hash);
  update students set review_issues = array(
    select issue from unnest(review_issues) as issue
    where issue like 'Name proposed%' or issue like 'Class X%' or issue like 'Male is%'
  ) || array['Answers reviewed. Pending hand check.'] where id = p_student_id;
  return p_expected_key_hash;
end $$;
revoke all on function review_copy(uuid,jsonb,text) from public, anon;
grant execute on function review_copy(uuid,jsonb,text) to authenticated, service_role;
