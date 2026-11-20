"use client";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  busy = false,
  destructive = false,
  onConfirm,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return <Dialog compact busy={busy} title={title} onClose={onClose}>
    <div className={`flex gap-3 rounded-xl border p-3 text-sm font-semibold ${destructive ? "border-red-200 bg-red-50 text-red-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
      <AlertTriangle size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
      <div className="space-y-2">{children}</div>
    </div>
    <div className="flex flex-wrap justify-end gap-2">
      <Button variant="soft" disabled={busy} onClick={onClose}>{cancelLabel}</Button>
      <Button className={destructive ? "!border-red-700 !bg-red-700 hover:!bg-red-800" : undefined} disabled={busy} onClick={onConfirm}>{confirmLabel}</Button>
    </div>
  </Dialog>;
}
