import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { OCCUPATIONS, SUBJECTS } from "@/lib/tamanna/booklet";
import { buildProfile } from "@/lib/tamanna/profile";
import { areasFor, bandLabel, descriptionFor, reportLabels, termLabel, type ReportLanguage } from "@/lib/tamanna/report-language";
import { TESTS } from "@/lib/tamanna/tests";
(globalThis as unknown as { React: typeof React }).React = React; // classic JSX runtime for this script only
async function main() {
  const { ReportPages } = await import("../components/report/ReportPages");
  const { SheetDisplay } = await import("../components/features/OMRSheetPreview");
  const sheet = renderToStaticMarkup(React.createElement(SheetDisplay, {
    pages: [], roll: "10001", responses: { LA: ["MULTI", "UNCERTAIN", "A", null] }, answerKey: { LA: ["B", "B", "A", "B"] }, onChange: () => {},
  }));
  assert.ok(sheet.includes("M = Multi select"));
  assert.match(sheet, /<section class="[^"]*@min-\[1200px\]:sticky[^"]*@min-\[1200px\]:top-20[^"]*"><h3 class="font-bold">Original upload/);
  assert.ok(sheet.includes('aria-label="LA question 1: Multi select" aria-pressed="true"'));
  assert.ok(sheet.includes('aria-label="LA question 4: No response" aria-pressed="true"'));
  assert.ok(sheet.includes('aria-label="LA question 2: No response" aria-pressed="false"'));
  assert.match(sheet, /title="No response"/);
  assert.equal((sheet.match(/>No response<\/button>/g) ?? []).length, 240);
  assert.equal((sheet.match(/<\/div><button[^>]*class="col-span-2[^"]*"[^>]*>No response<\/button><\/li>/g) ?? []).length, 120);
  const secondPage = renderToStaticMarkup(React.createElement(SheetDisplay, {
    pages: [], responses: Object.fromEntries(TESTS.filter((test) => ["LA", "AR", "VR", "MR"].includes(test.code)).map((test) => [test.code, Array.from({ length: test.questions }, () => null)])),
    answerKey: {}, onChange: () => {},
  }));
  assert.equal((secondPage.match(/>No response<\/button>/g) ?? []).length, 240);
  assert.ok(secondPage.includes('aria-label="PA question 60: No response" aria-pressed="false"'));
  const readonlySheet = renderToStaticMarkup(React.createElement(SheetDisplay, {
    pages: [], roll: "10001", responses: { LA: [null] }, answerKey: {},
  }));
  assert.ok(!readonlySheet.includes(">No response</button>"));
  assert.match(readonlySheet, /title="No response"/);
  assert.match(sheet, /title="Multiple marks" class="[^"]*bg-red-100/);
  assert.match(sheet, /title="Needs checking" class="[^"]*bg-amber-200[^"]*ring-amber-600/);
  assert.ok(!sheet.includes("Select circles"));
  assert.ok(!sheet.includes("Name:"));
  assert.ok(!sheet.includes("Name pending"));
  assert.ok(sheet.includes("PA question 60"));
  // 1. Worked example with High scores (Roll 101, Class IX, Female)
  const raw1 = { LA: 15, AR: 27, VR: 25, MR: 6, NA: 19, SA: 11, PA: 43 };
  const s1 = { id: "1", name: "Example Student", roll_number: "10001", class: "IX", gender: "Female", school: "Example School", block: "Example Block", district: "Example District", scores: Object.entries(raw1).map(([test_code, correct]) => ({ test_code, correct })) };
  const html1 = renderToStaticMarkup(React.createElement(ReportPages, { s: s1 }));
  const text1 = html1.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const pageCount = (html1.match(/class="report-page /g) || []).length;
  const titleCount = (text1.match(/Aptitude Test Report/g) || []).length;
  if (pageCount !== 3) throw new Error(`Expected three report pages, got ${pageCount}`);
  if (titleCount !== 1) throw new Error(`Expected one report title, got ${titleCount}`);
  if (text1.includes("Verified by")) throw new Error("Report should not include a verification stamp");
  if (!text1.includes("Appendices VI–VIII") || !text1.includes("Suggestions / Remarks")) throw new Error("Report source labels are missing");
  assert.match(text1, /Roll 10001 shows high aptitude in/);
  assert.ok(!html1.includes(s1.name));
  assert.ok(!text1.includes("Name pending"));
  assert.equal((text1.match(/Roll 10001 · Page/g) ?? []).length, 3);
  assert.match(text1, /Example Block/); assert.match(text1, /Example District/);
  console.log("pages:", pageCount, "| titles:", titleCount, "| verification stamp removed: true");
  for (const label of ["Sten Score 10 · High", "Sten Score 9 · High", "Sten Score 8 · High", "Sten Score 3 · Low", "Sten Score 5 · Average", "Sten Score 6 · Average"]) assert.ok(html1.includes(label), label);

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
  for (const language of ["hi", "en"] as ReportLanguage[]) {
    for (const student of [s1, s2, { ...s2, scores: [] }]) {
      const html = renderToStaticMarkup(React.createElement(ReportPages, { s: student, language }));
      assert.equal((html.match(/class="report-page /g) ?? []).length, 3);
      assert.ok(!html.includes(student.name));
      assert.ok(!html.includes("Name pending"));
      assert.ok(html.includes(reportLabels(language).title));
      assert.ok(html.includes(reportLabels(language).remarksSource));
      assert.ok(html.includes(bandLabel("Average", language)));
    }
    for (const test of TESTS) {
      assert.ok(areasFor(test.code, language));
      for (const band of ["Low", "Average", "High"] as const) assert.ok(descriptionFor(test.code, band, language));
      for (const subject of SUBJECTS[test.code]) assert.ok(termLabel(subject, language));
    }
    for (const occupation of OCCUPATIONS) assert.ok(termLabel(occupation.name, language));
  }
  const uncertain = { ...s1, scores: s1.scores.map((score) => ({ ...score, uncertain: 1 })) };
  assert.ok(buildProfile(uncertain).rows.every((r) => r.sten === null && !r.giveReccs));
  assert.ok(buildProfile({ ...s1, excluded: true }).rows.every((r) => r.sten === null && !r.giveReccs));
  for (const language of ["hi", "en"] as const) {
    const html = renderToStaticMarkup(React.createElement(ReportPages, { s: uncertain, language }));
    assert.ok(html.includes(reportLabels(language).noSten));
    assert.ok(!html.includes(reportLabels(language).occupations));
  }
  if (process.argv[2]) {
    const maximum = { ...s1, scores: TESTS.map((t) => ({ test_code: t.code, correct: t.questions })) };
    const nearHigh = { ...s1, scores: buildProfile(maximum).rows.map((row) => {
      assert.ok(row.highMin !== null);
      return { test_code: row.code, correct: row.highMin - 1 };
    }) };
    const fixtures = Object.fromEntries((["hi", "en"] as const).flatMap((language) => [
      [language, renderToStaticMarkup(React.createElement(ReportPages, { s: maximum, language }))],
      [`${language}-pending`, renderToStaticMarkup(React.createElement(ReportPages, { s: { ...s2, scores: [] }, language }))],
      [`${language}-mixed`, renderToStaticMarkup(React.createElement(ReportPages, { s: s1, language }))],
      [`${language}-average`, renderToStaticMarkup(React.createElement(ReportPages, { s: s2, language }))],
      [`${language}-near-high`, renderToStaticMarkup(React.createElement(ReportPages, { s: nearHigh, language }))],
    ]));
    await writeFile(process.argv[2], JSON.stringify(fixtures));
  }
  console.log("Report checks passed: three pages in both languages, no names, complete translations, booklet bands, and no interpretation of unscored, uncertain or excluded copies.");
  console.log("Themed sheet checks passed: direct M and No response controls, blank selection, read-only export, red MULTI rows, visible amber review rows, both PA columns, and no name fields.");
}
main();
