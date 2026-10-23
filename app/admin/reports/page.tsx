import { createServer } from "@/lib/supabase/server";
import { ReportPages } from "@/components/report/ReportPages";
import { PrintButton } from "@/components/report/PrintButton";
import { normalizeClass } from "@/lib/tamanna/norms";
import type { Student } from "@/lib/types";

/** Prints every included student's report (optionally one class). Use the browser's "Save as PDF". */
export default async function Page({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  const sp = await searchParams;
  const { data } = await (await createServer()).from("students").select("*,scores(*)").eq("excluded", false).order("name");
  const cls = normalizeClass(sp.class);
  const rows = ((data ?? []) as unknown as Student[]).filter((s) => !cls || normalizeClass(s.class) === cls);
  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center gap-3"><PrintButton label={`Print ${rows.length} reports`} /><p className="text-sm font-semibold">{cls ? `Class ${cls}` : "All classes"} · 3 pages each</p></div>
      {rows.map((s) => <ReportPages key={s.id} s={s} />)}
      {!rows.length && <p className="clay p-8 text-center">No reports to print yet.</p>}
    </div>
  );
}
