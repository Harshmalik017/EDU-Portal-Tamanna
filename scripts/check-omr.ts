import assert from "node:assert/strict";
import { TESTS } from "@/lib/tamanna/tests";
import { isFilledBubble } from "@/lib/omr/reader";
import responses from "@/lib/demo/student-responses.json";
import type { PageResult } from "@/lib/omr/reader";

const demoResponses = responses as PageResult;
for (const test of TESTS) {
  assert.equal(demoResponses[test.code]?.length, test.questions, `${test.code} response count`);
}

assert.equal(isFilledBubble(82, 500, 220), true, "solid dark fill");
assert.equal(isFilledBubble(130, 9000, 220), false, "printed option letter");
assert.equal(isFilledBubble(230, 300, 220), false, "unmarked bubble");
assert.equal(isFilledBubble(198, 300, 220), false, "insufficient contrast");

console.log("OMR detector thresholds and demo response counts are valid.");
