import { TESTS } from "@/lib/tamanna/tests";
import type { ScoreRow, Student } from "@/lib/types";

export function sectionNotFilled(score: ScoreRow | undefined, code: string): boolean {
  const test = TESTS.find((item) => item.code === code);
  return !!score && !!test && score.blank === test.questions && (score.uncertain ?? 0) === 0;
}

export function reviewComplete(student: Pick<Student, "scores" | "excluded" | "report_ready">): boolean {
  return !student.excluded && student.report_ready !== false && TESTS.every((test) =>
    student.scores.some((score) => score.test_code === test.code && (score.uncertain ?? 0) === 0),
  );
}
