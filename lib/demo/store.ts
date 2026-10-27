import { TESTS } from "@/lib/tamanna/tests";

export type Row = Record<string, unknown>;
export type Db = Record<string, Row[]>;

function rng(seed: number) { return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** DEMO answer key (made up). It is NOT the real Tamanna scoring key; replace it under Answer key. */
export function demoKey() {
  const r = rng(7); const rows: Row[] = [];
  for (const t of TESTS) for (let q = 1; q <= t.questions; q++) rows.push({ test_code: t.code, question_no: q, correct_option: "ABCD"[Math.floor(r() * 4)] });
  return rows;
}

type DemoGender = "Male" | "Female";
const PEOPLE: readonly [string, string, DemoGender][] = [
  ["101", "IX", "Male"],
];
const EXAMPLE_SCORES: Record<string, number> = { LA: 15, AR: 27, VR: 25, MR: 6, NA: 19, SA: 11, PA: 43 }; // worked example in the booklet (High in AR, VR, NA)

function seed(): Db {
  const r = rng(2026); const now = Date.now();
  const students: Row[] = [], scores: Row[] = [], submissions: Row[] = [];
  PEOPLE.forEach(([name, cls, gender], i) => {
    const id = `demo-${i + 1}`;
    const raw = EXAMPLE_SCORES;
    for (const t of TESTS) {
      const blank = Math.floor(r() * 4), flagged = Math.floor(r() * 2);
      scores.push({ id: `${id}-${t.code}`, student_id: id, test_code: t.code, correct: raw[t.code], wrong: Math.max(0, t.questions - raw[t.code] - blank - flagged), blank, flagged });
    }
    const createdAt = new Date(now - (PEOPLE.length - i) * 3600e3).toISOString();
    const st: Row = { id, name, class: cls, gender, school: "", excluded: false, exclude_reason: null, verification_status: "verified",
      verified_by: "demo@tamanna.local", verified_at: new Date(now - 3600e3).toISOString(), manual_scores: raw, verification_note: null, created_at: createdAt };
    students.push(st);
    submissions.push({ id: `sub-${i + 1}`, student_id: id, responses: {}, image_paths: [], created_at: createdAt });
  });
  return { students, scores, submissions, answer_keys: demoKey(), settings: [] };
}

const g = globalThis as unknown as { __tamannaDemo?: Db };
export const getDb = (): Db => (g.__tamannaDemo ??= seed());
export const resetDb = () => { g.__tamannaDemo = seed(); };
