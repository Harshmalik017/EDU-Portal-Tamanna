import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { createClient } from "@supabase/supabase-js";
import { openPdf } from "./inspect-copies";
import { detectPatterns, readCopy, score, validateKey, type PageResult } from "@/lib/omr/reader";
import { REF_HEIGHT, REF_WIDTH } from "@/lib/omr/template";
import type { Key } from "@/lib/types";
import { TESTS } from "@/lib/tamanna/tests";

export type CopyEntry = {
  file: string; hash: string; importHash: string; id: string; roll: string; name: string;
  class: "IX" | "X"; gender: "Male" | "Female" | "Not specified";
  genderSource?: "written" | "default";
  pages: number; answerPages: [number, number] | null; issues: string[]; readingIssues?: string[]; responses: PageResult;
  status: "prepared" | "uploaded" | "failed"; error?: string; uploadedId?: string;
};
type Manifest = { version: 1; source: string; entries: CopyEntry[] };
const sha = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const school = "Pt. Deen Dayal Upadhyay Rajkiya Model Inter College, Jajaur";

export function proposedName(filename: string) {
  return filename.replace(/_\d{6}_\d{6}\.pdf$/i, "").trim();
}

export function allocateRoll(existing: CopyEntry[], index: number) {
  const max = existing.reduce((n, e) => Math.max(n, Number(e.roll)), 10000);
  const roll = max + index + 1;
  if (roll > 99999) throw new Error("Could not allocate another five-digit roll number.");
  return String(roll);
}

async function saveManifest(file: string, value: Manifest) {
  await writeFile(`${file}.tmp`, JSON.stringify(value, null, 2), { mode: 0o600 });
  await rename(`${file}.tmp`, file);
}

async function loadManifest(file: string): Promise<Manifest | null> {
  try { return JSON.parse(await readFile(file, "utf8")) as Manifest; }
  catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}

export async function renderPdf(bytes: Uint8Array, output: string) {
  const relative = path.relative(process.cwd(), path.resolve(output));
  if (!relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Keep identifiable page images outside this Git repository.");
  await mkdir(output, { recursive: true });
  const doc = await openPdf(bytes);
  const gray: Uint8ClampedArray[] = [];
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const view = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: REF_WIDTH / view.width });
      const canvas = createCanvas(REF_WIDTH, REF_HEIGHT), ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, REF_WIDTH, REF_HEIGHT);
      ctx.save(); ctx.scale(1, REF_HEIGHT / viewport.height);
      await page.render({
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        viewport, background: "rgb(255,255,255)",
      }).promise;
      ctx.restore();
      const rgba = ctx.getImageData(0, 0, REF_WIDTH, REF_HEIGHT).data;
      const pixels = new Uint8ClampedArray(REF_WIDTH * REF_HEIGHT);
      for (let i = 0; i < pixels.length; i++) pixels[i] = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
      gray.push(pixels);
      await writeFile(path.join(output, `page-${n}.jpg`), canvas.toBuffer("image/jpeg", 90));
      page.cleanup();
    }
  } finally { await doc.destroy(); }
  return gray;
}

