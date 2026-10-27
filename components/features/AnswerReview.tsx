import { Card } from "@/components/ui";
import { TESTS } from "@/lib/tamanna/tests";
import type { Key } from "@/lib/types";
import type { PageResult } from "@/lib/omr/reader";

function answerLabel(value: string | null | undefined) {
  if (value === "MULTI") return "Multiple marks";
  return value ?? "Blank";
}

export function AnswerReview({ responses, answerKey }: { responses: PageResult; answerKey: Key }) {
  return (
    <Card>
      <h2 className="mb-1 text-xl font-extrabold">Student responses and answer key</h2>
      <p className="mb-4 text-sm">Green responses are correct. Light red responses are incorrect or have multiple marks. The correct answer is shown when an answer key is available.</p>
      <div className="space-y-3">
        {TESTS.map((test) => {
          const studentAnswers = responses[test.code] ?? [];
          const correctAnswers = answerKey[test.code] ?? [];
          const answered = studentAnswers.filter((answer) => answer !== null && answer !== undefined).length;
          const wrong = studentAnswers.filter((answer, question) =>
            answer === "MULTI" || (answer !== null && answer !== undefined && correctAnswers[question] && answer !== correctAnswers[question]),
          ).length;

          return (
            <details key={test.code} className="clay-inset overflow-hidden" open={test.code === "LA"}>
              <summary className="cursor-pointer px-4 py-3 font-bold">
                {test.code} · {test.name} · {answered} responses · {wrong} incorrect
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
                      const isCorrect = !!response && response !== "MULTI" && !!correct && response === correct;
                      const isWrong = response === "MULTI" || (!!response && !!correct && response !== correct);
                      return (
                        <tr key={question} className="border-t border-(--line)">
                          <th scope="row" className="px-4 py-2 font-semibold">{question + 1}</th>
                          <td className={`px-4 py-2 font-bold ${isCorrect ? "bg-green-50 text-green-800" : isWrong ? "bg-red-50 text-red-800" : "text-ink/70"}`}>
                            {answerLabel(response)}{isCorrect ? " · Correct" : isWrong ? " · Incorrect" : ""}
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
