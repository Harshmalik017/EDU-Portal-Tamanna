/**
 * Sten norms transcribed from "Tamanna: Guide for Teachers and Parents" (NCERT, 2019),
 * Appendix IV (Class IX, Tables 1-3) and Appendix V (Class X, Tables 4-6).
 * Each string = ranges of raw scores for Sten 1..10. Run `npm run check:norms` after any edit.
 */
export type Group = "combined" | "girls" | "boys";
export type Band = "Low" | "Average" | "High";
type Range = [number, number];
const R = (s: string): Range[] => s.split(" ").map((x) => { const [a, b] = x.split("-").map(Number); return [a, b ?? a] as Range; });
const T = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, R(v)])) as Record<string, Range[]>;

export const NORMS: Record<"IX" | "X", Record<Group, Record<string, Range[]>>> = {
  IX: {
    combined: T({
      LA: "0-4 5-6 7-9 10-12 13-15 16-18 19-21 22-24 25-27 28-30", AR: "0-1 2-4 5-7 8-10 11-13 14-16 17-19 20-22 23-25 26-30",
      VR: "0-3 4-5 6-8 9-11 12-14 15-17 18-20 21-23 24-26 27-30", MR: "0-3 4-5 6-7 8-9 10-11 12-13 14-15 16-17 18-20 21-30",
      NA: "0 1-3 4-6 7-9 10-12 13-15 16-18 19-22 23-25 26-30", SA: "0-1 2-4 5-6 7-9 10-11 12-14 15-16 17-19 20-21 22-30",
      PA: "0-9 10-16 17-23 24-30 31-37 38-43 44-50 51-56 57-58 59-60" }),
    girls: T({
      LA: "0-4 5-7 8-10 11-13 14-16 17-19 20-22 23-24 25-27 28-30", AR: "0-1 2-4 5-7 8-9 10-12 13-15 16-18 19-21 22-24 25-30",
      VR: "0-4 5-7 8-9 10-12 13-15 16-18 19-20 21-23 24-26 27-30", MR: "0-3 4-5 6-7 8-9 10-11 12-13 14-15 16-17 18-19 20-30",
      NA: "0 1-3 4-6 7-9 10-12 13-15 16-17 18-20 21-23 24-30", SA: "0-2 3-4 5-7 8-9 10-11 12-13 14-16 17-18 19-20 21-30",
      PA: "0-12 13-18 19-25 26-31 32-38 39-45 46-51 52-56 57-58 59-60" }),
    boys: T({
      LA: "0-3 4-6 7-9 10-12 13-15 16-18 19-21 22-24 25-26 27-30", AR: "0-1 2-4 5-7 8-10 11-13 14-16 17-19 20-22 23-26 27-30",
      VR: "0-2 3-5 6-8 9-11 12-14 15-17 18-20 21-23 24-26 27-30", MR: "0-3 4-5 6-7 8-9 10-12 13-14 15-16 17-18 19-20 21-30",
      NA: "0 1-3 4-6 7-10 11-13 14-16 17-19 20-22 23-25 26-30", SA: "0-1 2-4 5-6 7-9 10-11 12-14 15-17 18-19 20-22 23-30",
      PA: "0-8 9-15 16-22 23-29 30-36 37-43 44-50 51-56 57-58 59-60" }),
  },
  X: {
    combined: T({
      LA: "0-6 7-9 10-12 13-14 15-17 18-20 21-23 24-26 27-28 29-30", AR: "0-2 3-5 6-8 9-11 11-15 16-18 19-21 22-24 25-27 28-30",
      VR: "0-4 5-7 8-10 11-13 14-16 17-19 20-22 23-25 26-28 29-30", MR: "0-3 4-6 7-8 9-10 11-12 13-15 15-17 18-19 20-22 23-30",
      NA: "0-2 3-5 6-9 10-12 13-15 16-19 20-22 23-25 26-28 29-30", SA: "0-2 3-4 5-7 8-10 11-12 13-15 16-18 19-21 21-23 24-30",
      PA: "0-11 12-19 20-25 26-31 32-37 38-43 44-50 51-56 57-58 59-60" }),
    girls: T({
      LA: "0-5 6-8 9-10 11-13 14-16 17-19 20-21 22-24 25-27 28-30", AR: "0-2 3-5 6-8 9-11 12-14 15-17 18-20 21-23 24-26 27-30",
      VR: "0-6 7-8 9-11 12-14 15-17 18-20 21-23 24-26 27-28 29-30", MR: "0-3 4-5 6-7 8-10 11-12 13-14 15-16 17-18 19-20 21-30",
      NA: "0-2 3-5 6-8 9-12 13-15 16-18 19-21 22-24 25-27 28-30", SA: "0-3 4-5 6-8 9-10 11-12 13-15 16-17 18-20 21-22 23-30",
      PA: "0-10 11-17 18-23 24-30 31-38 39-43 44-50 51-56 57-58 59-60" }),
    boys: T({
      LA: "0-5 6-8 9-11 12-14 15-17 18-19 20-22 23-25 26-28 29-30", AR: "0-2 3-5 6-8 9-12 13-15 16-18 19-21 22-25 26-28 29-30",
      VR: "0-3 4-7 8-10 11-13 14-16 17-19 20-22 23-25 26-28 29-30", MR: "0-3 4-6 7-8 9-10 11-13 14-15 16-17 18-20 21-22 22-30",
      NA: "0-2 3-5 6-9 10-12 13-15 16-18 19-22 23-25 26-28 29-30", SA: "0-1 2-4 5-7 8-9 10-12 13-15 16-18 19-21 22-24 25-30",
      PA: "0-11 12-17 18-24 25-31 32-37 38-44 45-50 51-56 57-58 59-60" }),
  },
};