async function prepare(source: string, output: string) {
  const file = path.join(output, "manifest.json");
  const previous = await loadManifest(file);
  if (previous && previous.source !== source) throw new Error("Could not reuse this manifest with a different source folder.");
  const manifest: Manifest = previous ?? { version: 1, source, entries: [] };
  const names = (await readdir(source)).filter((f) => /\.pdf$/i.test(f)).sort();
  for (const filename of names) {
    const bytes = await readFile(path.join(source, filename)), hash = sha(bytes);
    let entry = manifest.entries.find((e) => e.file === filename);
    if (entry && entry.hash !== hash) throw new Error(`Could not continue: source changed for roll ${entry.roll}. Preserve its original PDF.`);
    if (entry?.status === "uploaded") continue;
    if (!entry) {
      entry = {
        file: filename, hash, importHash: sha(`${filename}\0${hash}`), id: randomUUID(),
        roll: allocateRoll(manifest.entries, 0), name: proposedName(filename), class: "X", gender: "Male", genderSource: "default",
        pages: 0, answerPages: null, issues: [], responses: {}, status: "prepared",
      };
      manifest.entries.push(entry);
      await saveManifest(file, manifest);
    }
    try {
      const pages = await renderPdf(bytes, path.join(output, entry.id));
      entry.pages = pages.length;
      entry.answerPages ??= pages.length === 2 ? [1, 2] : null;
      entry.issues = ["Name proposed from filename; compare with handwriting.", "Class X is the batch default; check it.", entry.genderSource === "written" ? "Gender transcribed from the written sheet." : "Male is the batch default; check written gender.", "Pending hand check."];
      entry.responses = {};
      entry.readingIssues = [];
      if (entry.answerPages) {
        if (new Set(entry.answerPages).size !== 2 || entry.answerPages.some((n) => !Number.isInteger(n) || !pages[n - 1])) throw new Error("Select two different existing answer pages.");
        const [front, back] = entry.answerPages;
        const a = readCopy(pages[front - 1], 1), b = readCopy(pages[back - 1], 2);
        entry.responses = { ...a.answers, ...b.answers };
        entry.readingIssues = [...a.issues, ...b.issues];
        entry.issues.push(...entry.readingIssues, ...detectPatterns(entry.responses));
        if (a.issues.length || b.issues.length) entry.issues.push("Machine readings need checking before scoring.");
      } else {
        entry.readingIssues.push("Select the two answer pages in the private manifest and prepare again.");
        entry.issues.push(...entry.readingIssues);
      }
      entry.status = "prepared"; delete entry.error;
    } catch (error) {
      entry.status = "failed"; entry.error = error instanceof Error ? error.message : String(error);
    }
    await saveManifest(file, manifest);
  }
  console.log(JSON.stringify({ files: manifest.entries.length, prepared: manifest.entries.filter((e) => e.status === "prepared").length, failed: manifest.entries.filter((e) => e.status === "failed").length, completeReadings: manifest.entries.filter((e) => completeResponses(e.responses)).length }));
  if (manifest.entries.some((e) => e.status === "failed")) process.exitCode = 1;
}

export function completeResponses(responses: PageResult): boolean {
  return Object.keys(responses).length === TESTS.length && TESTS.every(({ code, questions: count }) =>
    responses[code]?.length === count && Array.from({ length: count }, (_, i) => responses[code][i]).every((v) => v === null || v === "MULTI" || ["A", "B", "C", "D"].includes(v)));
}

