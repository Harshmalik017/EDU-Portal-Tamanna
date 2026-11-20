import { BriefcaseBusiness, ChartNoAxesColumn, Compass, Lightbulb } from "lucide-react";
import { buildProfile } from "@/lib/tamanna/profile";
import { reportLabels, reportNotes, reportRemarks, termLabel, type ReportLanguage, type ReportStudent } from "@/lib/tamanna/report-language";
import { ReportPageHeader } from "@/components/report/ReportPageHeader";

export function ReportRemarks({ student, language, profile }: { student: ReportStudent; language: ReportLanguage; profile: ReturnType<typeof buildProfile> }) {
  const text = reportLabels(language), notes = reportNotes(language);
  return <section className="report-page report-remarks">
    <ReportPageHeader page={3} roll={student.roll_number} language={language} />
    <h3 className="mb-1 text-lg font-extrabold">{text.remarks}</h3>
    <p className="report-source mb-3 italic text-ink/70">{text.remarksSource}</p>
    <div className="remarks-grid space-y-2">
      {reportRemarks(profile, student, language).map((remark, index) => {
        const Icon = index === 0 ? ChartNoAxesColumn : index === 1 ? Lightbulb : Compass;
        const tone = ["border-blue-200 bg-blue-50", "border-amber-200 bg-amber-50", "border-violet-200 bg-violet-50"][index % 3];
        return <article key={index} className={`flex gap-3 rounded-xl border p-3 text-xs leading-relaxed ${tone}`}><Icon size={19} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-700" /><p>{remark}</p></article>;
      })}
    </div>
    {profile.highs.length === 0 && <p className="report-source mt-2 italic text-ink/70">{notes.noHighSource}</p>}
    {profile.reccRows.length > 0 && <>
      <h4 className="mb-1 mt-4 flex items-center gap-2 text-sm font-extrabold"><BriefcaseBusiness size={17} aria-hidden="true" className="text-brand-700" />{text.occupations}</h4>
      <ul className="occupation-grid grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
        {profile.occupations.slice(0, 14).map((occupation) => <li key={occupation.name} className="rounded-lg border border-violet-100 bg-violet-50/70 px-2 py-1.5">
          <b>{termLabel(occupation.name, language)}</b>{" "}
          <span className="text-xs">({occupation.aptitudes.map((aptitude) => profile.reccRows.some((row) => row.code === aptitude) ? `${aptitude}✓` : aptitude).join(", ")})</span>
        </li>)}
      </ul>
      <p className="mt-1 text-xs text-ink/80">{text.tick}</p>
    </>}
    <div className="report-caution mt-3 space-y-1.5 rounded-xl border border-brand-200 bg-brand-50 p-3 leading-relaxed"><p className="font-bold">{notes.suggestive}</p><p>{notes.cluster}</p></div>
    <p className="report-signature pt-5 text-right text-sm font-bold">{text.signature}: ______________________</p>
    <p className="report-source mt-3 italic leading-relaxed text-ink/70">{notes.source}</p>
  </section>;
}
