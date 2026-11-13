import { TESTS } from "@/lib/tamanna/tests";
import { normalizeClass } from "@/lib/tamanna/norms";
import type { ScoreRow, Student } from "@/lib/types";

export function stenClassIssue(cls?: string | null): string | null {
  if (normalizeClass(cls)) return null;
  const value = (cls ?? "").trim();
  return value ? `No STEN norms for Class ${value}.` : "Select class IX or X in Profile.";
}

export function sectionNotFilled(score: ScoreRow | undefined, code: string): boolean {
  const test = TESTS.find((item) => item.code === code);
  return !!score && !!test && score.blank === test.questions && (score.uncertain ?? 0) === 0;
}

export function reviewComplete(student: Pick<Student, "class" | "scores" | "excluded" | "report_ready" | "archived_at">): boolean {
  return normalizeClass(student.class) !== null && !student.archived_at && !student.excluded && student.report_ready !== false && TESTS.every((test) =>
    student.scores.some((score) => score.test_code === test.code && (score.uncertain ?? 0) === 0),
  );
}
