import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { archiveDeadline, canRestore } from "../lib/tamanna/archive";
import { deleteArchivedStudents, purgeArchivedStudents } from "../lib/supabase/archive";

const id = "11111111-1111-4111-8111-111111111111";
const token = "22222222-2222-4222-8222-222222222222";
type Call = { path: string; body: Record<string, unknown> };
async function check(mode: "success" | "storage" | "finish" | "invalid" | "empty" | "wrong-id" | "claim" | "partial", manual = false) {
  const calls: Call[] = [];
  const secondId = "33333333-3333-4333-8333-333333333333";
  let claims = 0;
  const client = createClient("https://synthetic.supabase.invalid", "synthetic-public-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        const path = new URL(String(input)).pathname;
        const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
        calls.push({ path, body });
        if (path.endsWith("claim_student_purges") || path.endsWith("claim_selected_student_purges")) {
          if (mode === "claim") return Response.json({ message: "Selected student is active" }, { status: 400 });
          const batch = claims++ === 0 && mode !== "empty" ? [{ id: mode === "wrong-id" ? secondId : id, token, paths: mode === "invalid" ? ["another-student/original.pdf"] : Array.from({ length: 101 }, (_, i) => `${mode === "wrong-id" ? secondId : id}/page-${i}.jpg`) }] : [];
          if (mode === "partial") batch.push({ id: secondId, token, paths: [`${secondId}/original.pdf`] });
          return Response.json(batch);
        }
        const failure = (path.includes("/storage/") && (mode === "storage" || (mode === "partial" && (body.prefixes as string[])[0].startsWith(secondId)))) || (mode === "finish" && path.endsWith("finish_student_purge"));
        return Response.json(failure ? { message: "Synthetic failure", error: "Synthetic failure" } : [], { status: failure ? 400 : 200 });
      },
    },
  });
  const execute = () => manual ? deleteArchivedStudents(client, mode === "partial" ? [id, secondId] : [id]) : purgeArchivedStudents(client);
  if (mode === "success") assert.equal(await execute(), 1);
  else if (mode === "empty" && !manual) assert.equal(await execute(), 0);
  else await assert.rejects(execute, mode === "partial" ? /Could not delete 1 archived student\. 1 deleted/ : /Could not/);
  const removes = calls.filter((call) => call.path.includes("/storage/"));
  const finalizes = calls.filter((call) => call.path.endsWith("finish_student_purge"));
  if (mode === "success") {
    assert.deepEqual(removes.map((call) => (call.body.prefixes as string[]).length), [100, 1]);
    assert.deepEqual(finalizes[0].body, { p_id: id, p_token: token });
    assert.ok(calls.indexOf(finalizes[0]) > calls.indexOf(removes[1]));
  }
  if (["storage", "invalid", "empty", "wrong-id", "claim"].includes(mode)) assert.equal(finalizes.length, 0);
  if (["invalid", "empty", "wrong-id", "claim"].includes(mode)) assert.equal(removes.length, 0);
  const releases = calls.filter((call) => call.path.endsWith("release_student_purge"));
  assert.equal(releases.length, manual && ["storage", "finish", "partial"].includes(mode) ? 1 : 0);
  if (manual) assert.deepEqual(calls[0].body, { p_ids: mode === "partial" ? [id, secondId] : [id] });
  if (mode === "partial") {
    assert.equal(finalizes.length, 1);
    assert.equal(finalizes[0].body.p_id, id);
    assert.equal(releases[0].body.p_id, secondId);
  }
  const previous = calls.length;
  for (const ids of [[], [id, id], ["invalid"]]) await assert.rejects(() => deleteArchivedStudents(client, ids), /select valid archived students/);
  assert.equal(calls.length, previous);
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
  for (const mode of ["success", "storage", "finish", "invalid", "empty", "wrong-id", "claim", "partial"] as const) await check(mode, true);
  console.log("Archive checks passed: exact cutoff, automatic and selected cleanup, file-first deletion, storage chunks, partial failures, immediate manual retries, claim errors, invalid selections, and cross-student path rejection.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
