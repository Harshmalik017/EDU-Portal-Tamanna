"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowUpDown, ClipboardCheck, FileSpreadsheet, FileText, Printer, Search, Table2, Trash2, UserRound } from "lucide-react";
import { TESTS } from "@/lib/tamanna/tests";
import { bandOf, normalizeClass, stenOf } from "@/lib/tamanna/norms";
import { supabase } from "@/lib/supabase/client";
import type { Student } from "@/lib/types";
import { Button, Card, Input, PageHeader, Select } from "@/components/ui";
import { useToast } from "@/components/Toast";

const PAGE = 20;
const StudentProfileDialog = dynamic(() => import("@/components/features/StudentProfileDialog").then((m) => m.StudentProfileDialog));
const StudentSheetDialog = dynamic(() => import("@/components/features/StudentSheetDialog").then((m) => m.StudentSheetDialog));
const raw = (r: Student, c: string) => r.scores.find((s) => s.test_code === c)?.correct ?? null;
const sten = (r: Student, c: string) => { const v = raw(r, c); return v === null || r.scores.find((s) => s.test_code === c)?.uncertain ? null : stenOf(r.class, r.gender, c, v); };
const tone = { Low: "bg-amber-100 text-amber-900", Average: "bg-blue-100 text-blue-900", High: "bg-green-100 text-green-900" } as const;
const blurry = (r: Student) => r.scores.some((score) => (score.uncertain ?? 0) > 0);
const status = (r: Student) => r.excluded ? "Excluded" : !r.scores.length ? "No scan" : blurry(r) ? "Confirm blurry answers" : "Review scan";

function Cell({ r, c }: { r: Student; c: string }) {
  const v = raw(r, c), s = sten(r, c);
  const uncertain = r.scores.find((score) => score.test_code === c)?.uncertain ?? 0;
  return <span className="inline-flex flex-col gap-1"><span className="whitespace-nowrap">{v ?? "–"}{uncertain > 0 ? <span className="ml-1 text-[11px] font-semibold text-amber-900">provisional</span> : s && <span className={`ml-1 rounded-full px-1.5 text-[11px] font-bold ${tone[bandOf(s)]}`} title={`Sten ${s}, ${bandOf(s)}`}>{s}</span>}</span>{uncertain > 0 && <span className="text-[11px] font-semibold text-amber-900">{uncertain} blurry</span>}</span>;
}

