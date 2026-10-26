"use client";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { resetDemo } from "@/lib/demo/client";
import { useToast } from "@/components/Toast";

export function DemoBanner() {
  const router = useRouter();
  const toast = useToast();
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800 print:hidden">
      <p className="flex animate-pulse items-center gap-2 font-bold"><CircleAlert size={18} aria-hidden="true" /> Practice mode: showing sample student records.</p>
      <button className="animate-pulse font-bold text-red-800 underline" onClick={async () => { await resetDemo(); toast("Sample data reset"); router.refresh(); }}>Reset sample data</button>
    </div>
  );
}
