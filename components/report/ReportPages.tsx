import {
  BookOpen,
  Box,
  BriefcaseBusiness,
  Calculator,
  ChartNoAxesColumn,
  Check,
  Cog,
  Compass,
  Lightbulb,
  MessageSquareText,
  ScanSearch,
  Shapes,
  type LucideIcon,
} from "lucide-react";
import { NOTES, DESCRIPTIONS } from "@/lib/tamanna/booklet";
import { buildProfile } from "@/lib/tamanna/profile";
import type { Band } from "@/lib/tamanna/norms";
import type { Student } from "@/lib/types";
import { StenChart } from "./StenChart";

const pill = { Low: "bg-amber-100 text-amber-900", Average: "bg-blue-100 text-blue-900", High: "bg-green-100 text-green-900" } as const;
const cardTone: Record<Band, string> = {
  Low: "border-amber-200 bg-amber-50",
  Average: "border-sky-200 bg-sky-50",
  High: "border-green-200 bg-green-50",
};
const testIcon: Record<string, LucideIcon> = {
  LA: BookOpen,
  AR: Shapes,
  VR: MessageSquareText,
  MR: Cog,
  NA: Calculator,
  SA: Box,
  PA: ScanSearch,
};

function Head({ n, roll, name }: { n: number; roll: string; name: string }) {
  return (
    <header className="report-header mb-4 flex items-end justify-between border-b-2 border-brand-600 pb-2">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-start">
          <img src="/brand/logo.png" alt="Tamanna" className="h-8 w-auto" />
          <span className="text-[9px] font-semibold leading-none text-brand-700">Uttar Pradesh</span>
        </div>
        {n === 1 && <h2 className="text-xl font-extrabold">Aptitude Test Report</h2>}
      </div>
      <p className="max-w-[45%] text-right text-xs font-semibold">{name || "Name pending"} · Roll {roll} · Page {n} of 3</p>
    </header>
  );
}

