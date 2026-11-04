import { TESTS } from "@/lib/tamanna/tests";
import { stenOf } from "@/lib/tamanna/norms";
import { reviewComplete, sectionNotFilled } from "@/lib/tamanna/results";
import type { Student } from "@/lib/types";

export function resultsCsv(rows: Student[]): string {
  const head = ["Roll no.", "Name", "School", ...TESTS.map((test) => test.code), "OMR sheet"];
  const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const lines = rows.map((r) => {
    const status = r.excluded ? "Excluded" : !r.scores.length ? "No scan" : !reviewComplete(r) ? "Review Pending" : "Scanned";
    return [r.roll_number, `${r.name || "Name pending"} · Class ${r.class} · ${r.gender}`, r.school ?? "", ...TESTS.map((t) => {
      const score = r.scores.find((s) => s.test_code === t.code);
      if (sectionNotFilled(score, t.code)) return "Section not filled";
      const sten = score && !score.uncertain && !r.excluded ? stenOf(r.class, r.gender, t.code, score.correct) : null;
      return `Section Score: ${score?.correct ?? "–"}; STEN SCORE: ${sten ?? "–"}`;
    }), status].map(cell).join(",");
  });
  return [head.join(","), ...lines].join("\n");
}
