"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export function TopBar({ userName }: { userName?: string }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-(--line) bg-[#f9fbf2]/90 px-3 pl-13 backdrop-blur sm:gap-3 sm:px-5 sm:pl-15 lg:px-6 print:hidden">
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {userName && <span className="hidden max-w-48 truncate text-xs font-medium text-ink/70 md:block">{userName}</span>}
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
