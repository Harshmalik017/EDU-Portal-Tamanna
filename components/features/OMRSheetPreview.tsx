"use client";
import { useRef, useState } from "react";
import { Download } from "lucide-react";
import type { PageResult } from "@/lib/omr/reader";
import type { Key } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { pendingOnPage, ThemeSheet, type SheetPage, type ThemeSheetProps } from "@/components/features/omr/ThemeSheet";

type OriginalPage = { label: string; url: string };
function ThemePreview({ responses, answerKey, roll, page, onChange }: ThemeSheetProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const toast = useToast();
  async function exportPdf() {
    const source = exportRef.current;
    if (!source) return toast("Could not prepare the Theme UI PDF.");
    const popup = window.open("", "_blank", "width=840,height=980");
    if (!popup) return toast("Could not open PDF export. Allow pop-ups for this site.");
    popup.opener = null;
    setExporting(true);
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const doc = popup.document;
      doc.title = `Tamanna OMR ${roll ?? ""}`;
      const style = doc.createElement("style");
      style.textContent = "@page{size:A4 portrait;margin:8mm}html,body{width:194mm!important;margin:0!important;padding:0!important;background:white!important}body:before{display:none!important}.theme-sheet{width:194mm!important;max-width:none!important;margin:0!important;box-shadow:none!important;break-after:page;print-color-adjust:exact;-webkit-print-color-adjust:exact}.theme-sheet:last-child{break-after:auto}.theme-columns{grid-template-columns:repeat(4,minmax(0,1fr))!important}.theme-perceptual{grid-column:span 2/span 2!important}.theme-segments{grid-template-columns:repeat(2,minmax(0,1fr))!important}.theme-row{padding-top:2px!important;padding-bottom:2px!important;line-height:14px!important}.theme-bubble{width:16px!important;height:16px!important}.theme-sheet footer{font-size:9px!important;line-height:12px!important}";
      const styles = Array.from(document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>('link[rel="stylesheet"],style')).map((element) => {
        const clone = doc.importNode(element, true);
        const loaded = clone.tagName === "LINK" ? new Promise<void>((resolve, reject) => {
          clone.addEventListener("load", () => resolve(), { once: true });
          clone.addEventListener("error", () => reject(new Error("Could not load the PDF styles.")), { once: true });
        }) : Promise.resolve();
        doc.head.appendChild(clone);
        return loaded;
      });
      doc.head.appendChild(style);
      for (const child of Array.from(source.children)) doc.body.appendChild(doc.importNode(child, true));
      await Promise.race([
        Promise.all(styles).then(() => doc.fonts.ready),
        new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error("PDF styles took too long to load.")), 15000); }),
      ]);
      if (popup.closed) return;
      popup.addEventListener("afterprint", () => popup.close(), { once: true });
      popup.focus();
      popup.print();
    } catch (error) {
      if (!popup.closed) {
        popup.close();
        console.error("Could not export Theme UI PDF.", error);
        toast("Could not export the Theme UI PDF.");
      }
    } finally { clearTimeout(timeout); setExporting(false); }
  }
  return <div className="@container space-y-3">
    <button type="button" disabled={exporting} onClick={() => void exportPdf()} className="clay-btn-soft"><Download size={17} aria-hidden="true" />{exporting ? "Preparing…" : "Export PDF"}</button>
    <div role="region" aria-label={`Theme UI page ${page}`} className="rounded-lg">
      <ThemeSheet responses={responses} answerKey={answerKey} roll={roll} page={page} onChange={onChange} />
    </div>
    <div ref={exportRef} className="hidden" aria-hidden="true">
      <ThemeSheet responses={responses} answerKey={answerKey} roll={roll} page={1} />
      <ThemeSheet responses={responses} answerKey={answerKey} roll={roll} page={2} />
    </div>
  </div>;
}

function PagePicker({ page, onChange, pdfUrl, responses }: { page: SheetPage; onChange: (page: SheetPage) => void; pdfUrl?: string | null; responses?: PageResult }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <div className="flex gap-2">
        {([1, 2] as const).map((number) => (
          <button key={number} type="button" onClick={() => onChange(number)} aria-pressed={page === number}
            className={`rounded-lg px-3 py-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${page === number ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-800 hover:bg-brand-100"}`}>
            Page {number}
            {responses && pendingOnPage(responses, number) > 0 && <span className="block text-[10px]">{pendingOnPage(responses, number)} to review</span>}
          </button>
        ))}
      </div>
      {pdfUrl && <a href={pdfUrl} target="_blank" rel="noreferrer" className="clay-btn-soft w-fit"><Download size={17} aria-hidden="true" /> Download Original Scanned</a>}
    </div>
  );
}

function OriginalSheet({ pages }: { pages: OriginalPage[] }) {
  if (!pages.length) return <p className="clay-inset p-4 text-sm">No uploaded or captured sheet is available for this student.</p>;
  return (
    <div className="space-y-3">
      <div className={`grid gap-3 ${pages.length > 1 ? "md:grid-cols-2" : "grid-cols-1"}`}>
        {pages.map((page) => (
          <figure key={page.url} className="min-w-0 rounded-xl border border-(--line) bg-white p-2">
            <figcaption className="mb-2 text-sm font-bold">{page.label}</figcaption>
            <img src={page.url} alt={`${page.label}, original scanned sheet`} width={924} height={1300} loading="lazy" decoding="async" className="max-h-[78dvh] w-full rounded-lg object-contain" />
          </figure>
        ))}
      </div>
    </div>
  );
}

export function SheetDisplay({ pages, pdfUrl, responses, answerKey, roll, onChange }: { pages: OriginalPage[]; pdfUrl?: string | null; responses: PageResult; answerKey: Key; roll?: string; onChange?: (responses: PageResult) => void }) {
  const [page, setPage] = useState<SheetPage>(() => onChange && !pendingOnPage(responses, 1) && pendingOnPage(responses, 2) ? 2 : 1);
  return (
    <div className="@container space-y-3">
      <PagePicker page={page} onChange={setPage} pdfUrl={pdfUrl} responses={onChange ? responses : undefined} />
      <div className="grid items-start gap-4 @min-[1200px]:grid-cols-[minmax(0,1fr)_760px]">
        <section className="min-w-0 space-y-2 @min-[1200px]:sticky @min-[1200px]:top-20 @min-[1200px]:[&_img]:max-h-[calc(100dvh-14rem)]">
          <h3 className="font-bold">Original upload</h3>
          <OriginalSheet pages={pages.filter((item) => item.label === `Page ${page}`)} />
        </section>
        <section className="min-w-0 space-y-2">
          <h3 className="font-bold">Theme UI</h3>
          <ThemePreview responses={responses} answerKey={answerKey} roll={roll} page={page} onChange={onChange} />
        </section>
      </div>
    </div>
  );
}
