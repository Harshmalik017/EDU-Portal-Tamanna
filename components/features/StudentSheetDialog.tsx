"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui";
import { SheetDisplay } from "@/components/features/OMRSheetPreview";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase/client";
import type { Student, StudentSheet } from "@/lib/types";
import type { PageResult } from "@/lib/omr/reader";
import { ReplaceSheetDialog } from "@/components/features/ReplaceSheetDialog";
import { stenClassIssue } from "@/lib/tamanna/results";
import { responsesReady } from "@/lib/tamanna/responses";
import { reviewSheet } from "@/lib/supabase/review-sheet";
import { useUnsavedChanges } from "@/components/hooks/useUnsavedChanges";

export function StudentSheetDialog({ student, mode, onClose }: { student: Student; mode: "view" | "check"; onClose: () => void }) {
  const [sheet, setSheet] = useState<StudentSheet | null>(null);
  const [marked, setMarked] = useState<PageResult>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const classIssue = stenClassIssue(student.class);
  useUnsavedChanges(!!sheet && JSON.stringify(marked) !== JSON.stringify(sheet.responses));
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
  const ready = responsesReady(marked);
  async function save() {
    if (!sheet || !ready) return toast("Select an answer, No response, or M for every question.");
    setBusy(true);
    try {
      await reviewSheet(supabase, student.id, marked, sheet.keyHash);
      toast(classIssue ? `No STEN score available. Raw marks saved. ${classIssue}` : "Scan answers confirmed. Final marks saved."); onClose(); router.refresh();
    } catch (failure) {
      console.error("Could not score the checked sheet.", failure);
      toast(failure instanceof Error && failure.message.startsWith("Could not") ? failure.message : "Could not score the checked sheet.");
    } finally { setBusy(false); }
  }
  return <><Dialog wide busy={busy || replacing} title={`OMR sheet · ${student.name || "Name pending"} · ${student.roll_number}`} onClose={onClose}
    headerActions={sheet && !loading && !error && <Button variant="soft" disabled={busy || replacing} onClick={() => setReplacing(true)}>Reupload OMR</Button>}>
    {loading ? <p role="status">Loading student sheet…</p> : error ? <div role="alert" className="space-y-3"><p>{error}</p><Button variant="soft" onClick={() => setAttempt((value) => value + 1)}>Try again</Button></div> : sheet && <>
      {classIssue && <p role="status" className="text-sm font-semibold text-amber-900">{classIssue} STEN unavailable; raw marks can be saved.</p>}
      <fieldset disabled={busy || replacing} className="min-w-0"><SheetDisplay pages={sheet.originals} pdfUrl={sheet.pdfUrl} responses={marked} answerKey={sheet.answerKey} roll={student.roll_number} onChange={mode === "check" ? setMarked : undefined} /></fieldset>
      {mode === "check" && <>
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-(--line) bg-[#fbfdf4] py-3">
          {!ready && <p className="text-sm font-semibold text-amber-900">Select an answer, No response, or M for each ? row on both pages.</p>}
          <Button onClick={save} disabled={!ready || busy || replacing}>{busy ? "Saving…" : "Confirm and score"}</Button>
        </div>
      </>}
    </>}
  </Dialog>
  {replacing && sheet && <ReplaceSheetDialog student={student} sheet={sheet} onClose={() => setReplacing(false)} onSaved={() => { setReplacing(false); setAttempt((value) => value + 1); }} />}
  </>;
}
