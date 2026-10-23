"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Table2, ScanLine, KeyRound, Crosshair, ClipboardCheck, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/results", label: "Results", icon: Table2 },
  { href: "/admin/scan", label: "Scan", icon: ScanLine },
  { href: "/admin/verify", label: "Verify", icon: ClipboardCheck },
  { href: "/admin/key", label: "Answer key", icon: KeyRound },
  { href: "/admin/calibrate", label: "Calibrate", icon: Crosshair },
];

export function AdminNav() {
  const path = usePathname();
  const router = useRouter();
  const active = (h: string) => (h === "/admin" ? path === h : path.startsWith(h));
  return (
    <header className="clay print:hidden mx-auto mt-4 flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
      <Link href="/" aria-label="Tamanna home"><Image src="/brand/logo.png" alt="Tamanna" width={104} height={22} priority /></Link>
      <nav className="flex flex-wrap items-center gap-2" aria-label="Admin">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-label={label} aria-current={active(href) ? "page" : undefined}
            className={(active(href) ? "clay-btn" : "clay-btn-soft") + " !px-3 !py-2 lg:!px-4"}>
            <Icon size={18} /><span className="hidden lg:inline">{label}</span>
          </Link>
        ))}
        <button aria-label="Sign out" className="clay-btn-soft !px-3 !py-2" onClick={async () => { await supabase.auth.signOut(); router.push("/login"); router.refresh(); }}><LogOut size={18} /></button>
      </nav>
    </header>
  );
}
