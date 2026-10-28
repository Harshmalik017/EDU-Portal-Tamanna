import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import assert from "node:assert/strict";
(globalThis as unknown as { React: typeof React }).React = React; // classic JSX runtime for this script only
async function main() {
  const { ReportPages } = await import("../components/report/ReportPages");
  // 1. Worked example with High scores (Roll 101, Class IX, Female)
  const raw1 = { LA: 15, AR: 27, VR: 25, MR: 6, NA: 19, SA: 11, PA: 43 };
  const s1 = { id: "1", name: "Example Student", roll_number: "10001", class: "IX", gender: "Female", school: "Example School", block: "Example Block", district: "Example District", scores: Object.entries(raw1).map(([test_code, correct]) => ({ test_code, correct })) };
  const html1 = renderToStaticMarkup(React.createElement(ReportPages, { s: s1 }));
  const text1 = html1.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const pageCount = (html1.match(/class="report-page"/g) || []).length;
  const titleCount = (text1.match(/Aptitude Test Report/g) || []).length;
  if (pageCount !== 3) throw new Error(`Expected three report pages, got ${pageCount}`);
  if (titleCount !== 1) throw new Error(`Expected one report title, got ${titleCount}`);
  if (text1.includes("Verified by")) throw new Error("Report should not include a verification stamp");
  if (!text1.includes("Appendices VI–VIII") || !text1.includes("Suggestions / Remarks")) throw new Error("Report source labels are missing");
  assert.match(text1, /Roll 10001 shows high aptitude in/);
  assert.equal((text1.match(/Example Student · Roll 10001 · Page/g) ?? []).length, 3);
  assert.match(text1, /Example Block/); assert.match(text1, /Example District/);
  console.log("pages:", pageCount, "| titles:", titleCount, "| verification stamp removed: true");
  for (const label of ["Sten 10 · High", "Sten 9 · High", "Sten 8 · High", "Sten 3 · Low", "Sten 5 · Average", "Sten 6 · Average"]) assert.ok(html1.includes(label), label);

  // 2. No-High example (Roll 102, Class X, Male — Sten 2, 3, 3, 5, 4, 4, 2)
  const raw2 = { LA: 6, AR: 8, VR: 10, MR: 11, NA: 10, SA: 9, PA: 15 };
  const s2 = { id: "2", name: "Second Example", roll_number: "10002", class: "X", gender: "Male", school: "Example School", scores: Object.entries(raw2).map(([test_code, correct]) => ({ test_code, correct })) };
  const html2 = renderToStaticMarkup(React.createElement(ReportPages, { s: s2 }));
  const text2 = html2.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  assert.match(text2, /Roll 10002 has not scored high/);
  assert.ok(!text2.includes("Recommended occupations"));
  const pending = renderToStaticMarkup(React.createElement(ReportPages, { s: { ...s2, scores: [] } }));
  assert.match(pending, /scores are pending/);
  assert.ok(!pending.includes("has not scored high"));
  assert.ok(!pending.includes("Recommended occupations"));
  console.log("Report checks passed: three pages, separate names and rolls, booklet bands, no-High remarks, and no interpretation of unscored copies.");
}
main();
