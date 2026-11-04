import { createServer } from "@/lib/supabase/server";
import { ResultsTable } from "@/components/features/ResultsTable";
import type { Student } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function Page({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
  if ((await searchParams).archived === "1") redirect("/admin/archive");
  const sb = await createServer();
  const { data, error } = await sb.rpc("scan_results");
  if (error) throw new Error("Could not load student reports.", { cause: error });
  return <ResultsTable key="active" rows={(data ?? []) as Student[]} />;
}