export function ResultsTable({ rows }: { rows: Student[] }) {
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState(""); const [cls, setCls] = useState("");
  const [sort, setSort] = useState<{ by: string; dir: 1 | -1 }>({ by: "roll_number", dir: 1 });
  const [page, setPage] = useState(0);
  const [profile, setProfile] = useState<Student | null>(null);
  const [sheet, setSheet] = useState<{ student: Student; mode: "view" | "check" } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const get = (r: Student, by: string): string | number => TESTS.some((t) => t.code === by) ? raw(r, by) ?? -1 : by === "status" ? status(r) : ((r as unknown as Record<string, string>)[by] ?? "");
  const shown = useMemo(() => rows
    .filter((r) => (!cls || normalizeClass(r.class) === cls) && `${r.roll_number} ${r.name} ${r.school}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => { const x = get(a, sort.by), y = get(b, sort.by); return (x > y ? 1 : x < y ? -1 : 0) * sort.dir; }), [rows, q, cls, sort]);  
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const view = shown.slice(page * PAGE, page * PAGE + PAGE);
  const heads: [string, string][] = [["roll_number", "Roll no."], ["name", "Name"], ["class", "Class"], ["gender", "Gender"], ["school", "School"], ...TESTS.map((t) => [t.code, t.code] as [string, string]), ["status", "Check"]];

  async function deleteStudent(student: Student) {
    if (!confirm(`Delete ${student.name || `roll ${student.roll_number}`} and all scores? This cannot be undone.`)) return;
    setDeletingId(student.id);
    const { data: submissions, error: submissionError } = await supabase.from("submissions").select("image_paths,pdf_path").eq("student_id", student.id);
    if (submissionError) {
      setDeletingId(null);
      return toast("Could not load student files before deletion.");
    }
    const paths = [...new Set<string>((submissions ?? []).flatMap((submission: { image_paths?: string[] | null; pdf_path?: string | null }) => [...(submission.image_paths ?? []), ...(submission.pdf_path ? [submission.pdf_path] : [])]))];
    if (paths.length) {
      const { error: storageError } = await supabase.storage.from("sheets").remove(paths);
      if (storageError) {
        setDeletingId(null);
        return toast("Could not delete student files.");
      }
    }
    const { error } = await supabase.from("students").delete().eq("id", student.id);
    setDeletingId(null);
    if (error) return toast("Could not delete student.");
    toast("Deleted");
    router.refresh();
  }

  function exportCsv() {
    const head = ["Roll number", "Name", "Class", "Gender", "School", "Block", "District", ...TESTS.flatMap((t) => [`${t.code} score`, `${t.code} blurry answers (score provisional if above zero)`, `${t.code} sten`, `${t.code} level`]), "Scan status", "Excluded"];
    const csv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const lines = shown.map((r) => [r.roll_number, r.name, r.class, r.gender, r.school ?? "", r.block ?? "", r.district ?? "", ...TESTS.flatMap((t) => { const s = sten(r, t.code); return [raw(r, t.code) ?? "", r.scores.find((score) => score.test_code === t.code)?.uncertain ?? "", s ?? "", s ? bandOf(s) : ""]; }), status(r), r.excluded ? "yes" : "no"].map(csv).join(","));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" }));
    a.download = "tamanna-results.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  return (
    <div className="space-y-6">
    <PageHeader title="Student reports" icon={Table2} />
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink/80">{shown.length} students</p>
        <div className="flex flex-wrap gap-2">
          <Link prefetch={false} href={`/admin/reports${cls ? `?class=${cls}` : ""}`} className="clay-btn-soft"><Printer size={18} /> Print all reports</Link>
          <Button onClick={exportCsv} disabled={!shown.length} className="!border-green-700 !bg-green-700 !text-white hover:!bg-green-800 focus-visible:!outline-green-700"><FileSpreadsheet size={18} /> Download CSV</Button>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-ink/80">Marks and Sten score</span>
        <span className="text-amber-900">Provisional: marks from clear answers; confirm blurry answers for final marks.</span>
        <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 font-bold text-amber-900">Low · 1–3</span>
        <span className="rounded-full border border-blue-300 bg-blue-50 px-2.5 py-1 font-bold text-blue-900">Average · 4–7</span>
        <span className="rounded-full border border-green-300 bg-green-50 px-2.5 py-1 font-bold text-green-900">High · 8–10</span>
      </div>
      <div className="mb-4 grid items-end gap-3 sm:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute bottom-3.5 left-4 text-ink/60" />
          <Input label="Search name, roll no. or school" placeholder="Name, roll no. or school" className="!pl-11" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </div>
        <Select label="Class" options={["IX", "X"]} placeholder="All classes" value={cls} onChange={(e) => { setCls(e.target.value); setPage(0); }} />
      </div>
      {!shown.length ? <p className="py-10 text-center">No results.</p> : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-(--line) md:block">
            <table className="min-w-[1200px] w-full border-collapse text-left text-sm">
              <thead className="bg-brand-100 text-brand-700">
                <tr>{heads.map(([k, h]) => <th key={k} scope="col" className="border-b border-r border-(--line) px-3 py-3 last:border-r-0"><button className="flex items-center gap-1 font-bold" onClick={() => setSort((s) => ({ by: k, dir: s.by === k ? (-s.dir as 1 | -1) : 1 }))}>{h}<ArrowUpDown size={12} /></button></th>)}<th scope="col" className="border-b border-(--line) px-3 py-3">Actions</th></tr>
              </thead>
              <tbody>{view.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-brand-50/70">
                  <td className="border-b border-r border-(--line) px-3 py-2.5 font-semibold"><button type="button" className="min-h-11 underline focus-visible:outline-2 focus-visible:outline-brand-700" aria-label={`Profile for ${r.name}, roll ${r.roll_number}`} onClick={() => setProfile(r)}>{r.roll_number}</button></td><td className="border-b border-r border-(--line) px-3 py-2.5">{r.name || "Name pending"}</td><td className="border-b border-r border-(--line) px-3 py-2.5">{r.class}</td><td className="border-b border-r border-(--line) px-3 py-2.5">{r.gender}</td><td className="border-b border-r border-(--line) px-3 py-2.5">{r.school}</td>
                  {TESTS.map((t) => <td key={t.code} className="border-b border-r border-(--line) px-3 py-2.5"><Cell r={r} c={t.code} /></td>)}
                  <td className="border-b border-r border-(--line) px-3 py-2.5"><Button variant="soft" disabled={!r.scores.length} className="whitespace-nowrap !px-3 !py-2 text-xs" onClick={() => setSheet({ student: r, mode: "check" })}><ClipboardCheck size={15} />{status(r)}</Button></td>
                  <td className="border-b border-(--line) px-3 py-2.5"><div className="flex items-center gap-2">
                    <Link prefetch={false} href={`/admin/students/${r.id}/report`} aria-label={`Report for ${r.name}, roll ${r.roll_number}`} title="Report" className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-800 transition hover:bg-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"><FileText size={15} /> Report</Link>
                    <Button variant="soft" className="!min-h-9 !px-3 !py-1.5 text-xs" onClick={() => setProfile(r)}><UserRound size={15} /> Profile</Button>
                    <Button variant="soft" className="!min-h-9 !bg-violet-100 !px-3 !py-1.5 text-xs !text-violet-900" onClick={() => setSheet({ student: r, mode: "view" })}>OMR Sheet</Button>
                    <button type="button" aria-label={`Delete ${r.name}, roll ${r.roll_number}`} title="Delete student" disabled={deletingId === r.id} onClick={() => deleteStudent(r)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"><Trash2 size={17} /></button>
                  </div></td>
                </tr>))}</tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">{view.map((r) => (
            <li key={r.id} className="clay-inset p-4">
              <div className="flex justify-between gap-2"><button type="button" className="text-left font-extrabold underline focus-visible:outline-2 focus-visible:outline-brand-700" onClick={() => setProfile(r)}>{r.name || "Name pending"} · {r.roll_number}</button></div>
              <p className="text-xs">Class {r.class} · {r.gender} · {r.school}</p>
              <p className="mt-2 grid grid-cols-3 gap-1 text-xs">{TESTS.map((t) => <span key={t.code}><b>{t.code}</b> <Cell r={r} c={t.code} /></span>)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="soft" disabled={!r.scores.length} className="!px-3 !py-2 text-xs" onClick={() => setSheet({ student: r, mode: "check" })}><ClipboardCheck size={15} />{status(r)}</Button>
                <Link prefetch={false} href={`/admin/students/${r.id}/report`} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-800 transition hover:bg-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"><FileText size={15} /> Report</Link>
                <Button variant="soft" className="!min-h-9 !px-3 !py-1.5 text-xs" onClick={() => setProfile(r)}><UserRound size={15} /> Profile</Button>
                <Button variant="soft" className="!min-h-9 !bg-violet-100 !px-3 !py-1.5 text-xs !text-violet-900" onClick={() => setSheet({ student: r, mode: "view" })}>OMR Sheet</Button>
                <button type="button" aria-label={`Delete ${r.name}, roll ${r.roll_number}`} title="Delete student" disabled={deletingId === r.id} onClick={() => deleteStudent(r)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"><Trash2 size={17} /></button>
              </div>
            </li>))}</ul>
          <div className="mt-4 flex items-center justify-between">
            <Button variant="soft" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="text-sm font-semibold">Page {page + 1} of {pages}</span>
            <Button variant="soft" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </>)}
    </Card>
    {profile && <StudentProfileDialog key={profile.id} student={profile} onClose={() => setProfile(null)} />}
    {sheet && <StudentSheetDialog key={`${sheet.student.id}:${sheet.mode}`} student={sheet.student} mode={sheet.mode} onClose={() => setSheet(null)} />}
    </div>
  );
}
