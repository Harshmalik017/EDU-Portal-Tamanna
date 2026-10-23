export type ScoreRow = { test_code: string; correct: number; wrong?: number; blank?: number; flagged?: number };
export type Verification = "pending" | "verified" | "mismatch";
/** `name` column in `students` stores the student roll number (names are not shown). */
export type Student = {
  id: string; name: string; class: string; gender: string; school: string; scores: ScoreRow[];
  excluded?: boolean; exclude_reason?: string | null;
  verification_status?: Verification; verified_by?: string | null; verified_at?: string | null;
  manual_scores?: Record<string, number> | null; verification_note?: string | null;
};
export type Key = Record<string, (string | undefined)[]>;
