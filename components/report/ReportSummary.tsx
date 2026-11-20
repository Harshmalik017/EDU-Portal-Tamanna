import { buildProfile } from "@/lib/tamanna/profile";
import { bandLabel, genderLabel, normLabel, reportLabels, reportNotes, testLabel, type ReportLanguage, type ReportStudent } from "@/lib/tamanna/report-language";
import { ReportPageHeader } from "@/components/report/ReportPageHeader";
import { StenChart } from "@/components/report/StenChart";

export function ReportSummary({ student, language, profile }: { student: ReportStudent; language: ReportLanguage; profile: ReturnType<typeof buildProfile> }) {
  const text = reportLabels(language), notes = reportNotes(language);
  return <section className="report-page report-summary">
    <ReportPageHeader page={1} roll={student.roll_number} language={language} />
    <dl className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-xl border border-(--line) bg-brand-50/50 p-3 text-sm">
      <div><dt className="inline font-bold">{text.rollNo}: </dt><dd className="inline">{student.roll_number}</dd></div>
      <div><dt className="inline font-bold">{text.class}: </dt><dd className="inline">{student.class}</dd></div>
      <div><dt className="inline font-bold">{text.gender}: </dt><dd className="inline">{genderLabel(student.gender, language)}</dd></div>
      <div><dt className="inline font-bold">{text.school}: </dt><dd className="inline">{student.school || text.recorded}</dd></div>
      <div><dt className="inline font-bold">{text.block}: </dt><dd className="inline">{student.block || text.missing}</dd></div>
      <div><dt className="inline font-bold">{text.district}: </dt><dd className="inline">{student.district || text.missing}</dd></div>
    </dl>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse border border-(--line) text-sm">
        <thead>
          <tr className="bg-brand-600 text-white">
            <th rowSpan={2} className="border border-brand-700 p-2 text-center">{text.serial}</th>
            <th rowSpan={2} className="border border-brand-700 p-2 text-left">{text.test}</th>
            <th rowSpan={2} className="border border-brand-700 p-2 text-center">{text.score}</th>
            <th rowSpan={2} className="border border-brand-700 p-2 text-center">{text.sten}</th>
            <th colSpan={3} className="border border-brand-700 p-1.5 text-center">{text.performance}</th>
          </tr>
          <tr className="bg-brand-700 text-xs text-white">
            <th className="border border-brand-600 px-2 py-1 text-center">{bandLabel("High", language)}</th>
            <th className="border border-brand-600 px-2 py-1 text-center">{bandLabel("Average", language)}</th>
            <th className="border border-brand-600 px-2 py-1 text-center">{bandLabel("Low", language)}</th>
          </tr>
        </thead>
        <tbody>
          {profile.rows.map((row, index) => (
            <tr key={row.code} className={index % 2 ? "bg-brand-50/70" : "bg-white"}>
              <td className="border border-(--line) p-2 text-center font-semibold">{index + 1}.</td>
              <td className="border border-(--line) p-2 font-bold">{row.code} <span className="font-normal text-ink/85">({testLabel(row.code, row.name, language)})</span></td>
              <td className="border border-(--line) p-2 text-center font-semibold">{row.raw ?? "–"} <span className="text-xs font-normal text-ink/65">/ {row.max}</span></td>
              <td className="border border-(--line) p-2 text-center font-bold">{row.sten ?? "–"}</td>
              <td className="border border-(--line) p-2 text-center font-bold text-green-700" aria-label={row.band === "High" ? `${text.sten} ${row.sten} · ${bandLabel("High", language)}` : undefined}>{row.band === "High" ? "✓" : ""}</td>
              <td className="border border-(--line) p-2 text-center font-bold text-sky-700" aria-label={row.band === "Average" ? `${text.sten} ${row.sten} · ${bandLabel("Average", language)}` : undefined}>{row.band === "Average" ? "✓" : ""}</td>
              <td className="border border-(--line) p-2 text-center font-bold text-amber-700" aria-label={row.band === "Low" ? `${text.sten} ${row.sten} · ${bandLabel("Low", language)}` : undefined}>{row.band === "Low" ? "✓" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="mt-2 text-xs italic text-ink/85">{text.norms}: {normLabel(profile, language)}. {text.bands} {notes.noPassFail}</p>
    <h3 className="mb-1 mt-5 text-center text-sm font-extrabold uppercase tracking-wide">{text.profile}</h3>
    <StenChart rows={profile.rows} language={language} />
  </section>;
}
