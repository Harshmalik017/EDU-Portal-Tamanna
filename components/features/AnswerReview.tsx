import { Card } from "@/components/ui";
import { TESTS } from "@/lib/tamanna/tests";
import type { Key } from "@/lib/types";
import type { Marked, PageResult } from "@/lib/omr/reader";

function answerLabel(value: string | null | undefined) {
  if (value === "MULTI") return "Multiple marks";
  if (value === "UNCERTAIN" || value === undefined) return "Needs checking";
  return value ?? "Blank";
}

export function AnswerReview({ responses, answerKey, onChange }: { responses: PageResult; answerKey: Key; onChange?: (test: string, question: number, value: Marked) => void }) {
  return (
    <Card>
      <h2 className="mb-1 text-xl font-extrabold">{onChange ? "Check marked answers" : "Student responses and answer key"}</h2>
      <p className="mb-4 text-sm">Green: correct · Red: incorrect · Amber: needs checking · Multiple marks: not scored</p>
      <div className="space-y-3">
        {TESTS.map((test) => {
          const studentAnswers = responses[test.code] ?? [];
          const correctAnswers = answerKey[test.code] ?? [];
          const answered = studentAnswers.filter((answer) => answer !== null && answer !== undefined && answer !== "UNCERTAIN").length;
          const pending = Array.from({ length: test.questions }, (_, i) => studentAnswers[i]).filter((answer) => answer === undefined || answer === "UNCERTAIN").length;
          const wrong = studentAnswers.filter((answer, question) =>
            answer !== "UNCERTAIN" && answer !== "MULTI" && answer !== null && answer !== undefined && correctAnswers[question] && answer !== correctAnswers[question],
          ).length;

          return (
            <details key={test.code} className="clay-inset overflow-hidden" open={test.code === "LA"}>
              <summary className="cursor-pointer px-4 py-3 font-bold">
                {test.code} · {test.name} · {answered} responses · {wrong} incorrect{pending ? ` · ${pending} need checking` : ""}
              </summary>
              <div className="overflow-x-auto border-t border-(--line)">
                <table className="w-full min-w-[30rem] text-left text-sm">
                  <thead className="bg-brand-50 text-brand-800">
                    <tr>
                      <th scope="col" className="px-4 py-2">Question</th>
                      <th scope="col" className="px-4 py-2">Student response</th>
                      <th scope="col" className="px-4 py-2">Correct answer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: test.questions }, (_, question) => {
                      const response = studentAnswers[question];
                      const correct = correctAnswers[question];
                      const uncertain = response === undefined || response === "UNCERTAIN";
                      const isCorrect = !uncertain && !!response && response !== "MULTI" && !!correct && response === correct;
                      const isWrong = !uncertain && response !== "MULTI" && !!response && !!correct && response !== correct;
                      return (
                        <tr key={question} className="border-t border-(--line)">
                          <th scope="row" className="px-4 py-2 font-semibold">{question + 1}</th>
                          <td className={`px-4 py-2 font-bold ${uncertain ? "bg-amber-50 text-amber-900" : isCorrect ? "bg-green-50 text-green-800" : isWrong || response === "MULTI" ? "bg-red-50 text-red-800" : "text-ink/70"}`}>
                            {onChange ? <select aria-label={`${test.code} question ${question + 1}`} className="clay-inset min-h-11 px-2" value={response === undefined ? "UNCERTAIN" : response === null ? "BLANK" : response} onChange={(event) => onChange(test.code, question, event.target.value === "BLANK" ? null : event.target.value)}>
                              <option value="UNCERTAIN">Needs checking</option>
                              <option value="BLANK">Blank</option>
                              {["A", "B", "C", "D"].map((option) => <option key={option} value={option}>{option}</option>)}
                              <option value="MULTI">Multiple marks</option>
                            </select> : answerLabel(response)}{isCorrect ? " · Correct" : isWrong ? " · Incorrect" : response === "MULTI" ? " · Not scored" : ""}
                          </td>
                          <td className="px-4 py-2 font-semibold text-brand-800">{correct ?? "Not available"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          );
        })}
      </div>
    </Card>
  );
}
