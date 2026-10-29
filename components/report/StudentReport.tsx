import { notFound } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import { ReportDialog } from "@/components/report/ReportDialog";

export async function StudentReport({ id, intercepted = false }: { id: string; intercepted?: boolean }) {
  const { data, error } = await (await createServer()).from("students").select("id,roll_number,class,gender,school,block,district,excluded,scores(test_code,correct,wrong,blank,flagged)").eq("id", id).maybeSingle();
  if (error) throw new Error("Could not load student report.", { cause: error });
  if (!data) notFound();
  return <ReportDialog key={id} student={data} intercepted={intercepted} />;
}
