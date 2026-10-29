import type { ProfileRow } from "@/lib/tamanna/profile";
import { bandLabel, reportLabels, type ReportLanguage } from "@/lib/tamanna/report-language";
const COLOR = { Low: "#d97706", Average: "#2f7fc1", High: "#15803d" } as const;

/** Sten profile (0-10) as inline SVG, so it prints and needs no JS. */
export function StenChart({ rows, language = "en" }: { rows: ProfileRow[]; language?: ReportLanguage }) {
  const text = reportLabels(language);
  const W = 700, H = 230, x0 = 48, y0 = 34, ph = 150, pw = 630, u = ph / 10, step = pw / rows.length;
  const y = (v: number) => y0 + ph - v * u;
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={text.chart} className="report-chart w-full">
        <rect x={x0} y={y(3.5)} width={pw} height={3.5 * u} fill="#fffbeb" />
        <rect x={x0} y={y(7.5)} width={pw} height={4 * u} fill="#eff6ff" />
        <rect x={x0} y={y(10)} width={pw} height={2.5 * u} fill="#f0fdf4" />
        {Array.from({ length: 11 }, (_, i) => (
          <g key={i}>
            <line x1={x0} x2={x0 + pw} y1={y(i)} y2={y(i)} stroke={i === 0 ? "#64748b" : "#cbd5e1"} strokeWidth={i === 0 ? 1.4 : 0.8} />
            <text x={x0 - 10} y={y(i) + 4} textAnchor="end" fontSize="12" fontWeight="600" fill="#334155">{i}</text>
          </g>))}
        {rows.map((r, i) => {
          const cx = x0 + step * i + step / 2;
          return (
            <g key={r.code}>
              {r.sten !== null && r.band && <rect x={cx - 20} y={y(r.sten)} width={40} height={r.sten * u} rx={5} fill={COLOR[r.band]} opacity="0.88" />}
              {r.sten !== null && r.band && <circle cx={cx} cy={y(r.sten)} r="5" fill="#fff" stroke={COLOR[r.band]} strokeWidth="3" />}
              <text x={cx} y={(r.sten !== null ? y(r.sten) : y(0)) - 8} textAnchor="middle" fontSize="14" fontWeight="800" fill="#1e293b">{r.sten ?? "–"}</text>
              <text x={cx} y={y0 + ph + 21} textAnchor="middle" fontSize="14" fontWeight="800" fill="#25331a">{r.code}</text>
            </g>);
        })}
        <text x={14} y={y0 + ph / 2} fontSize="13" fontWeight="700" fill="#334155" transform={`rotate(-90 14 ${y0 + ph / 2})`} textAnchor="middle">{language === "en" ? "STEN SCORE" : text.sten}</text>
      </svg>
      <div className="mt-1 flex flex-wrap justify-center gap-2 text-[10px] font-bold sm:text-xs" aria-label={text.legend}>
        <span className="rounded-full border border-green-300 bg-green-50 px-2.5 py-1 text-green-800">{bandLabel("High", language)} · 8–10</span>
        <span className="rounded-full border border-blue-300 bg-blue-50 px-2.5 py-1 text-blue-800">{bandLabel("Average", language)} · 4–7</span>
        <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-amber-800">{bandLabel("Low", language)} · 1–3</span>
      </div>
    </>
  );
}
