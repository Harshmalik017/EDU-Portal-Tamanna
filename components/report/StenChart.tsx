import type { ProfileRow } from "@/lib/tamanna/profile";
const COLOR = { Low: "#d97706", Average: "#2f7fc1", High: "#15803d" } as const;

/** Sten profile (0-10) as inline SVG, so it prints and needs no JS. */
export function StenChart({ rows }: { rows: ProfileRow[] }) {
  const W = 560, H = 270, x0 = 40, y0 = 20, ph = 200, pw = 500, u = ph / 10, step = pw / rows.length;
  const y = (v: number) => y0 + ph - v * u;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Sten scores by sub-test" className="w-full">
      <rect x={x0} y={y(3.5)} width={pw} height={3.5 * u} fill="#fef3c7" />
      <rect x={x0} y={y(7.5)} width={pw} height={4 * u} fill="#e1eefa" />
      <rect x={x0} y={y(10)} width={pw} height={2.5 * u} fill="#dcfce7" />
      {Array.from({ length: 11 }, (_, i) => (
        <g key={i}><line x1={x0} x2={x0 + pw} y1={y(i)} y2={y(i)} stroke="#c3cf9a" strokeWidth={0.6} />
          <text x={x0 - 8} y={y(i) + 4} textAnchor="end" fontSize="11" fill="#25331a">{i}</text></g>))}
      <text x={x0 + pw - 4} y={y(10) + 14} textAnchor="end" fontSize="10" fill="#15803d">High (8–10)</text>
      <text x={x0 + pw - 4} y={y(7.5) + 14} textAnchor="end" fontSize="10" fill="#2f7fc1">Average (4–7)</text>
      <text x={x0 + pw - 4} y={y(3.5) + 14} textAnchor="end" fontSize="10" fill="#b45309">Low (1–3)</text>
      {rows.map((r, i) => {
        const cx = x0 + step * i + step / 2;
        return (
          <g key={r.code}>
            {r.sten !== null && r.band && <rect x={cx - 17} y={y(r.sten)} width={34} height={r.sten * u} rx={4} fill={COLOR[r.band]} />}
            <text x={cx} y={(r.sten !== null ? y(r.sten) : y(0)) - 5} textAnchor="middle" fontSize="12" fontWeight="700" fill="#25331a">{r.sten ?? "–"}</text>
            <text x={cx} y={y0 + ph + 18} textAnchor="middle" fontSize="12" fontWeight="700" fill="#25331a">{r.code}</text>
          </g>);
      })}
      <text x={12} y={y0 + ph / 2} fontSize="11" fill="#25331a" transform={`rotate(-90 12 ${y0 + ph / 2})`} textAnchor="middle">Sten score</text>
    </svg>
  );
}
