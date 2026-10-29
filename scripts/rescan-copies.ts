import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { renderPdf } from "./copy-batch";
import { rescanPages, score, validateKey, type PageResult } from "@/lib/omr/reader";
import { TESTS } from "@/lib/tamanna/tests";
import { REF_HEIGHT, REF_WIDTH } from "@/lib/omr/template";
import type { Key } from "@/lib/types";

type Person = { id: string; roll_number: string; class: string; gender: string; excluded: boolean; review_issues: string[]; scores: unknown[] };
type Submission = { id: string; student_id: string; created_at: string; responses: PageResult; pdf_path: string | null; image_paths: string[] | null; source_sha256: string | null; key_hash: string | null };
type Entry = { student: Person; submission: Submission; hash?: string; responses?: PageResult; issues?: string[]; pages?: number; result?: string };
type Run = { version: 1; key: Key; keyHash: string; entries: Entry[] };
const sha = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const equal = (a: unknown, b: unknown): boolean => {
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => equal(v, b[i]));
  if (a && b && typeof a === "object" && typeof b === "object") {
    const x = Object.entries(a), y = Object.entries(b);
    return x.length === y.length && x.every(([k, v]) => k in b && equal(v, Reflect.get(b, k)));
  }
  return a === b;
};

function database() {
  process.loadEnvFile(".env.local");
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://zhrlfkvmmrgwainsfyha.supabase.co") throw new Error("Could not rescan: unexpected school project.");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Could not rescan: missing service role key.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function privateFolder(folder: string) {
  const resolved = path.resolve(folder), relative = path.relative(process.cwd(), resolved);
  if (!relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)) throw new Error("Could not rescan: output must be outside the repository.");
  return resolved;
}

async function save(file: string, value: unknown) {
  await writeFile(`${file}.tmp`, JSON.stringify(value, null, 2), { mode: 0o600 });
  await rename(`${file}.tmp`, file);
}

async function snapshot(sb: ReturnType<typeof database>, file: string): Promise<Run> {
  try { return JSON.parse(await readFile(file, "utf8")) as Run; }
  catch (error) { if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error; }
  const { data: students, error } = await sb.from("students").select("id,roll_number,class,gender,excluded,review_issues,scores(*)").order("roll_number");
  if (error) throw error;
  if (students.length !== 129 || new Set(students.map((s) => s.id)).size !== 129) throw new Error(`Could not rescan: expected exactly 129 students, found ${students.length}.`);
  const { data: submissions, error: subError } = await sb.from("submissions").select("id,student_id,created_at,responses,pdf_path,image_paths,source_sha256,key_hash").order("created_at", { ascending: false }).order("id", { ascending: false });
  if (subError) throw subError;
  const { data: rows, error: keyError } = await sb.from("answer_keys").select("test_code,question_no,correct_option").order("test_code").order("question_no");
  if (keyError) throw keyError;
  if (rows.length !== 240) throw new Error("Could not rescan: official key needs 240 answers.");
  const key: Key = {};
  for (const row of rows) (key[row.test_code] ??= [])[row.question_no - 1] = row.correct_option;
  validateKey(key);
  const run: Run = {
    version: 1, key, keyHash: sha(rows.map((r) => `${r.test_code}:${r.question_no}:${r.correct_option}`).join("|")),
    entries: students.map((student: Person) => {
      const submission: Submission | undefined = submissions.find((sub) => sub.student_id === student.id);
      if (!submission || !pdfPath(submission)) throw new Error(`Could not locate PDF for roll ${student.roll_number}.`);
      return { student, submission };
    }),
  };
  await save(file, run);
  return run;
}

function pdfPath(sub: Submission) {
  return sub.pdf_path || sub.image_paths?.find((p) => /\.pdf$/i.test(p));
}

async function download(sb: ReturnType<typeof database>, entry: Entry) {
  const location = pdfPath(entry.submission);
  if (!location) throw new Error("Could not locate original PDF.");
  const { data, error } = await sb.storage.from("sheets").download(location);
  if (error) throw error;
  const bytes = new Uint8Array(await data.arrayBuffer()), hash = sha(bytes);
  if (entry.submission.source_sha256 && hash !== entry.submission.source_sha256) throw new Error(`Could not verify original PDF for roll ${entry.student.roll_number}.`);
  if (entry.hash && entry.hash !== hash) throw new Error("Could not resume: source PDF changed.");
  return { bytes, hash };
}

