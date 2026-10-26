import Link from "next/link";
import { ChartColumn, UserRound, Users, UsersRound } from "lucide-react";
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
      <PageHeader title="Dashboard" icon={ChartColumn}
        actions={<div className="clay-inset flex gap-1 p-1" aria-label="Filter by class">{[["", "All classes"], ["IX", "Class IX"], ["X", "Class X"]].map(([v, l]) => pill(v, l))}</div>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Users} label="Students checked" value={rows.length} tone="green" />
        <StatCard icon={UserRound} label="Male students" value={rows.filter((s) => s.gender === "Male").length} tone="blue" />
        <StatCard icon={UsersRound} label="Female students" value={rows.filter((s) => s.gender === "Female").length} tone="violet" />
      </div>
      {rows.length === 0 ? <Card className="text-center">No students yet.</Card> : (
        <Card title="Performance by sub-test">
          <div className="mb-5 flex flex-wrap gap-2" aria-label="Performance levels">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">Low (1–3)</span>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-900">Average (4–7)</span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-900">High (8–10)</span>
          </div>
          <ul className="grid gap-x-6 gap-y-5 md:grid-cols-2">{perTest.map((t) => (
            <li key={t.code}>
              <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{t.code} <span className="font-normal">{t.name}</span></span><span>Average marks {t.avg.toFixed(1)} / {t.questions}</span></div>
              <div className="clay-inset flex h-8 overflow-hidden" role="img" aria-label={`${t.code}: ${t.b.High} high students, ${t.b.Average} average students, ${t.b.Low} low students`}>
                {(["High", "Average", "Low"] as const).map((level) => t.b[level] > 0 && (
                  <div key={level} className={`flex min-w-fit items-center justify-center px-2 text-[10px] font-bold text-white ${level === "High" ? "bg-green-600" : level === "Average" ? "bg-sky-600" : "bg-amber-500"}`} style={{ flex: t.b[level] }}>
                    {level}
                  </div>
                ))}
              </div>
              <p className="mt-1 flex flex-wrap gap-x-3 text-xs">
                <span className="font-semibold text-green-800">High {t.b.High} students</span>
                <span className="font-semibold text-sky-800">Average {t.b.Average} students</span>
                <span className="font-semibold text-amber-900">Low {t.b.Low} students</span>
              </p>
            </li>))}</ul>
        </Card>)}
    </div>
  );
}
