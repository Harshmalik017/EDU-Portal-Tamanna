"use client";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui";
import { Download, X } from "lucide-react";
import { TESTS } from "@/lib/tamanna/tests";
import type { PageResult } from "@/lib/omr/reader";
import type { Key } from "@/lib/types";

type OriginalPage = { label: string; url: string };
type SheetPage = 1 | 2;

const sectionNames: Record<string, string> = {
  LA: "भाषा अभिक्षमता",
  AR: "अमूर्त तर्क",
  VR: "मौखिक तर्क",
  MR: "यांत्रिक तर्क",
  NA: "संख्यात्मक अभिक्षमता",
  SA: "स्थानिक अभिक्षमता",
  PA: "प्रत्यक्षण अभिक्षमता",
};

function ThemeSheet({ responses, answerKey, roll, name, page }: { responses: PageResult; answerKey: Key; roll?: string; name?: string; page: SheetPage }) {
  const tests = TESTS.filter((test) => page === 1 ? ["LA", "AR", "VR", "MR"].includes(test.code) : ["NA", "SA", "PA"].includes(test.code));
  return (
    <div className="mx-auto max-w-4xl border-4 border-brand-700 bg-white p-3 text-ink shadow-lg sm:p-5">
      <header className="border-b-2 border-brand-700 pb-3 text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-700">Tamanna · Uttar Pradesh</p>
        <h3 className="mt-1 text-lg font-extrabold sm:text-2xl">अभिक्षमता परीक्षण / Aptitude Test</h3>
        <p className="text-xs font-semibold">उत्तर पत्रक / Answer Sheet · पृष्ठ {page} / Page {page}</p>
        <p className="mt-2 text-left text-xs font-semibold">अनुक्रमांक / Roll No.: {roll || "________________"}</p>
        <p className="text-left text-xs font-semibold">Name: {name || "________________"}</p>
      </header>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tests.map((test) => {
          const segments = test.code === "PA" ? [[1, 30], [31, 60]] as const : [[1, test.questions]] as const;
          return (
            <section key={test.code} className={`min-w-0 overflow-hidden border-2 border-brand-600 ${test.code === "PA" ? "sm:col-span-2 lg:col-span-2" : ""}`}>
              <header className="grid min-h-16 content-center gap-1 bg-brand-700 px-2 py-2 text-center text-white">
                <p className="break-words text-sm font-extrabold leading-tight">{test.code} · {test.name}</p>
                <p lang="hi" className="break-words text-xs font-semibold leading-tight">{sectionNames[test.code]}</p>
              </header>
              <div className={`grid ${segments.length > 1 ? "grid-cols-2 divide-x divide-brand-200" : ""}`}>
                {segments.map(([start, end]) => (
                  <ol key={start} className="divide-y divide-brand-100">
                    {Array.from({ length: end - start + 1 }, (_, index) => {
                      const question = start + index;
                      const answer = responses[test.code]?.[question - 1];
                      const correctAnswer = answerKey[test.code]?.[question - 1];
                      return (
                        <li key={question} className="flex items-center justify-between gap-1 px-2 py-1 text-[11px]">
                          <span className="w-6 shrink-0 font-bold">{question}.</span>
                          <div className="flex gap-1.5">
                            {["A", "B", "C", "D"].map((option) => {
                              const selected = answer === option;
                              const correct = correctAnswer === option;
                              const correctSelection = selected && correct;
                              const incorrectSelection = selected && !!correctAnswer && !correct;
                              const responseWithoutKey = selected && !correctAnswer;
                              return (
                                <span
                                  key={option}
                                  aria-label={`${test.code} question ${question}, ${option}${correctSelection ? ", correct student response" : incorrectSelection ? ", incorrect student response" : responseWithoutKey ? ", student response" : ""}${correct ? ", correct answer" : ""}`}
                                  className={`grid h-5 w-5 place-items-center rounded-full border text-[9px] font-bold ${
                                    correctSelection
                                      ? "border-green-800 bg-green-700 text-white"
                                      : incorrectSelection
                                        ? "border-red-300 bg-red-100 text-red-900"
                                        : correct
                                          ? "border-green-600 bg-green-50 text-green-900"
                                          : responseWithoutKey
                                            ? "border-blue-800 bg-blue-700 text-white"
                                            : "border-slate-400 bg-white text-slate-600"
                                  }`}
                                >
                                  {option}
                                </span>
                              );
                            })}
                            {answer === "MULTI" && <span className="self-center rounded bg-red-100 px-1 text-[9px] font-extrabold text-red-800">MULTI</span>}
                            {(answer === "UNCERTAIN" || answer === undefined) && <span className="self-center rounded bg-amber-100 px-1 text-[9px] font-extrabold text-amber-900" aria-label="Needs checking">?</span>}
                          </div>
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
        <p>हरा: सही उत्तर · हल्का लाल: गलत उत्तर · हरा घेरा: उत्तर कुंजी · नीला: कुंजी उपलब्ध न होने पर विद्यार्थी का उत्तर / Green: correct · Light red: incorrect · Green outline: answer key · Blue: response when no key is available</p>
        <p>एक से अधिक उत्तर पुस्तिका के नियमों के अनुसार नहीं गिने जाते / Multiple marks are not scored under the guide.</p>
        <p>भरा हुआ गोला चुना गया उत्तर दर्शाता है / A filled bubble shows the selected response</p>
      </footer>
    </div>
  );
}

function PagePicker({ page, onChange, pdfUrl }: { page: SheetPage; onChange: (page: SheetPage) => void; pdfUrl?: string | null }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <div className="flex gap-2">
        {([1, 2] as const).map((number) => (
          <button key={number} type="button" onClick={() => onChange(number)} aria-pressed={page === number}
            className={`rounded-lg px-3 py-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${page === number ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-800 hover:bg-brand-100"}`}>
            Page {number}
          </button>
        ))}
      </div>
      {pdfUrl && <a href={pdfUrl} target="_blank" rel="noreferrer" className="clay-btn-soft w-fit"><Download size={17} /> Download Original Scanned</a>}
    </div>
  );
}

function OriginalSheet({ pages }: { pages: OriginalPage[] }) {
  if (!pages.length) return <p className="clay-inset p-4 text-sm">No uploaded or captured sheet is available for this student.</p>;
  return (
    <div className="space-y-3">
      <div className={`grid gap-3 ${pages.length > 1 ? "md:grid-cols-2" : "grid-cols-1"}`}>
        {pages.map((page) => (
          <figure key={page.url} className="min-w-0 rounded-xl border border-(--line) bg-white p-2">
            <figcaption className="mb-2 text-sm font-bold">{page.label}</figcaption>
            <img src={page.url} alt={`${page.label}, original scanned sheet`} className="max-h-[78dvh] w-full rounded-lg object-contain" />
          </figure>
        ))}
      </div>
    </div>
  );
}

export function SheetDisplay({ pages, pdfUrl, responses, answerKey, roll, name }: { pages: OriginalPage[]; pdfUrl?: string | null; responses: PageResult; answerKey: Key; roll?: string; name?: string }) {
  const [page, setPage] = useState<SheetPage>(1);
  return (
    <div className="space-y-3">
      <PagePicker page={page} onChange={setPage} pdfUrl={pdfUrl} />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className="min-w-0 space-y-2">
          <h3 className="font-bold">Original upload</h3>
          <OriginalSheet pages={pages.filter((item) => item.label === `Page ${page}`)} />
        </section>
        <section className="min-w-0 space-y-2">
          <h3 className="font-bold">Theme UI</h3>
          <ThemeSheet responses={responses} answerKey={answerKey} roll={roll} name={name} page={page} />
        </section>
      </div>
    </div>
  );
}

export function OMRSheetPreview({
  originalPages,
  originalPdfUrl,
  responses,
  answerKey,
  roll,
  name,
  variant,
}: {
  originalPages: OriginalPage[];
  originalPdfUrl?: string | null;
  responses: PageResult;
  answerKey: Key;
  roll?: string;
  name?: string;
  variant: "inline" | "button";
}) {
  const [open, setOpen] = useState(false);
  const [inlinePage, setInlinePage] = useState<SheetPage>(1);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
  }, [open]);

  if (variant === "inline") {
    return (
      <Card className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold">OMR sheet</h2>
        </div>
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="font-bold">Original uploaded / captured sheet</h3>
            <OriginalSheet pages={originalPages} />
          </section>
          <section className="space-y-3">
            <h3 className="font-bold">Tamanna theme UI sheet</h3>
            <PagePicker page={inlinePage} onChange={setInlinePage} pdfUrl={originalPdfUrl} />
            <ThemeSheet responses={responses} answerKey={answerKey} roll={roll} name={name} page={inlinePage} />
          </section>
        </div>
      </Card>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-900 transition hover:bg-violet-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700">
        OMR Sheet
      </button>
      {open && (
        <dialog ref={dialogRef} aria-labelledby="omr-preview-title" onClose={() => setOpen(false)} onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current?.close(); }}
          className="m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1rem)] max-w-7xl overflow-y-auto rounded-2xl border border-(--line) bg-[#fbfdf4] p-0 text-ink shadow-2xl backdrop:bg-[#25331a]/50">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-(--line) bg-[#fbfdf4] px-4 py-3 sm:px-6">
            <h2 id="omr-preview-title" className="text-lg font-extrabold">OMR sheet · {name || "Name pending"} · Roll {roll}</h2>
            <button type="button" aria-label="Close OMR sheet" onClick={() => dialogRef.current?.close()} className="rounded-lg p-2 hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-brand-700"><X size={20} /></button>
          </header>
          <div className="space-y-4 p-4 sm:p-6">
            <SheetDisplay pages={originalPages} pdfUrl={originalPdfUrl} responses={responses} answerKey={answerKey} roll={roll} name={name} />
          </div>
        </dialog>
      )}
    </>
  );
}
