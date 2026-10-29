"use client";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export function Dialog({ title, children, onClose, busy = false, wide = false, headerActions, printable = false, closeLabel = "Close dialog" }: { title: string; children: React.ReactNode; onClose: () => void; busy?: boolean; wide?: boolean; headerActions?: React.ReactNode; printable?: boolean; closeLabel?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const overflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialog.open) return;
      const items = [...dialog.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])")].filter((item) => item.getClientRects().length > 0);
      if (!items.length) { event.preventDefault(); dialog.focus(); return; }
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", keyboard);
    return () => {
      window.removeEventListener("keydown", keyboard);
      if (dialog.open) dialog.close();
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);
  return <dialog ref={ref} aria-labelledby={titleId} onCancel={(event) => { if (busy) event.preventDefault(); }} onClose={() => { if (ref.current && !ref.current.open) onClose(); }} onClick={(event) => { if (!busy && event.target === ref.current) ref.current?.close(); }} className={`${printable ? "report-dialog " : ""}m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-1rem)] overflow-y-auto rounded-2xl border border-(--line) bg-[#fbfdf4] p-0 text-ink shadow-2xl backdrop:bg-[#25331a]/50 ${printable ? "max-w-[820px]" : wide ? "max-w-[1600px]" : "max-w-2xl"}`}>
    <header className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-(--line) bg-[#fbfdf4] px-4 py-3 sm:px-6">
      <h2 id={titleId} className="text-lg font-extrabold">{title}</h2>
      <div className="ml-auto flex items-center gap-2">{headerActions}<button type="button" disabled={busy} aria-label={closeLabel} onClick={() => ref.current?.close()} className="rounded-lg p-2 hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-brand-700 disabled:opacity-50"><X size={20} /></button></div>
    </header>
    <div className="space-y-4 p-4 sm:p-6">{children}</div>
  </dialog>;
}
