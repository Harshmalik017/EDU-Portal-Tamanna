import React from "react";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { TESTS } from "@/lib/tamanna/tests";
import { reviewComplete, sectionNotFilled } from "@/lib/tamanna/results";
import { reportLabels } from "@/lib/tamanna/report-language";
import type { Student } from "@/lib/types";

(globalThis as unknown as { React: typeof React }).React = React;

async function main() {
  const { ResultScore, ResultsTable } = await import("@/components/features/ResultsTable");
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const { ReportDialog } = await import("@/components/report/ReportDialog");
  const student: Student = {
    id: "synthetic", name: "Synthetic", roll_number: "99999", class: "X", gender: "Male", school: "Synthetic",
    scores: TESTS.map((test) => ({ test_code: test.code, correct: 0, blank: 0, uncertain: 0 })),
  };
  assert.ok(reviewComplete(student));
  assert.ok(reviewComplete({ ...student, report_ready: true }));
  for (const pending of [
    { ...student, scores: [] },
    { ...student, scores: student.scores.slice(1) },
    { ...student, scores: student.scores.map((score) => ({ ...score, uncertain: 1 })) },
    { ...student, excluded: true },
    { ...student, report_ready: false },
  ]) assert.equal(reviewComplete(pending), false);

  for (const test of TESTS) {
    const blank = { test_code: test.code, correct: 0, blank: test.questions, uncertain: 0 };
    assert.ok(sectionNotFilled(blank, test.code));
    const html = renderToStaticMarkup(<ResultScore r={{ ...student, scores: [blank] }} c={test.code} />);
    assert.ok(html.includes("Section not filled"));
    assert.ok(!html.includes("Section Score"));
    assert.ok(!html.includes("STEN SCORE"));
    assert.equal(sectionNotFilled({ ...blank, blank: test.questions - 1 }, test.code), false);
    assert.equal(sectionNotFilled({ ...blank, uncertain: 1 }, test.code), false);
  }
  assert.equal(sectionNotFilled(undefined, "LA"), false);
  assert.equal(sectionNotFilled({ test_code: "PA", correct: 0, blank: 30, uncertain: 0 }, "PA"), false);
  const zero = renderToStaticMarkup(<ResultScore r={student} c="LA" />);
  assert.ok(zero.includes("Section Score: <b>0</b>"));
  assert.ok(!zero.includes("Section not filled"));
  const missing = renderToStaticMarkup(<ResultScore r={{ ...student, scores: [] }} c="LA" />);
  assert.ok(!missing.includes("Section not filled"));
  const router = { bfcacheId: "synthetic", back() {}, forward() {}, refresh() {}, push() {}, replace() {}, prefetch() {} };
  const pending = { ...student, id: "pending", report_ready: false };
  const table = renderToStaticMarkup(<AppRouterContext.Provider value={router}><ResultsTable rows={[student, pending]} /></AppRouterContext.Provider>);
  assert.equal((table.match(/href="\/admin\/students\/synthetic\/report"/g) ?? []).length, 2);
  assert.ok(!table.includes('href="/admin/students/pending/report"'));
  const pendingOnly = renderToStaticMarkup(<AppRouterContext.Provider value={router}><ResultsTable rows={[pending]} /></AppRouterContext.Provider>);
  assert.ok(!pendingOnly.includes('href="/admin/reports"'));
  assert.ok(!pendingOnly.includes('href="/admin/students/pending/report"'));
  const pendingReport = renderToStaticMarkup(<AppRouterContext.Provider value={router}><ReportDialog student={pending} /></AppRouterContext.Provider>);
  assert.ok(!pendingReport.includes('class="report-page '));
  assert.ok(!pendingReport.includes(reportLabels("hi").print));
  const readyReport = renderToStaticMarkup(<AppRouterContext.Provider value={router}><ReportDialog student={student} /></AppRouterContext.Provider>);
  assert.equal((readyReport.match(/class="report-page /g) ?? []).length, 3);
  console.log("Results checks passed: all seven completely blank sections hide both scores, zero/partial/uncertain/missing sections stay distinct, PA uses all 60 answers, and report readiness rejects pending/missing/excluded/unscored copies.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
