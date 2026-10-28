import assert from "node:assert/strict";
import { createCanvas } from "@napi-rs/canvas";
import { allocateRoll, completeResponses, proposedName } from "./copy-batch";
import { detectPatterns, readCopy, score, validateKey, type PageResult } from "@/lib/omr/reader";
import { REF_HEIGHT, REF_WIDTH } from "@/lib/omr/template";
import { loginEmail, ADMIN_EMAIL } from "@/lib/supabase/admin-identity";
import { TESTS } from "@/lib/tamanna/tests";
import { envReady, publicKey } from "@/lib/supabase/env";

const key = Object.fromEntries(TESTS.map((t) => [t.code, Array<string>(t.questions).fill("A")]));
validateKey(key);
assert.throws(() => validateKey({ LA: ["A"] }), /needs/);
const sparse = Array<string>(30); sparse[29] = "A";
assert.throws(() => validateKey({ ...key, LA: sparse }), /needs/);
const originalEnv = { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, legacy: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY };
try {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://school.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "your-public-publishable-key";
  assert.equal(envReady(), false);
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test_key_for_unit_checks";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "legacy";
  assert.equal(envReady(), true);
  assert.equal(publicKey(), "sb_publishable_test_key_for_unit_checks");
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  assert.equal(publicKey(), "legacy");
} finally {
  for (const [name, value] of Object.entries({ NEXT_PUBLIC_SUPABASE_URL: originalEnv.url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: originalEnv.key, NEXT_PUBLIC_SUPABASE_ANON_KEY: originalEnv.legacy })) {
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
}
assert.equal(allocateRoll([], 0), "10001");
assert.equal(allocateRoll([], 128), "10129");
assert.equal(proposedName("Example Student 2_260101_120000.pdf"), "Example Student 2");
assert.equal(loginEmail(" ADMIN "), ADMIN_EMAIL);
assert.equal(loginEmail("teacher@school.org"), "teacher@school.org");
const marked: PageResult = Object.fromEntries(TESTS.map((t) => [t.code, Array<string | null>(t.questions).fill("A")]));
assert.ok(completeResponses(marked));
marked.LA[0] = "B"; marked.LA[1] = null; marked.LA[2] = "MULTI";
assert.deepEqual(score(marked, key)[0], { test: "LA", correct: 27, wrong: 1, blank: 1, flagged: 1 });
marked.LA[3] = "UNCERTAIN";
assert.equal(completeResponses(marked), false);
assert.throws(() => score(marked, key), /uncertain/);
assert.deepEqual(detectPatterns({ LA: Array<string>(30).fill("UNCERTAIN") }), []);
assert.equal(detectPatterns({ LA: Array<string>(30).fill("A") }).length, 1);

const canvas = createCanvas(REF_WIDTH, REF_HEIGHT), ctx = canvas.getContext("2d");
ctx.fillStyle = "white"; ctx.fillRect(0, 0, REF_WIDTH, REF_HEIGHT);
for (let column = 0; column < 4; column++) {
  for (let q = 0; q < 30; q++) {
    for (let k = 0; k < 4; k++) {
      ctx.beginPath(); ctx.arc(120 + column * 180 + k * 30, 350 + q * 22, 7, 0, Math.PI * 2);
      ctx.strokeStyle = "black"; ctx.lineWidth = 1.5; ctx.stroke();
      if (k === q % 4) { ctx.fillStyle = "black"; ctx.fill(); }
    }
  }
}
const rgba = ctx.getImageData(0, 0, REF_WIDTH, REF_HEIGHT).data;
const gray = new Uint8ClampedArray(REF_WIDTH * REF_HEIGHT);
for (let i = 0; i < gray.length; i++) gray[i] = rgba[i * 4];
const reading = readCopy(gray, 1);
assert.deepEqual(reading.issues, []);
assert.deepEqual(reading.answers.LA, Array.from({ length: 30 }, (_, q) => "ABCD"[q % 4]));
assert.equal(Object.values(reading.answers).flat().length, 120);
const blank = readCopy(new Uint8ClampedArray(REF_WIDTH * REF_HEIGHT).fill(255), 1);
assert.equal(Object.keys(blank.answers).length, 0);
assert.ok(blank.issues.length);
console.log("Import checks passed: five-digit rolls, separate names, key validation, unscored uncertainty, score accounting, printed-grid reading, and blank-page rejection.");
