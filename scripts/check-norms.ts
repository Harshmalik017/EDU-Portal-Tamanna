import { NORMS, stenOf } from "@/lib/tamanna/norms";
import { TESTS } from "@/lib/tamanna/tests";
let problems = 0;
const knownOverlaps = new Set([
  "X/combined/AR sten 4->5: 9,11 | 11,15",
  "X/combined/MR sten 6->7: 13,15 | 15,17",
  "X/combined/SA sten 8->9: 19,21 | 21,23",
  "X/boys/MR sten 9->10: 21,22 | 22,30",
]);
let known = 0;
for (const [cls, groups] of Object.entries(NORMS))
  for (const [g, tests] of Object.entries(groups))
    for (const t of TESTS) {
      const r = tests[t.code];
      if (!r || r.length !== 10) { console.log(`MISSING ${cls}/${g}/${t.code}`); problems++; continue; }
      if (r[0][0] !== 0) { console.log(`START ${cls}/${g}/${t.code}`); problems++; }
      if (r[9][1] !== t.questions) { console.log(`END ${cls}/${g}/${t.code} = ${r[9][1]}`); problems++; }
      for (let i = 1; i < 10; i++) {
        if (r[i][0] === r[i - 1][1] + 1) continue;
        const detail = `${cls}/${g}/${t.code} sten ${i}->${i + 1}: ${r[i - 1]} | ${r[i]}`;
        if (knownOverlaps.delete(detail)) {
          console.log(`Known printed booklet overlap (unchanged): ${detail}`); known++;
        } else {
          console.error(`${r[i][0] <= r[i - 1][1] ? "OVERLAP" : "GAP"} ${detail}`); problems++;
        }
      }
    }
for (const missing of knownOverlaps) {
  console.error(`Booklet baseline changed; verify against the source: ${missing}`); problems++;
}
// Worked example in the booklet (p.12-13): Roll 101, Class IX, girl
const example: [string, number, number][] = [["LA", 15, 5], ["AR", 27, 10], ["VR", 25, 9], ["MR", 6, 3], ["NA", 19, 8], ["SA", 11, 5], ["PA", 43, 6]];
for (const [t, raw, want] of example) { const got = stenOf("IX", "Female", t, raw); if (got !== want) { console.log(`EXAMPLE ${t}: got ${got}, want ${want}`); problems++; } }
for (const [gender, test, raw, want] of [
  ["Not specified", "AR", 11, 4], ["Not specified", "MR", 15, 6],
  ["Not specified", "SA", 21, 8], ["Male", "MR", 22, 9],
] as const) {
  if (stenOf("X", gender, test, raw) !== want) {
    console.error(`FIRST MATCH X/${gender}/${test} score ${raw}: expected Sten ${want}`); problems++;
  }
}
if (problems) {
  console.error(`${problems} unexpected norm issue(s).`); process.exitCode = 1;
} else {
  console.log(`Norm checks passed; ${known} documented booklet overlaps preserved with lower-Sten first match. No scoring values changed.`);
}
