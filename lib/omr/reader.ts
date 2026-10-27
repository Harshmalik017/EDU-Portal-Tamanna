import { OPTIONS } from "@/lib/tamanna/tests";
import { DEFAULT_TEMPLATE, HEADER_MASK_RATIO, REF_WIDTH, REF_HEIGHT, type Column } from "@/lib/omr/template";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { PDFDocument } from "pdf-lib";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).toString();

export type Marked = string | null | "MULTI";
export type PageResult = Record<string, Marked[]>; // test code -> marked option per question (index 0 = Q1)
export type Quality = { ok: boolean; issues: string[] };
export type Inspection = { answers: PageResult; quality: Quality; overlay: string; crop: (test: string, q: number) => string | null };

async function archivePdf(pages: [File, File]) {
  const document = await PDFDocument.create();
  document.setTitle("Redacted answer sheet");
  document.setSubject("Student answer sheet with identifying header masked");
  for (const file of pages) {
    const image = await document.embedJpg(await file.arrayBuffer());
    const page = document.addPage([612, 612 * REF_HEIGHT / REF_WIDTH]);
    page.drawImage(image, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
  }
  const bytes = await document.save();
  return new File([Uint8Array.from(bytes)], "redacted-answer-sheet.pdf", { type: "application/pdf" });
}

async function normalizedPage(source: CanvasImageSource, name: string) {
  const canvas = document.createElement("canvas");
  canvas.width = REF_WIDTH;
  canvas.height = REF_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the answer-sheet page.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, REF_WIDTH, REF_HEIGHT);
  ctx.drawImage(source, 0, 0, REF_WIDTH, REF_HEIGHT);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, REF_WIDTH, Math.ceil(REF_HEIGHT * HEADER_MASK_RATIO));
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!blob) throw new Error("Could not prepare the answer-sheet page.");
  return new File([blob], name, { type: "image/jpeg" });
}

export async function redactPage(file: File | Blob, page: 1 | 2) {
  const bitmap = await createImageBitmap(file);
  try {
    return await normalizedPage(bitmap, `answer-sheet-page-${page}.jpg`);
  } finally {
    bitmap.close();
  }
}

export async function renderPdfPages(file: File): Promise<{ pages: [File, File]; archive: File }> {
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    isEvalSupported: false,
  }).promise;
  try {
    if (pdf.numPages !== 2) throw new Error("Answer-sheet PDFs must contain exactly two pages.");
    const rendered: File[] = [];
    for (const number of [1, 2] as const) {
      const page = await pdf.getPage(number);
      const unitViewport = page.getViewport({ scale: 1 });
      const rotation = unitViewport.width > unitViewport.height ? (page.rotate + 90) % 360 : page.rotate;
      const orientedViewport = page.getViewport({ scale: 1, rotation });
      const viewport = page.getViewport({ scale: REF_WIDTH / orientedViewport.width, rotation });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Could not render the answer-sheet page.");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      rendered.push(await normalizedPage(canvas, `answer-sheet-page-${number}.jpg`));
      page.cleanup();
      canvas.width = 0;
      canvas.height = 0;
    }
    const pages: [File, File] = [rendered[0], rendered[1]];
    return { pages, archive: await archivePdf(pages) };
  } finally {
    await pdf.destroy();
  }
}

export async function load(file: File | Blob) {
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = REF_WIDTH; canvas.height = REF_HEIGHT;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  try {
    ctx.drawImage(bmp, 0, 0, REF_WIDTH, REF_HEIGHT);
  } finally {
    bmp.close();
  }
  const { data } = ctx.getImageData(0, 0, REF_WIDTH, REF_HEIGHT);
  const gray = new Uint8ClampedArray(REF_WIDTH * REF_HEIGHT);
  for (let i = 0; i < gray.length; i++) gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  return { gray, canvas, ctx };
}

/** Rough photo checks: brightness, contrast, sharpness. Thresholds are starting points; tune on real scans. */
export function checkQuality(gray: Uint8ClampedArray): Quality {
  let sum = 0, edge = 0;
  for (let i = 0; i < gray.length; i++) { sum += gray[i]; if (i % REF_WIDTH) edge += Math.abs(gray[i] - gray[i - 1]); }
  const mean = sum / gray.length, sharp = edge / gray.length;
  let varSum = 0;
  for (let i = 0; i < gray.length; i += 7) varSum += (gray[i] - mean) ** 2;
  const contrast = Math.sqrt(varSum / (gray.length / 7));
  const issues: string[] = [];
  if (mean < 90) issues.push("Too dark. Use better light.");
  if (mean > 240) issues.push("Overexposed. Avoid glare.");
  if (contrast < 25) issues.push("Low contrast. Fit the whole sheet in frame.");
  if (sharp < 2.5) issues.push("Blurry. Hold steady and retake.");
  return { ok: issues.length === 0, issues };
}

