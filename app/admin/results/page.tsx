import { createServer } from "@/lib/supabase/server";
import { ResultsTable } from "@/components/features/ResultsTable";
import type { Student } from "@/lib/types";

export default async function Page({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
  const archived = (await searchParams).archived === "1";
  const sb = await createServer();
  const { data, error } = await sb.rpc(archived ? "archived_students" : "scan_results");
  if (error) throw new Error("Could not load student reports.", { cause: error });
  return <ResultsTable key={archived ? "archive" : "active"} rows={(data ?? []) as Student[]} archived={archived} />;
}
