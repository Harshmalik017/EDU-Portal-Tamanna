"use client";
import { useRouter } from "next/navigation";
import { CircleAlert, RotateCcw } from "lucide-react";
import { resetDemo } from "@/lib/demo/client";
import { useToast } from "@/components/Toast";

export function DemoBanner() {
  const router = useRouter();
  const toast = useToast();
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800 print:hidden">
      <p className="flex animate-pulse items-center gap-2 font-bold"><CircleAlert size={18} aria-hidden="true" /> Practice mode: showing sample student records.</p>
      <button type="button" className="animate-pulse inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 font-bold text-red-800 shadow-sm transition hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600" onClick={async () => { await resetDemo(); toast("Sample data reset"); router.refresh(); }}>
        <RotateCcw size={16} aria-hidden="true" /> Reset sample data
      </button>
    </div>
  );
}
