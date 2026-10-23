import Link from "next/link";
import { AlertTriangle, ClipboardCheck, FileText, ScanLine, Users } from "lucide-react";
import { createServer } from "@/lib/supabase/server";
import { TESTS } from "@/lib/tamanna/tests";
import { bandOf, normalizeClass, stenOf } from "@/lib/tamanna/norms";
import { Card, PageHeader, StatCard } from "@/components/ui";
import type { Student } from "@/lib/types";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  const sp = await searchParams;
  const { data } = await (await createServer()).from("students").select("id,class,gender,excluded,verification_status,scores(test_code,correct)");
  const all = (data ?? []) as unknown as Student[];
  const cls = normalizeClass(sp.class);
  const rows = all.filter((s) => !s.excluded && (!cls || normalizeClass(s.class) === cls));
  const count = (st: string) => rows.filter((s) => (s.verification_status ?? "pending") === st).length;
  const pending = count("pending");
  const perTest = TESTS.map((t) => {
    const b = { Low: 0, Average: 0, High: 0 };
    let sum = 0, n = 0;
    rows.forEach((s) => {
      const x = s.scores.find((v) => v.test_code === t.code);
      if (!x) return;
      sum += x.correct; n++;
      const st = stenOf(s.class, s.gender, t.code, x.correct);
      if (st) b[bandOf(st)]++;
    });
    return { ...t, n, avg: n ? sum / n : 0, b };
  });

  const pill = (v: string, l: string) => <Link key={l} href={v ? `/admin?class=${v}` : "/admin"} aria-current={(cls ?? "") === v ? "page" : undefined} className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${(cls ?? "") === v ? "bg-brand-600 text-white" : "hover:bg-brand-50"}`}>{l}</Link>;
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard"
        actions={<div className="clay-inset flex gap-1 p-1" aria-label="Filter by class">{[["", "All classes"], ["IX", "Class IX"], ["X", "Class X"]].map(([v, l]) => pill(v, l))}</div>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Students checked" value={rows.length} tone="green" />
        <StatCard icon={ClipboardCheck} label="Verified by hand" value={count("verified")} hint={`${pending} waiting`} tone="blue" />
        <StatCard icon={AlertTriangle} label="Score differences" value={count("mismatch")} tone="amber" />
        <StatCard icon={FileText} label="Excluded sheets" value={all.filter((s) => s.excluded).length} tone="violet" />
      </div>
      {pending >= 10 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 !border-amber-300"><p className="font-semibold">{pending} student reports are waiting for a hand check.</p>
          <Link href="/admin/verify" className="clay-btn"><ClipboardCheck size={18} /> Hand check a batch</Link></Card>)}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/scan" className="clay-btn"><ScanLine size={18} /> Check answer sheet</Link>
        <Link href={`/admin/reports${cls ? `?class=${cls}` : ""}`} className="clay-btn-soft"><FileText size={18} /> Print reports</Link>
      </div>
      {rows.length === 0 ? <Card className="text-center">No students yet.</Card> : (
        <Card title="Performance by sub-test" description="Low (1–3) · Average (4–7) · High (8–10)">
          <ul className="space-y-4">{perTest.map((t) => (
            <li key={t.code}>
              <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{t.code} <span className="font-normal">{t.name}</span></span><span>Average marks {t.avg.toFixed(1)} / {t.questions}</span></div>
              <div className="clay-inset flex h-5 overflow-hidden" role="img" aria-label={`${t.code}: ${t.b.High} high, ${t.b.Average} average, ${t.b.Low} low`}>
                {t.b.High > 0 && <div className="bg-green-600" style={{ flex: t.b.High }} />}{t.b.Average > 0 && <div className="bg-sky-600" style={{ flex: t.b.Average }} />}{t.b.Low > 0 && <div className="bg-amber-500" style={{ flex: t.b.Low }} />}
              </div>
              <p className="mt-1 text-xs">High {t.b.High} · Average {t.b.Average} · Low {t.b.Low}</p>
            </li>))}</ul>
        </Card>)}
    </div>
  );
}
