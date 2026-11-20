"use client";
import Link from "next/link";
import { ClipboardCheck, FileText, Trash2, UserRound } from "lucide-react";
import { Button, StatusPill } from "@/components/ui";
import { bandOf, stenOf } from "@/lib/tamanna/norms";
import { reviewComplete, sectionNotFilled, stenClassIssue } from "@/lib/tamanna/results";
import type { Student } from "@/lib/types";

export const rawScore = (student: Student, code: string) => {
  const score = student.scores.find((item) => item.test_code === code);
  return sectionNotFilled(score, code) ? null : score?.correct ?? null;
};

export const stenScore = (student: Student, code: string) => {
  const value = rawScore(student, code);
  return student.excluded || value === null || student.scores.find((item) => item.test_code === code)?.uncertain ? null : stenOf(student.class, student.gender, code, value);
};

const tone = { Low: "amber", Average: "blue", High: "green" } as const;

export function ResultScore({ student, code }: { student: Student; code: string }) {
  if (sectionNotFilled(student.scores.find((score) => score.test_code === code), code)) return <span className="text-xs font-semibold text-amber-900">Section not filled</span>;
  const value = rawScore(student, code), sten = stenScore(student, code);
  const uncertain = student.scores.find((score) => score.test_code === code)?.uncertain ?? 0;
  const classIssue = stenClassIssue(student.class);
  return <span className="inline-flex flex-col items-start gap-1">
    <span className="whitespace-nowrap text-xs" title={uncertain > 0 ? "Provisional marks from clear answers" : undefined}>Section Score: <b>{value ?? "–"}</b></span>
    <StatusPill tone={sten !== null ? tone[bandOf(sten)] : "slate"} className="whitespace-nowrap" title={sten !== null ? `Sten ${sten}, ${bandOf(sten)}` : classIssue ?? (uncertain > 0 ? "Review pending for a final Sten score" : "No Sten score available")}>STEN SCORE: {sten ?? "–"}</StatusPill>
    {classIssue && <span className="max-w-40 text-xs font-semibold text-amber-900">{classIssue}</span>}
  </span>;
}

export function StudentPills({ student }: { student: Student }) {
  return <span className="mt-1 flex flex-wrap gap-1 text-[11px] font-bold">
    <StatusPill tone="blue">{student.class?.trim() ? `Class ${student.class}` : "Class missing"}</StatusPill>
    <StatusPill tone="violet">{student.gender}</StatusPill>
  </span>;
}

export function SheetAction({ student, onClick }: { student: Student; onClick: () => void }) {
  const complete = reviewComplete(student);
  const pending = !student.excluded && student.scores.length > 0 && !complete;
  return <Button variant="soft" className={`!min-h-11 !bg-none !px-3 !py-2 text-xs !text-white ${complete ? "!border-green-800 !bg-green-700 hover:!bg-green-800 focus-visible:!outline-green-700" : "!border-blue-800 !bg-blue-700 hover:!bg-blue-800 focus-visible:!outline-blue-700"}`} aria-label={`OMR sheet for ${student.name}, roll ${student.roll_number}${pending ? ", Review Pending" : complete ? ", No review pending" : ""}`} onClick={onClick}>
    <ClipboardCheck size={15} aria-hidden="true" />
    <span className="flex flex-col items-start">
      <span>OMR Sheet</span>
      {pending && <span className="text-[10px] font-semibold">Review Pending</span>}
      {(student.excluded || !student.scores.length) && <span className="text-[10px] font-semibold">{student.excluded ? "Excluded" : "No scan"}</span>}
    </span>
  </Button>;
}

export function StudentActions({ student, busy, onProfile, onDelete }: { student: Student; busy: boolean; onProfile: () => void; onDelete: () => void }) {
  return <>
    {reviewComplete(student) && <Link prefetch={false} scroll={false} href={`/admin/students/${student.id}/report`} aria-label={`Report for roll ${student.roll_number}`} title="Report" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-800 transition-colors hover:bg-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"><FileText size={15} aria-hidden="true" /> Report</Link>}
    <Button variant="soft" className="!min-h-11 !px-3 !py-1.5 text-xs" onClick={onProfile}><UserRound size={15} aria-hidden="true" /> Profile</Button>
    <button type="button" aria-label={`Delete ${student.name}, roll ${student.roll_number}`} title="Move to Archive" disabled={busy} onClick={onDelete} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 transition-colors hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"><Trash2 size={17} aria-hidden="true" /></button>
  </>;
}
