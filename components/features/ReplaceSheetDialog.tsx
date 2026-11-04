"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/Toast";
import { replaceSheet } from "@/lib/supabase/replace-sheet";
import { supabase } from "@/lib/supabase/client";
import type { Student, StudentSheet } from "@/lib/types";

export function ReplaceSheetDialog({ student, sheet, onClose, onSaved }: { student: Student; sheet: StudentSheet; onClose: () => void; onSaved: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const toast = useToast();
  const oldPaths = [...new Set([...sheet.imagePaths, ...(sheet.pdfPath ? [sheet.pdfPath] : [])])];

  async function replace() {
    if (!saved && !files.length) return toast("Select a fresh OMR file.");
    setBusy(true); setError("");
    try {
      if (!saved) {
        const { readReplacement } = await import("@/lib/omr/reader");
        const replacement = await readReplacement(files, sheet.template);
        const outcome = await replaceSheet(supabase, student.id, sheet, replacement);
        setSaved(true);
        toast(outcome === "scored" ? "New OMR saved. Final marks updated." : outcome === "excluded" ? "New OMR saved. Student remains excluded." : "New OMR saved for review.");
        router.refresh();
      }
      if (oldPaths.length) {
        const { error: cleanupError } = await supabase.storage.from("sheets").remove(oldPaths);
        if (cleanupError) throw new Error("Could not remove the old files. New OMR is saved. Retry removal.");
      }
      onSaved();
    } catch (failure) {
      console.error("Could not complete OMR replacement.", failure);
      const message = failure instanceof Error ? failure.message : "Could not replace the OMR.";
      setError(message); toast(message);
    } finally { setBusy(false); }
  }

  return <Dialog compact title={saved ? "Remove old OMR files" : "Replace OMR"} busy={busy} onClose={saved ? onSaved : onClose}>
    <p className="text-sm font-semibold">Roll {student.roll_number}</p>
    {!saved && <>
      <Input label="Fresh OMR" type="file" accept="application/pdf,image/jpeg,image/png" multiple disabled={busy} onChange={(event) => { setFiles(Array.from(event.target.files ?? [])); setError(""); }} />
      <p className="text-sm">One two-page PDF or two images, front first.</p>
      <p className="text-sm font-semibold text-red-800">Replace the old OMR and answers, remove old files, and re-evaluate scores? Unclear answers will need review. This cannot be undone.</p>
    </>}
    {error && <p role="alert" className="text-sm font-semibold text-red-800">{error}</p>}
    <div className="flex flex-wrap justify-end gap-2">
      {!saved && <Button variant="soft" disabled={busy} onClick={onClose}>Cancel</Button>}
      <Button disabled={busy || (!saved && !files.length)} onClick={() => void replace()}>{busy ? "Processing..." : saved ? "Retry removal" : "Replace and re-evaluate"}</Button>
    </div>
  </Dialog>;
}
