"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Camera, Upload, Save, AlertTriangle, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { detectPatterns, inspectPage, preparePage, renderPdfPages, validateKey, type Inspection, type PageResult } from "@/lib/omr/reader";
import type { Column } from "@/lib/omr/template";
import type { Key } from "@/lib/types";
import { compress } from "@/lib/omr/image";
import { TESTS } from "@/lib/tamanna/tests";
import { Button, Card, Input, Select } from "@/components/ui";
import { SheetDisplay } from "@/components/features/OMRSheetPreview";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/Toast";

const EMPTY = { name: "", roll_number: "", class: "X", gender: "Male", school: "Pt. Deen Dayal Upadhyay Rajkiya Model Inter College, Jajaur", block: "Sidhauli", district: "Sitapur" };
const CameraCapture = dynamic(() => import("@/components/CameraCapture").then((m) => m.CameraCapture), { ssr: false });
const CLASSES = ["IX", "X"]; // Tamanna is for classes IX and X
type N = 1 | 2;

export function ScanClient({ initialKey, template }: { initialKey: Key; template: Column[] }) {
  const toast = useToast();
  const [files, setFiles] = useState<Partial<Record<N, File>>>({});
  const [previews, setPreviews] = useState<Partial<Record<N, string>>>({});
  const [pdfArchive, setPdfArchive] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [cam, setCam] = useState(false);
  const [info, setInfo] = useState(EMPTY);
  const [insp, setInsp] = useState<Partial<Record<N, Inspection>>>({});
  const [answers, setAnswers] = useState<PageResult | null>(null);
  const key = initialKey;
  const displayKey = key;
  const urls = useRef<Partial<Record<N, string>>>({});
  const archiveUrl = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exclude, setExclude] = useState(false);

  useEffect(() => () => {
    Object.values(urls.current).forEach((u) => u && URL.revokeObjectURL(u));
    if (archiveUrl.current) URL.revokeObjectURL(archiveUrl.current);
  }, []);
  const keyError = useMemo(() => { try { validateKey(key); return ""; } catch (error) { return error instanceof Error ? error.message : "Could not read the answer key."; } }, [key]);
  const patterns = useMemo(() => (answers ? detectPatterns(answers) : []), [answers]);
  const issues = ([1, 2] as N[]).flatMap((n) => (insp[n]?.quality.issues ?? []).map((i) => `Page ${n}: ${i}`));

  async function rollbackStudent(id: string, paths: string[]) {
    const { error: studentError } = await supabase.from("students").delete().eq("id", id);
    const { error: storageError } = paths.length ? await supabase.storage.from("sheets").remove(paths) : { error: null };
    return !!studentError || !!storageError;
  }

  function setPages(next: Partial<Record<N, File>>) {
    Object.values(urls.current).forEach((url) => url && URL.revokeObjectURL(url));
    if (archiveUrl.current) URL.revokeObjectURL(archiveUrl.current);
    archiveUrl.current = null;
    setPdfUrl(null);
    const nextUrls: Partial<Record<N, string>> = {};
    for (const n of [1, 2] as N[]) if (next[n]) nextUrls[n] = URL.createObjectURL(next[n]!);
    urls.current = nextUrls;
    setFiles(next);
    setPreviews(nextUrls);
    setPdfArchive(null);
    setReviewOpen(false);
    setExclude(false);
    setInsp({}); setAnswers(null);
  }

  async function loadPdf(file: File) {
    setBusy(true);
    setPages({});
    try {
      const { pages, archive } = await renderPdfPages(file);
      setPages({ 1: pages[0], 2: pages[1] });
      setPdfArchive(archive);
      archiveUrl.current = URL.createObjectURL(archive);
      setPdfUrl(archiveUrl.current);
      await readPages({ 1: pages[0], 2: pages[1] });
    } catch {
      toast("Could not read the PDF. Select a valid two-page answer sheet.");
    } finally {
      setBusy(false);
    }
  }

  function startCamera() {
    setPages({});
    setCam(true);
  }

  async function capturePages(captured: [File, File]) {
    setCam(false);
    setBusy(true);
    try {
      const [first, second] = await Promise.all([preparePage(captured[0], 1), preparePage(captured[1], 2)]);
      setPages({ 1: first, 2: second });
      await readPages({ 1: first, 2: second });
    } catch {
      toast("Could not prepare the scan. Capture both pages again.");
    } finally {
      setBusy(false);
    }
  }

  async function readPages(pages: Partial<Record<N, File>>) {
    if (!pages[1] || !pages[2]) throw new Error("Both answer-sheet pages are required.");
    const [a, b] = await Promise.all([inspectPage(pages[1], 1, template), inspectPage(pages[2], 2, template)]);
    const detected = { ...a.answers, ...b.answers };
    setInsp({ 1: a, 2: b });
    setAnswers(Object.fromEntries(TESTS.map((test) => [test.code, Array.from({ length: test.questions }, (_, i) => detected[test.code]?.[i] === undefined ? "UNCERTAIN" : detected[test.code][i])])));
    setReviewOpen(true);
    if (keyError) toast(keyError);
  }

  async function process() {
    if (!files[1] || !files[2]) return toast("Select a two-page PDF or scan both pages first.");
    setBusy(true);
    try {
      await readPages(files);
    } catch {
      toast("Could not read the answer sheet. Capture or upload it again.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!answers || !/^\d{5}$/.test(info.roll_number.trim())) return toast("Enter a five-digit roll number.");
    if (!info.name.trim()) return toast("Enter student name.");
    if (!info.class || !info.gender) return toast("Select class and gender.");
    setBusy(true);
    let studentId: string | null = null;
    const paths: string[] = [];
    try {
      const { data: dup, error: duplicateError } = await supabase.from("students").select("id").eq("roll_number", info.roll_number.trim()).eq("class", info.class).eq("school", info.school).limit(1);
      if (duplicateError) return toast("Could not check for a duplicate roll number.");
      if (dup?.length) return toast("Could not save. This roll number already exists.");
      const { data: st, error } = await supabase.from("students").insert({ ...info, name: info.name.trim(), roll_number: info.roll_number.trim(), excluded: exclude, exclude_reason: exclude ? patterns.join("; ") : null }).select("id").single();
      if (error || !st) return toast("Could not save. Try again.");
      studentId = st.id;
      for (const n of [1, 2] as N[]) {
        if (!files[n]) continue;
        const path = `${st.id}/side-${n}.jpg`;
        const image = await compress(files[n]!);
        paths.push(path);
        const { error: uploadError } = await supabase.storage.from("sheets").upload(path, image, { contentType: "image/jpeg" });
        if (uploadError) throw new Error("Could not save the scanned pages.", { cause: uploadError });
      }
      if (pdfArchive) {
        const path = `${st.id}/answer-sheet.pdf`;
        paths.push(path);
        const { error: pdfError } = await supabase.storage.from("sheets").upload(path, pdfArchive, { contentType: "application/pdf" });
        if (pdfError) throw new Error("Could not save the PDF record.", { cause: pdfError });
      }
      const { error: submissionError } = await supabase.from("submissions").insert({ student_id: st.id, responses: answers, image_paths: paths.filter((path) => !path.endsWith(".pdf")), pdf_path: paths.find((path) => path.endsWith(".pdf")) ?? null });
      if (submissionError) throw new Error("Could not save the responses.", { cause: submissionError });
      toast("Saved for review.");
      setPages({}); setInfo(EMPTY); setExclude(false);
    } catch (failure) {
      console.error("Could not save the scanned sheet.", failure);
      const cleanupFailed = studentId ? await rollbackStudent(studentId, paths) : false;
      const message = failure instanceof Error && failure.message.startsWith("Could not") ? failure.message : "Could not save the scanned sheet.";
      toast(`${message} ${cleanupFailed ? "Cleanup was incomplete." : "Nothing was kept."}`);
    } finally {
      setBusy(false);
    }
  }

  const studentFields = <div className="grid gap-3 sm:grid-cols-2">
    <Input label="Roll number" placeholder="e.g. 10001" value={info.roll_number} onChange={(e) => setInfo({ ...info, roll_number: e.target.value })} />
    <Input label="Student name" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} />
    <Select label="Class" options={CLASSES} value={info.class} onChange={(e) => setInfo({ ...info, class: e.target.value })} />
    <Select label="Gender" options={["Male", "Female", "Not specified"]} value={info.gender} onChange={(e) => setInfo({ ...info, gender: e.target.value })} />
    <Input label="School" value={info.school} onChange={(e) => setInfo({ ...info, school: e.target.value })} />
  </div>;
  return (
    <div className="space-y-6">
      {cam && <CameraCapture title="Scan answer sheet" onClose={() => setCam(false)} onCapture={(pages) => { void capturePages(pages); }} />}
      <Card className="space-y-4">
        <h2 className="text-lg font-bold">Student details</h2>
        {!reviewOpen && <fieldset disabled={busy} className="min-w-0">{studentFields}</fieldset>}
        <div className="clay-inset space-y-3 p-4" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (busy) return; const file = e.dataTransfer.files?.[0]; if (file) void loadPdf(file); }}>
          <div>
            <p className="font-bold">Answer sheet</p>
            <p className="text-sm">Upload one two-page PDF. The original is saved unchanged.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="clay-btn-soft cursor-pointer !py-2"><Upload size={18} /> Upload one PDF
              <input type="file" accept="application/pdf,.pdf" className="sr-only" disabled={busy} onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void loadPdf(file); }} /></label>
            <Button className="!py-2" variant="soft" onClick={startCamera} disabled={busy}><Camera size={18} /> Scan both pages</Button>
            {(files[1] || files[2]) && <button disabled={busy} className="clay-btn-soft !px-3 !py-2" aria-label="Remove scanned pages" onClick={() => setPages({})}><Trash2 size={18} /></button>}
          </div>
          {busy && !answers && <p className="text-sm font-semibold">Preparing answer sheet…</p>}
          {(previews[1] || previews[2]) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {([1, 2] as N[]).map((n) => previews[n] && <figure key={n} className="space-y-1">
                <figcaption className="text-sm font-semibold">Page {n}</figcaption>
                <img src={previews[n]} alt={`Original preview of page ${n}`} className="max-h-64 w-full rounded-lg object-contain" />
              </figure>)}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => answers ? setReviewOpen(true) : void process()} disabled={busy || (!files[1] || !files[2])}>{busy ? "Reading…" : answers ? "Review sheet" : "Check sheet"}</Button>
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

      {reviewOpen && answers && <Dialog wide busy={busy} title={`OMR sheet · ${info.name || "Name pending"} · ${info.roll_number}`} onClose={() => setReviewOpen(false)}>
        <fieldset disabled={busy} className="min-w-0 space-y-4">
          {studentFields}
          <SheetDisplay
            pages={([1, 2] as N[]).flatMap((n) => previews[n] ? [{ label: `Page ${n}`, url: previews[n]! }] : [])}
            pdfUrl={pdfUrl}
            responses={answers}
            answerKey={displayKey}
            roll={info.roll_number}
            onChange={setAnswers}
          />
          {patterns.length > 0 && <div className="clay-inset space-y-2 p-3 text-sm">
            <p className="font-bold text-amber-800">Repeated answer pattern</p>
            <ul className="list-disc pl-6">{patterns.map((pattern) => <li key={pattern}>{pattern}</li>)}</ul>
            <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={exclude} onChange={(e) => setExclude(e.target.checked)} /> Exclude this sheet</label>
          </div>}
        </fieldset>
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-(--line) bg-[#fbfdf4] py-3">
          <div className="ml-auto flex flex-wrap gap-2">
            <Button onClick={save} disabled={busy}><Save size={18} />{busy ? "Saving…" : "Add for review"}</Button>
          </div>
        </div>
      </Dialog>}
    </div>
  );
}
