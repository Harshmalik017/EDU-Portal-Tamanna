import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

async function main() {
  process.loadEnvFile(".env.local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (url !== "https://zhrlfkvmmrgwainsfyha.supabase.co" || !token) throw new Error("Could not validate results database access.");
  const source = await readFile("supabase/portal-update.sql", "utf8");
  const start = source.indexOf("create or replace function public.scan_results()");
  if (start < 0) throw new Error("Could not find the results migration.");
  const migration = source.slice(start);
  async function query(sql: string) {
    const response = await fetch("https://api.supabase.com/v1/projects/zhrlfkvmmrgwainsfyha/database/query", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: sql }),
    });
    if (!response.ok) throw new Error(`Could not check results (${response.status}): ${await response.text()}`);
  }
  await query(`
begin;
${migration}
do $test$
declare student uuid := gen_random_uuid(); submission uuid := gen_random_uuid();
  admin_id uuid; original jsonb; marked jsonb; result jsonb; section jsonb; fingerprint text; rejected boolean;
begin
  select user_id into admin_id from admins limit 1;
  if admin_id is null then raise exception 'Expected an existing admin'; end if;
  perform set_config('request.jwt.claims', jsonb_build_object('role','authenticated','sub',admin_id)::text, true);
  fingerprint := answer_key_hash();
  select jsonb_object_agg(test_code, answers) into original from (
    select test_code, jsonb_agg(case when correct_option = 'A' then 'B' else 'A' end order by question_no) as answers
    from answer_keys group by test_code
  ) sections;
  insert into students(id,name,roll_number,class,gender,school)
  values(student,'Synthetic results check','99999','X','Male','Synthetic results transaction');
  select value into result from scan_results() value where value->>'id' = student::text;
  if result->'scores' <> '[]'::jsonb or result->>'report_ready' <> 'false' then raise exception 'Missing scan treated as complete'; end if;
  insert into submissions(id,student_id,responses) values(submission,student,original);
  select value into result from scan_results() value where value->>'id' = student::text;
  if result->>'report_ready' <> 'false' then raise exception 'Unscored scan offers a report'; end if;
  perform score_copy(student,fingerprint);
  select value into result from scan_results() value where value->>'id' = student::text;
  if result->>'report_ready' <> 'true' then raise exception 'Completed scan has no report'; end if;
  select value into section from jsonb_array_elements(result->'scores') value where value->>'test_code' = 'LA';
  if section->>'correct' <> '0' or section->>'blank' <> '0' then raise exception 'Zero marks treated as blank'; end if;

  marked := jsonb_set(original,'{LA}',(select jsonb_agg(null::text) from generate_series(1,30)));
  marked := jsonb_set(marked,'{PA}',(select jsonb_agg(case when n <= 30 then original->'PA'->(n-1) else 'null'::jsonb end order by n) from generate_series(1,60) n));
  perform review_copy(student,marked,fingerprint);
  select value into result from scan_results() value where value->>'id' = student::text;
  select value into section from jsonb_array_elements(result->'scores') value where value->>'test_code' = 'LA';
  if section->>'blank' <> '30' or section->>'uncertain' <> '0' or result->>'report_ready' <> 'true' then raise exception 'Confirmed blank section not represented'; end if;
  select value into section from jsonb_array_elements(result->'scores') value where value->>'test_code' = 'PA';
  if section->>'blank' <> '30' then raise exception 'Partial PA section miscounted'; end if;
  marked := jsonb_set(marked,'{PA}',(select jsonb_agg(null::text) from generate_series(1,60)));
  perform review_copy(student,marked,fingerprint);
  select value into result from scan_results() value where value->>'id' = student::text;
  select value into section from jsonb_array_elements(result->'scores') value where value->>'test_code' = 'PA';
  if section->>'blank' <> '60' then raise exception 'Full PA blank section miscounted'; end if;

  marked := jsonb_set(marked,'{LA,29}','"UNCERTAIN"');
  update submissions set responses=marked, key_hash=null where id=submission;
  delete from scores where student_id=student;
  select value into result from scan_results() value where value->>'id' = student::text;
  select value into section from jsonb_array_elements(result->'scores') value where value->>'test_code' = 'LA';
  if section->>'blank' <> '29' or section->>'uncertain' <> '1' or result->>'report_ready' <> 'false' then raise exception 'Uncertain answer counted as blank or complete'; end if;
  marked := jsonb_set(marked,'{LA}',(select jsonb_agg(null::text) from generate_series(1,29)));
  update submissions set responses=marked where id=submission;
  select value into result from scan_results() value where value->>'id' = student::text;
  select value into section from jsonb_array_elements(result->'scores') value where value->>'test_code' = 'LA';
  if section->>'blank' <> '29' or section->>'uncertain' <> '1' then raise exception 'Missing answer counted as blank'; end if;
  marked := jsonb_set(original,'{LA}',(select jsonb_agg('MULTI'::text) from generate_series(1,30)));
  perform review_copy(student,marked,fingerprint);
  select value into result from scan_results() value where value->>'id' = student::text;
  select value into section from jsonb_array_elements(result->'scores') value where value->>'test_code' = 'LA';
  if section->>'blank' <> '0' or section->>'uncertain' <> '0' then raise exception 'Multiple marks counted as blank'; end if;
  update submissions set key_hash=repeat('0',64) where id=submission;
  select value into result from scan_results() value where value->>'id' = student::text;
  if result->>'report_ready' <> 'false' then raise exception 'Stale scan offers a report'; end if;
  update submissions set key_hash=fingerprint where id=submission;
  update students set excluded=true where id=student;
  select value into result from scan_results() value where value->>'id' = student::text;
  if result->>'report_ready' <> 'false' then raise exception 'Excluded scan offers a report'; end if;
  perform set_config('request.jwt.claims', jsonb_build_object('role','authenticated','sub',gen_random_uuid())::text, true);
  rejected := false;
  begin
    perform scan_results();
  exception when others then
    if sqlerrm <> 'Admin access required' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Non-admin results accepted'; end if;
end $test$;
rollback;`);
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("Could not check anonymous denial: missing public key.");
  const anon = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await anon.rpc("scan_results");
  if (error?.code !== "42501") throw new Error(`Could not verify anonymous results denial (${error?.code ?? "request accepted"}).`);
  console.log("Results database checks passed in a rolled-back synthetic transaction: blank/zero/partial PA/missing/uncertain/MULTI, final-score and key readiness, exclusion, and non-admin/anonymous denial.");
  if (process.argv.includes("--apply")) {
    await query(migration);
    console.log("Results RPC updated. No student responses or scores changed.");
  }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Could not check results database."); process.exitCode = 1; });
