import { reportLabels, type ReportLanguage } from "@/lib/tamanna/report-language";

export function ReportPageHeader({ page, roll, language }: { page: number; roll: string; language: ReportLanguage }) {
  const text = reportLabels(language);
  return (
    <header className="report-header mb-4 flex items-end justify-between border-b-2 border-brand-600 pb-2">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-start">
          <img src="/brand/logo.png" alt="Tamanna" width={110} height={24} className="h-8 w-auto" />
          <span className="text-[9px] font-semibold leading-none text-brand-700">{language === "hi" ? "उत्तर प्रदेश" : "Uttar Pradesh"}</span>
        </div>
        {page === 1 && <h2 className="text-xl font-extrabold">{text.title}</h2>}
      </div>
      <p className="max-w-[45%] text-right text-xs font-semibold">{text.roll} {roll} · {text.page} {page} / 3</p>
    </header>
  );
}
