import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
(globalThis as unknown as { React: typeof React }).React = React; // classic JSX runtime for this script only
async function main() {
  const { ReportPages } = await import("../components/report/ReportPages");
  const raw = { LA: 15, AR: 27, VR: 25, MR: 6, NA: 19, SA: 11, PA: 43 };
  const s = { id: "1", name: "101", class: "IX", gender: "Female", school: "G.S.S.School, New Delhi", scores: Object.entries(raw).map(([test_code, correct]) => ({ test_code, correct })) };
  const html = renderToStaticMarkup(React.createElement(ReportPages, { s }));
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  console.log(text.match(/Roll 101 shows high aptitude in[^.]*\./i)?.[0]);
  console.log("pages:", (html.match(/class="report-page"/g) || []).length);
  console.log(["Sten 10 · High", "Sten 9 · High", "Sten 8 · High", "Sten 3 · Low", "Sten 5 · Average", "Sten 6 · Average"].map((x) => `${x}: ${text.includes(x)}`).join(" | "));
}
main();
