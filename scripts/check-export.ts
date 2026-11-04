import assert from "node:assert/strict";
import { resultsCsv } from "@/lib/tamanna/export";
import type { Student } from "@/lib/types";
import { TESTS } from "@/lib/tamanna/tests";

const student: Student = {
  id: "synthetic", name: "PRIVATE_STUDENT_NAME", roll_number: "10001", class: "X", gender: "Male",
  school: 'School "A"', scores: [{ test_code: "LA", correct: 12, uncertain: 1 }],
};
const csv = resultsCsv([student]);
assert.ok(csv.includes(student.name));
const [header, row] = csv.split("\n");
assert.deepEqual(header.split(","), ["Roll no.", "Name", "School", ...TESTS.map((test) => test.code), "OMR sheet"]);
const cells = [...row.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map((match) => match[1].replace(/""/g, '"'));
assert.equal(cells.length, 11);
assert.deepEqual(cells.slice(0, 4), ["10001", "PRIVATE_STUDENT_NAME · Class X · Male", 'School "A"', "Section Score: 12; STEN SCORE: –"]);
assert.equal(cells[10], "Review Pending");
const blank = resultsCsv([{ ...student, scores: [{ test_code: "LA", correct: 0, blank: 30, uncertain: 0 }] }]);
assert.ok(blank.includes('"Section not filled"'));
const excluded = resultsCsv([{ ...student, excluded: true, scores: [{ test_code: "LA", correct: 30, uncertain: 0 }] }]);
assert.ok(excluded.includes('"Section Score: 30; STEN SCORE: –"'));
assert.ok(excluded.endsWith('"Excluded"'));
for (const removed of ["Block", "District", "blurry answers", "Excluded", "level"]) assert.ok(!header.includes(removed));
assert.equal(resultsCsv([]).split("\n").length, 1);
console.log("Export checks passed: 11 table-matching columns, profile pills in the Name cell, escaped quotes, blank sections, and withheld uncertain/excluded Sten.");
