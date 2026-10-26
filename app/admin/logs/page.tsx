import { FileText } from "lucide-react";
import { createServer } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";

const KEY_NOTES = [
  {
    title: "1. Student privacy (Roll number only)",
    text: "Student names are never asked for, stored, or printed. Every answer sheet and report is identified only by the student's roll number.",
  },
  {
    title: "2. NCERT Tamanna Guide is the only source",
    text: "All sub-test scores, Sten tables (Class IX: Appendix IV; Class X: Appendix V), performance levels (Low 1–3, Average 4–7, High 8–10), and descriptions come strictly from the NCERT Guide for Teachers and Parents (2019). No total marks, ranks, or outside predictions are used.",
  },
  {
    title: "3. When subject & career recommendations are given",
    text: "Recommendations are given for High scores (Sten 8–10), and for Average scores only when the score is close to the High score's lower bracket (Sten 7, or within 2 marks of High). No recommendations are given for other Average scores (Sten 4–6) or Low scores (Sten 1–3).",
  },
  {
    title: "4. Guidance when a student has no High scores",
    text: "Not scoring High on any sub-test does not mean a lack of ability. Following Section 5 (p. 11) of the guide, the report recommends self-exploration, school activities of interest, career-planning sessions, and referral to the school counsellor.",
  },
  {
    title: "5. Hand check every 10–20 sheets",
    text: "After checking a batch of 10–20 answer sheets, teachers must re-score them by hand with the official scoring key using Manual Check in Student Reports before sharing reports.",
  },
  {
    title: "6. Unscored & excluded sheets",
    text: "Questions with more than one marked option are not scored. Sheets with an obvious answer pattern (such as the same option marked throughout a sub-test) are flagged for exclusion.",
  },
  {
    title: "7. Scores are suggestive only",
    text: "There is no pass or fail in Tamanna. Aptitude scores are suggestive only, and schools or parents must not use them to choose subjects for a student.",
  },
];

export default async function Page() {
  const sb = await createServer();
  const [{ data: subs }, { data: students }] = await Promise.all([
    sb.from("submissions").select("id, created_at, student_id").order("created_at", { ascending: false }).limit(50),
    sb.from("students").select("id, name, class"),
  ]);
  const byId = new Map((students ?? []).map((s: { id: string; name: string; class: string | null }) => [s.id, s]));
  const rows = (subs ?? []) as { id: string; created_at: string; student_id: string }[];
  return (
    <div className="space-y-6">
      <PageHeader title="Logs & key notes" icon={FileText} />
      <Card title="Key notes about this portal">
        <ul className="grid gap-3 sm:grid-cols-2">
          {KEY_NOTES.map((n) => (
            <li key={n.title} className="clay-inset space-y-1 p-3.5 text-sm">
              <p className="font-bold text-brand-700">{n.title}</p>
              <p className="leading-relaxed text-ink/85">{n.text}</p>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Recent sheet activity">
        {rows.length === 0 ? <p className="text-sm">No activity yet.</p> : (
          <ul className="divide-y divide-(--line)">
            {rows.map((r) => {
              const s = byId.get(r.student_id);
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-semibold">{s?.name ? `Roll ${s.name}` : "Unknown roll no."}</span>
                  <span className="text-ink/70">{s?.class ? `Class ${s.class}` : "—"}</span>
                  <span className="text-ink/60">{new Date(r.created_at).toLocaleString()}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
