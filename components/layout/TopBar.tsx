"use client";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export function TopBar({ userName, demo, menuOpen, sidebarCollapsed, onToggleMenu, onToggleSidebar }: { userName?: string; demo?: boolean; menuOpen: boolean; sidebarCollapsed: boolean; onToggleMenu: () => void; onToggleSidebar: () => void }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-(--line) bg-[#f9fbf2]/90 px-4 backdrop-blur sm:px-6 lg:px-10 2xl:px-12 print:hidden">
      <button id="admin-menu-toggle" type="button" aria-label="Open menu" aria-controls="admin-sidebar" aria-expanded={menuOpen} onClick={onToggleMenu} className="clay-btn-soft !min-h-9 !w-9 !shrink-0 !p-0 lg:hidden"><Menu size={18} /></button>
      <button type="button" aria-label={sidebarCollapsed ? "Expand menu" : "Collapse menu"} aria-controls="admin-sidebar" aria-expanded={!sidebarCollapsed} onClick={onToggleSidebar} className="clay-btn-soft !hidden !min-h-9 !w-9 !shrink-0 !p-0 lg:!inline-flex">{sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button>
      <Link href="/admin" aria-label="Tamanna dashboard" className="lg:hidden">
        <span className="flex flex-col items-start">
          <Image src="/brand/logo.png" alt="Tamanna" width={96} height={21} priority />
          <span className="text-[9px] font-semibold leading-none text-brand-700">Uttar Pradesh</span>
        </span>
      </Link>
      <div className="ml-auto flex shrink-0 items-center gap-3">
        <Link prefetch={false} href="/admin/settings" aria-label="Profile settings" className="inline-flex min-h-9 items-center gap-2 rounded-xl px-2 text-sm font-semibold hover:bg-brand-100">
          <UserRound size={18} />
          {userName && <span className={`hidden max-w-48 truncate text-xs sm:block ${demo ? "animate-pulse" : ""}`}>{userName}</span>}
        </Link>
        <button
          type="button"
          aria-label="Sign out"
          onClick={async () => { await supabase.auth.signOut(); router.push("/login"); router.refresh(); }}
          className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 sm:text-sm"
        >
          <LogOut size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
