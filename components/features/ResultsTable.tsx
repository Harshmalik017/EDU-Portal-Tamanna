"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowUpDown, ClipboardCheck, FileSpreadsheet, FileText, Printer, Search, Table2, Trash2, UserRound } from "lucide-react";
import { TESTS } from "@/lib/tamanna/tests";
import { bandOf, normalizeClass, stenOf } from "@/lib/tamanna/norms";
import { supabase } from "@/lib/supabase/client";
import type { Key, Student } from "@/lib/types";
import { Badge, Button, Card, Input, PageHeader, Select, StatCard } from "@/components/ui";
import { ManualCheckDialog } from "@/components/features/ManualCheckDialog";
import { OMRSheetPreview } from "@/components/features/OMRSheetPreview";
import type { PageResult } from "@/lib/omr/reader";
import { useToast } from "@/components/Toast";

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

export function ResultsTable({ rows, email, omrSheets, answerKey }: { rows: Student[]; email: string; answerKey: Key; omrSheets: Record<string, { originals: { label: string; url: string }[]; responses: PageResult; pdfUrl?: string }> }) {
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState(""); const [cls, setCls] = useState("");
  const [sort, setSort] = useState<{ by: string; dir: 1 | -1 }>({ by: "roll_number", dir: 1 });
  const [page, setPage] = useState(0);
  const [manualCheck, setManualCheck] = useState<{ studentId?: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const eligibleStudents = rows.filter((row) => !row.excluded);
  const classRows = rows.filter((row) => !cls || normalizeClass(row.class) === cls);
  const checkedRows = classRows.filter((row) => !row.excluded);
  const verifiedCount = checkedRows.filter((row) => row.verification_status === "verified").length;
  const mismatchCount = checkedRows.filter((row) => row.verification_status === "mismatch").length;
  const excludedCount = classRows.filter((row) => row.excluded).length;
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
    const head = ["Roll number", "Name", "Class", "Gender", "School", "Block", "District", ...TESTS.flatMap((t) => [`${t.code} score`, `${t.code} sten`, `${t.code} level`]), "Verification", "Excluded"];
    const csv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const lines = shown.map((r) => [r.roll_number, r.name, r.class, r.gender, r.school ?? "", r.block ?? "", r.district ?? "", ...TESTS.flatMap((t) => { const s = sten(r, t.code); return [raw(r, t.code) ?? "", s ?? "", s ? bandOf(s) : ""]; }), r.verification_status ?? "pending", r.excluded ? "yes" : "no"].map(csv).join(","));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" }));
    a.download = "tamanna-results.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  return (
    <div className="space-y-6">
    <PageHeader title="Student reports" icon={Table2} actions={<Button variant="soft" disabled={!eligibleStudents.length} onClick={() => setManualCheck({})}><ClipboardCheck size={18} /> Manual Check</Button>} />
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard icon={ClipboardCheck} label="Verified by hand" value={verifiedCount} tone="blue" />
      <StatCard icon={AlertTriangle} label="Score differences" value={mismatchCount} tone="amber" />
      <StatCard icon={FileText} label="Excluded sheets" value={excludedCount} tone="violet" />
    </div>
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink/80">{shown.length} students</p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/reports${cls ? `?class=${cls}` : ""}`} className="clay-btn-soft"><Printer size={18} /> Print all reports</Link>
          <Button onClick={exportCsv} disabled={!shown.length} className="!border-green-700 !bg-green-700 !text-white hover:!bg-green-800 focus-visible:!outline-green-700"><FileSpreadsheet size={18} /> Download CSV</Button>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-ink/80">Marks and Sten score</span>
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
                  <td className="border-b border-r border-(--line) px-3 py-2.5 font-semibold"><Link className="underline" href={`/admin/students/${r.id}`}>{r.roll_number}</Link></td><td className="border-b border-r border-(--line) px-3 py-2.5">{r.name || "Name pending"}</td><td className="border-b border-r border-(--line) px-3 py-2.5">{r.class}</td><td className="border-b border-r border-(--line) px-3 py-2.5">{r.gender}</td><td className="border-b border-r border-(--line) px-3 py-2.5">{r.school}</td>
                  {TESTS.map((t) => <td key={t.code} className="border-b border-r border-(--line) px-3 py-2.5"><Cell r={r} c={t.code} /></td>)}
                  <td className="border-b border-r border-(--line) px-3 py-2.5"><Badge tone={TONE[status(r)]}>{status(r)}</Badge></td>
                  <td className="border-b border-(--line) px-3 py-2.5"><div className="flex items-center gap-2">
                    {!r.excluded && <Button variant="soft" className="!min-h-9 !px-3 !py-1.5 text-xs" onClick={() => setManualCheck({ studentId: r.id })}><ClipboardCheck size={15} />{r.verification_status && r.verification_status !== "pending" ? "Recheck" : "Hand Check"}</Button>}
                    <Link href={`/admin/students/${r.id}/report`} aria-label={`Report for ${r.name}, roll ${r.roll_number}`} title="Report" className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-800 transition hover:bg-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"><FileText size={15} /> Report</Link>
                    <Link href={`/admin/students/${r.id}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 transition hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"><UserRound size={15} /> Profile</Link>
                    <OMRSheetPreview variant="button" originalPages={omrSheets[r.id]?.originals ?? []} originalPdfUrl={omrSheets[r.id]?.pdfUrl} responses={omrSheets[r.id]?.responses ?? {}} answerKey={answerKey} roll={r.roll_number} name={r.name} />
                    <button type="button" aria-label={`Delete ${r.name}, roll ${r.roll_number}`} title="Delete student" disabled={deletingId === r.id} onClick={() => deleteStudent(r)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"><Trash2 size={17} /></button>
                  </div></td>
                </tr>))}</tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">{view.map((r) => (
            <li key={r.id} className="clay-inset p-4">
              <div className="flex justify-between gap-2"><Link href={`/admin/students/${r.id}`} className="font-extrabold underline">{r.name || "Name pending"} · {r.roll_number}</Link><Badge tone={TONE[status(r)]}>{status(r)}</Badge></div>
              <p className="text-xs">Class {r.class} · {r.gender} · {r.school}</p>
              <p className="mt-2 grid grid-cols-3 gap-1 text-xs">{TESTS.map((t) => <span key={t.code}><b>{t.code}</b> <Cell r={r} c={t.code} /></span>)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {!r.excluded && <Button variant="soft" className="!min-h-9 !px-3 !py-1.5 text-xs" onClick={() => setManualCheck({ studentId: r.id })}><ClipboardCheck size={15} />{r.verification_status && r.verification_status !== "pending" ? "Recheck" : "Hand Check"}</Button>}
                <Link href={`/admin/students/${r.id}/report`} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-800 transition hover:bg-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"><FileText size={15} /> Report</Link>
                <Link href={`/admin/students/${r.id}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 transition hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"><UserRound size={15} /> Profile</Link>
                <OMRSheetPreview variant="button" originalPages={omrSheets[r.id]?.originals ?? []} originalPdfUrl={omrSheets[r.id]?.pdfUrl} responses={omrSheets[r.id]?.responses ?? {}} answerKey={answerKey} roll={r.roll_number} name={r.name} />
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
    {manualCheck && <ManualCheckDialog students={eligibleStudents} initialStudentId={manualCheck.studentId} email={email} onClose={() => setManualCheck(null)} />}
    </div>
  );
}
