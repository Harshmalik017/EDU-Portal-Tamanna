import { TESTS } from "./tests";
import { AREAS, NOTES, OCCUPATIONS, SUBJECTS } from "./booklet";
import { bandOf, groupOf, normalizeClass, stenOf, type Band } from "./norms";
import type { Student } from "./types";

export type ProfileRow = { code: string; name: string; max: number; raw: number | null; sten: number | null; band: Band | null };

const list = (a: string[]) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);

export function buildProfile(s: Pick<Student, "name" | "class" | "gender" | "scores">) {
  const cls = normalizeClass(s.class);
  const group = groupOf(s.gender);
  const rows: ProfileRow[] = TESTS.map((t) => {
    const raw = s.scores.find((x) => x.test_code === t.code)?.correct ?? null;
    const sten = raw !== null ? stenOf(s.class, s.gender, t.code, raw) : null;
    return { code: t.code, name: t.name, max: t.questions, raw, sten, band: sten ? bandOf(sten) : null };
  });
  const highs = rows.filter((r) => r.band === "High");
  const codes = highs.map((h) => h.code);
  const subjects = Array.from(new Set(codes.flatMap((c) => SUBJECTS[c])));
  const occupations = OCCUPATIONS
    .map((o) => ({ ...o, matched: o.aptitudes.filter((a) => codes.includes(a)) }))
    .filter((o) => o.matched.length > 0)
    .sort((a, b) => b.matched.length / b.aptitudes.length - a.matched.length / a.aptitudes.length || b.matched.length - a.matched.length || a.name.localeCompare(b.name));
  const normLabel = `Class ${cls ?? "?"} · ${group === "combined" ? "Combined (boys and girls)" : group === "girls" ? "Girls" : "Boys"} norms`;

  const remarks: string[] = [];
  if (!cls) remarks.push("Class must be IX or X to convert scores into Sten scores. Update the student's class.");
  else if (!highs.length) remarks.push(NOTES.noHigh);
  else {
    const names = highs.map((h) => h.name);
    remarks.push(`The profile of ${s.name} shows high aptitude in ${list(names)}. This suggests they are likely to do well in subjects such as ${list(subjects.slice(0, 12))}.`);
    remarks.push(`Depending on interest and inclination, they may explore courses and occupations related to ${list(occupations.slice(0, 10).map((o) => o.name))}. See Appendix VII and VIII of the booklet for related information.`);
  }
  return { cls, group, normLabel, rows, highs, subjects, occupations, remarks, areas: (c: string) => AREAS[c] };
}
export type Profile = ReturnType<typeof buildProfile>;
