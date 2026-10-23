"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Download, FileText, Printer, Search } from "lucide-react";
import { TESTS } from "@/lib/tamanna/tests";
import { bandOf, normalizeClass, stenOf } from "@/lib/tamanna/norms";
import type { Student } from "@/lib/types";
import { Badge, Button, Card, Input, Select } from "@/components/ui";

const PAGE = 20;
const raw = (r: Student, c: string) => r.scores.find((s) => s.test_code === c)?.correct ?? null;
const sten = (r: Student, c: string) => { const v = raw(r, c); return v === null ? null : stenOf(r.class, r.gender, c, v); };
const tone = { Low: "bg-amber-100 text-amber-900", Average: "bg-blue-100 text-blue-900", High: "bg-green-100 text-green-900" } as const;
const TONE = { Verified: "green", Mismatch: "red", Pending: "amber", Excluded: "neutral" } as const;
const status = (r: Student): keyof typeof TONE => (r.excluded ? "Excluded" : r.verification_status === "verified" ? "Verified" : r.verification_status === "mismatch" ? "Mismatch" : "Pending");

function Cell({ r, c }: { r: Student; c: string }) {
  const v = raw(r, c), s = sten(r, c);
  return <span className="whitespace-nowrap">{v ?? "–"}{s && <span className={`ml-1 rounded-full px-1.5 text-[11px] font-bold ${tone[bandOf(s)]}`} title={`Sten ${s}, ${bandOf(s)}`}>{s}</span>}</span>;
}

export function ResultsTable({ rows }: { rows: Student[] }) {
  const [q, setQ] = useState(""); const [cls, setCls] = useState("");
  const [sort, setSort] = useState<{ by: string; dir: 1 | -1 }>({ by: "name", dir: 1 });
  const [page, setPage] = useState(0);
  const get = (r: Student, by: string): string | number => TESTS.some((t) => t.code === by) ? raw(r, by) ?? -1 : by === "status" ? status(r) : ((r as unknown as Record<string, string>)[by] ?? "");
  const shown = useMemo(() => rows
    .filter((r) => (!cls || normalizeClass(r.class) === cls) && `${r.name} ${r.school}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => { const x = get(a, sort.by), y = get(b, sort.by); return (x > y ? 1 : x < y ? -1 : 0) * sort.dir; }), [rows, q, cls, sort]);  
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const view = shown.slice(page * PAGE, page * PAGE + PAGE);
  const heads: [string, string][] = [["name", "Roll no."], ["class", "Class"], ["school", "School"], ...TESTS.map((t) => [t.code, t.code] as [string, string]), ["status", "Check"]];

  function exportCsv() {
    const head = ["Roll number", "Class", "Gender", "School", ...TESTS.flatMap((t) => [`${t.code} score`, `${t.code} sten`, `${t.code} level`]), "Verification", "Excluded"];
    const lines = shown.map((r) => [`"${r.name}"`, r.class, r.gender, `"${r.school}"`, ...TESTS.flatMap((t) => { const s = sten(r, t.code); return [raw(r, t.code) ?? "", s ?? "", s ? bandOf(s) : ""]; }), r.verification_status ?? "pending", r.excluded ? "yes" : "no"].join(","));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" }));
    a.download = "tamanna-results.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink/80">{shown.length} students</p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/reports${cls ? `?class=${cls}` : ""}`} className="clay-btn-soft"><Printer size={18} /> Print all reports</Link>
          <Button variant="soft" onClick={exportCsv} disabled={!shown.length}><Download size={18} /> Export CSV</Button>
        </div>
      </div>
      <p className="mb-3 text-xs">Score and Sten (Low 1–3 · Average 4–7 · High 8–10)</p>
      <div className="mb-4 grid items-end gap-3 sm:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute bottom-3.5 left-4 text-ink/60" />
          <Input label="Search roll no. or school" placeholder="Roll no. or school" className="!pl-11" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </div>
        <Select label="Class" options={["IX", "X"]} placeholder="All classes" value={cls} onChange={(e) => { setCls(e.target.value); setPage(0); }} />
      </div>
      {!shown.length ? <p className="py-10 text-center">No results.</p> : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead><tr>{heads.map(([k, h]) => <th key={k} className="px-2 py-2"><button className="flex items-center gap-1 font-bold" onClick={() => setSort((s) => ({ by: k, dir: s.by === k ? (-s.dir as 1 | -1) : 1 }))}>{h}<ArrowUpDown size={12} /></button></th>)}<th className="px-2 py-2">Report</th></tr></thead>
              <tbody>{view.map((r) => (
                <tr key={r.id} className="border-t border-white/70">
                  <td className="px-2 py-2 font-semibold"><Link className="underline" href={`/admin/students/${r.id}`}>{r.name}</Link></td><td className="px-2 py-2">{r.class}</td><td className="px-2 py-2">{r.school}</td>
                  {TESTS.map((t) => <td key={t.code} className="px-2 py-2"><Cell r={r} c={t.code} /></td>)}
                  <td className="px-2 py-2"><Badge tone={TONE[status(r)]}>{status(r)}</Badge></td>
                  <td className="px-2 py-2"><Link aria-label={`Report for roll ${r.name}`} href={`/admin/students/${r.id}/report`}><FileText size={18} /></Link></td>
                </tr>))}</tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">{view.map((r) => (
            <li key={r.id} className="clay-inset p-4">
              <div className="flex justify-between gap-2"><Link href={`/admin/students/${r.id}`} className="font-extrabold underline">Roll {r.name}</Link><Badge tone={TONE[status(r)]}>{status(r)}</Badge></div>
              <p className="text-xs">Class {r.class} · {r.school}</p>
              <p className="mt-2 grid grid-cols-3 gap-1 text-xs">{TESTS.map((t) => <span key={t.code}><b>{t.code}</b> <Cell r={r} c={t.code} /></span>)}</p>
              <Link href={`/admin/students/${r.id}/report`} className="mt-3 inline-flex items-center gap-1 text-sm font-bold underline"><FileText size={16} /> Open report</Link>
            </li>))}</ul>
          <div className="mt-4 flex items-center justify-between">
            <Button variant="soft" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="text-sm font-semibold">Page {page + 1} of {pages}</span>
            <Button variant="soft" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </>)}
    </Card>
  );
}
