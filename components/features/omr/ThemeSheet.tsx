"use client";
import { TESTS } from "@/lib/tamanna/tests";
import type { Marked, PageResult } from "@/lib/omr/reader";
import type { Key } from "@/lib/types";

export type SheetPage = 1 | 2;
export type ThemeSheetProps = { responses: PageResult; answerKey: Key; roll?: string; page: SheetPage; onChange?: (responses: PageResult) => void };
export const testsForPage = (page: SheetPage) => TESTS.filter((test) => page === 1 ? ["LA", "AR", "VR", "MR"].includes(test.code) : ["NA", "SA", "PA"].includes(test.code));
export const pendingOnPage = (responses: PageResult, page: SheetPage) => testsForPage(page).reduce((count, test) => count + Array.from({ length: test.questions }, (_, index) => responses[test.code]?.[index]).filter((answer) => answer === undefined || answer === "UNCERTAIN").length, 0);

const sectionNames: Record<string, string> = {
  LA: "भाषा अभिक्षमता",
  AR: "अमूर्त तर्क",
  VR: "मौखिक तर्क",
  MR: "यांत्रिक तर्क",
  NA: "संख्यात्मक अभिक्षमता",
  SA: "स्थानिक अभिक्षमता",
  PA: "प्रत्यक्षण अभिक्षमता",
};

