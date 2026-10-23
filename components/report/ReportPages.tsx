import { Check } from "lucide-react";
import { NOTES, DESCRIPTIONS } from "@/lib/tamanna/booklet";
import { buildProfile } from "@/lib/tamanna/profile";
import type { Student } from "@/lib/types";
import { StenChart } from "./StenChart";

const pill = { Low: "bg-amber-100 text-amber-900", Average: "bg-blue-100 text-blue-900", High: "bg-green-100 text-green-900" } as const;

function Head({ n, roll }: { n: number; roll: string }) {
  return (
    <header className="mb-4 flex items-end justify-between border-b-2 border-brand-600 pb-2">
      <div className="flex items-center gap-3">
        <img src="/brand/logo.png" alt="Tamanna" className="h-8 w-auto" />
        <div>
          <p className="text-xs font-bold text-brand-700">Tamanna: An Aptitude Test</p>
          <h2 className="text-xl font-extrabold">Aptitude Test Report Sheet</h2>
        </div>
      </div>
      <p className="text-xs font-semibold">Roll {roll} · Page {n} of 3</p>
    </header>
  );
}

/** A 3-page personal report. Content comes only from the Tamanna booklet (see lib/tamanna/booklet.ts). */
export function ReportPages({ s }: { s: Student }) {
  const p = buildProfile(s);
  const date = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-GB") : "");
  const status = s.verification_status === "verified" ? `Verified by ${s.verified_by ?? "teacher"} on ${date(s.verified_at)}`
    : s.verification_status === "mismatch" ? "Score difference found during hand check. Recheck before sharing." : "Pending hand check";
  return (
    <>
      <section className="report-page">
        <Head n={1} roll={s.name} />
        <dl className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-xl border border-(--line) bg-brand-50/50 p-3 text-sm">
          <div><dt className="inline font-bold">Roll No.: </dt><dd className="inline">{s.name}</dd></div>
          <div><dt className="inline font-bold">Class: </dt><dd className="inline">{s.class}</dd></div>
          <div><dt className="inline font-bold">Gender: </dt><dd className="inline">{s.gender}</dd></div>
          <div><dt className="inline font-bold">School: </dt><dd className="inline">{s.school || "As recorded on answer sheet"}</dd></div>
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
        <p className="mt-1 text-xs font-semibold">{status}</p>
      </section>

      <section className="report-page">
        <Head n={2} roll={s.name} />
        <h3 className="mb-3 text-lg font-extrabold">What each score means</h3>
        <ul className="space-y-3">{p.rows.map((r) => (
          <li key={r.code} className="rounded-2xl border border-brand-100 p-3 text-sm">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <span className="font-extrabold">{r.name} ({r.code})</span>
              {r.band && (
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold ${pill[r.band]}`}>
                  <Check size={12} /> Sten {r.sten} · {r.band}{r.nearHigh ? " (Close to High)" : ""}
                </span>
              )}
            </div>
            <p>{r.band ? DESCRIPTIONS[r.code][r.band] : "No Sten score available for this sub-test."}</p>
            {r.giveReccs && (
              <div className="mt-2 rounded-xl bg-brand-50/80 px-3 py-2 text-xs">
                <p>
                  <b>Recommended subjects{r.nearHigh ? ` (Average score close to High bracket of ${r.highMin}+)` : ""}:</b>{" "}
                  {p.subjectsFor(r.code).join(", ")}.
                </p>
                <p className="mt-1">
                  <b>Related fields:</b> {p.areas(r.code)}.
                </p>
              </div>
            )}
          </li>))}</ul>
      </section>

      <section className="report-page">
        <Head n={3} roll={s.name} />
        <h3 className="mb-2 text-lg font-extrabold">Suggestions / Remarks</h3>
        <div className="space-y-2.5">
          {p.remarks.map((t, i) => <p key={i} className="text-sm leading-relaxed">{t}</p>)}
        </div>
        {p.highs.length === 0 && (
          <p className="mt-2 text-xs italic text-ink/80">{NOTES.noHighSource}</p>
        )}
        {p.reccRows.length > 0 && (
          <>
            <h4 className="mb-1 mt-5 text-sm font-extrabold">
              Recommended occupations (Appendix VII — for High scores and Average scores close to High only)
            </h4>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              {p.occupations.slice(0, 14).map((o) => (
                <li key={o.name}>
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
        <div className="mt-5 space-y-1.5 rounded-2xl bg-brand-50 p-3.5 text-xs">
          <p className="font-bold">{NOTES.suggestive}</p>
          <p>{NOTES.cluster}</p>
        </div>
        <p className="mt-10 text-right text-sm font-bold">Teacher&apos;s Signature: ______________________</p>
        <p className="mt-6 text-[10px] text-ink/80">{NOTES.source}</p>
      </section>
    </>
  );
}
