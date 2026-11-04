import { createServer } from "@/lib/supabase/server";
import { ResultsTable } from "@/components/features/ResultsTable";
import type { Student } from "@/lib/types";

export default async function Page() {
  const { data, error } = await (await createServer()).rpc("archived_students");
  if (error) throw new Error("Could not load the archive.", { cause: error });
  return <ResultsTable key="archive" rows={(data ?? []) as Student[]} archived />;
}
