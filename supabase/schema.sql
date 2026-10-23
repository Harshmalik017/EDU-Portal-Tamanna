-- OMR Portal schema v0.3.1. Safe to re-run on an existing database.
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
