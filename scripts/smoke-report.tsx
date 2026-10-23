import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
(globalThis as unknown as { React: typeof React }).React = React; // classic JSX runtime for this script only
async function main() {
  const { ReportPages } = await import("../components/report/ReportPages");
  // 1. Worked example with High scores (Roll 101, Class IX, Female)
  const raw1 = { LA: 15, AR: 27, VR: 25, MR: 6, NA: 19, SA: 11, PA: 43 };
  const s1 = { id: "1", name: "101", class: "IX", gender: "Female", school: "G.S.S.School, New Delhi", scores: Object.entries(raw1).map(([test_code, correct]) => ({ test_code, correct })) };
  const html1 = renderToStaticMarkup(React.createElement(ReportPages, { s: s1 }));
  const text1 = html1.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  console.log("High example:", text1.match(/Roll 101 shows high aptitude in[^.]*\./i)?.[0]);
  console.log("pages:", (html1.match(/class="report-page"/g) || []).length);
  console.log(["Sten 10 · High", "Sten 9 · High", "Sten 8 · High", "Sten 3 · Low", "Sten 5 · Average", "Sten 6 · Average"].map((x) => `${x}: ${text1.includes(x)}`).join(" | "));

  // 2. No-High example (Roll 102, Class X, Male — Sten 2, 3, 3, 5, 4, 4, 2)
  const raw2 = { LA: 6, AR: 8, VR: 10, MR: 11, NA: 10, SA: 9, PA: 15 };
  const s2 = { id: "2", name: "102", class: "X", gender: "Male", school: "As recorded on answer sheet", scores: Object.entries(raw2).map(([test_code, correct]) => ({ test_code, correct })) };
  const html2 = renderToStaticMarkup(React.createElement(ReportPages, { s: s2 }));
  const text2 = html2.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  console.log("No-High example:", text2.match(/Roll 102 has not scored high[^.]*\./i)?.[0]);
  console.log("No-High has no occupation reccs:", !text2.includes("Recommended occupations"));
}
main();
