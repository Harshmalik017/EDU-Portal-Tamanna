import { createServer } from "@/lib/supabase/server";
import { ResultsTable } from "@/components/features/ResultsTable";
import type { Student } from "@/lib/types";

export default async function Page() {
  const sb = await createServer();
  const { data, error } = await sb.rpc("scan_results");
  if (error) throw new Error("Could not load student reports.", { cause: error });
  return <ResultsTable rows={(data ?? []) as Student[]} />;
}