async function prepare(sb: ReturnType<typeof database>, run: Run, folder: string, limit: number) {
  let processed = 0;
  for (const entry of run.entries) {
    if (entry.responses) continue;
    if (processed >= limit) break;
    const output = path.join(folder, entry.student.roll_number);
    let bytes: Uint8Array;
    try { bytes = new Uint8Array(await readFile(path.join(output, "original.pdf"))); }
    catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
      bytes = (await download(sb, entry)).bytes;
    }
    const hash = sha(bytes);
    if ((entry.hash && entry.hash !== hash) || (entry.submission.source_sha256 && entry.submission.source_sha256 !== hash)) throw new Error("Could not verify cached source PDF.");
    const pages = await renderPdf(bytes, output);
    await writeFile(path.join(output, "original.pdf"), bytes, { mode: 0o600 });
    // Nonstandard originals are retained, but cannot be treated as identified answer sides.
    const reading = pages.length === 2 ? rescanPages(pages) : rescanPages([
      new Uint8ClampedArray(REF_WIDTH * REF_HEIGHT).fill(255),
      new Uint8ClampedArray(REF_WIDTH * REF_HEIGHT).fill(255),
    ]);
    if (pages.length !== 2) reading.issues.unshift(`Review Pending: original PDF has ${pages.length} pages instead of two. Identify both answer sides; no answers were inferred.`);
    entry.hash = hash; entry.pages = pages.length; entry.responses = reading.answers; entry.issues = reading.issues;
    await save(path.join(folder, "run.json"), run);
    processed++;
    if (processed % 10 === 0) console.log(JSON.stringify({ processed, prepared: run.entries.filter((e) => e.responses).length }));
  }
}

function summary(run: Run) {
  const entries = run.entries.filter((e) => e.responses);
  const bySection = Object.fromEntries(TESTS.map((t) => [t.code, {
    uncertain: entries.reduce((n, e) => n + (e.responses?.[t.code]?.filter((v) => v === "UNCERTAIN").length ?? 0), 0),
    blank: entries.reduce((n, e) => n + (e.responses?.[t.code]?.filter((v) => v === null).length ?? 0), 0),
  }]));
  return { students: run.entries.length, prepared: entries.length, answerSides: entries.length * 2, sourcePages: entries.reduce((n, e) => n + (e.pages ?? 0), 0),
    positions: entries.reduce((n, e) => n + Object.values(e.responses ?? {}).flat().length, 0),
    review: entries.filter((e) => Object.values(e.responses ?? {}).flat().includes("UNCERTAIN")).length,
    applied: entries.filter((e) => e.result).length, bySection };
}

async function apply(sb: ReturnType<typeof database>, run: Run, folder: string) {
  if (run.entries.length !== 129 || run.entries.some((e) => !e.responses || !e.pages)) throw new Error("Could not apply: inspect all 129 original PDFs first.");
  const recoveryFile = path.join(folder, "student-state-before-apply.json");
  let hasRecovery = true;
  try { await readFile(recoveryFile); }
  catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    hasRecovery = false;
  }
  if (!hasRecovery) {
    if (run.entries.some((entry) => entry.result)) throw new Error("Could not resume without the original student-state backup.");
    const { data: states, error: stateError } = await sb.from("students").select("id,manual_scores,verification_status,verified_by,verified_at,verification_note,review_issues");
    if (stateError) throw stateError;
    if (states.length !== 129) throw new Error("Could not back up all 129 student states.");
    await save(recoveryFile, states);
  }
  for (const [index, entry] of run.entries.entries()) {
    if (!entry.responses) throw new Error("Missing prepared responses.");
    if (entry.result) continue;
    await download(sb, entry);
    const { data: current, error: currentError } = await sb.from("submissions").select("responses").eq("id", entry.submission.id).single();
    if (currentError) throw currentError;
    // A lost response after a committed transaction is safe to retry.
    const expected = equal(current.responses, entry.responses) ? entry.responses : entry.submission.responses;
    const { data, error } = await sb.rpc("rescan_copy", {
      p_student_id: entry.student.id, p_submission_id: entry.submission.id, p_responses: entry.responses,
      p_expected_responses: expected, p_expected_source_hash: entry.submission.source_sha256,
      p_expected_key_hash: run.keyHash,
      p_expected_student: { class: entry.student.class, gender: entry.student.gender, excluded: entry.student.excluded },
      p_issues: entry.issues,
    });
    if (error) throw new Error(`Could not save roll ${entry.student.roll_number}: ${error.message}`);
    entry.result = data;
    await save(path.join(folder, "run.json"), run);
    if ((index + 1) % 10 === 0) console.log(JSON.stringify({ applied: index + 1 }));
  }
}

