"use client";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export function Dialog({ title, children, onClose, busy = false, wide = false }: { title: string; children: React.ReactNode; onClose: () => void; busy?: boolean; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); document.body.style.overflow = overflow; };
  }, []);
  return <dialog ref={ref} aria-labelledby={titleId} onCancel={(event) => { if (busy) event.preventDefault(); }} onClose={() => { if (ref.current && !ref.current.open) onClose(); }} onClick={(event) => { if (!busy && event.target === ref.current) ref.current?.close(); }} className={`m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-1rem)] overflow-y-auto rounded-2xl border border-(--line) bg-[#fbfdf4] p-0 text-ink shadow-2xl backdrop:bg-[#25331a]/50 ${wide ? "max-w-[1600px]" : "max-w-2xl"}`}>
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-(--line) bg-[#fbfdf4] px-4 py-3 sm:px-6">
      <h2 id={titleId} className="text-lg font-extrabold">{title}</h2>
      <button type="button" disabled={busy} aria-label="Close dialog" onClick={() => ref.current?.close()} className="rounded-lg p-2 hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-brand-700 disabled:opacity-50"><X size={20} /></button>
    </header>
    <div className="space-y-4 p-4 sm:p-6">{children}</div>
  </dialog>;
}
