"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, KeyRound, LayoutDashboard, ScanLine, Table2, UserRound, X } from "lucide-react";

const GROUPS = [
  { label: "School Portal", items: [
    { href: "/admin", label: "Dashboard", sublabel: "Overview", icon: LayoutDashboard },
    { href: "/admin/results", label: "Student Reports", sublabel: "All roll numbers", icon: Table2 },
    { href: "/admin/scan", label: "Check Sheets", sublabel: "Read answer sheets", icon: ScanLine },
  ] },
  { label: "Guide & Setup", items: [
    { href: "/admin/key", label: "Answer Key", sublabel: "Correct options", icon: KeyRound },
    { href: "/admin/logs", label: "Activity Logs", sublabel: "Portal activity", icon: FileText },
    { href: "/admin/settings", label: "Profile Settings", sublabel: "Account & password", icon: UserRound },
  ] },
];

export function Sidebar({ open, collapsed, onClose }: { open: boolean; collapsed: boolean; onClose: () => void }) {
  const path = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);
  const [navigating, setNavigating] = useState(false);
  const active = (h: string) => (h === "/admin" ? path === h : path.startsWith(h));
  const navigate = (href: string) => {
    onClose();
    if (href !== path) setNavigating(true);
  };
  useEffect(() => { onClose(); setNavigating(false); }, [path, onClose]);
  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    if (desktop.matches) { onClose(); return; }
    const resize = () => { if (desktop.matches) onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebarRef.current?.querySelector("button")?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key === "Tab") {
        const items = sidebarRef.current?.querySelectorAll<HTMLElement>("a[href],button:not([disabled])");
        if (!items?.length) return;
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && (document.activeElement === first || !sidebarRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !sidebarRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", keyboard);
    desktop.addEventListener("change", resize);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", keyboard);
      desktop.removeEventListener("change", resize);
      if (!desktop.matches) document.getElementById("admin-menu-toggle")?.focus();
    };
  }, [open, onClose]);

  const nav = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-brand-200 bg-brand-100/70 px-4">
        <Link href="/" aria-label="Tamanna Uttar Pradesh home" className="flex flex-col items-start">
          <Image src="/brand/logo.png" alt="Tamanna" width={110} height={24} priority />
          <span className="text-[10px] font-semibold leading-none text-brand-700">Uttar Pradesh</span>
        </Link>
      </div>
      <nav aria-label="Main menu" className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-4">
        {GROUPS.map((g) => (
          <div key={g.label} className="space-y-1">
            <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-brand-700">{g.label}</p>
            {g.items.map(({ href, label, icon: Icon }) => {
              const isActive = active(href);
              return (
                <Link key={href} href={href} onClick={() => navigate(href)} aria-current={isActive ? "page" : undefined}
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
    </div>
  );

  return (
    <>
      <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 items-end border-t border-brand-200 bg-[#fbfdf4]/95 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(37,51,26,.10)] backdrop-blur lg:hidden print:hidden">
        <Link href="/admin" onClick={() => navigate("/admin")} aria-current={path === "/admin" ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-semibold ${path === "/admin" ? "text-brand-700" : "text-ink/70"}`}>
          <LayoutDashboard size={19} aria-hidden="true" />
          Dashboard
        </Link>
        <Link href="/admin/scan" onClick={() => navigate("/admin/scan")} aria-current={path.startsWith("/admin/scan") ? "page" : undefined} className={`-mt-6 flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold ${path.startsWith("/admin/scan") ? "text-brand-700" : "text-ink/70"}`}>
          <span className={`grid h-12 w-12 place-items-center rounded-full border-4 border-[#fbfdf4] shadow-md ${path.startsWith("/admin/scan") ? "bg-brand-700 text-white" : "bg-brand-600 text-white"}`}>
            <ScanLine size={22} aria-hidden="true" />
          </span>
          Check Sheets
        </Link>
        <Link href="/admin/results" onClick={() => navigate("/admin/results")} aria-current={path.startsWith("/admin/results") || path.startsWith("/admin/students") ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-semibold ${path.startsWith("/admin/results") || path.startsWith("/admin/students") ? "text-brand-700" : "text-ink/70"}`}>
          <Table2 size={19} aria-hidden="true" />
          Student Reports
        </Link>
      </nav>
      {open && <div className="fixed inset-0 z-40 bg-[#25331a]/50 lg:hidden print:hidden" onClick={onClose} aria-hidden />}
      <aside ref={sidebarRef} id="admin-sidebar" aria-label="Main menu" className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden border-r border-brand-200 bg-brand-50 transition-transform lg:z-20 lg:w-64 print:hidden ${open ? "visible translate-x-0" : "invisible -translate-x-full"} ${collapsed ? "lg:invisible lg:-translate-x-full" : "lg:visible lg:translate-x-0"}`}>
        {open && <button aria-label="Close menu" onClick={() => { onClose(); document.getElementById("admin-menu-toggle")?.focus(); }} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm hover:bg-red-700 lg:hidden"><X size={16} /></button>}
        {nav}
      </aside>
      {navigating && (
        <div role="status" aria-label="Loading page" aria-busy="true" className={`fixed inset-0 z-[45] overflow-y-auto bg-[#f9fbf2] px-4 pt-20 pb-24 sm:px-6 lg:px-10 lg:pt-24 lg:pb-10 2xl:px-12 ${collapsed ? "" : "lg:left-64"}`}>
          <div className="space-y-6">
            <div className="clay-inset h-10 w-56 animate-pulse" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => <div key={i} className="clay-inset h-24 animate-pulse" />)}
            </div>
            <div className="clay-inset h-[min(55vh,32rem)] animate-pulse" />
          </div>
        </div>
      )}
    </>
  );
}
