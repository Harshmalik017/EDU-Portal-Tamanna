import { OPTIONS, TESTS } from "@/lib/tamanna/tests";
import { COPY_GRID, PART_BREAKS, DEFAULT_TEMPLATE, REF_WIDTH, REF_HEIGHT, type Column } from "@/lib/omr/template";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

if (typeof window !== "undefined") pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).toString();

export type Marked = string | null | "MULTI";
export type PageResult = Record<string, Marked[]>; // test code -> marked option per question (index 0 = Q1)
export type Quality = { ok: boolean; issues: string[] };
export type Inspection = { answers: PageResult; quality: Quality; overlay: string; crop: (test: string, q: number) => string | null };

async function normalizedPage(source: CanvasImageSource, name: string) {
  const canvas = document.createElement("canvas");
  canvas.width = REF_WIDTH;
  canvas.height = REF_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the answer-sheet page.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, REF_WIDTH, REF_HEIGHT);
  ctx.drawImage(source, 0, 0, REF_WIDTH, REF_HEIGHT);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!blob) throw new Error("Could not prepare the answer-sheet page.");
  return new File([blob], name, { type: "image/jpeg" });
}

export async function preparePage(file: File | Blob, page: 1 | 2) {
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
    return { pages, archive: file };
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

const bubbleXY = (c: Column, i: number, k: number) => {
  const y = c.y0 + i * c.pitch + Math.floor(i / c.breakEvery) * c.breakGap;
  return { x: c.xA + k * c.xStep + c.xSlope * (y - c.y0), y };
};

function bubbleStats(gray: Uint8ClampedArray, cx: number, cy: number, r = 4) {
  let total = 0, sum = 0, sumSquared = 0;
  for (let y = Math.round(cy - r); y <= cy + r; y++)
    for (let x = Math.round(cx - r); x <= cx + r; x++) {
      if (x < 0 || y < 0 || x >= REF_WIDTH || y >= REF_HEIGHT || (x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
      const value = gray[y * REF_WIDTH + x];
      sum += value;
      sumSquared += value * value;
      total++;
    }
  const mean = sum / Math.max(total, 1);
  return { mean, variance: sumSquared / Math.max(total, 1) - mean * mean };
}

export function isFilledBubble(mean: number, variance: number, baseline: number) {
  return mean < 175 && baseline - mean >= 20 && variance < 5000;
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
      const samples = OPTIONS.map((_, k) => { const p = bubbleXY(col, i, k); return bubbleStats(gray, p.x, p.y); });
      const background = [...samples].sort((a, b) => a.mean - b.mean)[2].mean;
      const filled = samples.map((sample, k) => (isFilledBubble(sample.mean, sample.variance, background) ? k : -1)).filter((k) => k >= 0);
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
export function validateKey(key: Record<string, (string | undefined)[]>): void {
  if (Object.keys(key).length !== TESTS.length || Object.keys(key).some((code) => !TESTS.some((test) => test.code === code))) throw new Error("Could not score. The official key needs all seven tests.");
  for (const { code, questions } of TESTS) {
    const answers = key[code];
    if (!answers || answers.length !== questions || Array.from({ length: questions }, (_, i) => answers[i]).some((answer) => !answer || !OPTIONS.some((option) => option === answer))) throw new Error(`Could not score. ${code} needs ${questions} valid official answers.`);
  }
}
export function score(marked: PageResult, key: Record<string, (string | undefined)[]>): Score[] {
  validateKey(key);
  if (Object.values(marked).some((answers) => answers.some((answer) => answer !== null && answer !== "MULTI" && !OPTIONS.some((option) => option === answer)))) throw new Error("Could not score. Review uncertain responses first.");
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

export type Bubble = { x: number; y: number; diameter: number };
export type CopyReading = { answers: PageResult; issues: string[]; rows: Bubble[][][] };

function readCopyAtThreshold(gray: Uint8ClampedArray, page: 1 | 2, threshold: number): CopyReading {
  if (gray.length !== REF_WIDTH * REF_HEIGHT) throw new Error("Could not read. Unexpected image dimensions.");
  const seen = new Uint8Array(gray.length), components: Bubble[] = [], stack: number[] = [];
  for (let start = COPY_GRID.minY * REF_WIDTH; start < COPY_GRID.maxY * REF_WIDTH; start++) {
    if (seen[start] || gray[start] > threshold) continue;
    stack.push(start); seen[start] = 1;
    let minX = REF_WIDTH, maxX = 0, minY = REF_HEIGHT, maxY = 0, count = 0;
    while (stack.length) {
      const i = stack.pop()!, x = i % REF_WIDTH, y = Math.floor(i / REF_WIDTH);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); count++;
      for (const n of [x > 0 ? i - 1 : -1, x < REF_WIDTH - 1 ? i + 1 : -1, i - REF_WIDTH, i + REF_WIDTH]) {
        if (n < 0 || n >= gray.length || seen[n] || gray[n] > threshold) continue;
        seen[n] = 1; stack.push(n);
      }
    }
    const w = maxX - minX + 1, h = maxY - minY + 1;
    if (w >= COPY_GRID.minDiameter && h >= COPY_GRID.minDiameter && w <= COPY_GRID.maxDiameter && h <= COPY_GRID.maxDiameter && w / h > 0.65 && w / h < 1.5 && count > 22) {
      components.push({ x: (minX + maxX) / 2, y: (minY + maxY) / 2, diameter: (w + h) / 2 });
    }
  }
  components.sort((a, b) => a.x - b.x);
  const quartets: Bubble[][] = [];
  for (const a of components) {
    for (const b of components.filter((p) => Math.abs(p.y - a.y) <= COPY_GRID.rowTolerance && p.x - a.x >= COPY_GRID.minStep && p.x - a.x <= COPY_GRID.maxStep)) {
      const step = b.x - a.x, slope = (b.y - a.y) / step;
      const find = (k: number) => components.find((p) => Math.abs(p.x - (a.x + k * step)) <= COPY_GRID.stepTolerance && Math.abs(p.y - (a.y + k * step * slope)) <= COPY_GRID.rowTolerance);
      const c = find(2), d = find(3);
      if (c && d) { quartets.push([a, b, c, d]); break; }
    }
  }
  const groups: Bubble[][][] = [];
  for (const row of quartets) {
    let group = groups.find((g) => Math.abs(g[Math.floor(g.length / 2)][0].x - row[0].x) < COPY_GRID.columnTolerance);
    if (!group) { group = []; groups.push(group); }
    if (!group.some((r) => Math.abs(r[0].y - row[0].y) < COPY_GRID.rowTolerance)) group.push(row);
  }
  for (const group of groups.filter((g) => g.length >= 20)) {
    const reference = [...group];
    const steps = reference.map((row) => (row[3].x - row[0].x) / 3).sort((a, b) => a - b);
    const step = steps[Math.floor(steps.length / 2)];
    for (const p of components) {
      if (group.some((row) => Math.abs(row[0].y - p.y) <= COPY_GRID.rowTolerance)) continue;
      const nearest = reference.reduce((a, b) => Math.abs(a[0].y - p.y) < Math.abs(b[0].y - p.y) ? a : b);
      for (let k = 0; k < 4; k++) {
        const xA = p.x - k * step;
        if (Math.abs(xA - nearest[0].x) > COPY_GRID.recoveryXTolerance) continue;
        const slope = (nearest[3].y - nearest[0].y) / 3, yA = p.y - k * slope;
        if (group.some((row) => Math.abs(row[0].y - yA) <= COPY_GRID.rowTolerance)) continue;
        const matched = Array.from({ length: 4 }, (_, j) => components.find((b) => Math.abs(b.x - (xA + j * step)) <= COPY_GRID.stepTolerance && Math.abs(b.y - (yA + j * slope)) <= COPY_GRID.rowTolerance));
        if (matched.filter(Boolean).length < 3) continue;
        group.push(matched.map((b, j) => b ?? { x: xA + j * step, y: yA + j * slope, diameter: nearest[j].diameter }));
        break;
      }
    }
  }
  const columns = groups.filter((g) => g.length >= COPY_GRID.rows).sort((a, b) => a[0][0].x - b[0][0].x);
  const issues: string[] = [], answers: PageResult = {}, selectedRows: Bubble[][][] = [];
  if (columns.length !== COPY_GRID.columns) return { answers, issues: [`Side ${page}: could not locate all four complete answer columns (${groups.map((g) => g.length).join(", ")} rows).`], rows: groups };
  for (const [index, column] of columns.entries()) {
    const sorted = column.sort((a, b) => a[0].y - b[0].y);
    const test = COPY_GRID.tests[page][index];
    // Practice rows and footer glyphs can also form quartets. Match the answer-row rhythm.
    const windows = Array.from({ length: sorted.length - COPY_GRID.rows + 1 }, (_, start) => {
      const rows = sorted.slice(start, start + COPY_GRID.rows);
      const gaps = rows.slice(1).map((row, i) => row[0].y - rows[i][0].y);
      const pitch = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
      const error = gaps.reduce((n, gap, i) => n + Math.abs(gap / pitch - (PART_BREAKS[test].includes(i + 1) ? COPY_GRID.partGapPitches : 1)), 0);
      return { rows, error };
    });
    const rows = windows.sort((a, b) => a.error - b.error)[0].rows;
    selectedRows.push(rows);
    const gaps = rows.slice(1).map((row, i) => row[0].y - rows[i][0].y);
    const pitch = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
    answers[test] ??= [];
    if (gaps.some((gap, i) => gap < pitch * 0.65 || gap > pitch * (PART_BREAKS[test].includes(i + 1) ? 2.7 : 1.5))) {
      issues.push(`Side ${page}: column ${index + 1} has irregular row spacing.`);
      answers[test].push(...Array<string>(COPY_GRID.rows).fill("UNCERTAIN"));
      continue;
    }
    for (const row of rows) {
      const density = row.map((b) => {
        const radius = b.diameter * 0.38;
        let dark = 0, count = 0;
        for (let y = Math.floor(b.y - radius); y <= b.y + radius; y++) for (let x = Math.floor(b.x - radius); x <= b.x + radius; x++) {
          if ((x - b.x) ** 2 + (y - b.y) ** 2 > radius ** 2) continue;
          count++; if (gray[y * REF_WIDTH + x] < 150) dark++;
        }
        return dark / count;
      });
      const filled = density.map((value, k) => value > 0.72 ? k : -1).filter((k) => k >= 0);
      const uncertain = density.some((d) => d > 0.55 && d <= 0.72);
      if (uncertain) issues.push(`${test} question ${answers[test].length + 1}: faint or uncertain mark.`);
      answers[test].push(uncertain ? "UNCERTAIN" : filled.length > 1 ? "MULTI" : filled.length ? OPTIONS[filled[0]] : null);
    }
  }
  return { answers, issues, rows: selectedRows };
}

export function readCopy(gray: Uint8ClampedArray, page: 1 | 2): CopyReading {
  const candidates = [150, 170, 190, 210, 230].map((threshold) => readCopyAtThreshold(gray, page, threshold));
  const complete = candidates.filter((c) => Object.values(c.answers).reduce((n, a) => n + a.length, 0) === 120 && !c.issues.some((issue) => issue.includes("irregular row spacing")));
  if (!complete.length) return candidates.sort((a, b) => Object.values(b.answers).flat().length - Object.values(a.answers).flat().length || a.issues.length - b.issues.length)[0];
  const best = complete.sort((a, b) => a.issues.length - b.issues.length)[0];
  for (const [test, answers] of Object.entries(best.answers)) answers.forEach((value, i) => {
    if (complete.some((candidate) => candidate.answers[test]?.[i] !== value)) {
      best.answers[test][i] = "UNCERTAIN"; best.issues.push(`${test} question ${i + 1}: reading changes with image threshold.`);
    }
  });
  return best;
}

export function rescanPages(pages: Uint8ClampedArray[]): { answers: PageResult; issues: string[] } {
  if (pages.length !== 2 || pages.some((pixels) => pixels.length !== REF_WIDTH * REF_HEIGHT)) throw new Error("Could not rescan: two complete reference-sized pages are required.");
  const answers: PageResult = {}, issues: string[] = [];
  for (const page of [1, 2] as const) {
    const reading = readCopy(pages[page - 1], page);
    const invalid = Object.values(reading.answers).flat().length !== 120;
    issues.push(...reading.issues);
    for (const test of new Set(COPY_GRID.tests[page])) {
      const count = TESTS.find((t) => t.code === test)?.questions;
      if (!count) throw new Error(`Could not rescan unknown section ${test}.`);
      answers[test] = Array.from({ length: count }, (_, i) => invalid ? "UNCERTAIN" : reading.answers[test]?.[i] ?? (i in (reading.answers[test] ?? []) ? null : "UNCERTAIN"));
    }
  }
  issues.push(...detectPatterns(answers));
  if (Object.values(answers).flat().includes("UNCERTAIN")) issues.push("Review Pending: check unreadable answers against both original pages.");
  return { answers, issues };
}

/** Booklet rule: exclude sheets with an obvious pattern (all one option, or two options alternating). Needs 10+ answers per test. */
export function detectPatterns(marked: PageResult): string[] {
  const out: string[] = [];
  for (const [test, list] of Object.entries(marked)) {
    const given = Array.from(list, (v) => (v && OPTIONS.some((option) => option === v) ? v : null)).filter(Boolean) as string[];
    if (given.length < 10) continue;
    const set = Array.from(new Set(given));
    if (set.length === 1) out.push(`${test}: every answer is ${set[0]}`);
    else if (set.length === 2 && given.every((v, i) => i === 0 || v !== given[i - 1])) out.push(`${test}: answers alternate between ${set[0]} and ${set[1]}`);
  }
  return out;
}
