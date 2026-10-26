"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogIn, Menu, X } from "lucide-react";

const NAV = [["about", "About"], ["subtests", "Sub-tests"], ["conduct", "Conduct"], ["scoring", "Scoring"]] as const;

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="clay sticky top-3 z-30 px-4 py-2.5 sm:px-5 sm:py-3">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" aria-label="Tamanna Uttar Pradesh home" className="flex shrink-0 flex-col items-start">
          <Image src="/brand/logo.png" alt="Tamanna" width={120} height={26} priority />
          <span className="text-[10px] font-semibold leading-none text-brand-700">Uttar Pradesh</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Page sections">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-xl px-3.5 py-2 text-sm font-semibold text-ink/85 transition hover:bg-brand-100/70 hover:text-brand-700">
              {label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link href="/login" className="clay-btn !min-h-10 !px-3 !py-2 sm:!px-4">
            <LogIn size={18} /> Login
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? "Close page sections menu" : "Open page sections menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-page-sections"
            onClick={() => setMenuOpen((open) => !open)}
            className="clay-btn-soft !min-h-10 !w-10 !p-0 md:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <nav id="mobile-page-sections" aria-label="Page sections" className={`${menuOpen ? "grid" : "hidden"} mt-2.5 gap-1 border-t border-(--line) pt-2 md:hidden`}>
          {NAV.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              {label}
            </a>
          ))}
      </nav>
    </header>
  );
}
