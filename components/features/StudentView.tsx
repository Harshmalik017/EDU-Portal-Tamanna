"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Save, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { buildProfile } from "@/lib/tamanna/profile";
import type { Student as S } from "@/lib/types";
import { Badge, Button, Card, Input, Select } from "@/components/ui";
import { useToast } from "@/components/Toast";

const tone = { Low: "bg-amber-100 text-amber-900", Average: "bg-blue-100 text-blue-900", High: "bg-green-100 text-green-900" } as const;

export function StudentView({ initial, imgs }: { initial: S; imgs: string[] }) {
  const id = initial.id;
  const router = useRouter();
  const toast = useToast();
  const [s, setS] = useState<S>(initial);
  const p = buildProfile(s);

  async function save() {
    const { error } = await supabase.from("students").update({ name: s.name, class: s.class, gender: s.gender, school: s.school }).eq("id", id);
    toast(error ? "Could not save." : "Saved"); router.refresh();
  }
  async function recheck() {
    const { error } = await supabase.from("students").update({ verification_status: "pending", verification_note: null }).eq("id", id);
    if (!error) { setS({ ...s, verification_status: "pending", verification_note: null }); toast("Sent back for verification"); router.refresh(); }
  }
  async function del() {
    if (!confirm(`Delete ${s.name} and all their scores? This cannot be undone.`)) return;
    await supabase.storage.from("sheets").remove([`${id}/side-1.jpg`, `${id}/side-2.jpg`]);
    await supabase.from("students").delete().eq("id", id);
    toast("Deleted"); router.push("/admin/results"); router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-4">
        <h1 className="text-2xl font-extrabold">{s.name}</h1>
        {s.excluded && <p className="clay-inset p-3 text-sm font-semibold">Excluded: {s.exclude_reason || "answer pattern"}.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Name" value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} />
          <Select label="Class" options={["IX", "X"]} value={s.class ?? ""} onChange={(e) => setS({ ...s, class: e.target.value })} />
          <Select label="Gender" options={["Male", "Female", "Not specified"]} value={s.gender ?? ""} onChange={(e) => setS({ ...s, gender: e.target.value })} />
          <Input label="School" value={s.school ?? ""} onChange={(e) => setS({ ...s, school: e.target.value })} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={save}><Save size={18} /> Save changes</Button>
          <Link href={`/admin/students/${id}/report`} className="clay-btn-soft"><FileText size={18} /> Open report</Link>
          <Button variant="soft" onClick={del}><Trash2 size={18} /> Delete</Button>
        </div>
        <div className="clay-inset p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold">Verification <Badge tone={s.verification_status === "verified" ? "green" : s.verification_status === "mismatch" ? "red" : "amber"}>{s.verification_status === "verified" ? "Verified" : s.verification_status === "mismatch" ? "Mismatch" : "Pending"}</Badge></p>
          {s.verification_note && <p className="mt-1">{s.verification_note}</p>}
          {s.verification_status === "mismatch" && <Button variant="soft" className="mt-2 !py-2" onClick={recheck}>Send back for re-check</Button>}
        </div>
        {imgs.length > 0 && <div><h2 className="mb-2 font-extrabold">Original sheets</h2>{imgs.map((u) => <img key={u} src={u} alt="Scanned answer sheet" className="mb-3 w-full rounded-xl" />)}</div>}
      </Card>
      <Card>
        <h2 className="mb-1 text-xl font-extrabold">Scorecard</h2>
        <p className="mb-4 text-xs">{p.normLabel}</p>
        <ul className="space-y-2">{p.rows.map((r) => (
          <li key={r.code} className="clay-inset flex items-center justify-between gap-2 px-4 py-3">
            <span className="font-extrabold">{r.code} <span className="text-sm font-semibold">{r.name}</span></span>
            <span className="flex items-center gap-2 text-sm"><b>{r.raw ?? "–"}</b>/{r.max}
              {r.band && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${tone[r.band]}`}>Sten {r.sten} · {r.band}</span>}</span>
          </li>))}</ul>
      </Card>
    </div>
  );
}
