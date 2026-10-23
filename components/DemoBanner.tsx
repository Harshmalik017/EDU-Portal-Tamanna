"use client";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { resetDemo } from "@/lib/demo/client";
import { useToast } from "@/components/Toast";

export function DemoBanner() {
  const router = useRouter();
  const toast = useToast();
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-950 print:hidden">
      <p className="flex items-center gap-2 font-bold"><FlaskConical size={18} /> Practice mode: showing sample student records.</p>
      <button className="font-bold underline" onClick={async () => { await resetDemo(); toast("Sample data reset"); router.refresh(); }}>Reset sample data</button>
    </div>
  );
}
