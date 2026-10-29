"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/Dialog";
import { ReportPages } from "@/components/report/ReportPages";
import { PrintButton } from "@/components/report/PrintButton";
import { reportLabels, type ReportLanguage, type ReportStudent } from "@/lib/tamanna/report-language";

export function ReportDialog({ student, intercepted = false }: { student: ReportStudent; intercepted?: boolean }) {
  const router = useRouter();
  const [language, setLanguage] = useState<ReportLanguage>("hi");
  const text = reportLabels(language);
  return <Dialog printable title={`${text.title} · ${student.roll_number}`} closeLabel={text.close} onClose={() => intercepted ? router.back() : router.replace("/admin/results")} headerActions={
    <label className="flex items-center gap-2 text-sm font-semibold">
      <span className="sr-only">{text.language}</span>
      <select aria-label={text.language} value={language} onChange={(event) => { const value = event.target.value; if (value === "hi" || value === "en") setLanguage(value); }} className="clay-inset min-h-11 px-3 py-2 focus-visible:outline-2 focus-visible:outline-brand-700">
        <option value="hi">हिन्दी</option><option value="en">English</option>
      </select>
    </label>
  }>
    <div className="no-print flex justify-end"><PrintButton label={text.print} /></div>
    <div lang={language}><ReportPages s={student} language={language} /></div>
  </Dialog>;
}
