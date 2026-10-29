import { createServer } from "@/lib/supabase/server";
import { ReportPages } from "@/components/report/ReportPages";
import { PrintButton } from "@/components/report/PrintButton";
import { normalizeClass } from "@/lib/tamanna/norms";
import { reviewComplete } from "@/lib/tamanna/results";
import { getKey, keyHashOf } from "@/lib/supabase/data";

/** Prints every included student's report (optionally one class). Use the browser's "Save as PDF". */
export default async function Page({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  const sp = await searchParams;
  const sb = await createServer();
  const [{ data, error }, key] = await Promise.all([
    sb.from("students").select("id,roll_number,class,gender,school,block,district,excluded,scores(test_code,correct,wrong,blank,flagged),submissions(key_hash)").eq("excluded", false).order("roll_number")
      .order("created_at", { referencedTable: "submissions", ascending: false }).order("id", { referencedTable: "submissions", ascending: false }).limit(1, { referencedTable: "submissions" }),
    getKey(),
  ]);
  if (error) throw new Error("Could not load reports.", { cause: error });
  const cls = normalizeClass(sp.class);
  const fingerprint = keyHashOf(key);
  const rows = (data ?? []).filter((s) => reviewComplete(s) && s.submissions[0]?.key_hash === fingerprint && (!cls || normalizeClass(s.class) === cls));
  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center gap-3"><PrintButton label={`Print ${rows.length} reports`} /><p className="text-sm font-semibold">{cls ? `Class ${cls}` : "All classes"} · 3 pages each</p></div>
      {rows.map((s) => <ReportPages key={s.id} s={s} />)}
      {!rows.length && <p className="clay p-8 text-center">No reports to print yet.</p>}
    </div>
  );
}
