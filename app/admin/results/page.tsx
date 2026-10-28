import { createServer, getServerUser } from "@/lib/supabase/server";
import { ResultsTable } from "@/components/features/ResultsTable";
import type { Student } from "@/lib/types";

export default async function Page() {
  const sb = await createServer();
  const [{ data, error }, { data: { user } }] = await Promise.all([
    sb.from("students").select("id,name,roll_number,class,school,block,district,gender,excluded,exclude_reason,verification_status,verification_note,manual_scores,scores(test_code,correct)").order("roll_number"),
    getServerUser(),
  ]);
  if (error) throw new Error("Could not load student reports.", { cause: error });
  return <ResultsTable rows={(data ?? []) as Student[]} email={user?.email ?? "admin"} />;
}
