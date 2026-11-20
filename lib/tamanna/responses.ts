import type { PageResult } from "@/lib/omr/reader";
import { OPTIONS, TESTS } from "@/lib/tamanna/tests";

export function responsesReady(responses: PageResult): boolean {
  return TESTS.every((test) => {
    const answers = responses[test.code];
    return answers?.length === test.questions && answers.every((value) =>
      value === null || value === "MULTI" || OPTIONS.some((option) => option === value),
    );
  });
}
