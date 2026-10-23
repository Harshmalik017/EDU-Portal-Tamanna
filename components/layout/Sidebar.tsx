"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardCheck, FileText, KeyRound, LayoutDashboard, Menu, ScanLine, Table2, X } from "lucide-react";

const GROUPS = [
  { label: "School Portal", items: [
    { href: "/admin", label: "Dashboard", sublabel: "Overview", icon: LayoutDashboard },
    { href: "/admin/results", label: "Student Reports", sublabel: "All roll numbers", icon: Table2 },
    { href: "/admin/scan", label: "Check Sheets", sublabel: "Read answer sheets", icon: ScanLine },
    { href: "/admin/verify", label: "Hand Check", sublabel: "Verify 10–20 sheets", icon: ClipboardCheck },
  ] },
  { label: "Guide & Setup", items: [
    { href: "/admin/key", label: "Answer Key", sublabel: "Correct options", icon: KeyRound },
    { href: "/admin/logs", label: "Logs & Key Notes", sublabel: "Rules & activity", icon: FileText },
  ] },
];

export function Sidebar({ demo }: { demo: boolean }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/admin" ? path === h : path.startsWith(h));
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const nav = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-(--line) px-4">
        <Link href="/" aria-label="Tamanna home">
          <Image src="/brand/logo.png" alt="Tamanna" width={110} height={24} priority />
        </Link>
      </div>
      <nav aria-label="Main menu" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {GROUPS.map((g) => (
          <div key={g.label} className="space-y-1">
            <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-ink/60">{g.label}</p>
            {g.items.map(({ href, label, icon: Icon }) => {
              const isActive = active(href);
              return (
                <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={isActive ? "page" : undefined}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${isActive ? "bg-brand-100 text-brand-700" : "text-ink/80 hover:bg-brand-50 hover:text-brand-700"}`}>
                  {isActive && <span aria-hidden className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand-600" />}
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${isActive ? "bg-brand-600 text-white shadow-sm" : "bg-brand-50 text-brand-700 group-hover:bg-brand-100"}`}>
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      {demo && (
        <div className="shrink-0 border-t border-(--line) p-3">
          <p className="flex items-center gap-2 rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900"><span aria-hidden>📋</span> Practice data</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="clay-btn-soft fixed left-3 top-2.5 z-30 !min-h-9 !w-9 !p-0 lg:hidden print:hidden"
      >
        <Menu size={18} />
      </button>
      {open && <div className="fixed inset-0 z-40 bg-[#25331a]/50 lg:hidden print:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <aside aria-label="Main menu" className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-(--line) bg-[#fbfdf4] transition-transform lg:z-20 lg:w-64 lg:translate-x-0 print:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}>
        {open && <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm hover:bg-red-700"><X size={16} /></button>}
        {nav}
      </aside>
    </>
  );
}
