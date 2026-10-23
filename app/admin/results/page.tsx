import { createServer } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { ResultsTable } from "@/components/features/ResultsTable";
import type { Student } from "@/lib/types";

export default async function Page() {
  const { data } = await (await createServer()).from("students").select("id,name,class,school,gender,excluded,verification_status,scores(test_code,correct)");
  return (
    <div className="space-y-6">
      <PageHeader title="Student reports" />
      <ResultsTable rows={(data ?? []) as unknown as Student[]} />
    </div>
  );
}
