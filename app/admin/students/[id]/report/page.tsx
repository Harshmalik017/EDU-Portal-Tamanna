import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createServer } from "@/lib/supabase/server";
import { ReportPages } from "@/components/report/ReportPages";
import { PrintButton } from "@/components/report/PrintButton";
import type { Student } from "@/lib/types";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await (await createServer()).from("students").select("*,scores(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap gap-3"><PrintButton /><Link href="/admin/results" className="clay-btn-soft"><ArrowLeft size={18} /> Back to Student Reports</Link><Link href={`/admin/students/${id}`} className="clay-btn-soft">Back to profile</Link></div>
      <ReportPages s={data as unknown as Student} />
    </div>
  );
}
