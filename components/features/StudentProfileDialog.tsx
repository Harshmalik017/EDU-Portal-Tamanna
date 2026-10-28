"use client";
import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { StudentProfileForm } from "@/components/features/StudentProfileForm";
import type { Student } from "@/lib/types";

export function StudentProfileDialog({ student, onClose }: { student: Student; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  return <Dialog title={`Profile · ${student.name || "Name pending"} · ${student.roll_number}`} busy={busy} onClose={onClose}>
    <StudentProfileForm initial={student} onSaved={onClose} onBusyChange={setBusy} />
  </Dialog>;
}
