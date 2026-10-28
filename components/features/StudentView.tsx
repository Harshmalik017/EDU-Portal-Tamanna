"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Download, FileText, Save, Trash2, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { buildProfile } from "@/lib/tamanna/profile";
import type { Key, Student as S } from "@/lib/types";
import type { Marked, PageResult } from "@/lib/omr/reader";
import { TESTS } from "@/lib/tamanna/tests";
import { Badge, Button, Card, Input, PageHeader, Select } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { ManualCheckDialog } from "@/components/features/ManualCheckDialog";
import { AnswerReview } from "@/components/features/AnswerReview";

const tone = { Low: "bg-amber-100 text-amber-900", Average: "bg-blue-100 text-blue-900", High: "bg-green-100 text-green-900" } as const;

export function StudentView({ initial, imgs, pdfUrl, filePaths, responses, answerKey, email, keyHash }: { initial: S; imgs: string[]; pdfUrl: string | null; filePaths: string[]; responses: PageResult; answerKey: Key; email: string; keyHash: string }) {
  const id = initial.id;
  const router = useRouter();
  const toast = useToast();
  const [s, setS] = useState<S>(initial);
  const [marked, setMarked] = useState(responses);
  const [scoring, setScoring] = useState(false);
  useEffect(() => { setS(initial); setMarked(responses); }, [initial, responses]);
  const [manualCheckOpen, setManualCheckOpen] = useState(false);
  const p = buildProfile(s);

  async function save() {
    if (!/^\d{5}$/.test(s.roll_number.trim()) && s.roll_number !== initial.roll_number) return toast("Enter a five-digit roll number.");
    if (!s.name.trim()) return toast("Enter student name.");
    const { error } = await supabase.from("students").update({ name: s.name.trim(), roll_number: s.roll_number.trim(), class: s.class, gender: s.gender, school: s.school, block: s.block, district: s.district }).eq("id", id);
    if (error) return toast("Could not save.");
    toast("Saved"); router.refresh();
  }
  function changeAnswer(test: string, q: number, value: Marked) {
    const count = TESTS.find((item) => item.code === test)!.questions;
    const answers = Array.from({ length: count }, (_, i) => marked[test]?.[i] === undefined ? "UNCERTAIN" : marked[test][i]);
    answers[q] = value; setMarked({ ...marked, [test]: answers });
  }
  async function saveAnswers() {
    if (!keyHash) return toast("Could not score. Save the complete official answer key first.");
    setScoring(true);
    try {
      const { error } = await supabase.rpc("review_copy", { p_student_id: id, p_responses: marked, p_expected_key_hash: keyHash });
      if (error) return toast(`Could not score. ${error.message}`);
      toast("Answers saved. Scores need a hand check."); router.refresh();
    } finally { setScoring(false); }
  }
  async function recheck() {
    const { error } = await supabase.from("students").update({ verification_status: "pending", verification_note: null }).eq("id", id);
    if (!error) { setS({ ...s, verification_status: "pending", verification_note: null }); toast("Sent back for verification"); router.refresh(); }
  }
  async function del() {
    if (!confirm(`Delete ${s.name || `roll ${s.roll_number}`} and all scores? This cannot be undone.`)) return;
    if (filePaths.length) {
      const { error: storageError } = await supabase.storage.from("sheets").remove(filePaths);
      if (storageError) return toast("Could not delete student files.");
    }
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) return toast("Could not delete student.");
    toast("Deleted"); router.push("/admin/results"); router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${s.name || "Name pending"} · ${s.roll_number}`}
        icon={UserRound}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/results" className="clay-btn-soft"><ArrowLeft size={18} /> Back to results</Link>
            {!s.excluded && <Button variant="soft" disabled={s.scores.length !== TESTS.length} onClick={() => setManualCheckOpen(true)}><ClipboardCheck size={18} /> Hand Check</Button>}
            <Link href={`/admin/students/${id}/report`} className="clay-btn"><FileText size={18} /> Open report</Link>
          </div>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-lg font-bold">Student details</h2>
          {s.excluded && <p className="clay-inset p-3 text-sm font-semibold">Excluded: {s.exclude_reason || "answer pattern"}.</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Roll number" value={s.roll_number} onChange={(e) => setS({ ...s, roll_number: e.target.value })} />
            <Input label="Student name" value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} />
            <Select label="Class" options={["IX", "X"]} value={s.class ?? ""} onChange={(e) => setS({ ...s, class: e.target.value })} />
            <Select label="Gender" options={["Male", "Female", "Not specified"]} value={s.gender ?? ""} onChange={(e) => setS({ ...s, gender: e.target.value })} />
            <Input label="School" value={s.school ?? ""} onChange={(e) => setS({ ...s, school: e.target.value })} />
            <Input label="Block" value={s.block ?? ""} onChange={(e) => setS({ ...s, block: e.target.value })} />
            <Input label="District" value={s.district ?? ""} onChange={(e) => setS({ ...s, district: e.target.value })} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={save}><Save size={18} /> Save changes</Button>
            <Button variant="soft" onClick={del}><Trash2 size={18} /> Delete</Button>
          </div>
          <div className="clay-inset p-3 text-sm">
            <p className="flex items-center gap-2 font-semibold">Verification <Badge tone={s.verification_status === "verified" ? "green" : s.verification_status === "mismatch" ? "red" : "amber"}>{s.verification_status === "verified" ? "Verified" : s.verification_status === "mismatch" ? "Mismatch" : "Pending"}</Badge></p>
            {s.verification_note && <p className="mt-1">{s.verification_note}</p>}
            {s.verification_status === "mismatch" && <Button variant="soft" className="mt-2 !py-2" onClick={recheck}>Send back for re-check</Button>}
          </div>
          {!!s.review_issues?.length && <ul className="text-sm text-amber-900">{s.review_issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
          {imgs.length > 0 && <div><h3 className="mb-2 font-extrabold">Original scanned pages</h3>{imgs.map((u) => <img key={u} src={u} alt="Original scanned answer sheet" className="mb-3 w-full rounded-xl" />)}</div>}
          {pdfUrl && <a href={pdfUrl} target="_blank" rel="noreferrer" className="clay-btn-soft w-fit"><Download size={18} /> Open original PDF</a>}
        </Card>
        <Card>
          <h2 className="mb-1 text-lg font-bold">Scorecard</h2>
          <p className="mb-4 text-xs">{p.normLabel}</p>
          <ul className="space-y-2">{p.rows.map((r) => (
            <li key={r.code} className="clay-inset flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <span className="font-extrabold">{r.code} <span className="text-sm font-semibold">{r.name}</span></span>
              <span className="flex items-center gap-2 text-sm"><b>{r.raw ?? "–"}</b>/{r.max}
                {r.band && (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tone[r.band]}`}>
                    Sten {r.sten} · {r.band}{r.nearHigh ? " (Close to High)" : ""}{r.giveReccs ? " · Reccs given" : ""}
                  </span>
                )}
              </span>
            </li>))}</ul>
        </Card>
      </div>
      <AnswerReview responses={marked} answerKey={answerKey} onChange={changeAnswer} />
      <Button onClick={saveAnswers} disabled={scoring || !keyHash}>{scoring ? "Saving…" : "Save checked answers and score"}</Button>
      {manualCheckOpen && <ManualCheckDialog students={s.excluded ? [] : [s]} initialStudentId={s.id} email={email} onClose={() => setManualCheckOpen(false)} />}
    </div>
  );
}
