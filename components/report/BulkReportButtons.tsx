"use client";
import { useEffect, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/Toast";
import type { ReportLanguage } from "@/lib/tamanna/report-language";

export async function printBulkReports(language: ReportLanguage, cls: string, signal: AbortSignal, onProgress: (percent: number) => void = () => {}) {
  onProgress(0);
  const frame = document.createElement("iframe");
  frame.title = `Print all reports (${language === "hi" ? "Hindi" : "English"})`;
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:820px;height:1120px;border:0";
  const params = new URLSearchParams({ language });
  if (cls) params.set("class", cls);
  frame.src = `/admin/reports?${params}`;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let afterPrint: (() => void) | undefined;
  let onAbort: (() => void) | undefined;
  try {
    await new Promise<void>((resolve, reject) => {
      let finished = false;
      let loaded = false;
      const fail = (error: Error) => { finished = true; reject(error); };
      onAbort = () => fail(new DOMException("Printing cancelled.", "AbortError"));
      signal.addEventListener("abort", onAbort, { once: true });
      if (signal.aborted) { onAbort(); return; }
      timeout = setTimeout(() => fail(new Error("Could not load reports. Try again.")), 60000);
      frame.onerror = () => fail(new Error("Could not load reports. Try again."));
      frame.onload = async () => {
        if (loaded || finished) return;
        loaded = true;
        try {
          const doc = frame.contentDocument;
          const printWindow = frame.contentWindow;
          const reports = doc?.querySelector("[data-bulk-reports]");
          if (!doc || !printWindow || reports?.getAttribute("lang") !== language) throw new Error("Could not load reports. Check your session and try again.");
          if (!reports.querySelector(".report-page")) throw new Error("No reviewed reports to print.");
          onProgress(40);
          const images = Array.from(reports.querySelectorAll("img"));
          let completed = 0;
          const total = images.length + 1;
          const advance = () => { if (!finished && !signal.aborted) onProgress(40 + Math.floor(++completed / total * 55)); };
          await Promise.all([doc.fonts.ready.then(advance), ...images.map(async (image) => { await image.decode(); advance(); })]);
          if (finished || signal.aborted) return;
          clearTimeout(timeout);
          onProgress(100);
          afterPrint = () => { finished = true; resolve(); };
          printWindow.addEventListener("afterprint", afterPrint, { once: true });
          printWindow.focus();
          printWindow.print();
        } catch (error) {
          fail(error instanceof Error ? error : new Error("Could not prepare reports for printing."));
        }
      };
      document.body.appendChild(frame);
    });
  } finally {
    clearTimeout(timeout);
    if (onAbort) signal.removeEventListener("abort", onAbort);
    if (frame.contentWindow && afterPrint) frame.contentWindow.removeEventListener("afterprint", afterPrint);
    frame.onload = null;
    frame.onerror = null;
    frame.remove();
  }
}

export function BulkReportButtons({ cls }: { cls: string }) {
  const toast = useToast();
  const job = useRef<AbortController | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [printing, setPrinting] = useState<ReportLanguage | null>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => () => { job.current?.abort(); }, []);
  useEffect(() => {
    if (printing === null && trigger.current) {
      trigger.current.focus({ preventScroll: true });
      trigger.current = null;
    }
  }, [printing]);

  async function print(language: ReportLanguage, button: HTMLButtonElement) {
    if (job.current) return;
    trigger.current = button;
    const controller = new AbortController();
    job.current = controller;
    setProgress(0);
    setPrinting(language);
    try {
      await printBulkReports(language, cls, controller.signal, setProgress);
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error("Bulk report printing failed.", error);
        toast(error instanceof Error && /^(Could not|No )/.test(error.message) ? error.message : "Could not print reports. Try again.");
      }
    } finally {
      job.current = null;
      setPrinting(null);
    }
  }

  return <>
    <Button variant="soft" disabled={printing !== null} aria-busy={printing === "hi"} onClick={(event) => void print("hi", event.currentTarget)}><Printer size={18} /> All Reports (Hindi)</Button>
    <Button variant="soft" disabled={printing !== null} aria-busy={printing === "en"} onClick={(event) => void print("en", event.currentTarget)}><Printer size={18} /> All Reports (English)</Button>
    {printing && <Dialog compact title={`All reports (${printing === "hi" ? "Hindi" : "English"})`} onClose={() => job.current?.abort()}>
      <div role="status" aria-live="polite" className="flex items-center justify-between gap-3 text-sm font-semibold"><span>{progress === 100 ? "Ready to save as PDF" : "Processing reports"}</span><span>{progress}%</span></div>
      <progress aria-label="Report processing" value={progress} max={100} className="h-3 w-full accent-brand-700" />
      <Button variant="soft" onClick={() => job.current?.abort()}>Cancel</Button>
    </Dialog>}
  </>;
}
