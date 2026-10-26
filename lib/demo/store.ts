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
  ["101", "IX", "Female"], ["102", "X", "Male"], ["103", "IX", "Female"], ["104", "X", "Male"], ["105", "X", "Female"],
  ["106", "IX", "Male"], ["107", "X", "Female"], ["108", "X", "Male"], ["109", "IX", "Female"], ["110", "X", "Male"],
  ["111", "IX", "Female"], ["112", "IX", "Male"], ["113", "X", "Female"], ["114", "X", "Male"], ["115", "IX", "Female"],
  ["116", "X", "Male"], ["117", "IX", "Female"], ["118", "X", "Male"], ["119", "X", "Female"], ["120", "IX", "Male"],
  ["121", "IX", "Female"], ["122", "X", "Male"], ["123", "X", "Female"], ["124", "IX", "Male"],
];
const EXAMPLE_SCORES: Record<string, number> = { LA: 15, AR: 27, VR: 25, MR: 6, NA: 19, SA: 11, PA: 43 }; // worked example in the booklet (High in AR, VR, NA)
const NO_HIGH_EXAMPLE: Record<string, number> = { LA: 6, AR: 8, VR: 10, MR: 11, NA: 10, SA: 9, PA: 15 }; // Class X Boys example (Average in MR, NA, SA; Low in LA, AR, VR, PA)
const NEAR_HIGH_EXAMPLE: Record<string, number> = { LA: 21, AR: 17, VR: 14, MR: 11, NA: 17, SA: 12, PA: 40 }; // Class IX Girls example with Sten 7 (near High) in LA, AR, NA

function seed(): Db {
  const r = rng(2026); const now = Date.now();
  const students: Row[] = [], scores: Row[] = [], submissions: Row[] = [];
  PEOPLE.forEach(([name, cls, gender], i) => {
    const id = `demo-${i + 1}`; const ability = 0.3 + r() * 0.5;
    const raw: Record<string, number> = {};
    for (const t of TESTS) {
      raw[t.code] = i === 0 ? EXAMPLE_SCORES[t.code] : i === 1 ? NO_HIGH_EXAMPLE[t.code] : i === 2 ? NEAR_HIGH_EXAMPLE[t.code]
        : Math.max(0, Math.min(t.questions, Math.round(t.questions * (ability + (r() - 0.5) * 0.4))));
      const blank = Math.floor(r() * 4), flagged = Math.floor(r() * 2);
      scores.push({ id: `${id}-${t.code}`, student_id: id, test_code: t.code, correct: raw[t.code], wrong: Math.max(0, t.questions - raw[t.code] - blank - flagged), blank, flagged });
    }
    const createdAt = new Date(now - (PEOPLE.length - i) * 3600e3).toISOString();
    const st: Row = { id, name, class: cls, gender, school: "Demo Public School", excluded: false, exclude_reason: null, verification_status: "pending",
      verified_by: null, verified_at: null, manual_scores: null, verification_note: null, created_at: createdAt };
    if (i < 8) Object.assign(st, { verification_status: "verified", verified_by: "demo@tamanna.local", verified_at: new Date(now - 3600e3).toISOString(), manual_scores: raw });
    else if (i === 8 || i === 9) Object.assign(st, { verification_status: "mismatch", verified_by: "demo@tamanna.local", verified_at: new Date(now - 1800e3).toISOString(), verification_note: `LA: app ${raw.LA}, manual ${raw.LA + 1}` });
    else if (i === 10) Object.assign(st, { excluded: true, exclude_reason: "LA: every answer is A" });
    students.push(st);
    submissions.push({ id: `sub-${i + 1}`, student_id: id, responses: {}, image_paths: [], created_at: createdAt });
  });
  return { students, scores, submissions, answer_keys: demoKey(), settings: [] };
}

const g = globalThis as unknown as { __tamannaDemo?: Db };
export const getDb = (): Db => (g.__tamannaDemo ??= seed());
export const resetDb = () => { g.__tamannaDemo = seed(); };
