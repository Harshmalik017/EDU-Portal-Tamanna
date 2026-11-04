import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

async function main() {
  process.loadEnvFile(".env.local");
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://zhrlfkvmmrgwainsfyha.supabase.co" || !process.env.SUPABASE_ACCESS_TOKEN) throw new Error("Could not validate rescan database access.");
  const migration = await readFile("supabase/rescan.sql", "utf8");
  const checks = `
begin;
${migration}
set local request.jwt.claims = '{"role":"service_role"}';
do $test$
declare student uuid := gen_random_uuid(); submission uuid := gen_random_uuid();
  original jsonb; changed jsonb; pending jsonb; fingerprint text; source text := repeat('a',64);
  outcome text; rejected boolean; persisted jsonb; images text[]; pdf text;
begin
  select jsonb_object_agg(code, answers) into original from (
    select code, jsonb_agg('A'::text) as answers from
      (values ('LA',30),('AR',30),('VR',30),('MR',30),('NA',30),('SA',30),('PA',60)) as tests(code, items),
      lateral generate_series(1,items) as q group by code
  ) sections;
  changed := replace(original::text, '"A"', '"B"')::jsonb;
  pending := jsonb_set(changed, '{PA,59}', '"UNCERTAIN"');
  fingerprint := answer_key_hash();
  insert into students(id,name,roll_number,class,gender,school,manual_scores)
  values(student,'Synthetic check','99999','X','Male','Synthetic rescan transaction', '{"LA":1}');
  insert into submissions(id,student_id,responses,source_sha256) values(submission,student,original,source);
  outcome := rescan_copy(student,submission,changed,original,source,fingerprint,
    '{"class":"X","gender":"Male","excluded":false}', '{}');
  if outcome <> 'scored' or (select count(*) from scores where student_id=student) <> 7 then raise exception 'Final scoring failed'; end if;
  if (select responses from submissions where id=submission) <> changed then raise exception 'Manual answers not replaced'; end if;
  if (select manual_scores from students where id=student) is not null then raise exception 'Manual score state not cleared'; end if;
  rejected := false;
  begin
    perform rescan_copy(student,submission,original,changed,source,'stale',
      '{"class":"X","gender":"Male","excluded":false}', '{}');
  exception when others then
    if sqlerrm <> 'Answer key changed' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Stale key accepted'; end if;
  rejected := false;
  begin
    perform rescan_copy(student,submission,original,original,source,fingerprint,
      '{"class":"X","gender":"Male","excluded":false}', '{}');
  exception when others then
    if sqlerrm <> 'Submission changed since rescan snapshot' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Concurrent correction overwritten'; end if;
  rejected := false;
  begin
    perform rescan_copy(student,submission,'{}',changed,source,fingerprint,
      '{"class":"X","gender":"Male","excluded":false}', '{}');
  exception when others then
    if sqlerrm <> 'Expected seven sections' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Incomplete scan accepted'; end if;
  select responses into persisted from submissions where id=submission;
  if persisted <> changed or (select count(*) from scores where student_id=student) <> 7 then raise exception 'Failed operation did not roll back'; end if;
  outcome := rescan_copy(student,submission,pending,changed,source,fingerprint,
    '{"class":"X","gender":"Male","excluded":false}', array['Review Pending']);
  if outcome <> 'review' or exists(select 1 from scores where student_id=student) then raise exception 'Uncertain scan kept final scores'; end if;
  if (select key_hash from submissions where id=submission) is not null then raise exception 'Stale fingerprint retained'; end if;
  outcome := rescan_copy(student,submission,pending,pending,source,fingerprint,
    '{"class":"X","gender":"Male","excluded":false}', array['Review Pending']);
  if outcome <> 'review' then raise exception 'Retry failed'; end if;
  images := array[student::text || '/11111111-1111-4111-8111-111111111111/side-1.jpg', student::text || '/11111111-1111-4111-8111-111111111111/side-2.jpg'];
  pdf := student::text || '/11111111-1111-4111-8111-111111111111/answer-sheet.pdf';
  insert into storage.objects(bucket_id,name) select 'sheets', unnest(images || array[pdf]);
  outcome := replace_copy(student,submission,pending,'{}',null,fingerprint,changed,images,pdf,repeat('b',64),'{}');
  if outcome <> 'scored' or (select count(*) from scores where student_id=student) <> 7 then raise exception 'Replacement did not score'; end if;
  if (select image_paths from submissions where id=submission) <> images
     or (select pdf_path from submissions where id=submission) <> pdf
     or (select source_sha256 from submissions where id=submission) <> repeat('b',64) then raise exception 'Files not replaced'; end if;
  if (select roll_number from students where id=student) <> '99999' then raise exception 'Replacement changed identity'; end if;
  rejected := false;
  begin
    perform replace_copy(student,submission,pending,'{}',null,fingerprint,original,images,pdf,repeat('c',64),'{}');
  exception when others then
    if sqlerrm not like 'Submission changed.%' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Stale replacement accepted'; end if;
  rejected := false;
  begin
    perform replace_copy(student,submission,changed,images,pdf,fingerprint,pending,
      array['another-student/side-1.jpg','another-student/side-2.jpg'],null,repeat('c',64),'{}');
  exception when others then
    if sqlerrm <> 'Replacement file is missing or invalid' then raise; end if;
    rejected := true;
  end;
  if not rejected or (select responses from submissions where id=submission) <> changed then raise exception 'Invalid replacement changed answers'; end if;
  update students set excluded=true where id=student;
  update submissions set image_paths='{}',pdf_path=null where id=submission;
  outcome := replace_copy(student,submission,changed,'{}',null,fingerprint,original,images,pdf,repeat('c',64),'{}');
  if outcome <> 'excluded' or exists(select 1 from scores where student_id=student) then raise exception 'Excluded replacement produced scores'; end if;
  delete from submissions where id=submission;
  outcome := replace_copy(student,null,'{}','{}',null,fingerprint,pending,images,pdf,repeat('d',64),'{}');
  if outcome <> 'review' or (select count(*) from submissions where student_id=student) <> 1 then raise exception 'No-scan replacement failed'; end if;
  if has_function_privilege('anon','public.replace_copy(uuid,uuid,jsonb,text[],text,text,jsonb,text[],text,text,text[])','execute') then raise exception 'Anonymous replacement allowed'; end if;
  rejected := false;
  perform set_config('request.jwt.claims', jsonb_build_object('role','authenticated','sub',gen_random_uuid())::text, true);
  begin
    perform rescan_copy(student,submission,original,pending,source,fingerprint,
      '{"class":"X","gender":"Male","excluded":false}', '{}');
  exception when others then
    if sqlerrm <> 'Admin access required' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Non-admin rescan accepted'; end if;
  rejected := false;
  begin
    perform replace_copy(student,null,'{}','{}',null,fingerprint,pending,images,pdf,repeat('e',64),'{}');
  exception when others then
    if sqlerrm <> 'Admin access required' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Non-admin replacement accepted'; end if;
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
end $test$;
rollback;`;
  const response = await fetch("https://api.supabase.com/v1/projects/zhrlfkvmmrgwainsfyha/database/query", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: checks }),
  });
  if (!response.ok) throw new Error(`Could not check rescan transactions (${response.status}): ${await response.text()}`);
  if (process.argv.includes("--apply")) {
    const installed = await fetch("https://api.supabase.com/v1/projects/zhrlfkvmmrgwainsfyha/database/query", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: migration }),
    });
    if (!installed.ok) throw new Error(`Could not install rescan RPCs (${installed.status}): ${await installed.text()}`);
    console.log("Installed only the additive rescan/replacement RPCs. Existing student records were not modified.");
  }
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("Could not check anonymous denial: missing public key.");
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } });
  const { error } = await anon.rpc("rescan_copy", {
    p_student_id: "00000000-0000-0000-0000-000000000000", p_submission_id: "00000000-0000-0000-0000-000000000000",
    p_responses: {}, p_expected_responses: {}, p_expected_source_hash: "", p_expected_key_hash: "", p_expected_student: {}, p_issues: [],
  });
  if (error?.code !== "42501") throw new Error(`Could not verify anonymous rescan denial (${error?.code ?? "request accepted"}).`);
  console.log("Rescan database checks passed in a rolled-back synthetic transaction: replacement, final scoring, pending/stale-score invalidation, stale keys, concurrent edits, incomplete scans, retries, and anonymous/non-admin denial.");
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Could not check rescan database."); process.exitCode = 1; });
