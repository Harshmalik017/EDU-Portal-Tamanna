"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Archive, ArrowUpDown, ClipboardCheck, FileSpreadsheet, FileText, RotateCcw, Search, Table2, Trash2, UserRound } from "lucide-react";
import { TESTS } from "@/lib/tamanna/tests";
import { bandOf, normalizeClass, stenOf } from "@/lib/tamanna/norms";
import { reviewComplete, sectionNotFilled } from "@/lib/tamanna/results";
import { resultsCsv } from "@/lib/tamanna/export";
import { supabase } from "@/lib/supabase/client";
import type { Student } from "@/lib/types";
import { Button, Card, Input, PageHeader, Select } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { BulkReportButtons } from "@/components/report/BulkReportButtons";
import { Dialog } from "@/components/ui/Dialog";
import { archiveDeadline, canRestore } from "@/lib/tamanna/archive";
import { deleteArchivedStudents } from "@/lib/supabase/archive";

const PAGE = 20;
const StudentProfileDialog = dynamic(() => import("@/components/features/StudentProfileDialog").then((m) => m.StudentProfileDialog));
const StudentSheetDialog = dynamic(() => import("@/components/features/StudentSheetDialog").then((m) => m.StudentSheetDialog));
const raw = (r: Student, c: string) => { const score = r.scores.find((s) => s.test_code === c); return sectionNotFilled(score, c) ? null : score?.correct ?? null; };
const sten = (r: Student, c: string) => { const v = raw(r, c); return r.excluded || v === null || r.scores.find((s) => s.test_code === c)?.uncertain ? null : stenOf(r.class, r.gender, c, v); };
const tone = { Low: "bg-amber-100 text-amber-900", Average: "bg-blue-100 text-blue-900", High: "bg-green-100 text-green-900" } as const;
const status = (r: Student) => r.excluded ? "Excluded" : !r.scores.length ? "No scan" : !reviewComplete(r) ? "Review Pending" : "Scanned";

