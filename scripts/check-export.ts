import assert from "node:assert/strict";
import { resultsCsv } from "@/lib/tamanna/export";
import type { Student } from "@/lib/types";

const student: Student = {
  id: "synthetic", name: "PRIVATE_STUDENT_NAME", roll_number: "10001", class: "X", gender: "Male",
  school: 'School "A"', scores: [{ test_code: "LA", correct: 12, uncertain: 1 }],
};
const csv = resultsCsv([student]);
assert.ok(!csv.includes(student.name));
const [header, row] = csv.split("\n");
assert.ok(!header.split(",").includes("Name"));
assert.equal(header.split(",").length, 36);
const cells = [...row.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map((match) => match[1].replace(/""/g, '"'));
assert.equal(cells.length, 36);
assert.deepEqual(cells.slice(0, 7), ["10001", "X", "Male", 'School "A"', "", "", "12"]);
assert.deepEqual(cells.slice(7, 10), ["1", "", ""]);
assert.equal(cells[34], "Review Pending");
assert.equal(resultsCsv([]).split("\n").length, 1);
console.log("Export checks passed: no names, 36 aligned columns, escaped quotes, and withheld uncertain Sten.");