export function normalizeClass(c?: string | null): "IX" | "X" | null {
  const v = (c ?? "").trim().toUpperCase();
  return v === "IX" || v === "9" ? "IX" : v === "X" || v === "10" ? "X" : null;
}
/** Booklet gives boys, girls and combined tables. Anything other than Male/Female uses combined. */
export function groupOf(g?: string | null): Group {
  const v = (g ?? "").trim().toLowerCase();
  return v.startsWith("f") || v === "girl" ? "girls" : v.startsWith("m") || v === "boy" ? "boys" : "combined";
}
/** Raw score -> Sten (1-10) for the student's class and gender. First matching range wins. */
export function stenOf(cls: string | null | undefined, gender: string | null | undefined, test: string, raw: number): number | null {
  const c = normalizeClass(cls); if (!c) return null;
  const ranges = NORMS[c][groupOf(gender)][test]; if (!ranges) return null;
  const i = ranges.findIndex(([lo, hi]) => raw >= lo && raw <= hi);
  return i < 0 ? null : i + 1;
}
/** Lower raw-score cutoff of the High band (Sten 8) for a class, gender and sub-test. */
export function highMinOf(cls: string | null | undefined, gender: string | null | undefined, test: string): number | null {
  const c = normalizeClass(cls); if (!c) return null;
  const ranges = NORMS[c][groupOf(gender)][test];
  return ranges?.[7]?.[0] ?? null;
}
/** True when an Average score is in the top Average bracket (Sten 7) right below High (Sten 8), or within 2 marks of High's lower cutoff. */
export function isNearHigh(cls: string | null | undefined, gender: string | null | undefined, test: string, raw: number | null, sten: number | null): boolean {
  if (raw === null || sten === null || bandOf(sten) !== "Average") return false;
  const highMin = highMinOf(cls, gender, test);
  return sten === 7 || (highMin !== null && highMin - raw <= 2);
}
/** Appendix VI: Sten 1-3 Low, 4-7 Average, 8-10 High. */
export const bandOf = (s: number): Band => (s <= 3 ? "Low" : s <= 7 ? "Average" : "High");
