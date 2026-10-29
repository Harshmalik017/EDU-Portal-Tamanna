import { notFound } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import { ReportDialog } from "@/components/report/ReportDialog";
import { getKey, keyHashOf } from "@/lib/supabase/data";
import { reviewComplete } from "@/lib/tamanna/results";

export async function StudentReport({ id, intercepted = false }: { id: string; intercepted?: boolean }) {
  const sb = await createServer();
  const [{ data, error }, key] = await Promise.all([
    sb.from("students").select("id,roll_number,class,gender,school,block,district,excluded,scores(test_code,correct,wrong,blank,flagged),submissions(key_hash)").eq("id", id)
      .order("created_at", { referencedTable: "submissions", ascending: false }).order("id", { referencedTable: "submissions", ascending: false }).limit(1, { referencedTable: "submissions" }).maybeSingle(),
    getKey(),
  ]);
  if (error) throw new Error("Could not load student report.", { cause: error });
  if (!data) notFound();
  const { submissions, ...student } = data;
  return <ReportDialog key={id} student={{ ...student, report_ready: reviewComplete(student) && submissions[0]?.key_hash === keyHashOf(key) }} intercepted={intercepted} />;
}
