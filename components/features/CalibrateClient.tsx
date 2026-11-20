"use client";
import { useEffect, useRef, useState } from "react";
import { Save, RotateCcw, Upload } from "lucide-react";
import { DEFAULT_TEMPLATE, REF_HEIGHT, REF_WIDTH, type Column } from "@/lib/omr/template";
import { supabase } from "@/lib/supabase/client";
import { drawGrid, load } from "@/lib/omr/reader";
import { Button, Card } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useUnsavedChanges } from "@/components/hooks/useUnsavedChanges";

const FIELDS: { k: keyof Column; label: string; min: number; max: number; step: number }[] = [
  { k: "xA", label: "Left edge (option A)", min: 0, max: REF_WIDTH, step: 0.5 },
  { k: "xStep", label: "Gap between options", min: 15, max: 40, step: 0.1 },
  { k: "xSlope", label: "Horizontal drift per vertical pixel", min: -0.05, max: 0.05, step: 0.001 },
  { k: "y0", label: "Top (question 1)", min: 0, max: REF_HEIGHT, step: 0.5 },
  { k: "pitch", label: "Gap between rows", min: 12, max: 30, step: 0.1 },
  { k: "breakGap", label: "Extra gap after each part", min: 0, max: 40, step: 0.1 },
];

export function CalibrateClient({ initial }: { initial: Column[] }) {
  const toast = useToast();
  const canvas = useRef<HTMLCanvasElement>(null);
  const base = useRef<HTMLCanvasElement | null>(null);
  const [tpl, setTpl] = useState<Column[]>(initial);
  const [savedTemplate, setSavedTemplate] = useState(initial);
  const [page, setPage] = useState<1 | 2>(1);
  const [idx, setIdx] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  useUnsavedChanges(JSON.stringify(tpl) !== JSON.stringify(savedTemplate));

  useEffect(() => {
    const c = canvas.current; if (!c || !base.current) return;
    const ctx = c.getContext("2d")!; ctx.drawImage(base.current, 0, 0); drawGrid(ctx, tpl, page);
  }, [tpl, page, ready]);

  async function pick(file?: File) {
    if (!file) return;
    setReading(true);
    try {
      const { canvas } = await load(file);
      base.current = canvas;
      setReady((value) => !value);
    } catch (error) {
      console.error("Could not prepare calibration sheet.", error);
      toast("Could not read the sample sheet.");
    } finally {
      setReading(false);
    }
  }
  const cols = tpl.map((c, i) => ({ c, i })).filter(({ c }) => c.page === page);
  const cur = tpl[idx]?.page === page ? tpl[idx] : cols[0]?.c;
  const curIdx = tpl.indexOf(cur);
  const upd = (k: keyof Column, v: number) => setTpl((t) => t.map((c, i) => (i === curIdx ? { ...c, [k]: v } : c)));
  async function save() {
    setBusy(true);
    try {
      const { error } = await supabase.from("settings").upsert({ key: "template", value: tpl });
      if (error) return toast(`Could not save. ${error.message}`);
      setSavedTemplate(tpl);
      toast("Calibration saved");
    } catch (error) {
      console.error("Could not save calibration.", error);
      toast("Could not save the calibration.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Sample sheet</h2>
            <p className="text-sm text-ink/80">Upload a flat scan and align the red circles with the bubbles.</p>
          </div>
          <label className="clay-btn-soft cursor-pointer !py-2">
            <Upload size={18} aria-hidden="true" /> Upload sheet
            <input type="file" accept="image/*" aria-label="Sample sheet" disabled={reading} onChange={(e) => void pick(e.target.files?.[0])} className="sr-only" />
          </label>
        </div>
        <canvas ref={canvas} width={REF_WIDTH} height={REF_HEIGHT} className="clay-inset w-full" />
      </Card>
      <Card className="space-y-4 self-start lg:sticky lg:top-20">
        <div className="flex gap-2">{([1, 2] as const).map((p) => <button key={p} type="button" onClick={() => { setPage(p); setIdx(tpl.findIndex((c) => c.page === p)); }} className={(page === p ? "clay-btn" : "clay-btn-soft") + " flex-1 !py-2"}>Page {20 + p}</button>)}</div>
        <div className="flex flex-wrap gap-2">{cols.map(({ c, i }) => <button key={i} type="button" onClick={() => setIdx(i)} className={(i === curIdx ? "clay-btn" : "clay-btn-soft") + " !px-3 !py-2 text-sm"}>{c.test}{c.firstQ > 1 ? ` ${c.firstQ}+` : ""}</button>)}</div>
        {cur && FIELDS.map((f) => (
          <label key={f.k} className="block text-sm font-semibold">{f.label}: {Number(cur[f.k]).toFixed(f.k === "xSlope" ? 3 : 1)}
            <input type="range" min={f.min} max={f.max} step={f.step} value={Number(cur[f.k])} onChange={(e) => upd(f.k, Number(e.target.value))} className="w-full" /></label>))}
        <div className="flex gap-3">
          <Button disabled={busy || reading} aria-busy={busy} onClick={() => void save()}><Save size={18} aria-hidden="true" /> {busy ? "Saving…" : "Save"}</Button>
          <Button variant="soft" onClick={() => setTpl(DEFAULT_TEMPLATE)}><RotateCcw size={18} aria-hidden="true" /> Reset</Button>
        </div>
      </Card>
    </div>
  );
}
