import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { renderPdf } from "./copy-batch";
import { readCopy, validateKey } from "@/lib/omr/reader";
import type { Key } from "@/lib/types";

async function main() {
  const [command, input, output] = process.argv.slice(2);
  if (!input || !output || !["read", "upload"].includes(command)) throw new Error("Usage: prepare-key read <official key PDF> <private output folder> | upload <reviewed key JSON> CONFIRM");
  if (command === "read") {
    const pages = await renderPdf(await readFile(input), path.resolve(output));
    if (pages.length !== 2) throw new Error("Could not read the key. Select its two answer pages first.");
    const a = readCopy(pages[0], 1), b = readCopy(pages[1], 2);
    const key = { ...a.answers, ...b.answers };
    const issues = [...a.issues, ...b.issues];
    await writeFile(path.join(output, "key-candidate.json"), JSON.stringify(key, null, 2), { mode: 0o600 });
    await writeFile(path.join(output, "key-review.json"), JSON.stringify({ issues, sourceSha256: createHash("sha256").update(await readFile(input)).digest("hex") }, null, 2));
    console.log(JSON.stringify({ counts: Object.fromEntries(Object.entries(key).map(([test, answers]) => [test, answers.length])), issues: issues.length, requiresReview: true }));
    return;
  }
  if (output !== "CONFIRM") throw new Error("Compare all 240 answers with the official key, then use CONFIRM.");
  const key: Key = JSON.parse(await readFile(input, "utf8"));
  validateKey(key);
  process.loadEnvFile(".env.local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) throw new Error("Could not connect. Set the private project settings.");
  const sb = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const rows = Object.entries(key).flatMap(([test_code, answers]) => answers.map((correct_option, i) => ({ test_code, question_no: i + 1, correct_option })));
  const { error } = await sb.from("answer_keys").upsert(rows, { onConflict: "test_code,question_no" });
  if (error) throw new Error(`Could not save the key: ${error.message}`);
  console.log("Saved 240 reviewed official answers.");
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Could not prepare the answer key."); process.exitCode = 1; });
