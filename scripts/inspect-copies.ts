import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";

Object.assign(globalThis, { DOMMatrix, ImageData, Path2D });

export async function openPdf(bytes: Uint8Array) {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  return getDocument({
    data: new Uint8Array(bytes), useSystemFonts: true, isEvalSupported: false,
  }).promise;
}

export async function inspectCopies(source: string, output: string) {
  await mkdir(output, { recursive: true });
  const isFile = (await stat(source)).isFile();
  const folder = isFile ? path.dirname(source) : source;
  const files = isFile ? [path.basename(source)] : (await readdir(source)).filter((f) => /\.pdf$/i.test(f)).sort();
  const rows = [];
  for (const [index, filename] of files.entries()) {
    const bytes = await readFile(path.join(folder, filename));
    const row: { file: string; sha256: string; pages?: { width: number; height: number; text: string }[]; error?: string } = {
      file: filename, sha256: createHash("sha256").update(bytes).digest("hex"),
    };
    try {
      const doc = await openPdf(bytes);
      try {
        row.pages = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          const view = page.getViewport({ scale: 1 });
          const text = (await page.getTextContent()).items.map((item) => "str" in item ? item.str : "").join(" ");
          row.pages.push({ width: view.width, height: view.height, text });
          if (index === 0 || process.env.RENDER_ALL === "1") {
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
            const context = canvas.getContext("2d");
            await page.render({
              canvasContext: context as unknown as CanvasRenderingContext2D,
              viewport, background: "rgb(255,255,255)",
            }).promise;
            await writeFile(path.join(output, `${index + 1}-page-${n}.png`), canvas.toBuffer("image/png"));
          }
          page.cleanup();
        }
      } finally { await doc.destroy(); }
    } catch (error) {
      row.error = error instanceof Error ? error.message : String(error);
    }
    rows.push(row);
  }
  await writeFile(path.join(output, "inspection.json"), JSON.stringify(rows, null, 2));
  const counts: Record<string, number> = {};
  for (const r of rows) {
    const key = r.error ? "failed" : String(r.pages?.length);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  console.log(JSON.stringify({ files: rows.length, pageCounts: counts, textPages: rows.flatMap((r) => r.pages ?? []).filter((p) => p.text.trim()).length }));
  if (rows.some((r) => r.error)) process.exitCode = 1;
}

if (process.argv[1]?.endsWith("inspect-copies.ts")) {
  const [source, output] = process.argv.slice(2);
  if (!source || !output) throw new Error("Usage: tsx scripts/inspect-copies.ts <PDF folder> <private output folder>");
  inspectCopies(path.resolve(source), path.resolve(output)).catch((error) => { console.error(error); process.exitCode = 1; });
}
