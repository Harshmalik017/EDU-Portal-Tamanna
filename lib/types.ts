import type { PageResult } from "@/lib/omr/reader";

export type ScoreRow = { test_code: string; correct: number; wrong?: number; blank?: number; flagged?: number };
export type Verification = "pending" | "verified" | "mismatch";
export type Student = {
  id: string; name: string; roll_number: string; class: string; gender: string; school: string; scores: ScoreRow[];
  block?: string; district?: string; review_issues?: string[];
  excluded?: boolean; exclude_reason?: string | null;
  verification_status?: Verification; verified_by?: string | null; verified_at?: string | null;
  manual_scores?: Record<string, number> | null; verification_note?: string | null;
};
export type Key = Record<string, (string | undefined)[]>;
export type StudentSheet = {
  originals: { label: string; url: string }[];
  pdfUrl: string | null;
  responses: PageResult;
  answerKey: Key;
  keyHash: string;
};
