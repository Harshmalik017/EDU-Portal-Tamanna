"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase/client";
import type { Student } from "@/lib/types";
import { normalizeClass } from "@/lib/tamanna/norms";
import { stenClassIssue } from "@/lib/tamanna/results";
import { StudentDetailsFields } from "@/components/features/StudentDetailsFields";
import { useUnsavedChanges } from "@/components/hooks/useUnsavedChanges";

export function StudentProfileForm({ initial, onSaved, onBusyChange, children }: { initial: Student; onSaved?: () => void; onBusyChange?: (busy: boolean) => void; children?: React.ReactNode }) {
  const [student, setStudent] = useState(initial);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const classIssue = stenClassIssue(student.class);
  useUnsavedChanges(JSON.stringify(student) !== JSON.stringify(initial));
  useEffect(() => { setStudent(initial); }, [initial]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!student.name.trim()) return toast("Enter student name.");
    const cls = normalizeClass(student.class);
    if (!cls) return toast("Select class IX or X. STEN norms are available only for these classes.");
    if (!student.gender) return toast("Select gender.");
    setBusy(true); onBusyChange?.(true);
    try {
      const { error } = await supabase.from("students").update({ name: student.name.trim(), class: cls, gender: student.gender, school: (student.school ?? "").trim(), block: student.block?.trim(), district: student.district?.trim() }).eq("id", student.id).is("archived_at", null).select("id").single();
      if (error) return toast("Could not save student details.");
      toast("Student details saved"); onSaved?.(); router.refresh();
    } catch (error) {
      console.error("Could not save student details.", error); toast("Could not save student details.");
    } finally { setBusy(false); onBusyChange?.(false); }
  }
  return <form onSubmit={save} className="space-y-4">
    <fieldset disabled={busy}><StudentDetailsFields value={student} onChange={(change) => setStudent({ ...student, ...change })} showLocation rollNumber={initial.roll_number} /></fieldset>
    {classIssue && <p role="status" className="text-sm font-semibold text-amber-900">{classIssue} Confirm the recorded class before changing it.</p>}
    {!!initial.review_issues?.length && <ul className="text-sm text-amber-900">{initial.review_issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
    <fieldset disabled={busy} className="flex flex-wrap gap-3"><Button type="submit" disabled={busy}><Save size={18} aria-hidden="true" />{busy ? "Saving…" : "Save changes"}</Button>{children}</fieldset>
  </form>;
}
