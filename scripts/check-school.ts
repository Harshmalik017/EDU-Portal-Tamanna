import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { randomBytes, randomUUID } from "node:crypto";
import { ADMIN_EMAIL } from "@/lib/supabase/admin-identity";

async function main() {
  process.loadEnvFile(".env.local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!, publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!, password = process.env.ADMIN_PASSWORD!;
  assert.equal(url, "https://zhrlfkvmmrgwainsfyha.supabase.co");
  assert.ok(secret && publicKey && password, "Private school connection and admin settings are required.");
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const owner = createClient(url, secret, options), anon = createClient(url, publicKey, options);
  const { data: publicRows, error: publicError } = await anon.from("students").select("id");
  assert.ifError(publicError); assert.equal(publicRows?.length, 0, "Anonymous users must not see students.");
  const { error: importError } = await anon.rpc("import_copy", { p_student: {}, p_submission: {} });
  assert.ok(importError, "Anonymous users must not import records.");
  const cookies = new Map<string, string>();
  const admin = createServerClient(url, publicKey, {
    cookies: { getAll: () => [...cookies].map(([name, value]) => ({ name, value })), setAll: (list: { name: string; value: string }[]) => list.forEach(({ name, value }) => cookies.set(name, value)) },
  });
  const { error: loginError } = await admin.auth.signInWithPassword({ email: ADMIN_EMAIL, password });
  assert.ifError(loginError);
  const { data: allowed, error: roleError } = await admin.rpc("is_admin");
  assert.ifError(roleError); assert.equal(allowed, true);
  const { data: students, error: studentError } = await admin.from("students").select("id,roll_number,name,class,gender,school,block,district,import_hash,verification_status,scores(test_code)").order("roll_number");
  assert.ifError(studentError);
  assert.equal(students?.length, 129);
  assert.equal(new Set(students.map((s) => s.roll_number)).size, 129);
  assert.equal(students[0].roll_number, "10001"); assert.equal(students[128].roll_number, "10129");
  assert.ok(students.every((s) => s.name && s.import_hash && s.class === "X" && s.block === "Sidhauli" && s.district === "Sitapur"));
  assert.ok(students.every((s) => s.scores.length === 0 || s.scores.length === 7), "Scoring must save all sections atomically.");
  assert.ok(students.every((s) => s.verification_status === "pending"));
  const { data: submissions, error: subError } = await admin.from("submissions").select("student_id,responses,pdf_path,source_sha256");
  assert.ifError(subError);
  assert.equal(submissions.length, 129);
  assert.equal(new Set(submissions.map((submission) => submission.student_id)).size, 129);
  assert.ok(submissions.every((submission) => submission.pdf_path && /^[a-f0-9]{64}$/.test(submission.source_sha256)));
  const sub = submissions.find((submission) => submission.student_id === students[0].id);
  assert.ok(sub);
  const { error: privateFileError } = await anon.storage.from("sheets").download(sub.pdf_path);
  assert.ok(privateFileError, "Anonymous users must not read PDFs.");
  const { data: fingerprint, error: hashError } = await admin.rpc("answer_key_hash");
  assert.ifError(hashError);
  const { error: invalidReview } = await admin.rpc("review_copy", { p_student_id: students[0].id, p_responses: {}, p_expected_key_hash: fingerprint });
  assert.ok(invalidReview, "Incomplete responses must be rejected.");
  const { data: after, error: afterError } = await admin.from("submissions").select("responses").eq("student_id", students[0].id).single();
  assert.ifError(afterError); assert.deepEqual(after.responses, sub.responses, "Failed review must roll back.");
  const { error: staleKey } = await admin.rpc("score_copy", { p_student_id: students[0].id, p_expected_key_hash: "stale" });
  assert.ok(staleKey, "Stale-key scoring must fail.");
  const tempPassword = randomBytes(30).toString("base64url");
  const email = `access-check-${randomUUID()}@tamanna.school`;
  const { data: temp, error: createError } = await owner.auth.admin.createUser({ email, password: tempPassword, email_confirm: true });
  assert.ifError(createError);
  try {
    const visitor = createClient(url, publicKey, options);
    const { error } = await visitor.auth.signInWithPassword({ email, password: tempPassword }); assert.ifError(error);
    const { data: visible, error: queryError } = await visitor.from("students").select("id");
    assert.ifError(queryError); assert.equal(visible.length, 0);
    const { data: isAdmin } = await visitor.rpc("is_admin"); assert.equal(isAdmin, false);
    const { error: rejected } = await visitor.rpc("score_copy", { p_student_id: students[0].id, p_expected_key_hash: fingerprint });
    assert.ok(rejected, "Non-admin authenticated users must not score.");
  } finally {
    const { error } = await owner.auth.admin.deleteUser(temp.user.id);
    assert.ifError(error);
  }
  const base = process.env.CHECK_PORTAL_URL;
  if (base) {
    assert.match(base, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
    const signedOut = await fetch(`${base}/admin/results`, { redirect: "manual" });
    assert.equal(signedOut.status, 307); assert.ok(signedOut.headers.get("location")?.endsWith("/login"));
    const retired = await fetch(`${base}/api/demo`, { method: "POST" }); assert.equal(retired.status, 404);
    const headers = { Cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join("; ") };
    const results = await fetch(`${base}/admin/results`, { headers });
    assert.equal(results.status, 200);
    const html = await results.text();
    assert.ok(html.includes("10001")); assert.ok(html.includes("Name")); assert.ok(!html.includes("Practice data"));
    const detail = await fetch(`${base}/admin/students/${students[0].id}`, { headers });
    assert.equal(detail.status, 200);
    const detailHtml = await detail.text();
    assert.ok(detailHtml.includes("Open original PDF")); assert.ok(detailHtml.includes("Check marked answers"));
    assert.ok(detailHtml.includes(fingerprint), "The displayed key must have the database scoring fingerprint.");
    assert.ok(!detailHtml.includes(password)); assert.ok(!detailHtml.includes(secret));
    const report = await fetch(`${base}/admin/students/${students[0].id}/report`, { headers });
    assert.equal(report.status, 200);
    const reportHtml = await report.text();
    assert.ok(!reportHtml.includes(students[0].name)); assert.ok(reportHtml.includes("10001"));
    const scan = await fetch(`${base}/admin/scan`, { headers });
    assert.equal(scan.status, 200);
    const scanHtml = await scan.text();
    assert.ok(scanHtml.includes("Student name") && scanHtml.includes(fingerprint));
    assert.ok(!scanHtml.includes("masked before"));
  }
  await admin.auth.signOut({ scope: "local" });
  console.log("Live checks passed: 129 private identities, admin login, anonymous/non-admin denial, private PDFs, atomic failed review, stale-key rejection, and optional portal HTTP flows.");
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Could not check the school database."); process.exitCode = 1; });
