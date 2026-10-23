"use client";
import { useState } from "react";
import { Save } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { OPTIONS, TESTS } from "@/lib/tamanna/tests";
import { Button, Card } from "@/components/ui";
import { useToast } from "@/components/Toast";
import type { Key } from "@/lib/types";

export function KeyEditor({ initial }: { initial: Key }) {
  const toast = useToast();
  const [key, setKey] = useState<Key>(initial);
  const [tab, setTab] = useState(TESTS[0].code);

  const t = TESTS.find((x) => x.code === tab)!;
  const count = (c: string) => (key[c] ?? []).filter(Boolean).length;
  const set = (c: string, q: number, v?: string) => setKey((k) => { const a = [...(k![c] ?? [])]; a[q] = v; return { ...k, [c]: a }; });

  async function save() {
    const rows = (key![tab] ?? []).map((o, i) => (o ? { test_code: tab, question_no: i + 1, correct_option: o } : null)).filter(Boolean);
    const { error } = await supabase.from("answer_keys").upsert(rows as object[], { onConflict: "test_code,question_no" });
    toast(error ? "Could not save." : `Saved ${rows.length} answers for ${tab}`);
  }

  return (
    <Card>
      <h2 className="mb-3 text-lg font-bold">Select the correct option (A, B, C or D) for each question</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        {TESTS.map((x) => (
          <button key={x.code} onClick={() => setTab(x.code)} className={(tab === x.code ? "clay-btn" : "clay-btn-soft") + " !px-4 !py-2"}>
            {x.code} <span className="text-xs">{count(x.code)}/{x.questions}</span>
          </button>
        ))}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: t.questions }, (_, q) => (
          <li key={q} className="clay-inset flex items-center justify-between px-3 py-2">
            <span className="w-10 font-bold">Q{q + 1}</span>
            <span className="flex gap-1">
              {OPTIONS.map((o) => (
                <button
                  key={o}
                  aria-pressed={key[tab]?.[q] === o}
                  onClick={() => set(tab, q, key[tab]?.[q] === o ? undefined : o)}
                  className={(key[tab]?.[q] === o ? "clay-btn" : "clay-btn-soft") + " min-h-11 min-w-11 !rounded-xl !p-0"}
                >
                  {o}
                </button>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <Button className="mt-5" onClick={save}><Save size={18} /> Save answers for {tab}</Button>
    </Card>
  );
}