export function ResultScore({ r, c }: { r: Student; c: string }) {
  if (sectionNotFilled(r.scores.find((score) => score.test_code === c), c)) return <span className="text-xs font-semibold text-amber-900">Section not filled</span>;
  const v = raw(r, c), s = sten(r, c);
  const uncertain = r.scores.find((score) => score.test_code === c)?.uncertain ?? 0;
  return <span className="inline-flex flex-col items-start gap-1"><span className="whitespace-nowrap text-xs" title={uncertain > 0 ? "Provisional marks from clear answers" : undefined}>Section Score: <b>{v ?? "–"}</b></span><span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ${s !== null ? tone[bandOf(s)] : "bg-slate-100 text-slate-700"}`} title={s !== null ? `Sten ${s}, ${bandOf(s)}` : uncertain > 0 ? "Review pending for a final Sten score" : "No Sten score available"}>STEN SCORE: {s ?? "–"}</span></span>;
}

function StudentPills({ student }: { student: Student }) {
  return <span className="mt-1 flex flex-wrap gap-1 text-[11px] font-bold"><span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-900">Class {student.class}</span><span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-900">{student.gender}</span></span>;
}

function SheetAction({ student, onClick }: { student: Student; onClick: () => void }) {
  const complete = reviewComplete(student);
  const pending = !student.excluded && student.scores.length > 0 && !complete;
  return <Button variant="soft" className={`!min-h-9 !bg-none !px-3 !py-2 text-xs !text-white ${complete ? "!border-green-800 !bg-green-700 hover:!bg-green-800 focus-visible:!outline-green-700" : "!border-blue-800 !bg-blue-700 hover:!bg-blue-800 focus-visible:!outline-blue-700"}`} aria-label={`OMR sheet for ${student.name}, roll ${student.roll_number}${pending ? ", Review Pending" : complete ? ", No review pending" : ""}`} onClick={onClick}><ClipboardCheck size={15} /><span className="flex flex-col items-start"><span>OMR Sheet</span>{pending && <span className="text-[10px] font-semibold">Review Pending</span>}{(student.excluded || !student.scores.length) && <span className="text-[10px] font-semibold">{student.excluded ? "Excluded" : "No scan"}</span>}</span></Button>;
}

export function ResultsTable({ rows, archived = false }: { rows: Student[]; archived?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState(""); const [cls, setCls] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ by: string; dir: 1 | -1 }>({ by: "roll_number", dir: 1 });
  const [page, setPage] = useState(0);
  const [profile, setProfile] = useState<Student | null>(null);
  const [sheet, setSheet] = useState<{ student: Student; mode: "view" | "check" } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmation, setConfirmation] = useState<{ ids: string[]; action: "archive" | "restore" | "delete"; all?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const get = (r: Student, by: string): string | number => TESTS.some((t) => t.code === by) ? raw(r, by) ?? -1 : by === "status" ? status(r) : by === "deadline" ? r.archived_at ? archiveDeadline(r.archived_at) : 0 : by === "archived_at" ? r.archived_at ?? "" : by === "roll_number" ? r.roll_number : by === "name" ? r.name : r.school;
  const shown = useMemo(() => rows
    .filter((r) => (!cls || normalizeClass(r.class) === cls) && `${r.roll_number} ${r.name} ${r.school}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => { const x = get(a, sort.by), y = get(b, sort.by); return (x > y ? 1 : x < y ? -1 : 0) * sort.dir; }), [rows, q, cls, sort]);  
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const currentPage = Math.min(page, pages - 1);
  const view = shown.slice(currentPage * PAGE, currentPage * PAGE + PAGE);
  const selectedIds = shown.filter((student) => selected.has(student.id)).map((student) => student.id);
  const restorable = (student: Student) => canRestore(student.archived_at) && !student.deletion_pending;
  const restoreSelected = selectedIds.length > 0 && shown.filter((student) => selected.has(student.id)).every(restorable);
  const allSelected = shown.length > 0 && selectedIds.length === shown.length;
  const heads: [string, string][] = [["roll_number", "Roll no."], ["name", "Name"], ["school", "School"], ...(!archived ? [...TESTS.map((t) => [t.code, t.code] as [string, string]), ["status", "OMR sheet"] as [string, string]] : [["archived_at", "Archived"], ["deadline", "Delete after"]] as [string, string][])];

  function toggle(id: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((previous) => {
      const next = new Set(previous);
      shown.forEach((student) => allSelected ? next.delete(student.id) : next.add(student.id));
      return next;
    });
  }
  async function changeArchive() {
    if (!confirmation?.ids.length) return toast("Select students first.");
    setBusy(true);
    try {
      if (confirmation.action === "delete") {
        await deleteArchivedStudents(supabase, confirmation.ids);
        toast("Students permanently deleted.");
      } else {
        const restoring = confirmation.action === "restore";
        const { data, error } = await supabase.rpc("archive_students", { p_ids: confirmation.ids, p_restore: restoring });
        if (error || data !== confirmation.ids.length) return toast(`Could not ${restoring ? "restore" : "archive"} students.${error ? ` ${error.message}` : " Refresh and try again."}`);
        toast(restoring ? "Restored and saved." : "Saved to Archive.");
      }
      setSelected(new Set()); setConfirmation(null); setProfile(null); setSheet(null);
      router.refresh();
    } catch (error) {
      console.error("Could not update student archive.", error);
      toast(error instanceof Error && error.message.startsWith("Could not") ? error.message : "Could not update student archive.");
      setConfirmation(null); router.refresh();
    } finally {
      setBusy(false);
    }
  }
  const selectionBox = (student: Student) => <input type="checkbox" aria-label={`Select roll ${student.roll_number}`} checked={selected.has(student.id)} disabled={busy} onChange={() => toggle(student.id)} className="h-5 w-5 shrink-0 accent-brand-700" />;
  const selectAll = () => <input type="checkbox" aria-label="Select all matching results" checked={allSelected} ref={(input) => { if (input) input.indeterminate = !allSelected && selectedIds.length > 0; }} disabled={busy || !shown.length} onChange={toggleAll} className="h-5 w-5 shrink-0 accent-brand-700" />;
  const archiveDates = (student: Student) => {
    const date = student.archived_at;
    return date ? <><span>{new Date(date).toLocaleDateString("en-IN")}</span><span>{new Date(archiveDeadline(date)).toLocaleDateString("en-IN")}</span></> : null;
  };
  const restoreAction = (student: Student) => <Button variant="soft" disabled={busy || !restorable(student)} onClick={() => setConfirmation({ ids: [student.id], action: "restore" })}><RotateCcw size={15} />{student.deletion_pending ? "Deletion started" : restorable(student) ? "Restore" : "Deletion pending"}</Button>;

  function exportCsv() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF", resultsCsv(shown)], { type: "text/csv;charset=utf-8" }));
    a.download = "tamanna-results.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const pagination = () => <nav aria-label="Results pagination" className="flex items-center justify-between gap-3">
    <Button variant="soft" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</Button>
    <span className="text-sm font-semibold">Page {currentPage + 1} of {pages}</span>
    <Button variant="soft" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Next</Button>
  </nav>;

  return (
    <div className="space-y-6">
    <PageHeader title={archived ? "Archive" : "Student reports"} icon={archived ? Archive : Table2}
      titleMeta={<span className="text-sm font-semibold text-ink/80">{shown.length} {shown.length === 1 ? "student" : "students"}</span>}
      actions={!archived && <div aria-label="STEN scoring" className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 font-bold text-amber-900">Low · 1–3</span>
        <span className="rounded-full border border-blue-300 bg-blue-50 px-2.5 py-1 font-bold text-blue-900">Average · 4–7</span>
        <span className="rounded-full border border-green-300 bg-green-50 px-2.5 py-1 font-bold text-green-900">High · 8–10</span>
      </div>} />
    {archived && <nav aria-label="Student record view" className="flex flex-wrap gap-2">
      <Link prefetch={false} href="/admin/results" aria-current={!archived ? "page" : undefined} className={!archived ? "clay-btn" : "clay-btn-soft"}>Active students</Link>
      <Link prefetch={false} href="/admin/archive" aria-current={archived ? "page" : undefined} className={archived ? "clay-btn" : "clay-btn-soft"}><Archive size={18} /> Archive</Link>
    </nav>}
    <Card>
      {archived && <p className="mb-4 text-sm font-semibold">Restore within 30 days. Expired students and files are permanently deleted by daily cleanup.</p>}
      <div className="mb-4 flex flex-wrap items-center gap-2 [&>button]:px-3 [&>button]:text-xs">
        <span className="whitespace-nowrap text-sm font-semibold" role="status">{selectedIds.length} selected</span>
        <form className="flex w-full flex-wrap items-center gap-2 sm:w-auto" onSubmit={(event) => { event.preventDefault(); setQ(search); setPage(0); setSelected(new Set()); }}>
          <div className="min-w-0 flex-1 sm:w-40 sm:flex-none">
            <Input hideLabel label="Search name, roll no. or school" placeholder="Name, roll no. or school" className="!py-2.5" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="w-32 shrink-0">
            <Select hideLabel label="Classes" options={["IX", "X"]} placeholder="All classes" className="!py-2.5" value={cls} onChange={(event) => { setCls(event.target.value); setPage(0); setSelected(new Set()); }} />
          </div>
          <Button type="submit" variant="soft" className="!px-3 text-xs"><Search size={16} /> Search</Button>
        </form>
          {!archived && shown.some(reviewComplete) && <BulkReportButtons cls={cls} />}
          {!archived && <Button onClick={exportCsv} disabled={!shown.length} className="!border-green-700 !bg-green-700 !text-white hover:!bg-green-800 focus-visible:!outline-green-700"><FileSpreadsheet size={18} /> Download CSV</Button>}
          {archived && <Button variant="soft" disabled={busy || !rows.length} onClick={() => setConfirmation({ ids: rows.map((student) => student.id), action: "delete", all: true })}><Trash2 size={18} /> Clear archive</Button>}
      </div>
      {selectedIds.length > 0 && <div className="mb-4 flex flex-wrap items-center gap-3">
          <Button variant="soft" disabled={busy} onClick={() => setSelected(new Set())}>Clear selection</Button>
          {archived && <Button variant="soft" disabled={busy || !restoreSelected} onClick={() => setConfirmation({ ids: selectedIds, action: "restore" })}><RotateCcw size={18} /> Restore selected</Button>}
          <Button variant="soft" disabled={busy} onClick={() => setConfirmation({ ids: selectedIds, action: archived ? "delete" : "archive" })}><Trash2 size={18} />{archived ? "Delete selected permanently" : "Delete selected"}</Button>
          {archived && !restoreSelected && <span className="text-sm text-amber-900">Some selected students cannot be restored.</span>}
      </div>}
      {!shown.length ? <p className="py-10 text-center">No results.</p> : (
        <>
          <div className="mb-4">{pagination()}</div>
          <div className="hidden overflow-x-auto rounded-xl border border-(--line) md:block">
            <table className="min-w-[1200px] w-full border-collapse text-left text-sm">
              <thead className="bg-brand-100 text-brand-700">
                <tr><th scope="col" className="border-b border-r border-(--line) px-3 py-3">{selectAll()}</th>{heads.map(([k, h]) => <th key={k} scope="col" className="border-b border-r border-(--line) px-3 py-3 last:border-r-0"><button className="flex items-center gap-1 font-bold" onClick={() => setSort((s) => ({ by: k, dir: s.by === k ? (-s.dir as 1 | -1) : 1 }))}>{h}<ArrowUpDown size={12} /></button></th>)}<th scope="col" className="border-b border-(--line) px-3 py-3">Actions</th></tr>
              </thead>
              <tbody>{view.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-brand-50/70">
                  <td className="border-b border-r border-(--line) px-3 py-2.5">{selectionBox(r)}</td>
                  <td className="border-b border-r border-(--line) px-3 py-2.5 font-semibold">{archived ? r.roll_number : <button type="button" className="min-h-11 underline focus-visible:outline-2 focus-visible:outline-brand-700" aria-label={`Profile for ${r.name}, roll ${r.roll_number}`} onClick={() => setProfile(r)}>{r.roll_number}</button>}</td><td className="border-b border-r border-(--line) px-3 py-2.5">{r.name || "Name pending"}<StudentPills student={r} /></td><td className="border-b border-r border-(--line) px-3 py-2.5">{r.school}</td>
                  {archived ? <><td className="border-b border-r border-(--line) px-3 py-2.5">{r.archived_at && new Date(r.archived_at).toLocaleDateString("en-IN")}</td><td className="border-b border-r border-(--line) px-3 py-2.5">{r.archived_at && new Date(archiveDeadline(r.archived_at)).toLocaleDateString("en-IN")}</td></> : <>
                  {TESTS.map((t) => <td key={t.code} className="border-b border-r border-(--line) px-3 py-2.5"><ResultScore r={r} c={t.code} /></td>)}
                  <td className="border-b border-r border-(--line) px-3 py-2.5"><SheetAction student={r} onClick={() => setSheet({ student: r, mode: "check" })} /></td></>}
                  <td className="border-b border-(--line) px-3 py-2.5"><div className="flex items-center gap-2">
                    {archived ? restoreAction(r) : <>
                    {reviewComplete(r) && <Link prefetch={false} scroll={false} href={`/admin/students/${r.id}/report`} aria-label={`Report for roll ${r.roll_number}`} title="Report" className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-800 transition hover:bg-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"><FileText size={15} /> Report</Link>}
                    <Button variant="soft" className="!min-h-9 !px-3 !py-1.5 text-xs" onClick={() => setProfile(r)}><UserRound size={15} /> Profile</Button>
                    <button type="button" aria-label={`Delete ${r.name}, roll ${r.roll_number}`} title="Move to Archive" disabled={busy} onClick={() => setConfirmation({ ids: [r.id], action: "archive" })} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"><Trash2 size={17} /></button></>}
                  </div></td>
                </tr>))}</tbody>
            </table>
          </div>
          <label className="mb-3 flex min-h-11 items-center gap-2 text-sm font-semibold md:hidden">{selectAll()} All matching results</label>
          <ul className="space-y-3 md:hidden">{view.map((r) => (
            <li key={r.id} className="clay-inset p-4">
              <div className="flex items-center justify-between gap-3">{archived ? <span className="font-extrabold">{r.name || "Name pending"} · {r.roll_number}</span> : <button type="button" className="text-left font-extrabold underline focus-visible:outline-2 focus-visible:outline-brand-700" onClick={() => setProfile(r)}>{r.name || "Name pending"} · {r.roll_number}</button>}{selectionBox(r)}</div>
              <StudentPills student={r} />
              <p className="mt-1 text-xs">{r.school}</p>
              {archived ? <div className="mt-2 grid grid-cols-2 gap-2 text-xs"><b>Archived</b><b>Delete after</b>{archiveDates(r)}</div> : <p className="mt-2 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">{TESTS.map((t) => <span key={t.code} className="flex flex-col items-start gap-1"><b>{t.code}</b><ResultScore r={r} c={t.code} /></span>)}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {archived ? restoreAction(r) : <>
                <SheetAction student={r} onClick={() => setSheet({ student: r, mode: "check" })} />
                {reviewComplete(r) && <Link prefetch={false} scroll={false} href={`/admin/students/${r.id}/report`} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-800 transition hover:bg-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"><FileText size={15} /> Report</Link>}
                <Button variant="soft" className="!min-h-9 !px-3 !py-1.5 text-xs" onClick={() => setProfile(r)}><UserRound size={15} /> Profile</Button>
                <button type="button" aria-label={`Delete ${r.name}, roll ${r.roll_number}`} title="Move to Archive" disabled={busy} onClick={() => setConfirmation({ ids: [r.id], action: "archive" })} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"><Trash2 size={17} /></button></>}
              </div>
            </li>))}</ul>
          <div className="mt-4">{pagination()}</div>
        </>)}
    </Card>
    {profile && <StudentProfileDialog key={profile.id} student={profile} onClose={() => setProfile(null)} />}
    {sheet && <StudentSheetDialog key={`${sheet.student.id}:${sheet.mode}`} student={sheet.student} mode={sheet.mode} onClose={() => setSheet(null)} />}
    {confirmation && <Dialog title={confirmation.action === "delete" ? confirmation.all ? "Clear archive" : "Permanently delete students" : archived ? "Restore students" : "Move students to Archive"} busy={busy} onClose={() => setConfirmation(null)}>
      <p className="text-sm font-semibold">{confirmation.ids.length} student{confirmation.ids.length === 1 ? "" : "s"} selected</p>
      {confirmation.action === "delete" ? <>
        {confirmation.all && <p className="text-sm">All archived students, including those hidden by search and class filters.</p>}
        <p className="text-sm font-semibold text-red-800">Permanently delete these students, scores, and uploaded files now. This cannot be undone.</p>
      </> : !archived && <p className="text-sm">Restore within 30 days. Student records, scores, and uploaded files are permanently deleted after that period.</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="soft" disabled={busy} onClick={() => setConfirmation(null)}>Cancel</Button>
        <Button disabled={busy} onClick={changeArchive}>{busy ? confirmation.action === "delete" ? "Deleting…" : "Saving…" : confirmation.action === "delete" ? "Delete permanently" : archived ? "Restore students" : "Move to Archive"}</Button>
      </div>
    </Dialog>}
    </div>
  );
}
