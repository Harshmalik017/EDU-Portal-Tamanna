import React from "react";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { TESTS } from "@/lib/tamanna/tests";
import { reviewComplete, sectionNotFilled } from "@/lib/tamanna/results";
import { reportLabels } from "@/lib/tamanna/report-language";
import type { Student } from "@/lib/types";
import { ActivityLogTable } from "@/components/features/ActivityLogTable";
import { activityDate, activityDetails, activityLabel, type ActivityLog } from "@/lib/tamanna/activity";

(globalThis as unknown as { React: typeof React }).React = React;

async function main() {
  const { default: nextConfig } = await import("../next.config");
  const { getPathMatch } = await import("next/dist/shared/lib/router/utils/path-match");
  const headerRules = await nextConfig.headers();
  for (const path of ["/", "/login", "/admin", "/admin/results", "/admin/reports", "/admin/students/synthetic/report", "/brand/logo.png"]) {
    const headers = new Map(headerRules.filter((rule) => getPathMatch(rule.source)(path)).flatMap((rule) => rule.headers.map(({ key, value }) => [key.toLowerCase(), value] as const)));
    assert.equal(headers.get("x-frame-options"), path === "/admin/reports" ? "SAMEORIGIN" : "DENY");
    assert.equal(headers.get("content-security-policy"), path === "/admin/reports" ? "frame-ancestors 'self'" : undefined);
    assert.equal(headers.get("x-content-type-options"), "nosniff");
  }
  const { ResultScore, ResultsTable } = await import("@/components/features/ResultsTable");
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const { ReportDialog } = await import("@/components/report/ReportDialog");
  const { StudentProfileDialog } = await import("@/components/features/StudentProfileDialog");
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
    { ...student, archived_at: new Date().toISOString() },
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
  const profile = renderToStaticMarkup(<AppRouterContext.Provider value={router}><StudentProfileDialog student={student} onClose={() => {}} /></AppRouterContext.Provider>);
  assert.match(profile, /<dt[^>]*>Roll number<\/dt><dd[^>]*>99999<\/dd>/);
  assert.doesNotMatch(profile, /<input\b[^>]*(?:id="roll-number"|value="99999")/);
  for (const id of ["student-name", "school", "block", "district"]) {
    const field = profile.match(new RegExp(`<input\\b[^>]*id="${id}"[^>]*>`))?.[0];
    assert.ok(field, `${id} remains available`);
    assert.doesNotMatch(field, /readonly|disabled/i);
  }
  assert.ok(profile.includes("Save changes"));
  const pending = { ...student, id: "pending", report_ready: false };
  const table = renderToStaticMarkup(<AppRouterContext.Provider value={router}><ResultsTable rows={[student, pending]} /></AppRouterContext.Provider>);
  for (const label of ["Hindi", "English"]) {
    assert.match(table, new RegExp(`<button[^>]*>[\\s\\S]*?All Reports \\(${label}\\)</button>`));
  }
  assert.ok(!table.includes('href="/admin/reports'));
  assert.ok(!table.includes("Print reviewed reports"));
  assert.equal((table.match(/href="\/admin\/students\/synthetic\/report"/g) ?? []).length, 2);
  assert.ok(!table.includes('href="/admin/students/pending/report"'));
  const pendingOnly = renderToStaticMarkup(<AppRouterContext.Provider value={router}><ResultsTable rows={[pending]} /></AppRouterContext.Provider>);
  assert.ok(!pendingOnly.includes('href="/admin/reports'));
  assert.ok(!pendingOnly.includes("All Reports ("));
  assert.ok(!pendingOnly.includes('href="/admin/students/pending/report"'));
  assert.ok(table.includes('aria-label="Select current page"'));
  assert.ok(table.includes('aria-label="Select roll 99999"'));
  assert.ok(table.includes("Select all 2 matching results"));
  const archived = renderToStaticMarkup(<AppRouterContext.Provider value={router}><ResultsTable archived rows={[{ ...student, archived_at: new Date().toISOString() }]} /></AppRouterContext.Provider>);
  assert.ok(archived.includes("Restore"));
  assert.ok(archived.includes("Delete after"));
  assert.ok(archived.includes("Clear archive"));
  assert.ok(archived.includes('href="/admin/archive"'));
  const expired = renderToStaticMarkup(<AppRouterContext.Provider value={router}><ResultsTable archived rows={[{ ...student, archived_at: "2020-01-01T00:00:00Z" }]} /></AppRouterContext.Provider>);
  assert.match(expired, /aria-label="Select roll 99999"[^>]*\/>/);
  assert.ok(!expired.match(/aria-label="Select roll 99999"[^>]*disabled/));
  assert.match(expired, /disabled=""[^>]*>[\s\S]*?Deletion pending/);
  const deleting = renderToStaticMarkup(<AppRouterContext.Provider value={router}><ResultsTable archived rows={[{ ...student, archived_at: new Date().toISOString(), deletion_pending: true }]} /></AppRouterContext.Provider>);
  assert.ok(deleting.includes("Deletion started"));
  assert.match(deleting, /disabled=""[^>]*>[\s\S]*?Deletion started/);
  for (const action of ["OMR Sheet", "Section Score", "Download CSV", "All Reports", 'href="/admin/students/synthetic/report"']) assert.ok(!archived.includes(action));
  const log: ActivityLog = {
    id: "synthetic-log", created_at: "2026-01-01T00:00:00Z", category: "students", action: "Student archived",
    actor_email: null, student_id: "synthetic", student_name: "Synthetic log student", student_gender: "Female", student_roll_number: "99999", detail: "Roll 99999",
  };
  const logs = renderToStaticMarkup(<ActivityLogTable rows={[log, { ...log, id: "unknown", student_name: null, student_gender: null }]} />);
  assert.match(logs, /<th[^>]*>Date and time<\/th><\/tr><\/thead>/);
  for (const label of ["Synthetic log student", "Female", "99999", "Student moved to Archive", "System", "Not recorded", "IST"]) assert.ok(logs.includes(label), label);
  assert.ok(!logs.includes("Import / system") && !logs.includes("Roll 99999"));
  for (const action of ["Student deleted", "Sheet uploaded", "Sheet removed", "Section scored", "Answer key insert", "Answer key update", "Setting delete"]) assert.notEqual(activityLabel(action), action);
  assert.equal(activityDetails("Roll 99999 · LA"), "Language Aptitude");
  assert.equal(activityDetails("PA question 60"), "Perceptual Aptitude · Question 60");
  assert.equal(activityDetails("Historical upload · Roll 99999"), "Earlier answer sheet upload");
  assert.equal(activityDetails("answer_key_hash"), "Answer key refreshed");
  assert.equal(activityDetails("template"), "Answer sheet layout");
  assert.match(activityDate(log.created_at), /01 Jan 2026.*5:30.*IST/);
  const accountLog = renderToStaticMarkup(<ActivityLogTable rows={[{ ...log, student_id: null, student_roll_number: null, student_name: null, student_gender: null }]} />);
  assert.ok(!accountLog.includes("Not recorded"));
  const pendingReport = renderToStaticMarkup(<AppRouterContext.Provider value={router}><ReportDialog student={pending} /></AppRouterContext.Provider>);
  assert.ok(!pendingReport.includes('class="report-page '));
  assert.ok(!pendingReport.includes(reportLabels("hi").print));
  const readyReport = renderToStaticMarkup(<AppRouterContext.Provider value={router}><ReportDialog student={student} /></AppRouterContext.Provider>);
  assert.equal((readyReport.match(/class="report-page /g) ?? []).length, 3);
  console.log("Results checks passed: all seven completely blank sections hide both scores, zero/partial/uncertain/missing sections stay distinct, PA uses all 60 answers, and report readiness rejects pending/missing/excluded/unscored copies.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