async function verify(sb: ReturnType<typeof database>, run: Run) {
  const { data: keyHash, error: hashError } = await sb.rpc("answer_key_hash");
  if (hashError) throw hashError;
  if (keyHash !== run.keyHash) throw new Error("Could not verify: official key changed.");
  const { data: students, error: studentError } = await sb.from("students").select("id,roll_number,class,gender,excluded");
  if (studentError) throw studentError;
  if (students.length !== 129) throw new Error("Could not verify student count.");
  const { data: submissions, error } = await sb.from("submissions").select("id,student_id,responses,key_hash,pdf_path,source_sha256,image_paths,created_at").order("created_at", { ascending: false }).order("id", { ascending: false });
  if (error) throw error;
  const { data: scores, error: scoreError } = await sb.from("scores").select("student_id,test_code,correct,wrong,blank,flagged");
  if (scoreError) throw scoreError;
  for (const entry of run.entries) {
    const student = students.find((s) => s.id === entry.student.id);
    if (!student || ["roll_number", "class", "gender", "excluded"].some((key) => Reflect.get(student, key) !== Reflect.get(entry.student, key))) throw new Error("Could not verify preserved student identity.");
    const current = submissions.find((s) => s.student_id === entry.student.id);
    if (!entry.result || !current || current.id !== entry.submission.id || !equal(current.responses, entry.responses)) throw new Error(`Could not verify responses for roll ${entry.student.roll_number}.`);
    if (current.pdf_path !== entry.submission.pdf_path || current.source_sha256 !== entry.submission.source_sha256 || !equal(current.image_paths, entry.submission.image_paths)) throw new Error("Could not verify preserved original file references.");
    const saved = scores.filter((s) => s.student_id === entry.student.id);
    if (entry.result === "scored" && entry.responses) {
      const expected = score(entry.responses, run.key);
      if (current.key_hash !== run.keyHash || saved.length !== 7 || expected.some((s) => !saved.some((r) => r.test_code === s.test && r.correct === s.correct && r.wrong === s.wrong && r.blank === s.blank && r.flagged === s.flagged))) throw new Error("Could not reconcile final scores.");
    } else if (saved.length || current.key_hash !== null) throw new Error("Could not verify stale-score invalidation.");
  }
  console.log("Verified all 129 saved rescans, preserved identities/originals, and final-versus-pending scores.");
}

async function main() {
  const [command, output] = process.argv.slice(2);
  if (command === "install" && process.argv.includes("--apply")) {
    database();
    if (!process.env.SUPABASE_ACCESS_TOKEN) throw new Error("Could not install rescan RPC: missing access token.");
    const response = await fetch("https://api.supabase.com/v1/projects/zhrlfkvmmrgwainsfyha/database/query", {
      method: "POST", headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: await readFile("supabase/rescan.sql", "utf8") }),
    });
    if (!response.ok) throw new Error(`Could not install rescan RPC (${response.status}): ${await response.text()}`);
    console.log("Installed admin-restricted transactional rescan RPC.");
    return;
  }
  if (!output || !["inventory", "prepare", "apply", "verify", "summary"].includes(command)) throw new Error("Usage: rescan-copies.ts inventory|prepare|apply|verify|summary <private folder> [--limit=N] or install --apply");
  const folder = privateFolder(output);
  await mkdir(folder, { recursive: true });
  const sb = database(), run = await snapshot(sb, path.join(folder, "run.json"));
  if (run.version !== 1 || run.entries.length !== 129) throw new Error("Unsupported or incomplete rescan snapshot.");
  if (command === "prepare") {
    if (process.argv.includes("--reread")) {
      if (run.entries.some((e) => e.result)) throw new Error("Could not reread an already applied run. Create a new snapshot.");
      for (const entry of run.entries) { delete entry.responses; delete entry.issues; }
    }
    const arg = process.argv.find((a) => a.startsWith("--limit="));
    const limit = arg ? Number(arg.split("=")[1]) : 129;
    if (!Number.isInteger(limit) || limit < 1 || limit > 129) throw new Error("Limit must be 1–129.");
    await prepare(sb, run, folder, limit);
  }
  if (command === "apply") await apply(sb, run, folder);
  if (command === "verify") await verify(sb, run);
  console.log(JSON.stringify(summary(run)));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Could not rescan copies.", error instanceof Error ? "" : error); process.exitCode = 1; });