const bubbleXY = (c: Column, i: number, k: number) => ({
  x: c.xA + k * c.xStep,
  y: c.y0 + i * c.pitch + Math.floor(i / c.breakEvery) * c.breakGap,
});

function meanGray(gray: Uint8ClampedArray, cx: number, cy: number, r = 6) {
  let total = 0, sum = 0;
  for (let y = Math.round(cy - r); y <= cy + r; y++)
    for (let x = Math.round(cx - r); x <= cx + r; x++) {
      if (x < 0 || y < 0 || x >= REF_WIDTH || y >= REF_HEIGHT || (x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
      sum += gray[y * REF_WIDTH + x]; total++;
    }
  return sum / Math.max(total, 1);
}

/** Read one page and return answers, a quality report and a debug overlay image (data URL). */
export function drawGrid(ctx: CanvasRenderingContext2D, template: Column[], page: 1 | 2) {
  ctx.lineWidth = 1.5; ctx.strokeStyle = "#ef4444";
  for (const c of template.filter((x) => x.page === page))
    for (let i = 0; i < c.count; i++)
      for (let k = 0; k < 4; k++) { const p = bubbleXY(c, i, k); ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.stroke(); }
}

export async function inspectPage(file: File | Blob, page: 1 | 2, template: Column[] = DEFAULT_TEMPLATE): Promise<Inspection> {
  const { gray, canvas, ctx } = await load(file);
  const clean = document.createElement("canvas");
  clean.width = REF_WIDTH; clean.height = REF_HEIGHT;
  clean.getContext("2d")!.drawImage(canvas, 0, 0);
  const answers: PageResult = {};
  for (const col of template.filter((c) => c.page === page)) {
    answers[col.test] ??= [];
    for (let i = 0; i < col.count; i++) {
      const means = OPTIONS.map((_, k) => { const p = bubbleXY(col, i, k); return meanGray(gray, p.x, p.y); });
      const background = [...means].sort((a, b) => a - b)[2];
      const filled = means.map((m, k) => (background - m > Math.max(35, background * 0.18) ? k : -1)).filter((k) => k >= 0);
      const q = col.firstQ + i - 1;
      answers[col.test][q] = filled.length === 0 ? null : filled.length > 1 ? "MULTI" : OPTIONS[filled[0]];
      // overlay: green = read, red = double-marked, orange outline = blank
      OPTIONS.forEach((_, k) => {
        const p = bubbleXY(col, i, k);
        ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        const isFilled = filled.includes(k);
        ctx.lineWidth = 2;
        ctx.strokeStyle = isFilled ? (filled.length > 1 ? "#ef4444" : "#16a34a") : filled.length === 0 ? "#f59e0b" : "rgba(59,109,240,.5)";
        ctx.stroke();
      });
    }
  }
  const crop = (test: string, q: number) => {
    const c = template.find((x) => x.page === page && x.test === test && q >= x.firstQ - 1 && q < x.firstQ - 1 + x.count);
    if (!c) return null;
    const { x, y } = bubbleXY(c, q - (c.firstQ - 1), 0);
    const w = c.xStep * 3 + 90, h = 28, out = document.createElement("canvas");
    out.width = w * 3; out.height = h * 3;
    out.getContext("2d")!.drawImage(clean, x - 45, y - h / 2, w, h, 0, 0, w * 3, h * 3);
    return out.toDataURL("image/jpeg", 0.8);
  };
  return { answers, quality: checkQuality(gray), overlay: canvas.toDataURL("image/jpeg", 0.75), crop };
}

export type Score = { test: string; correct: number; wrong: number; blank: number; flagged: number };
export function score(marked: PageResult, key: Record<string, (string | undefined)[]>): Score[] {
  return Object.entries(marked).map(([test, answers]) => {
    const k = key[test] ?? [];
    let correct = 0, wrong = 0, blank = 0, flagged = 0;
    for (let i = 0; i < answers.length; i++) {
      const a = answers[i];
      if (a === "MULTI") flagged++; // booklet: items with more than one response are not scored
      else if (a === null || a === undefined) blank++;
      else if (a === k[i]) correct++;
      else wrong++;
    }
    return { test, correct, wrong, blank, flagged };
  });
}

/** Booklet rule: exclude sheets with an obvious pattern (all one option, or two options alternating). Needs 10+ answers per test. */
export function detectPatterns(marked: PageResult): string[] {
  const out: string[] = [];
  for (const [test, list] of Object.entries(marked)) {
    const given = Array.from(list, (v) => (v && v !== "MULTI" ? v : null)).filter(Boolean) as string[];
    if (given.length < 10) continue;
    const set = Array.from(new Set(given));
    if (set.length === 1) out.push(`${test}: every answer is ${set[0]}`);
    else if (set.length === 2 && given.every((v, i) => i === 0 || v !== given[i - 1])) out.push(`${test}: answers alternate between ${set[0]} and ${set[1]}`);
  }
  return out;
}
