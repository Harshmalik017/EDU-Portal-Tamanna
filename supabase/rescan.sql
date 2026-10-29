-- Replace a specific scan atomically, including uncertain machine readings.
create or replace function public.rescan_copy(
  p_student_id uuid, p_submission_id uuid, p_responses jsonb,
  p_expected_responses jsonb, p_expected_source_hash text,
  p_expected_key_hash text, p_expected_student jsonb, p_issues text[]
) returns text language plpgsql security invoker set search_path = public as $$
declare saved public.submissions; person public.students; t record; answer jsonb; pending boolean := false;
begin
  if not (is_admin() or auth.role() = 'service_role') then raise exception 'Admin access required'; end if;
  lock table answer_keys in share mode;
  if answer_key_hash() is distinct from p_expected_key_hash then raise exception 'Answer key changed'; end if;
  select * into person from students where id = p_student_id for update;
  if not found then raise exception 'Student not found'; end if;
  if jsonb_build_object('class',person.class,'gender',person.gender,'excluded',person.excluded)
     is distinct from p_expected_student then raise exception 'Student details changed'; end if;
  select * into saved from submissions where student_id = p_student_id order by created_at desc, id desc limit 1 for update;
  if saved.id is distinct from p_submission_id
     or saved.responses is distinct from p_expected_responses
     or saved.source_sha256 is distinct from p_expected_source_hash then
    raise exception 'Submission changed since rescan snapshot';
  end if;
  if jsonb_typeof(p_responses) is distinct from 'object' then raise exception 'Responses must be an object'; end if;
  if (select count(*) from jsonb_object_keys(p_responses)) <> 7 then raise exception 'Expected seven sections'; end if;
  for t in select * from (values ('LA',30),('AR',30),('VR',30),('MR',30),('NA',30),('SA',30),('PA',60)) as tests(code, items) loop
    if jsonb_typeof(p_responses->t.code) is distinct from 'array' then raise exception 'Incomplete section %', t.code; end if;
    if jsonb_array_length(p_responses->t.code) <> t.items then raise exception 'Incomplete section %', t.code; end if;
    for answer in select value from jsonb_array_elements(p_responses->t.code) loop
      if answer = '"UNCERTAIN"'::jsonb then pending := true;
      elsif answer <> 'null'::jsonb and answer not in ('"A"'::jsonb,'"B"'::jsonb,'"C"'::jsonb,'"D"'::jsonb,'"MULTI"'::jsonb) then
        raise exception 'Invalid response in %', t.code;
      end if;
    end loop;
  end loop;
  update submissions set responses = p_responses, key_hash = null where id = p_submission_id;
  delete from scores where student_id = p_student_id;
  update students set verification_status = 'pending', manual_scores = null, verified_by = null, verified_at = null,
    verification_note = case when pending then 'Rescanned both pages. Review Pending.' else 'Rescanned both pages.' end,
    review_issues = array(
      select issue from unnest(review_issues) as issue
      where issue like 'Name proposed%' or issue like 'Class X%' or issue like 'Male is%' or issue like 'Gender %'
    ) || coalesce(p_issues, '{}'::text[]) where id = p_student_id;
  if not pending and not person.excluded then
    perform score_copy(p_student_id, p_expected_key_hash);
  end if;
  return case when pending then 'review' when person.excluded then 'excluded' else 'scored' end;
end $$;
revoke all on function public.rescan_copy(uuid,uuid,jsonb,jsonb,text,text,jsonb,text[]) from public, anon;
grant execute on function public.rescan_copy(uuid,uuid,jsonb,jsonb,text,text,jsonb,text[]) to authenticated, service_role;
