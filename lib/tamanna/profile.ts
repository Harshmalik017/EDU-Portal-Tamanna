import { TESTS } from "@/lib/tamanna/tests";
import { AREAS, NOTES, OCCUPATIONS, SUBJECTS } from "@/lib/tamanna/booklet";
import { bandOf, groupOf, highMinOf, isNearHigh, normalizeClass, stenOf, type Band, type Group } from "@/lib/tamanna/norms";
import type { Student } from "@/lib/types";

export type ProfileRow = {
  code: string;
  name: string;
  max: number;
  raw: number | null;
  sten: number | null;
  band: Band | null;
  nearHigh: boolean;
  highMin: number | null;
   giveReccs: boolean;
};

const list = (a: string[]) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);

function normReference(cls: "IX" | "X" | null, group: Group): string {
  if (!cls) return "Class must be IX or X to apply norms";
  const gLabel = group === "combined" ? "Combined (Boys and Girls)" : group === "girls" ? "Girls" : "Boys";
  const appendix = cls === "IX" ? "Appendix IV" : "Appendix V";
  const tableNo = (cls === "IX" ? 0 : 3) + (group === "combined" ? 1 : group === "girls" ? 2 : 3);
  return `Class ${cls} ${gLabel} (Guide for Teachers and Parents, ${appendix}, Table ${tableNo})`;
}

export function buildProfile(s: Pick<Student, "name" | "roll_number" | "class" | "gender" | "scores">) {
  const cls = normalizeClass(s.class);
  const group = groupOf(s.gender);
  const rows: ProfileRow[] = TESTS.map((t) => {
    const raw = s.scores.find((x) => x.test_code === t.code)?.correct ?? null;
    const sten = raw !== null ? stenOf(s.class, s.gender, t.code, raw) : null;
    const band = sten ? bandOf(sten) : null;
    const highMin = highMinOf(s.class, s.gender, t.code);
    const nearHigh = isNearHigh(s.class, s.gender, t.code, raw, sten);
    return {
      code: t.code,
      name: t.name,
      max: t.questions,
      raw,
      sten,
      band,
      nearHigh,
      highMin,
      giveReccs: band === "High" || nearHigh,
    };
  });

  const highs = rows.filter((r) => r.band === "High");
  const nearHighs = rows.filter((r) => r.nearHigh);
  const avgs = rows.filter((r) => r.band === "Average");
  const lows = rows.filter((r) => r.band === "Low");

  // Recommendations are ONLY given for High scores and Average scores near High's lower bracket.
  // No recommendations for other Average scores (Sten 4-6) or Low scores (Sten 1-3).
  const reccRows = rows.filter((r) => r.giveReccs);
  const reccCodes = reccRows.map((r) => r.code);
  const highCodes = highs.map((h) => h.code);
  const nearHighCodes = nearHighs.map((n) => n.code);

  const highSubjects = Array.from(new Set(highCodes.flatMap((c) => SUBJECTS[c])));
  const nearHighSubjects = Array.from(new Set(nearHighCodes.flatMap((c) => SUBJECTS[c]))).filter((x) => !highSubjects.includes(x));
  const subjects = Array.from(new Set(reccCodes.flatMap((c) => SUBJECTS[c])));

  const occupations = OCCUPATIONS
    .map((o) => ({ ...o, matched: o.aptitudes.filter((a) => reccCodes.includes(a)) }))
    .filter((o) => o.matched.length > 0)
    .sort((a, b) => b.matched.length / b.aptitudes.length - a.matched.length / a.aptitudes.length || b.matched.length - a.matched.length || a.name.localeCompare(b.name));

  const normLabel = normReference(cls, group);

  const remarks: string[] = [];
  if (rows.some((r) => r.raw === null)) {
    remarks.push(`Roll ${s.roll_number}: scores are pending. Complete sheet checking and scoring before interpreting this report.`);
  } else if (!cls) {
    remarks.push("Class must be IX or X to convert scores into Sten scores. Update the student's class.");
  } else if (!highs.length) {
    // Summary paragraph matching the NCERT Section 5 report format
    const parts: string[] = [];
    if (avgs.length) parts.push(`average on ${list(avgs.map((r) => r.name))}`);
    if (lows.length) parts.push(`low on ${list(lows.map((r) => r.name))}`);
    const bandSummary = parts.length ? ` Performance is ${parts.join(", and ")}.` : "";
    remarks.push(`Roll ${s.roll_number} has not scored high (Sten 8–10) on any of the seven sub-tests.${bandSummary}`);

    if (nearHighs.length > 0) {
      remarks.push(
        `Score on ${list(nearHighs.map((r) => `${r.name} (Sten ${r.sten})`))} is close to the High score bracket. Depending on interest, the student may explore subjects such as ${list(Array.from(new Set(nearHighCodes.flatMap((c) => SUBJECTS[c]))).slice(0, 10))}. No recommendations are made for the remaining average or low scores.`
      );
    }

    remarks.push(NOTES.noHighBody);
    remarks.push(NOTES.noHighAction);
  } else {
    const names = highs.map((h) => h.name);
    const otherParts: string[] = [];
    if (avgs.length) otherParts.push(`average on ${list(avgs.map((r) => r.name))}`);
    if (lows.length) otherParts.push(`low on ${list(lows.map((r) => r.name))}`);
    const otherSummary = otherParts.length ? ` Performance is ${otherParts.join(", and ")}.` : "";

    remarks.push(
      `Roll ${s.roll_number} shows high aptitude in ${list(names)}.${otherSummary} Based on high scores, the student is likely to do well in subjects such as ${list(highSubjects.slice(0, 12))}.`
    );

    if (nearHighs.length > 0) {
      const nhNames = nearHighs.map((r) => `${r.name} (Sten ${r.sten})`);
      const nhSubj = (nearHighSubjects.length ? nearHighSubjects : Array.from(new Set(nearHighCodes.flatMap((c) => SUBJECTS[c])))).slice(0, 8);
      remarks.push(
        `In addition, the average score in ${list(nhNames)} is close to the High score bracket, so subjects such as ${list(nhSubj)} may also be considered.`
      );
    }

    remarks.push(
      `Depending on interest and inclination, the student may explore courses and occupations related to ${list(occupations.slice(0, 10).map((o) => o.name))}. No recommendations are given for other average or low scores.`
    );
  }

  return {
    cls,
    group,
    normLabel,
    rows,
    highs,
    nearHighs,
    avgs,
    lows,
    reccRows,
    subjects,
    occupations,
    remarks,
    areas: (c: string) => AREAS[c],
    subjectsFor: (c: string) => SUBJECTS[c] ?? [],
  };
}
export type Profile = ReturnType<typeof buildProfile>;
