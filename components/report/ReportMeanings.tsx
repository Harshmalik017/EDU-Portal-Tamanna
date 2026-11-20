import { BookOpen, Box, Calculator, Check, Cog, MessageSquareText, ScanSearch, Shapes, type LucideIcon } from "lucide-react";
import { buildProfile } from "@/lib/tamanna/profile";
import type { Band } from "@/lib/tamanna/norms";
import { areasFor, bandLabel, descriptionFor, reportLabels, subjectsFor, testLabel, type ReportLanguage, type ReportStudent } from "@/lib/tamanna/report-language";
import { ReportPageHeader } from "@/components/report/ReportPageHeader";

const pill = { Low: "bg-amber-100 text-amber-900", Average: "bg-blue-100 text-blue-900", High: "bg-green-100 text-green-900" } as const;
const cardTone: Record<Band, string> = { Low: "border-amber-200 bg-amber-50", Average: "border-sky-200 bg-sky-50", High: "border-green-200 bg-green-50" };
const testIcon: Record<string, LucideIcon> = { LA: BookOpen, AR: Shapes, VR: MessageSquareText, MR: Cog, NA: Calculator, SA: Box, PA: ScanSearch };

export function ReportMeanings({ student, language, profile }: { student: ReportStudent; language: ReportLanguage; profile: ReturnType<typeof buildProfile> }) {
  const text = reportLabels(language);
  return <section className="report-page report-meanings">
    <ReportPageHeader page={2} roll={student.roll_number} language={language} />
    <h3 className="mb-1 text-lg font-extrabold">{text.meaning}</h3>
    <p className="report-source mb-3 italic text-ink/70">{text.meaningSource}</p>
    <ul className="meaning-grid grid grid-cols-2 gap-2">{profile.rows.map((row) => {
      const Icon = testIcon[row.code];
      return <li key={row.code} className={`meaning-card rounded-xl border p-2.5 text-[11px] leading-snug ${row.band ? cardTone[row.band] : "border-slate-200 bg-slate-50"}`}>
        <div className="mb-1 flex items-start justify-between gap-2">
          <span className="flex items-center gap-1.5 font-extrabold"><Icon size={16} aria-hidden="true" className="shrink-0 text-brand-700" />{testLabel(row.code, row.name, language)} ({row.code})</span>
          {row.band && <span aria-label={`${text.sten} ${row.sten} · ${bandLabel(row.band, language)}${row.nearHigh ? ` · ${text.nearHigh}` : ""}`} className={`report-band inline-flex flex-wrap items-center gap-1 rounded-full px-2 py-0.5 font-bold ${pill[row.band]}`}><Check size={11} aria-hidden="true" /> {row.sten} · {bandLabel(row.band, language)}</span>}
        </div>
        <p>{row.band ? descriptionFor(row.code, row.band, language) : text.noSten}</p>
        {row.giveReccs && <div className="recommendations-copy mt-1.5 border-t border-current/10 pt-1.5 text-[10px]">
          <p><b>{text.subjects}{row.nearHigh ? ` (${text.nearHigh}: ${row.highMin}+)` : ""}:</b> {subjectsFor(row.code, language).join(", ")}.</p>
          <p className="mt-1"><b>{text.fields}:</b> {areasFor(row.code, language)}.</p>
        </div>}
      </li>;
    })}</ul>
  </section>;
}