/** A 3-page personal report. Content comes only from the Tamanna booklet (see lib/tamanna/booklet.ts). */
export function ReportPages({ s }: { s: Student }) {
  const p = buildProfile(s);
  return (
    <>
      <section className="report-page">
        <Head n={1} roll={s.roll_number} name={s.name} />
        <dl className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-xl border border-(--line) bg-brand-50/50 p-3 text-sm">
          <div><dt className="inline font-bold">Roll No.: </dt><dd className="inline">{s.roll_number}</dd></div>
          <div><dt className="inline font-bold">Name: </dt><dd className="inline">{s.name || "Name pending"}</dd></div>
          <div><dt className="inline font-bold">Class: </dt><dd className="inline">{s.class}</dd></div>
          <div><dt className="inline font-bold">Gender: </dt><dd className="inline">{s.gender}</dd></div>
          <div><dt className="inline font-bold">School: </dt><dd className="inline">{s.school || "As recorded on answer sheet"}</dd></div>
          <div><dt className="inline font-bold">Block: </dt><dd className="inline">{s.block || "Not recorded"}</dd></div>
          <div><dt className="inline font-bold">District: </dt><dd className="inline">{s.district || "Not recorded"}</dd></div>
        </dl>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse border border-(--line) text-sm">
            <thead>
              <tr className="bg-brand-600 text-white">
                <th rowSpan={2} className="border border-brand-700 p-2 text-center">S. No.</th>
                <th rowSpan={2} className="border border-brand-700 p-2 text-left">Sub-Test</th>
                <th rowSpan={2} className="border border-brand-700 p-2 text-center">Score Obtained</th>
                <th rowSpan={2} className="border border-brand-700 p-2 text-center">Sten Score</th>
                <th colSpan={3} className="border border-brand-700 p-1.5 text-center">Performance</th>
              </tr>
              <tr className="bg-brand-700 text-xs text-white">
                <th className="border border-brand-600 px-2 py-1 text-center">High</th>
                <th className="border border-brand-600 px-2 py-1 text-center">Average</th>
                <th className="border border-brand-600 px-2 py-1 text-center">Low</th>
              </tr>
            </thead>
            <tbody>
              {p.rows.map((r, i) => (
                <tr key={r.code} className={i % 2 ? "bg-brand-50/70" : "bg-white"}>
                  <td className="border border-(--line) p-2 text-center font-semibold">{i + 1}.</td>
                  <td className="border border-(--line) p-2 font-bold">
                    {r.code} <span className="font-normal text-ink/85">({r.name})</span>
                  </td>
                  <td className="border border-(--line) p-2 text-center font-semibold">
                    {r.raw ?? "–"} <span className="text-xs font-normal text-ink/65">/ {r.max}</span>
                  </td>
                  <td className="border border-(--line) p-2 text-center font-bold">{r.sten ?? "–"}</td>
                  <td className="border border-(--line) p-2 text-center font-bold text-green-700" aria-label={r.band === "High" ? `Sten ${r.sten} · High` : undefined}>
                    {r.band === "High" ? "✓" : ""}
                  </td>
                  <td className="border border-(--line) p-2 text-center font-bold text-sky-700" aria-label={r.band === "Average" ? `Sten ${r.sten} · Average` : undefined}>
                    {r.band === "Average" ? "✓" : ""}
                  </td>
                  <td className="border border-(--line) p-2 text-center font-bold text-amber-700" aria-label={r.band === "Low" ? `Sten ${r.sten} · Low` : undefined}>
                    {r.band === "Low" ? "✓" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs italic text-ink/85">
          Norms applied: {p.normLabel}. Performance bands as per Appendix VI: Sten 1–3 Low, 4–7 Average, 8–10 High. {NOTES.noPassFail}
        </p>
        <h3 className="mb-1 mt-5 text-center text-sm font-extrabold uppercase tracking-wide">Aptitude Profile</h3>
        <StenChart rows={p.rows} />
      </section>

      <section className="report-page">
        <Head n={2} roll={s.roll_number} name={s.name} />
        <h3 className="mb-1 text-lg font-extrabold">What each score means</h3>
        <p className="mb-3 text-[10px] italic text-ink/70">Source: Tamanna Guide for Teachers and Parents, Section 2 and Appendices VI–VIII.</p>
        <ul className="meaning-grid grid grid-cols-2 gap-2">{p.rows.map((r) => {
          const Icon = testIcon[r.code];
          return (
            <li key={r.code} className={`meaning-card rounded-xl border p-2.5 text-[11px] leading-snug ${r.band ? cardTone[r.band] : "border-slate-200 bg-slate-50"}`}>
              <div className="mb-1 flex items-start justify-between gap-2">
                <span className="flex items-center gap-1.5 font-extrabold">
                  <Icon size={16} aria-hidden="true" className="shrink-0 text-brand-700" />
                  {r.name} ({r.code})
                </span>
                {r.band && (
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${pill[r.band]}`}>
                    <Check size={11} /> Sten {r.sten} · {r.band}{r.nearHigh ? " · Near high" : ""}
                  </span>
                )}
              </div>
              <p>{r.band ? DESCRIPTIONS[r.code][r.band] : "No Sten score available for this sub-test."}</p>
              {r.giveReccs && (
                <div className="recommendations-copy mt-1.5 border-t border-current/10 pt-1.5 text-[10px]">
                  <p><b>Subjects{r.nearHigh ? ` (near High: ${r.highMin}+)` : ""}:</b> {p.subjectsFor(r.code).join(", ")}.</p>
                  <p className="mt-1"><b>Related fields:</b> {p.areas(r.code)}.</p>
                </div>
              )}
            </li>
          );
        })}</ul>
      </section>

      <section className="report-page">
        <Head n={3} roll={s.roll_number} name={s.name} />
        <h3 className="mb-1 text-lg font-extrabold">Suggestions / Remarks</h3>
        <p className="mb-3 text-[10px] italic text-ink/70">
          Source: Tamanna Guide for Teachers and Parents, Section 5 (p. 11), Appendices VII–VIII.
        </p>
        <div className="remarks-grid space-y-2">
          {p.remarks.map((text, index) => {
            const Icon = index === 0 ? ChartNoAxesColumn : index === 1 ? Lightbulb : Compass;
            const tone = ["border-blue-200 bg-blue-50", "border-amber-200 bg-amber-50", "border-violet-200 bg-violet-50"][index % 3];
            return (
              <article key={index} className={`flex gap-3 rounded-xl border p-3 text-xs leading-relaxed ${tone}`}>
                <Icon size={19} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-700" />
                <p>{text}</p>
              </article>
            );
          })}
        </div>
        {p.highs.length === 0 && (
          <p className="mt-2 text-[10px] italic text-ink/70">{NOTES.noHighSource}</p>
        )}
        {p.reccRows.length > 0 && (
          <>
            <h4 className="mb-1 mt-4 flex items-center gap-2 text-sm font-extrabold">
              <BriefcaseBusiness size={17} aria-hidden="true" className="text-brand-700" />
              Recommended occupations
            </h4>
            <ul className="occupation-grid grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
              {p.occupations.slice(0, 14).map((o) => (
                <li key={o.name} className="rounded-lg border border-violet-100 bg-violet-50/70 px-2 py-1.5">
                  <b>{o.name}</b>{" "}
                  <span className="text-xs">
                    ({o.aptitudes.map((a) => (p.reccRows.some((h) => h.code === a) ? `${a}✓` : a)).join(", ")})
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-ink/80">
              ✓ marks an aptitude where the student scored High (Sten 8–10) or Average close to High (Sten 7). No recommendations are given for other Average or Low scores.
            </p>
          </>
        )}
        <div className="mt-3 space-y-1.5 rounded-xl border border-brand-200 bg-brand-50 p-3 text-[10px] leading-relaxed">
          <p className="font-bold">{NOTES.suggestive}</p>
          <p>{NOTES.cluster}</p>
        </div>
        <p className="mt-5 text-right text-xs font-bold">Teacher&apos;s Signature: ______________________</p>
        <p className="mt-3 text-[9px] italic leading-relaxed text-ink/70">{NOTES.source}</p>
      </section>
    </>
  );
}