function database() {
  process.loadEnvFile(".env.local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url !== "https://zhrlfkvmmrgwainsfyha.supabase.co") throw new Error("Could not import: the configured project does not match the school project.");
  if (!key) throw new Error("Could not import. Set SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function upload(output: string, reconcileOnly: boolean) {
  const file = path.join(output, "manifest.json"), manifest = await loadManifest(file);
  if (!manifest || manifest.version !== 1) throw new Error("Could not find a supported private manifest. Run prepare first.");
  const sb = database();
  const { error: schemaError } = await sb.from("students").select("id,roll_number,import_hash").limit(1);
  if (schemaError) throw new Error(`Could not read the student tables. Run supabase/schema.sql first: ${schemaError.message}`);
  if (new Set(manifest.entries.map((entry) => entry.id)).size !== manifest.entries.length ||
    new Set(manifest.entries.map((entry) => entry.roll)).size !== manifest.entries.length) throw new Error("Could not import: duplicate identities in the private manifest.");
  const results: { roll: string; status: "uploaded" | "failed"; needsChecking?: boolean; error?: string }[] = [];
  for (let start = 0; start < manifest.entries.length; start += 4) {
    await Promise.all(manifest.entries.slice(start, start + 4).map(async (entry) => {
    try {
      if (!/^\d{5}$/.test(entry.roll)) throw new Error("Roll number must contain five digits.");
      const bytes = await readFile(path.join(manifest.source, entry.file));
      if (sha(bytes) !== entry.hash) throw new Error("Source PDF changed.");
      const { data: existing, error } = await sb.from("students").select("id,roll_number").eq("import_hash", entry.importHash).maybeSingle();
      if (error) throw error;
      const id = existing?.id ?? entry.id;
      if (existing && existing.roll_number !== entry.roll) throw new Error("Database roll differs from the private manifest.");
      if (!existing && reconcileOnly) throw new Error("No saved student record.");
      if (!existing) {
        const { data: collision, error: collisionError } = await sb.from("students").select("id").eq("school", school).eq("class", entry.class).eq("roll_number", entry.roll).maybeSingle();
        if (collisionError) throw collisionError;
        if (collision) throw new Error("Roll number belongs to another record. Resolve the collision before continuing.");
        const images = [];
        for (let n = 1; n <= entry.pages; n++) {
          const imagePath = `${id}/page-${n}.jpg`, image = await readFile(path.join(output, entry.id, `page-${n}.jpg`));
          const { error } = await sb.storage.from("sheets").upload(imagePath, image, { contentType: "image/jpeg", upsert: true });
          if (error) throw error;
          images.push(imagePath);
        }
        const pdfPath = `${id}/original.pdf`;
        const { error: pdfError } = await sb.storage.from("sheets").upload(pdfPath, bytes, { contentType: "application/pdf", upsert: true });
        if (pdfError) throw pdfError;
        const { data: saved, error: importError } = await sb.rpc("import_copy", {
          p_student: { id, name: entry.name, roll_number: entry.roll, class: entry.class, gender: entry.gender, school, block: "Sidhauli", district: "Sitapur", import_hash: entry.importHash, source_file: entry.file, review_issues: entry.issues },
          p_submission: { responses: entry.responses, image_paths: images, pdf_path: pdfPath, source_sha256: entry.hash },
        });
        if (importError) throw importError;
        if (saved !== id) throw new Error("Concurrent import used a different identity. Reconcile before continuing.");
      }
      const { data: sub, error: subError } = await sb.from("submissions").select("pdf_path,source_sha256,image_paths,responses").eq("student_id", id).single();
      if (subError) throw subError;
      if (sub.source_sha256 !== entry.hash || !sub.pdf_path || sub.image_paths?.length !== entry.pages) throw new Error("Stored submission does not match the manifest.");
      const { data: stored, error: downloadError } = await sb.storage.from("sheets").download(sub.pdf_path);
      if (downloadError) throw downloadError;
      if (sha(new Uint8Array(await stored.arrayBuffer())) !== entry.hash) throw new Error("Uploaded PDF checksum differs from the original.");
      for (const imagePath of sub.image_paths) {
        const { data: image, error: imageError } = await sb.storage.from("sheets").download(imagePath);
        if (imageError) throw imageError;
        const local = await readFile(path.join(output, entry.id, path.basename(imagePath)));
        if (sha(new Uint8Array(await image.arrayBuffer())) !== sha(local)) throw new Error("Stored page image differs from the prepared image.");
      }
      entry.status = "uploaded"; entry.uploadedId = id; delete entry.error;
      results.push({ roll: entry.roll, status: "uploaded", needsChecking: true });
    } catch (error) {
      entry.status = "failed"; entry.error = error instanceof Error ? error.message : JSON.stringify(error);
      results.push({ roll: entry.roll, status: "failed", error: entry.error });
    }
    }));
    await saveManifest(file, manifest);
    console.log(JSON.stringify({ processed: results.length, total: manifest.entries.length }));
  }
  await writeFile(path.join(output, "upload-report.json"), JSON.stringify(results, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ sources: manifest.entries.length, uploaded: results.filter((r) => r.status === "uploaded").length, failed: results.filter((r) => r.status === "failed").length }));
  if (results.some((r) => r.status === "failed")) process.exitCode = 1;
}

async function scoreBatch(output: string) {
  const manifest = await loadManifest(path.join(output, "manifest.json"));
  if (!manifest) throw new Error("Could not find the private manifest.");
  const sb = database();
  const { data: rows, error } = await sb.from("answer_keys").select("test_code,question_no,correct_option").order("test_code").order("question_no");
  if (error) throw new Error(`Could not read the official key: ${error.message}`);
  const key: Key = {};
  for (const row of rows) (key[row.test_code] ??= [])[row.question_no - 1] = row.correct_option;
  validateKey(key);
  if (rows.length !== 240) throw new Error("Could not score. The official key must contain exactly 240 answers.");
  const hash = sha(rows.map((r) => `${r.test_code}:${r.question_no}:${r.correct_option}`).join("|"));
  const report = [];
  for (const entry of manifest.entries) {
    if (entry.status !== "uploaded" || !entry.uploadedId) {
      report.push({ roll: entry.roll, status: "pending", reason: "Not uploaded." }); continue;
    }
    if (!completeResponses(entry.responses) || !Array.isArray(entry.readingIssues) || entry.readingIssues.length) {
      report.push({ roll: entry.roll, status: "needs-checking", reason: "Review and correct the machine reading in the portal before scoring." }); continue;
    }
    try {
      const { data: saved, error: savedError } = await sb.from("submissions").select("responses,key_hash").eq("student_id", entry.uploadedId).single();
      if (savedError) throw savedError;
      const expected = score(saved.responses as PageResult, key);
      if (saved.key_hash === hash) {
        const { data: existing, error: existingError } = await sb.from("scores").select("test_code,correct,wrong,blank,flagged").eq("student_id", entry.uploadedId);
        if (existingError) throw existingError;
        if (existing.length === 7 && expected.every((s) => existing.some((r) =>
          r.test_code === s.test && r.correct === s.correct && r.wrong === s.wrong && r.blank === s.blank && r.flagged === s.flagged))) {
          report.push({ roll: entry.roll, status: "already-scored" }); continue;
        }
      }
      const { error } = await sb.rpc("score_copy", { p_student_id: entry.uploadedId, p_expected_key_hash: hash });
      if (error) throw error;
      const { data: scores, error: readError } = await sb.from("scores").select("test_code,correct,wrong,blank,flagged").eq("student_id", entry.uploadedId);
      if (readError) throw readError;
      if (scores.length !== 7 || expected.some((s) => !scores.some((row) =>
        row.test_code === s.test && row.correct === s.correct && row.wrong === s.wrong && row.blank === s.blank && row.flagged === s.flagged))) {
        throw new Error("Stored scores differ from the shared reader's scoring.");
      }
      report.push({ roll: entry.roll, status: "scored", pendingHandCheck: true });
    } catch (error) {
      report.push({ roll: entry.roll, status: "failed", reason: error instanceof Error ? error.message : JSON.stringify(error) });
    }
  }
  await writeFile(path.join(output, "scoring-report.json"), JSON.stringify(report, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ records: report.length, scored: report.filter((r) => r.status === "scored").length, alreadyScored: report.filter((r) => r.status === "already-scored").length, needsChecking: report.filter((r) => r.status === "needs-checking").length, failed: report.filter((r) => r.status === "failed").length }));
  if (report.some((r) => r.status === "failed")) process.exitCode = 1;
}

