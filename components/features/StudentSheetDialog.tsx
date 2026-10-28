"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui";
import { AnswerReview } from "@/components/features/AnswerReview";
import { SheetDisplay } from "@/components/features/OMRSheetPreview";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase/client";
import { OPTIONS, TESTS } from "@/lib/tamanna/tests";
import type { Student, StudentSheet } from "@/lib/types";
import type { PageResult } from "@/lib/omr/reader";

export function StudentSheetDialog({ student, mode, onClose }: { student: Student; mode: "view" | "check"; onClose: () => void }) {
  const [sheet, setSheet] = useState<StudentSheet | null>(null);
  const [marked, setMarked] = useState<PageResult>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    async function load() {
      try {
        const response = await fetch(`/api/admin/students/${encodeURIComponent(student.id)}/sheet`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) {
          const failure: { error?: string } = await response.json();
          throw new Error(failure.error ?? "Could not load the student sheet.");
        }
        const data: StudentSheet = await response.json();
        if (!controller.signal.aborted) { setSheet(data); setMarked(data.responses); }
      } catch (failure) {
        if (!controller.signal.aborted) {
          console.error("Could not load the student sheet.", failure);
          setError(failure instanceof Error ? failure.message : "Could not load the student sheet.");
        }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [student.id, attempt]);
  const ready = TESTS.every((test) => marked[test.code]?.length === test.questions && marked[test.code].every((value) => value === null || value === "MULTI" || OPTIONS.some((option) => option === value)));
  async function save() {
    if (!sheet || !ready) return toast("Select an answer, blank, or multiple marks for every question.");
    setBusy(true);
    try {
      const { error: saveError } = await supabase.rpc("review_copy", { p_student_id: student.id, p_responses: marked, p_expected_key_hash: sheet.keyHash });
      if (saveError) return toast(`Could not score. ${saveError.message}`);
      toast("Answers and scores saved. Pending hand check."); onClose(); router.refresh();
    } catch (failure) {
      console.error("Could not score the checked sheet.", failure); toast("Could not score the checked sheet.");
    } finally { setBusy(false); }
  }
  return <Dialog wide busy={busy} title={`${mode === "check" ? "Confirm scores" : "OMR sheet"} · ${student.name || "Name pending"} · ${student.roll_number}`} onClose={onClose}>
    {loading ? <p role="status">Loading student sheet…</p> : error ? <div role="alert" className="space-y-3"><p>{error}</p><Button variant="soft" onClick={() => setAttempt((value) => value + 1)}>Try again</Button></div> : sheet && <>
      <SheetDisplay pages={sheet.originals} pdfUrl={sheet.pdfUrl} responses={marked} answerKey={sheet.answerKey} name={student.name} roll={student.roll_number} />
      {mode === "check" && <>
        <fieldset disabled={busy}><AnswerReview responses={marked} answerKey={sheet.answerKey} onChange={setMarked} /></fieldset>
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-(--line) bg-[#fbfdf4] py-3">
          {!ready && <p className="text-sm font-semibold text-amber-900">Select all responses marked “Needs checking”.</p>}
          <Button onClick={save} disabled={!ready || busy}>{busy ? "Saving…" : "Confirm and score"}</Button>
        </div>
      </>}
    </>}
  </Dialog>;
}
