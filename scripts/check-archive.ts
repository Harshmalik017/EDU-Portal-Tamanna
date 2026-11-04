import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { archiveDeadline, canRestore } from "../lib/tamanna/archive";
import { purgeArchivedStudents } from "../lib/supabase/archive";

const id = "11111111-1111-4111-8111-111111111111";
const token = "22222222-2222-4222-8222-222222222222";
type Call = { path: string; body: Record<string, unknown> };
async function check(mode: "success" | "storage" | "finish" | "invalid" | "empty") {
  const calls: Call[] = [];
  let claims = 0;
  const client = createClient("https://synthetic.supabase.invalid", "synthetic-public-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        const path = new URL(String(input)).pathname;
        const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
        calls.push({ path, body });
        if (path.endsWith("claim_student_purges")) {
          const batch = claims++ === 0 && mode !== "empty" ? [{ id, token, paths: mode === "invalid" ? ["another-student/original.pdf"] : Array.from({ length: 101 }, (_, i) => `${id}/page-${i}.jpg`) }] : [];
          return Response.json(batch);
        }
        const failure = (mode === "storage" && path.includes("/storage/")) || (mode === "finish" && path.endsWith("finish_student_purge"));
        return Response.json(failure ? { message: "Synthetic failure", error: "Synthetic failure" } : [], { status: failure ? 400 : 200 });
      },
    },
  });
  if (mode === "success") assert.equal(await purgeArchivedStudents(client), 1);
  else if (mode === "empty") assert.equal(await purgeArchivedStudents(client), 0);
  else await assert.rejects(() => purgeArchivedStudents(client), /Could not/);
  const removes = calls.filter((call) => call.path.includes("/storage/"));
  const finalizes = calls.filter((call) => call.path.endsWith("finish_student_purge"));
  if (mode === "success") {
    assert.deepEqual(removes.map((call) => (call.body.prefixes as string[]).length), [100, 1]);
    assert.deepEqual(finalizes[0].body, { p_id: id, p_token: token });
    assert.ok(calls.indexOf(finalizes[0]) > calls.indexOf(removes[1]));
  }
  if (mode === "storage" || mode === "invalid" || mode === "empty") assert.equal(finalizes.length, 0);
  if (mode === "invalid" || mode === "empty") assert.equal(removes.length, 0);
}
async function main() {
  const archived = "2026-01-01T00:00:00.000Z";
  const deadline = Date.parse("2026-01-31T00:00:00.000Z");
  assert.equal(archiveDeadline(archived), deadline);
  assert.ok(canRestore(archived, deadline - 1));
  assert.equal(canRestore(archived, deadline), false);
  assert.equal(canRestore(archived, deadline + 1), false);
  assert.equal(canRestore(null, deadline), false);
  assert.equal(canRestore("invalid", deadline), false);
  for (const mode of ["success", "storage", "finish", "invalid", "empty"] as const) await check(mode);
  console.log("Archive checks passed: exact 30-day cutoff, file deletion before row deletion, storage chunking, leases, failed-job errors, retryable records, and cross-student path rejection.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
