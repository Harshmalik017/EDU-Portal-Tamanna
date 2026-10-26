"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui";
import { supabase } from "@/lib/supabase/client";
import { TESTS } from "@/lib/tamanna/tests";
import type { Student } from "@/lib/types";

type Scores = Record<string, string>;

export function ManualCheckDialog({
  students,
  initialStudentId,
  email,
  onClose,
}: {
  students: Student[];
  initialStudentId?: string;
  email: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [studentId, setStudentId] = useState(initialStudentId ?? "");
  const [scores, setScores] = useState<Scores>({});
  const [busy, setBusy] = useState(false);
  const student = useMemo(() => students.find((item) => item.id === studentId), [students, studentId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  useEffect(() => {
    const previous = student?.manual_scores;
    setScores(Object.fromEntries(TESTS.map((test) => [test.code, previous?.[test.code] == null ? "" : String(previous[test.code])])));
  }, [student?.id, student?.manual_scores]);

  async function save() {
    if (!student) return toast("Select a student.");
    const invalid = TESTS.find((test) => {
      const value = scores[test.code];
      const score = Number(value);
      return value === "" || !Number.isInteger(score) || score < 0 || score > test.questions;
    });
    if (invalid) return toast(`Enter a whole ${invalid.code} score from 0 to ${invalid.questions}.`);

    setBusy(true);
    const manualScores = Object.fromEntries(TESTS.map((test) => [test.code, Number(scores[test.code])]));
    const differences = TESTS.filter((test) => manualScores[test.code] !== (student.scores.find((score) => score.test_code === test.code)?.correct ?? 0))
      .map((test) => `${test.code}: app ${student.scores.find((score) => score.test_code === test.code)?.correct ?? 0}, manual ${manualScores[test.code]}`);
    const matched = differences.length === 0;
    const { error } = await supabase.from("students").update({
      verification_status: matched ? "verified" : "mismatch",
      verified_by: email,
      verified_at: new Date().toISOString(),
      manual_scores: manualScores,
      verification_note: matched ? null : differences.join("; "),
    }).eq("id", student.id);
    setBusy(false);
    if (error) return toast("Could not save manual check.");
    toast(matched ? `Roll ${student.name}: verified` : `Roll ${student.name}: mismatch recorded`);
    onClose();
    router.refresh();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="manual-check-title"
      onClose={onClose}
      onClick={(event) => { if (event.target === dialogRef.current) onClose(); }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-(--line) bg-[#fbfdf4] p-0 text-ink shadow-2xl backdrop:bg-[#25331a]/50"
    >
      <div className="flex items-center justify-between gap-3 border-b border-(--line) px-5 py-4">
        <h2 id="manual-check-title" className="flex items-center gap-2 text-xl font-extrabold"><ClipboardCheck size={20} /> Manual check</h2>
        <button type="button" aria-label="Close manual check" onClick={onClose} className="rounded-lg p-2 hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-brand-600"><X size={20} /></button>
      </div>
      <div className="space-y-4 p-5">
        <label className="block text-sm font-semibold">
          Student
          <select
            autoFocus
            required
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            className="clay-inset mt-1 w-full px-4 py-3 outline-hidden focus:ring-2 focus:ring-brand-600"
          >
            <option value="">Select a student</option>
            {students.map((item) => <option key={item.id} value={item.id}>Roll {item.name} · Class {item.class} · {item.school}</option>)}
          </select>
        </label>
        {student && (
          <>
            <p className="text-sm text-ink/80">Count correct answers by hand for each sub-test, then compare with the portal’s scores.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TESTS.map((test) => {
                const appScore = student.scores.find((score) => score.test_code === test.code)?.correct ?? 0;
                return (
                  <label key={test.code} className="clay-inset block p-3 text-sm font-semibold">
                    {test.code} <span className="font-normal text-ink/75">(portal: {appScore}/{test.questions})</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={test.questions}
                      step={1}
                      required
                      aria-label={`Manual ${test.code} score`}
                      value={scores[test.code] ?? ""}
                      onChange={(event) => setScores((previous) => ({ ...previous, [test.code]: event.target.value }))}
                      className="mt-2 w-full rounded-lg bg-white/70 px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-brand-600"
                    />
                  </label>
                );
              })}
            </div>
          </>
        )}
        <div className="flex flex-wrap justify-end gap-2 border-t border-(--line) pt-4">
          <Button type="button" variant="soft" onClick={onClose}>Cancel</Button>
          <Button type="button" disabled={!student || busy} onClick={save}>{busy ? "Saving…" : "Compare and save"}</Button>
        </div>
      </div>
    </dialog>
  );
}
