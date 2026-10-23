"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { TESTS } from "@/lib/tamanna/tests";
import { Button, Card } from "@/components/ui";
import { useToast } from "@/components/Toast";
import type { Student } from "@/lib/types";

export type VerifyItem = Student & { imgs: string[] };

export function VerifyBatch({ items, email }: { items: VerifyItem[]; email: string }) {
  const router = useRouter();
  const toast = useToast();
  const [manual, setManual] = useState<Record<string, Record<string, string>>>({});
  const app = (s: Student, c: string) => s.scores.find((x) => x.test_code === c)?.correct ?? 0;

  async function compare(s: VerifyItem) {
    const m = manual[s.id] ?? {};
    if (TESTS.some((t) => (m[t.code] ?? "") === "")) return toast("Enter all 7 scores.");
    const diffs = TESTS.filter((t) => Number(m[t.code]) !== app(s, t.code)).map((t) => `${t.code}: app ${app(s, t.code)}, manual ${m[t.code]}`);
    const ok = diffs.length === 0;
    const { error } = await supabase.from("students").update({
      verification_status: ok ? "verified" : "mismatch", verified_by: email, verified_at: new Date().toISOString(),
      manual_scores: Object.fromEntries(TESTS.map((t) => [t.code, Number(m[t.code])])), verification_note: ok ? null : diffs.join("; "),
    }).eq("id", s.id);
    toast(error ? "Could not save." : ok ? `Roll ${s.name}: verified` : `Roll ${s.name}: mismatch recorded`);
    router.refresh();
  }

  return (
    <ul className="space-y-4">{items.map((s) => (
      <li key={s.id}><Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-extrabold">Roll {s.name} <span className="text-sm font-semibold text-ink/75">· Class {s.class} · {s.gender}</span></h2>
          <span className="flex gap-3 text-sm font-bold">{s.imgs.map((u, i) => <a key={u} href={u} target="_blank" rel="noreferrer" className="underline">Open side {i + 1}</a>)}</span></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{TESTS.map((t) => (
          <label key={t.code} className="clay-inset block p-2 text-xs font-semibold">{t.code} <span className="font-normal">(portal: {app(s, t.code)})</span>
            <input inputMode="numeric" min={0} max={t.questions} type="number" aria-label={`Hand score for ${t.code}`} value={manual[s.id]?.[t.code] ?? ""}
              onChange={(e) => setManual((p) => ({ ...p, [s.id]: { ...p[s.id], [t.code]: e.target.value } }))} className="mt-1 w-full rounded-lg bg-white/70 px-2 py-2 text-base" /></label>))}</div>
        <Button onClick={() => compare(s)}>Compare and save</Button>
      </Card></li>))}</ul>
  );
}
