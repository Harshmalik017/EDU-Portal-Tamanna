import { createServer } from "@/lib/supabase/server";
import { ResultsTable } from "@/components/features/ResultsTable";
import type { Student } from "@/lib/types";

export default async function Page() {
  const sb = await createServer();
  const [{ data }, { data: { user } }] = await Promise.all([
    sb.from("students").select("id,name,class,school,gender,excluded,verification_status,manual_scores,scores(test_code,correct)"),
    sb.auth.getUser(),
  ]);
  return (
    <ResultsTable rows={(data ?? []) as unknown as Student[]} email={user?.email ?? "admin"} />
  );
}