async function main() {
  const [command, first, second] = process.argv.slice(2);
  if (command === "prepare" && first && second) {
    const output = path.resolve(second);
    const relative = path.relative(process.cwd(), output);
    if (!relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Choose a private output folder outside this Git repository.");
    await mkdir(output, { recursive: true });
    return prepare(path.resolve(first), output);
  }
  if ((command === "upload" || command === "reconcile") && first) return upload(path.resolve(first), command === "reconcile");
  if (command === "score" && first) return scoreBatch(path.resolve(first));
  if (command === "details" && first && second) {
    const file = path.join(path.resolve(first), "manifest.json"), manifest = await loadManifest(file);
    if (!manifest) throw new Error("Could not find the private manifest.");
    const overrides: unknown = JSON.parse(await readFile(second, "utf8"));
    if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) throw new Error("Details must map roll numbers to reviewed gender values.");
    for (const [roll, gender] of Object.entries(overrides)) {
      if (gender !== "Male" && gender !== "Female" && gender !== "Not specified") throw new Error(`Invalid gender for roll ${roll}.`);
      const entry = manifest.entries.find((e) => e.roll === roll);
      if (!entry || entry.status === "uploaded") throw new Error(`Roll ${roll} is missing or already uploaded. Edit uploaded students in the portal.`);
      entry.gender = gender; entry.genderSource = "written";
      entry.issues = entry.issues.map((issue) => issue === "Male is the batch default; check written gender." ? "Gender transcribed from the written sheet." : issue);
    }
    await saveManifest(file, manifest); console.log("Reviewed gender details saved privately.");
    return;
  }
  throw new Error("Usage: copy-batch prepare <PDF folder> <private output folder> | upload/reconcile/score <private output folder> | details <private output folder> <reviewed details JSON>");
}
if (process.argv[1]?.endsWith("copy-batch.ts")) main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
