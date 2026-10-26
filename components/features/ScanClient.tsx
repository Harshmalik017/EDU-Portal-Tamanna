"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Camera, Upload, Save, AlertTriangle, CheckCircle2, RotateCw, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { detectPatterns, inspectPage, score, type Inspection, type Marked, type PageResult } from "@/lib/omr/reader";
import type { Column } from "@/lib/omr/template";
import type { Key } from "@/lib/types";
import { compress, rotate90 } from "@/lib/omr/image";
import { OPTIONS } from "@/lib/tamanna/tests";
import { isDemo } from "@/lib/supabase/env";
import { sampleAnswers } from "@/lib/demo/sample";
import { Button, Card, Input, Select } from "@/components/ui";
import { useToast } from "@/components/Toast";

const EMPTY = { name: "", class: "", gender: "", school: "" };
const CameraCapture = dynamic(() => import("@/components/CameraCapture").then((m) => m.CameraCapture), { ssr: false });
const CLASSES = ["IX", "X"]; // Tamanna is for classes IX and X
type N = 1 | 2;

export function ScanClient({ initialKey, template }: { initialKey: Key; template: Column[] }) {
  const toast = useToast();
  const [files, setFiles] = useState<Partial<Record<N, File>>>({});
  const [previews, setPreviews] = useState<Partial<Record<N, string>>>({});
  const [cam, setCam] = useState<N | null>(null);
  const [info, setInfo] = useState(EMPTY);
  const [insp, setInsp] = useState<Partial<Record<N, Inspection>>>({});
  const [answers, setAnswers] = useState<PageResult | null>(null);
  const key = initialKey;
  const urls = useRef<Partial<Record<N, string>>>({});
  const [showBlank, setShowBlank] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exclude, setExclude] = useState(false);

  useEffect(() => () => { Object.values(urls.current).forEach((u) => u && URL.revokeObjectURL(u)); }, []);
  const scores = useMemo(() => (answers ? score(answers, key) : []), [answers, key]);
  const patterns = useMemo(() => (answers ? detectPatterns(answers) : []), [answers]);
  const issues = ([1, 2] as N[]).flatMap((n) => (insp[n]?.quality.issues ?? []).map((i) => `Side ${n}: ${i}`));

  function setFile(n: N, f?: File) {
    if (urls.current[n]) URL.revokeObjectURL(urls.current[n]!);
    const u = f ? URL.createObjectURL(f) : undefined;
    urls.current[n] = u;
    setFiles((p) => ({ ...p, [n]: f }));
    setPreviews((p) => ({ ...p, [n]: u }));
    setInsp({}); setAnswers(null);
  }

  async function process() {
    if (!files[1] || !files[2]) return toast("Add both sides first.");
    setBusy(true);
    try {
      const [a, b] = await Promise.all([inspectPage(files[1], 1, template), inspectPage(files[2], 2, template)]);
      setInsp({ 1: a, 2: b }); setAnswers({ ...a.answers, ...b.answers });
      if (!Object.keys(key).length) toast("No answer key yet.");
    } catch { toast("Could not read the images. Retake them."); }
    setBusy(false);
  }

  const fix = (test: string, q: number, v: Marked) =>
    setAnswers((prev) => prev && { ...prev, [test]: prev[test].map((x, i) => (i === q ? v : x)) });

  async function save() {
    if (!answers || !info.name.trim()) return toast("Enter roll number.");
    if (!info.class || !info.gender) return toast("Select class and gender.");
    setBusy(true);
    const { data: dup } = await supabase.from("students").select("id").eq("name", info.name).eq("class", info.class).eq("school", info.school).limit(1);
    if (dup?.length && !confirm("This roll number already exists in this class and school. Save anyway?")) return setBusy(false);
    const { data: st, error } = await supabase.from("students").insert({ ...info, excluded: exclude, exclude_reason: exclude ? patterns.join("; ") : null }).select("id").single();
    if (error || !st) { setBusy(false); return toast("Could not save. Try again."); }
    const paths: string[] = [];
    for (const n of [1, 2] as N[]) {
      if (!files[n]) continue; // demo "sample answers" have no photos
      const path = `${st.id}/side-${n}.jpg`;
      const { error: e } = await supabase.storage.from("sheets").upload(path, await compress(files[n]!), { contentType: "image/jpeg" });
      if (!e) paths.push(path);
    }
    const [r1, r2] = await Promise.all([
      supabase.from("submissions").insert({ student_id: st.id, responses: answers, image_paths: paths }),
      supabase.from("scores").insert(scores.map((s) => ({ student_id: st.id, test_code: s.test, correct: s.correct, wrong: s.wrong, blank: s.blank, flagged: s.flagged }))),
    ]);
    if (r1.error || r2.error) {
      await supabase.from("students").delete().eq("id", st.id);
      if (paths.length) await supabase.storage.from("sheets").remove(paths);
      setBusy(false); return toast("Save failed. Nothing was kept.");
    }
    setBusy(false); toast("Saved.");
    setFile(1); setFile(2); setInfo(EMPTY); setExclude(false);
  }

  const review = answers ? Object.entries(answers).flatMap(([test, list]) =>
    Array.from(list, (v, q) => ({ test, q, v: (v ?? null) as Marked })).filter((r) => r.v === "MULTI" || (showBlank && r.v === null))) : [];

  const pageBox = (n: N, label: string) => (
    <div className="clay-inset p-4" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setFile(n, e.dataTransfer.files?.[0]); }}>
      <p className="mb-2 font-bold">{label}</p>
      {previews[n] ? (
        <div className="flex items-center gap-3">
          { }
          <img src={previews[n]} alt={`Preview ${label}`} className="h-24 rounded-lg" />
          <div className="flex flex-wrap gap-2">
            <button className="clay-btn-soft !px-3 !py-2" aria-label="Rotate" onClick={async () => setFile(n, await rotate90(files[n]!))}><RotateCw size={18} /></button>
            <button className="clay-btn-soft !px-3 !py-2" aria-label="Retake" onClick={() => setCam(n)}><Camera size={18} /></button>
            <button className="clay-btn-soft !px-3 !py-2" aria-label="Remove" onClick={() => setFile(n)}><Trash2 size={18} /></button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button className="!py-2" onClick={() => setCam(n)}><Camera size={18} /> Take photo</Button>
          <label className="clay-btn-soft cursor-pointer !py-2"><Upload size={18} /> Upload or drop
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => setFile(n, e.target.files?.[0])} /></label>
        </div>
      )}
    </div>
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      {cam && <CameraCapture title={`Side ${cam}`} onClose={() => setCam(null)} onCapture={(f) => { setFile(cam, f); setCam(null); }} />}
      <Card className="space-y-4">
        <h2 className="text-lg font-bold">Student details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Roll number" placeholder="e.g. 101" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} />
          <Select label="Class" options={CLASSES} value={info.class} onChange={(e) => setInfo({ ...info, class: e.target.value })} />
          <Select label="Gender" options={["Male", "Female", "Not specified"]} value={info.gender} onChange={(e) => setInfo({ ...info, gender: e.target.value })} />
          <Input label="School" value={info.school} onChange={(e) => setInfo({ ...info, school: e.target.value })} />
        </div>
        {pageBox(1, "Side 1 (LA, AR, VR, MR)")}
        {pageBox(2, "Side 2 (NA, SA, PA)")}
        <div className="flex flex-wrap gap-3">
          <Button onClick={process} disabled={busy}>{busy ? "Reading…" : "Check sheet"}</Button>
          {isDemo() && <Button variant="soft" className="animate-pulse" onClick={() => { setAnswers(sampleAnswers(key)); setInsp({}); setInfo((i) => (i.name ? i : { name: "125", class: "IX", gender: "Female", school: "Demo Public School" })); }}>Load sample sheet</Button>}
        </div>
        {issues.length > 0 && <ul className="space-y-1 text-sm font-semibold text-amber-800">{issues.map((i) => <li key={i} className="flex gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" />{i}</li>)}</ul>}
        {insp[1] && (
          <details className="clay-inset p-3" open>
            <summary className="cursor-pointer font-bold">Checked bubbles</summary>
            <p className="my-2 text-xs">Green: single mark · Red: multiple marks · Orange: blank</p>
            {([1, 2] as N[]).map((n) => insp[n] &&   <img key={n} src={insp[n]!.overlay} alt={`Checked side ${n}`} className="mb-3 w-full rounded-xl" />)}
          </details>
        )}
      </Card>

      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 text-xl font-extrabold">Marks counted</h2>
          {!scores.length ? <p>Marks appear here after you check a sheet.</p> : (
            <>
              <ul className="space-y-2">{scores.map((s) => (
                <li key={s.test} className="clay-inset flex items-center justify-between gap-2 px-4 py-3">
                  <span className="font-extrabold">{s.test}</span>
                  <span className="text-right text-sm">{s.correct} correct · {s.wrong} wrong · {s.blank} blank{s.flagged ? ` · ${s.flagged} multiple marks (not scored)` : ""}</span>
                </li>))}</ul>
              {patterns.length > 0 && (
                <div className="clay-inset mt-4 space-y-2 p-3 text-sm">
                  <p className="flex gap-2 font-bold text-amber-800"><AlertTriangle size={16} className="mt-0.5 shrink-0" />Repeated answer pattern found. The guide advises excluding this sheet.</p>
                  <ul className="list-disc pl-6">{patterns.map((p) => <li key={p}>{p}</li>)}</ul>
                  <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={exclude} onChange={(e) => setExclude(e.target.checked)} /> Exclude this sheet</label>
                </div>)}
              <Button className="mt-5 w-full" onClick={save} disabled={busy}><Save size={18} /> Save student report</Button>
            </>
          )}
        </Card>
        {answers && (
          <Card>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-xl font-extrabold">Questions needing attention</h2>
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={showBlank} onChange={(e) => setShowBlank(e.target.checked)} /> Show blanks</label>
            </div>
            {review.length === 0 ? <p className="flex items-center gap-2 text-sm"><CheckCircle2 size={18} className="text-green-700" /> All questions read clearly.</p> : (
              <ul className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">{review.map((r) => {
                const img = insp[1]?.crop(r.test, r.q) ?? insp[2]?.crop(r.test, r.q);
                return (
                  <li key={`${r.test}-${r.q}`} className="clay-inset space-y-2 p-3">
                    <div className="flex items-center justify-between"><span className="font-bold">{r.test} Q{r.q + 1}</span><span className="text-xs">Read: {r.v === "MULTI" ? "multiple marks" : "blank"}</span></div>
                    { }
                    {img && <img src={img} alt={`Row ${r.test} Q${r.q + 1}`} className="w-full rounded-lg" />}
                    <div className="flex gap-2">{[...OPTIONS, null].map((o) => (
                      <button key={o ?? "blank"} onClick={() => fix(r.test, r.q, o)} className="clay-btn-soft min-h-11 min-w-11 !rounded-xl !px-3 !py-2" aria-label={`Set ${r.test} Q${r.q + 1} to ${o ?? "blank"}`}>{o ?? "–"}</button>))}</div>
                  </li>);
              })}</ul>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
