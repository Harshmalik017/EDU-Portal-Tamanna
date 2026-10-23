import { createServer } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";

export default async function Page() {
  const sb = await createServer();
  const [{ data: subs }, { data: students }] = await Promise.all([
    sb.from("submissions").select("id, created_at, student_id").order("created_at", { ascending: false }).limit(50),
    sb.from("students").select("id, name, class"),
  ]);
  const byId = new Map((students ?? []).map((s: { id: string; name: string; class: string | null }) => [s.id, s]));
  const rows = (subs ?? []) as { id: string; created_at: string; student_id: string }[];
  return (
    <div className="space-y-5">
      <PageHeader title="Logs" description="Recent scan activity." />
      <Card>
        {rows.length === 0 ? <p className="text-sm">No activity yet.</p> : (
          <ul className="divide-y divide-(--line)">
            {rows.map((r) => {
              const s = byId.get(r.student_id);
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
                  <span className="font-semibold">{s?.name ?? "Unknown student"}</span>
                  <span className="text-ink/70">{s?.class ?? "—"}</span>
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
