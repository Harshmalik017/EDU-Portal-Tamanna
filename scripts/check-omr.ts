import assert from "node:assert/strict";
import { isFilledBubble } from "@/lib/omr/reader";

assert.equal(isFilledBubble(82, 500, 220), true, "solid dark fill");
assert.equal(isFilledBubble(130, 9000, 220), false, "printed option letter");
assert.equal(isFilledBubble(230, 300, 220), false, "unmarked bubble");
assert.equal(isFilledBubble(198, 300, 220), false, "insufficient contrast");

console.log("OMR detector thresholds are valid.");
