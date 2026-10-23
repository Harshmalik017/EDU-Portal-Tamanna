import { Check } from "lucide-react";
import { NOTES, DESCRIPTIONS } from "@/lib/tamanna/booklet";
import { buildProfile } from "@/lib/tamanna/profile";
import type { Student } from "@/lib/types";
import { StenChart } from "./StenChart";

const pill = { Low: "bg-amber-100 text-amber-900", Average: "bg-blue-100 text-blue-900", High: "bg-green-100 text-green-900" } as const;

function Head({ n, roll }: { n: number; roll: string }) {
  return (
    <header className="mb-4 flex items-end justify-between border-b-2 border-brand-600 pb-2">
      <div className="flex items-center gap-3"><img src="/brand/logo.png" alt="Tamanna" className="h-8 w-auto" /><div><p className="text-xs font-bold text-brand-700">An Aptitude Test for Senior School Students</p><h2 className="text-xl font-extrabold">Aptitude Test Report Sheet</h2></div></div>
      <p className="text-xs font-semibold">Roll {roll} · Page {n} of 3</p>
    </header>
  );
}

/** A 3-page personal report. Content comes only from the Tamanna booklet (see lib/booklet.ts). */
export function ReportPages({ s }: { s: Student }) {
  const p = buildProfile(s);
  const date = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-GB") : "");
  const status = s.verification_status === "verified" ? `Verified by ${s.verified_by ?? "teacher"} on ${date(s.verified_at)}`
    : s.verification_status === "mismatch" ? "Verification mismatch. Re-check before sharing." : "Not yet verified";
  return (
    <>
      <section className="report-page">
        <Head n={1} roll={s.name} />
        <dl className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div><dt className="inline font-bold">Roll no.: </dt><dd className="inline">{s.name}</dd></div><div><dt className="inline font-bold">Class: </dt><dd className="inline">{s.class}</dd></div>
          <div><dt className="inline font-bold">Gender: </dt><dd className="inline">{s.gender}</dd></div><div><dt className="inline font-bold">School: </dt><dd className="inline">{s.school}</dd></div>
        </dl>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead><tr className="bg-brand-600 text-white"><th className="p-2 text-left">Sub-test</th><th className="p-2">Score obtained</th><th className="p-2">Sten score</th><th className="p-2">Performance</th></tr></thead>
            <tbody>{p.rows.map((r, i) => (
              <tr key={r.code} className={i % 2 ? "bg-brand-50" : "bg-white"}>
                <td className="p-2 font-semibold">{r.code} <span className="font-normal">{r.name}</span></td>
                <td className="p-2 text-center">{r.raw ?? "–"} <span className="text-xs">/ {r.max}</span></td>
                <td className="p-2 text-center font-bold">{r.sten ?? "–"}</td>
                <td className="p-2 text-center">{r.band ? <span className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold ${pill[r.band]}`}><Check size={12} />{r.band}</span> : "–"}</td>
              </tr>))}</tbody>
          </table>
        </div>
        <h3 className="mb-1 mt-5 text-center text-sm font-extrabold">Aptitude profile</h3>
        <StenChart rows={p.rows} />
        <p className="mt-2 text-xs">Sten scores use {p.normLabel}. Sten 1–3 is Low, 4–7 is Average and 8–10 is High. {NOTES.noPassFail}</p>
        <p className="mt-1 text-xs font-semibold">{status}</p>
      </section>

      <section className="report-page">
        <Head n={2} roll={s.name} />
        <h3 className="mb-3 text-lg font-extrabold">What each score means</h3>
        <ul className="space-y-3">{p.rows.map((r) => (
          <li key={r.code} className="rounded-2xl border border-brand-100 p-3 text-sm">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2"><span className="font-extrabold">{r.name} ({r.code})</span>
              {r.band && <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${pill[r.band]}`}>Sten {r.sten} · {r.band}</span>}</div>
            <p>{r.band ? DESCRIPTIONS[r.code][r.band] : "No Sten score available for this sub-test."}</p>
            {r.band === "High" && <p className="mt-1 text-xs"><b>Related areas:</b> {p.areas(r.code)}.</p>}
          </li>))}</ul>
      </section>

      <section className="report-page">
        <Head n={3} roll={s.name} />
        <h3 className="mb-2 text-lg font-extrabold">Suggestions and remarks</h3>
        {p.remarks.map((t, i) => <p key={i} className="mb-2 text-sm leading-relaxed">{t}</p>)}
        {p.highs.length > 0 && (
          <>
            <h4 className="mb-1 mt-4 text-sm font-extrabold">Occupations that list your high aptitudes (Appendix VII)</h4>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">{p.occupations.slice(0, 14).map((o) => (
              <li key={o.name}><b>{o.name}</b> <span className="text-xs">({o.aptitudes.map((a) => (p.highs.some((h) => h.code === a) ? `${a}✓` : a)).join(", ")})</span></li>))}</ul>
            <p className="mt-1 text-xs">✓ marks an aptitude where the student scored High. The full list is in Appendix VII.</p>
          </>)}
        <div className="mt-5 space-y-1 rounded-2xl bg-brand-50 p-3 text-xs"><p className="font-bold">Please note</p><p>{NOTES.suggestive}</p><p>{NOTES.cluster}</p></div>
        <p className="mt-10 text-right text-sm font-bold">Teacher&apos;s signature: ______________________</p>
        <p className="mt-6 text-[10px] text-ink/80">{NOTES.source}</p>
      </section>
    </>
  );
}
