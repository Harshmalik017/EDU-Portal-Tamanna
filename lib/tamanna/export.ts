import { TESTS } from "@/lib/tamanna/tests";
import { bandOf, stenOf } from "@/lib/tamanna/norms";
import type { Student } from "@/lib/types";

export function resultsCsv(rows: Student[]): string {
  const head = ["Roll number", "Class", "Gender", "School", "Block", "District", ...TESTS.flatMap((t) => [`${t.code} score`, `${t.code} blurry answers (score provisional if above zero)`, `${t.code} sten`, `${t.code} level`]), "Scan status", "Excluded"];
  const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const lines = rows.map((r) => {
    const pending = r.scores.some((score) => (score.uncertain ?? 0) > 0);
    const status = r.excluded ? "Excluded" : !r.scores.length ? "No scan" : pending ? "Review Pending" : "Scanned";
    return [r.roll_number, r.class, r.gender, r.school ?? "", r.block ?? "", r.district ?? "", ...TESTS.flatMap((t) => {
      const score = r.scores.find((s) => s.test_code === t.code);
      const sten = score && !score.uncertain && !r.excluded ? stenOf(r.class, r.gender, t.code, score.correct) : null;
      return [score?.correct ?? "", score?.uncertain ?? "", sten ?? "", sten !== null ? bandOf(sten) : ""];
    }), status, r.excluded ? "yes" : "no"].map(cell).join(",");
  });
  return [head.join(","), ...lines].join("\n");
}
