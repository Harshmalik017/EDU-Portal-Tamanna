"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase/client";
import type { Student } from "@/lib/types";

export function StudentProfileForm({ initial, onSaved, onBusyChange, children }: { initial: Student; onSaved?: () => void; onBusyChange?: (busy: boolean) => void; children?: React.ReactNode }) {
  const [student, setStudent] = useState(initial);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();
  useEffect(() => { setStudent(initial); }, [initial]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{5}$/.test(student.roll_number.trim()) && student.roll_number !== initial.roll_number) return toast("Enter a five-digit roll number.");
    if (!student.name.trim()) return toast("Enter student name.");
    if (!student.class || !student.gender) return toast("Select class and gender.");
    setBusy(true); onBusyChange?.(true);
    try {
      const { error } = await supabase.from("students").update({ name: student.name.trim(), roll_number: student.roll_number.trim(), class: student.class, gender: student.gender, school: (student.school ?? "").trim(), block: student.block?.trim(), district: student.district?.trim() }).eq("id", student.id);
      if (error) return toast("Could not save student details.");
      toast("Student details saved"); onSaved?.(); router.refresh();
    } catch (error) {
      console.error("Could not save student details.", error); toast("Could not save student details.");
    } finally { setBusy(false); onBusyChange?.(false); }
  }
  return <form onSubmit={save} className="space-y-4">
    <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
      <Input label="Roll number" required value={student.roll_number} onChange={(e) => setStudent({ ...student, roll_number: e.target.value })} />
      <Input label="Student name" required value={student.name} onChange={(e) => setStudent({ ...student, name: e.target.value })} />
      <Select label="Class" options={["IX", "X"]} value={student.class} onChange={(e) => setStudent({ ...student, class: e.target.value })} />
      <Select label="Gender" options={["Male", "Female", "Not specified"]} value={student.gender} onChange={(e) => setStudent({ ...student, gender: e.target.value })} />
      <Input label="School" value={student.school ?? ""} onChange={(e) => setStudent({ ...student, school: e.target.value })} />
      <Input label="Block" value={student.block ?? ""} onChange={(e) => setStudent({ ...student, block: e.target.value })} />
      <Input label="District" value={student.district ?? ""} onChange={(e) => setStudent({ ...student, district: e.target.value })} />
    </fieldset>
    {!!initial.review_issues?.length && <ul className="text-sm text-amber-900">{initial.review_issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
    <fieldset disabled={busy} className="flex flex-wrap gap-3"><Button type="submit" disabled={busy}><Save size={18} />{busy ? "Saving…" : "Save changes"}</Button>{children}</fieldset>
  </form>;
}
