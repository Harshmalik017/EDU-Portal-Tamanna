import { NORMS, stenOf } from "@/lib/tamanna/norms";
import { TESTS } from "@/lib/tamanna/tests";
let problems = 0;
for (const [cls, groups] of Object.entries(NORMS))
  for (const [g, tests] of Object.entries(groups))
    for (const t of TESTS) {
      const r = tests[t.code];
      if (!r || r.length !== 10) { console.log(`MISSING ${cls}/${g}/${t.code}`); problems++; continue; }
      if (r[0][0] !== 0) { console.log(`START ${cls}/${g}/${t.code}`); problems++; }
      if (r[9][1] !== t.questions) { console.log(`END ${cls}/${g}/${t.code} = ${r[9][1]}`); problems++; }
      for (let i = 1; i < 10; i++) {
        if (r[i][0] === r[i - 1][1] + 1) continue;
        console.log(`${r[i][0] <= r[i - 1][1] ? "OVERLAP" : "GAP"} ${cls}/${g}/${t.code} sten ${i}->${i + 1}: ${r[i - 1]} | ${r[i]}`); problems++;
      }
    }
// Worked example in the booklet (p.12-13): Manju, Class IX, girl
const manju: [string, number, number][] = [["LA", 15, 5], ["AR", 27, 10], ["VR", 25, 9], ["MR", 6, 3], ["NA", 19, 8], ["SA", 11, 5], ["PA", 43, 6]];
for (const [t, raw, want] of manju) { const got = stenOf("IX", "Female", t, raw); if (got !== want) { console.log(`MANJU ${t}: got ${got}, want ${want}`); problems++; } }
console.log(problems ? `${problems} item(s) to review (overlaps are likely misprints in the booklet)` : "All norm tables consistent");
