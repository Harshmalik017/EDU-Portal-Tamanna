"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { resetDemo } from "@/lib/demo/client";
import { useToast } from "@/components/Toast";

export function DemoBanner() {
  const router = useRouter();
  const toast = useToast();
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-950 print:hidden">
      <p className="flex items-center gap-2 font-bold"><FlaskConical size={18} /> Demo mode: sample data. Nothing is saved.</p>
      <span className="flex gap-3 font-bold">
        <button className="underline" onClick={async () => { await resetDemo(); toast("Demo data reset"); router.refresh(); }}>Reset demo data</button>
        <Link className="underline" href="/setup">Connect Supabase</Link>
      </span>
    </div>
  );
}
