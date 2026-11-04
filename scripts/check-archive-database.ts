import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

async function main() {
  process.loadEnvFile(".env.local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (url !== "https://zhrlfkvmmrgwainsfyha.supabase.co" || !accessToken) throw new Error("Could not validate archive database access.");
  const lifecycle = await readFile("supabase/student-lifecycle.sql", "utf8");
  const portal = await readFile("supabase/portal-update.sql", "utf8");
  const activityStart = portal.indexOf("-- Student identity snapshots");
  const activityEnd = portal.indexOf("revoke all on function public.record_portal_activity()");
  const resultsStart = portal.indexOf("create or replace function public.scan_results()");
  if (activityStart < 0 || activityEnd < 0 || resultsStart < 0) throw new Error("Could not find lifecycle dependencies.");
  const migration = `${lifecycle}\n${portal.slice(activityStart, activityEnd)}\n${portal.slice(resultsStart)}`;
  async function query(sql: string) {
    const response = await fetch("https://api.supabase.com/v1/projects/zhrlfkvmmrgwainsfyha/database/query", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: sql }),
    });
    if (!response.ok) throw new Error(`Could not check archive database (${response.status}): ${await response.text()}`);
  }
  await query(`begin;
${migration}
do $test$
declare admin_id uuid; first_id uuid := gen_random_uuid(); second_id uuid := gen_random_uuid();
  third_id uuid := gen_random_uuid(); fourth_id uuid := gen_random_uuid(); baseline integer; first_roll text;
  second_roll text; fourth_roll text; claimed jsonb; claimed_token uuid; second_token uuid; rejected boolean; fingerprint text; responses jsonb;
begin
  select user_id into admin_id from admins limit 1;
  if admin_id is null then raise exception 'Expected an existing admin'; end if;
  perform set_config('request.jwt.claims', jsonb_build_object('role','authenticated','sub',admin_id)::text, true);
  select last_roll into baseline from student_roll_counter where singleton;
  if baseline > 99994 then raise exception 'Insufficient unused roll numbers for transaction checks'; end if;
  insert into students(id,name,class,gender,school) values(first_id,'Synthetic archive check','X','Male','Synthetic archive transaction') returning roll_number into first_roll;
  insert into students(id,name,class,gender,school) values(second_id,'Synthetic archive check','X','Male','Synthetic archive transaction') returning roll_number into second_roll;
  update students set name='Synthetic updated identity', gender='Female' where id=first_id;
  if first_roll::integer <> baseline + 1 or second_roll::integer <> baseline + 2 then raise exception 'Roll allocation is not incremental'; end if;
  rejected := false;
  begin update students set roll_number = '99999' where id = first_id;
  exception when others then
    if sqlerrm <> 'Roll numbers cannot be changed' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Roll edit was accepted'; end if;
  select jsonb_object_agg(test_code, answers) into responses from (
    select test_code, jsonb_agg(correct_option order by question_no) answers from answer_keys group by test_code
  ) sections;
  insert into submissions(student_id,responses) values(first_id,responses);
  fingerprint := answer_key_hash();
  perform score_copy(first_id,fingerprint);
  if archive_students(array[first_id,second_id]) <> 2 then raise exception 'Bulk archive failed'; end if;
  if exists(select 1 from scan_results() r where r->>'id' in (first_id::text,second_id::text)) then raise exception 'Archived students appear in active results'; end if;
  if not exists(select 1 from archived_students() r where r->>'id' = first_id::text) then raise exception 'Archive list omitted student'; end if;
  if (select count(*) from scores where student_id=first_id) <> 7 then raise exception 'Archive destroyed scores'; end if;
  rejected := false;
  begin perform review_copy(first_id,responses,fingerprint);
  exception when others then
    if sqlerrm <> 'Could not save: student is archived' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Archived sheet was edited'; end if;
  if archive_students(array[first_id],true) <> 1 then raise exception 'Restore failed'; end if;
  if not exists(select 1 from activity_logs where student_id=first_id and action='Student archived')
    or not exists(select 1 from activity_logs where student_id=first_id and action='Student restored') then raise exception 'Archive audit events were not recorded'; end if;
  if not exists(select 1 from scan_results() r where r->>'id'=first_id::text and r->>'report_ready'='true') then raise exception 'Restored report was not preserved'; end if;
  rejected := false;
  begin perform archive_students(array[first_id,second_id]);
  exception when others then
    if sqlerrm not like 'Could not update students:%' then raise; end if;
    rejected := true;
  end;
  if not rejected or (select archived_at from students where id=first_id) is not null then raise exception 'Bulk archive was not atomic'; end if;
  rejected := false;
  begin perform claim_selected_student_purges(array[first_id,second_id]);
  exception when others then
    if sqlerrm not like 'Could not delete:%' then raise; end if;
    rejected := true;
  end;
  if not rejected or exists(select 1 from students where id=any(array[first_id,second_id]) and purge_token is not null) then raise exception 'Mixed active/archive permanent deletion was not atomic'; end if;
  perform archive_students(array[first_id]);
  update students set archived_at=now()-interval '30 days' where id=first_id;
  update students set archived_at=now()-interval '31 days' where id=second_id;
  rejected := false;
  begin perform archive_students(array[first_id],true);
  exception when others then
    if sqlerrm not like 'Could not update students:%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Restore accepted at the exact 30-day cutoff'; end if;
  insert into students(id,name,class,gender,school,archived_at) values(third_id,'Synthetic archive check','X','Male','Synthetic archive transaction',now()-interval '29 days');
  insert into storage.objects(bucket_id,name) values('sheets',second_id::text || '/synthetic-rollback-only.jpg');
  perform set_config('request.jwt.claims', jsonb_build_object('role','service_role')::text, true);
  for claimed in select * from claim_student_purges(100) loop
    if claimed->>'id'=third_id::text then raise exception 'Cleanup claimed a student before 30 days'; end if;
    if claimed->>'id'=first_id::text then claimed_token := (claimed->>'token')::uuid; end if;
    if claimed->>'id'=second_id::text then
      second_token := (claimed->>'token')::uuid;
      if not (claimed->'paths' ? (second_id::text || '/synthetic-rollback-only.jpg')) then raise exception 'Cleanup omitted an owned storage file'; end if;
    end if;
  end loop;
  if claimed_token is null then raise exception 'Cleanup omitted the exact 30-day boundary'; end if;
  if exists(select 1 from claim_student_purges(100) r where r->>'id'=first_id::text) then raise exception 'Active cleanup lease was reclaimed'; end if;
  rejected := false;
  begin perform finish_student_purge(first_id,gen_random_uuid());
  exception when others then
    if sqlerrm <> 'Could not delete: cleanup lease changed' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Wrong cleanup token accepted'; end if;
  rejected := false;
  begin perform finish_student_purge(second_id,second_token);
  exception when others then
    if sqlerrm <> 'Could not delete: student files still exist' then raise; end if;
    rejected := true;
  end;
  if not rejected or not exists(select 1 from students where id=second_id) then raise exception 'Purge discarded a student before its files'; end if;
  perform finish_student_purge(first_id,claimed_token);
  if exists(select 1 from students where id=first_id) or exists(select 1 from submissions where student_id=first_id)
    or exists(select 1 from scores where student_id=first_id) then raise exception 'Purge left student data'; end if;
  if not exists(select 1 from activity_logs where student_id=first_id and action='Student deleted'
      and student_name='Synthetic updated identity' and student_gender='Female' and student_roll_number=first_roll)
    or exists(select 1 from activity_logs where student_id=first_id and action in ('Sheet removed','Section score cleared')
      and (student_name is distinct from 'Synthetic updated identity' or student_gender is distinct from 'Female' or student_roll_number is distinct from first_roll))
    then raise exception 'Permanent deletion lost student identity in audit history'; end if;
  perform release_student_purge(second_id,second_token);
  if not exists(select 1 from claim_student_purges(100) r where r->>'id'=second_id::text and r->>'token'<>second_token::text) then raise exception 'Automatic cleanup did not reclaim a released failed deletion'; end if;
  perform set_config('request.jwt.claims', jsonb_build_object('role','authenticated','sub',admin_id)::text, true);
  rejected := false;
  begin perform claim_selected_student_purges(array[third_id,second_id]);
  exception when others then if sqlerrm not like 'Could not delete:%' then raise; end if; rejected := true; end;
  if not rejected or (select purge_token from students where id=third_id) is not null then raise exception 'Busy selection claimed other students'; end if;
  select r into claimed from claim_selected_student_purges(array[third_id]) r;
  claimed_token := (claimed->>'token')::uuid;
  if claimed_token is null or not exists(select 1 from archived_students() r where r->>'id'=third_id::text and r->>'deletion_pending'='true') then raise exception 'Explicit early deletion was not marked pending'; end if;
  rejected := false;
  begin perform archive_students(array[third_id],true);
  exception when others then if sqlerrm not like 'Could not update students:%' then raise; end if; rejected := true; end;
  if not rejected then raise exception 'Restored a student after deletion started'; end if;
  rejected := false;
  begin perform claim_selected_student_purges(array[third_id]);
  exception when others then if sqlerrm not like 'Could not delete:%' then raise; end if; rejected := true; end;
  if not rejected then raise exception 'Concurrent explicit deletion accepted'; end if;
  perform release_student_purge(third_id,claimed_token);
  if (select purge_token from students where id=third_id) is distinct from claimed_token then raise exception 'Failed deletion became restorable'; end if;
  rejected := false;
  begin perform archive_students(array[third_id],true);
  exception when others then if sqlerrm not like 'Could not update students:%' then raise; end if; rejected := true; end;
  if not rejected then raise exception 'Released partial deletion became restorable'; end if;
  select r into claimed from claim_selected_student_purges(array[third_id]) r;
  if claimed->>'token'=claimed_token::text then raise exception 'Retry did not renew lease'; end if;
  perform finish_student_purge(third_id,(claimed->>'token')::uuid);
  if exists(select 1 from students where id=third_id) then raise exception 'Admin early deletion did not finish'; end if;
  insert into students(id,name,class,gender,school) values(fourth_id,'Synthetic archive check','IX','Female','Synthetic archive transaction') returning roll_number into fourth_roll;
  if fourth_roll::integer <> baseline + 4 then raise exception 'Deleted roll was reused'; end if;
  rejected := false;
  begin
    update student_roll_counter set last_roll=99999 where singleton;
    insert into students(name,class,gender,school) values('Synthetic exhausted roll','X','Male','Synthetic archive transaction');
  exception when others then
    if sqlerrm <> 'Could not allocate a roll number: five-digit rolls are exhausted' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Roll exhaustion was silently accepted'; end if;
  perform set_config('request.jwt.claims', jsonb_build_object('role','authenticated','sub',gen_random_uuid())::text, true);
  rejected := false;
  begin perform archive_students(array[fourth_id]);
  exception when others then if sqlerrm <> 'Admin access required' then raise; end if; rejected := true; end;
  if not rejected then raise exception 'Non-admin archived a student'; end if;
  rejected := false;
  begin perform claim_student_purges();
  exception when others then if sqlerrm <> 'Service access required' then raise; end if; rejected := true; end;
  if not rejected then raise exception 'Non-service cleanup accepted'; end if;
  rejected := false;
  begin perform claim_selected_student_purges(array[fourth_id]);
  exception when others then if sqlerrm <> 'Admin access required' then raise; end if; rejected := true; end;
  if not rejected then raise exception 'Non-admin claimed explicit deletion'; end if;
  rejected := false;
  begin perform finish_student_purge(fourth_id,gen_random_uuid());
  exception when others then if sqlerrm <> 'Admin access required' then raise; end if; rejected := true; end;
  if not rejected then raise exception 'Non-admin finalized explicit deletion'; end if;
  rejected := false;
  begin perform release_student_purge(fourth_id,gen_random_uuid());
  exception when others then if sqlerrm <> 'Admin access required' then raise; end if; rejected := true; end;
  if not rejected then raise exception 'Non-admin released explicit deletion'; end if;
  perform set_config('request.jwt.claims', jsonb_build_object('role','authenticated','sub',admin_id)::text, true);
end $test$;
set local role authenticated;
do $permissions$
declare rejected boolean; generated text; generated_id uuid; claimed jsonb;
begin
  insert into students(name,class,gender,school) values('Synthetic role check','IX','Female','Synthetic archive transaction') returning roll_number,id into generated,generated_id;
  if generated !~ '^[0-9]{5}$' then raise exception 'Admin auto-allocation failed'; end if;
  rejected := false;
  begin update student_roll_counter set last_roll = 10000;
  exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'Admin can reset the roll counter'; end if;
  rejected := false;
  begin perform claim_student_purges();
  exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'Admin can execute service-only cleanup'; end if;
  perform archive_students(array[generated_id]);
  select r into claimed from claim_selected_student_purges(array[generated_id]) r;
  if claimed is null or jsonb_array_length(claimed->'paths')<>0 then raise exception 'Authenticated admin claim failed'; end if;
  perform finish_student_purge(generated_id,(claimed->>'token')::uuid);
  if exists(select 1 from students where id=generated_id) then raise exception 'Authenticated admin deletion failed'; end if;
end $permissions$;
rollback;`);
  console.log("Archive database checks passed in a rolled-back synthetic transaction: immutable incremental rolls, archive/restore, atomic selections, preserved scores, report exclusion, exact cutoff, automatic and explicit deletion, leases/retries, file-first guard, retained identity snapshots, no roll reuse, and role denial.");
  if (process.argv.includes("--apply")) {
    await query(`begin;
create temporary table lifecycle_snapshot as select
  (select md5(coalesce(string_agg(concat_ws('|',id,name,roll_number,class,gender,school,excluded), E'\\n' order by id),'')) from students) students,
  (select md5(coalesce(string_agg(to_jsonb(s)::text, E'\\n' order by id),'')) from submissions s) submissions,
  (select md5(coalesce(string_agg(to_jsonb(s)::text, E'\\n' order by id),'')) from scores s) scores;
${migration}
do $check$ begin
  if exists(select 1 from lifecycle_snapshot snap where
    snap.students is distinct from (select md5(coalesce(string_agg(concat_ws('|',id,name,roll_number,class,gender,school,excluded), E'\\n' order by id),'')) from students)
    or snap.submissions is distinct from (select md5(coalesce(string_agg(to_jsonb(s)::text, E'\\n' order by id),'')) from submissions s)
    or snap.scores is distinct from (select md5(coalesce(string_agg(to_jsonb(s)::text, E'\\n' order by id),'')) from scores s)
  ) then raise exception 'Lifecycle migration changed existing student records'; end if;
end $check$;
commit;`);
    console.log("Lifecycle migration installed. Existing student identities, submissions, and scores are unchanged.");
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!key) throw new Error("Could not verify anonymous archive access: missing public key.");
    const anon = createClient(url, key, { auth: { persistSession: false } });
    for (const [name, params] of [["archived_students", {}], ["archive_students", { p_ids: [], p_restore: false }], ["claim_student_purges", {}], ["claim_selected_student_purges", { p_ids: [] }], ["finish_student_purge", { p_id: "11111111-1111-4111-8111-111111111111", p_token: "22222222-2222-4222-8222-222222222222" }], ["release_student_purge", { p_id: "11111111-1111-4111-8111-111111111111", p_token: "22222222-2222-4222-8222-222222222222" }]] as const) {
      const { error } = await anon.rpc(name, params);
      if (error?.code !== "42501") throw new Error(`Could not verify anonymous denial for ${name}.`);
    }
    console.log("Anonymous archive and cleanup access is denied.");
  }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Could not check archive database."); process.exitCode = 1; });
