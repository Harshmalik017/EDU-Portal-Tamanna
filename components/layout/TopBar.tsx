"use client";
import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export function TopBar({ userName }: { userName?: string }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-(--line) bg-[#f9fbf2]/90 px-4 pl-14 backdrop-blur lg:px-8 print:hidden">
      <Link href="/admin" aria-label="Tamanna dashboard" className="lg:hidden">
        <Image src="/brand/logo.png" alt="Tamanna" width={96} height={21} priority />
      </Link>
      <div className="ml-auto flex shrink-0 items-center gap-3">
        {userName && <span className="hidden max-w-48 truncate text-xs font-semibold text-ink/75 sm:block">{userName}</span>}
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