export function ThemeSheet({ responses, answerKey, roll, page, onChange }: ThemeSheetProps) {
  const tests = testsForPage(page);
  return (
    <div className="theme-sheet mx-auto w-full max-w-[760px] border-4 border-brand-700 bg-white p-3 text-ink shadow-lg">
      <header className="border-b-2 border-brand-700 pb-3 text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-700">Tamanna · Uttar Pradesh</p>
        <h3 className="mt-1 text-lg font-extrabold sm:text-2xl">अभिक्षमता परीक्षण / Aptitude Test</h3>
        <p className="text-xs font-semibold">उत्तर पत्रक / Answer Sheet</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
          <p>अनुक्रमांक / Roll No.: {roll || "________________"}</p>
          <p className="ml-auto rounded border border-red-300 bg-red-100 px-2 py-1 text-red-900">M = Multi select</p>
        </div>
      </header>
      <div className="theme-columns mt-3 grid grid-cols-1 gap-2 @min-[360px]:grid-cols-2 @min-[760px]:grid-cols-4">
        {tests.map((test) => {
          const segments = test.code === "PA" ? [[1, 30], [31, 60]] as const : [[1, test.questions]] as const;
          return (
            <section key={test.code} className={`min-w-0 border-2 border-brand-600 ${test.code === "PA" ? "theme-perceptual @min-[360px]:col-span-2" : ""}`}>
              <header className="grid min-h-16 content-center gap-1 bg-brand-700 px-2 py-2 text-center text-white">
                <p className="break-words text-sm font-extrabold leading-tight">{test.code} · {test.name}</p>
                <p lang="hi" className="break-words text-xs font-semibold leading-tight">{sectionNames[test.code]}</p>
              </header>
              <div className={`grid ${segments.length > 1 ? "theme-segments grid-cols-1 @min-[360px]:grid-cols-2 @min-[360px]:divide-x divide-brand-200" : ""}`}>
                {segments.map(([start, end]) => (
                  <ol key={start} className="divide-y divide-brand-100">
                    {Array.from({ length: end - start + 1 }, (_, index) => {
                      const question = start + index;
                      const answer = responses[test.code]?.[question - 1];
                      const correctAnswer = answerKey[test.code]?.[question - 1];
                      const uncertain = answer === "UNCERTAIN" || answer === undefined;
                      const questionLabel = <>{question}.{answer === "MULTI" ? <span className="text-red-800">M</span> : uncertain ? <span className="text-amber-900">?</span> : answer === null ? <span className="text-slate-600">–</span> : ""}</>;
                      const setAnswer = (value: Marked) => onChange?.({ ...responses, [test.code]: Array.from({ length: test.questions }, (_, i) => i === question - 1 ? value : responses[test.code]?.[i] === undefined ? "UNCERTAIN" : responses[test.code][i]) });
                      return (
                        <li key={question} title={answer === "MULTI" ? "Multiple marks" : uncertain ? "Needs checking" : answer === null ? "No response" : undefined} className={`theme-row grid grid-cols-[1.5rem_1fr] items-center gap-1 px-1 py-1 text-[11px] ${uncertain ? "bg-amber-200 ring-1 ring-inset ring-amber-600" : answer === "MULTI" ? "bg-red-100 ring-1 ring-inset ring-red-300" : ""}`}>
                          {onChange ? <details className="relative" onKeyDown={(event) => {
                            if (event.key === "Escape" && event.currentTarget.open) {
                              event.preventDefault(); event.stopPropagation(); event.currentTarget.open = false;
                              event.currentTarget.querySelector("summary")?.focus();
                            }
                          }}>
                            <summary aria-label={`${test.code} question ${question}, ${uncertain ? "needs checking" : answer === null ? "no response" : answer === "MULTI" ? "multiple marks" : answer}, other responses`} className="flex min-h-6 cursor-pointer list-none items-center rounded font-bold underline decoration-dotted focus-visible:outline-2 focus-visible:outline-blue-700">{questionLabel}</summary>
                            <div className="absolute top-full left-0 z-20 min-w-40 rounded-lg border border-(--line) bg-white p-1 shadow-xl">
                              {([{ label: "No response", value: null }, { label: "Multiple marks", value: "MULTI" }, { label: "Needs checking", value: "UNCERTAIN" }] as const).map(({ label, value }) => <button key={label} type="button" aria-label={`${test.code} question ${question}: ${label}`} aria-pressed={value === answer} onClick={(event) => {
                                setAnswer(value);
                                const menu = event.currentTarget.closest("details");
                                if (menu) { menu.open = false; menu.querySelector("summary")?.focus(); }
                              }} className="block min-h-9 w-full rounded px-2 text-left text-xs font-semibold hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-700 disabled:opacity-50">{label}</button>)}
                            </div>
                          </details> : <span className="font-bold">{questionLabel}</span>}
                          <div role={onChange ? "group" : undefined} aria-label={onChange ? `${test.code} question ${question}` : undefined} className="flex justify-between gap-0.5">
                            {["A", "B", "C", "D"].map((option) => {
                              const selected = answer === option;
                              const correct = correctAnswer === option;
                              const correctSelection = selected && correct;
                              const incorrectSelection = selected && !!correctAnswer && !correct;
                              const responseWithoutKey = selected && !correctAnswer;
                              const label = `${test.code} question ${question}, ${option}${correctSelection ? ", correct student response" : incorrectSelection ? ", incorrect student response" : responseWithoutKey ? ", student response" : ""}${correct ? ", correct answer" : ""}`;
                              const bubbleClass = `theme-bubble grid shrink-0 place-items-center rounded-full border text-[9px] font-bold ${
                                    correctSelection
                                      ? "border-green-800 bg-green-700 text-white"
                                      : incorrectSelection
                                        ? "border-red-300 bg-red-100 text-red-900"
                                        : correct
                                          ? "border-green-600 bg-green-50 text-green-900"
                                          : responseWithoutKey
                                            ? "border-blue-800 bg-blue-700 text-white"
                                            : "border-slate-400 bg-white text-slate-600"
                                  }`;
                              return onChange ? <button key={option} type="button" aria-label={label} aria-pressed={selected} title={`Select ${option}`} onClick={() => setAnswer(option)} className={`${bubbleClass} h-6 w-6 cursor-pointer hover:ring-2 hover:ring-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-60`}>{option}</button> : <span key={option} aria-label={label} className={`${bubbleClass} h-5 w-5`}>{option}</span>;
                            })}
                            {onChange && <button type="button" aria-label={`${test.code} question ${question}: Multi select`} aria-pressed={answer === "MULTI"} title="Multi select" onClick={() => setAnswer("MULTI")} className={`grid h-6 w-6 shrink-0 place-items-center rounded border text-[10px] font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${answer === "MULTI" ? "border-red-800 bg-red-700 text-white" : "border-red-400 bg-white text-red-900 hover:bg-red-100"}`}>M</button>}
                          </div>
                          {onChange && <button type="button" aria-label={`${test.code} question ${question}: No response`} aria-pressed={answer === null} onClick={() => setAnswer(null)} className={`col-span-2 min-h-6 rounded border px-2 text-[10px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${answer === null ? "border-slate-700 bg-slate-200 text-slate-900" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}>No response</button>}
                        </li>
                      );
                    })}
                  </ol>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <footer className="mt-3 space-y-2 border-t border-brand-200 pt-2 text-center text-[10px] font-semibold">
        <p>हरा: सही उत्तर · हल्का लाल: गलत या एक से अधिक उत्तर · पीला: जाँच आवश्यक · हरा घेरा: उत्तर कुंजी / Green: correct · Light red: incorrect or multiple marks · Amber: needs checking · Green outline: answer key · Blue: response when no key is available</p>
        <p>एक से अधिक उत्तर पुस्तिका के नियमों के अनुसार नहीं गिने जाते / Multiple marks are not scored under the guide.</p>
        <p>भरा हुआ गोला चुना गया उत्तर दर्शाता है / A filled bubble shows the selected response</p>
      </footer>
    </div>
  );
}
