import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { readCopy, rescanPages } from "@/lib/omr/reader";
import { COPY_GRID, PART_BREAKS, REF_HEIGHT, REF_WIDTH } from "@/lib/omr/template";
import { TESTS } from "@/lib/tamanna/tests";

async function main() {
  const file = process.argv[2];
  if (file) {
    const canvas = createCanvas(REF_WIDTH, REF_HEIGHT), ctx = canvas.getContext("2d");
    ctx.drawImage(await loadImage(file), 0, 0);
    const rgba = ctx.getImageData(0, 0, REF_WIDTH, REF_HEIGHT).data;
    const gray = new Uint8ClampedArray(REF_WIDTH * REF_HEIGHT);
    for (let i = 0; i < gray.length; i++) gray[i] = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
    const page = process.argv[3] === "2" ? 2 : 1;
    const reading = readCopy(gray, page);
    if (process.argv[4]) {
      const offsets: Record<string, number> = {};
      reading.rows.forEach((column, index) => {
        const test = COPY_GRID.tests[page][index], offset = offsets[test] ?? 0;
        if (!test) return;
        column.forEach((row, i) => {
          const value = reading.answers[test]?.[offset + i];
          ctx.font = "bold 10px sans-serif";
          ctx.fillStyle = value === "UNCERTAIN" ? "#b45309" : "#1d4ed8";
          ctx.fillText(`${offset + i + 1}:${value ?? "-"}`, row[0].x - 35, row[0].y - 7);
          row.forEach((bubble, k) => {
            ctx.beginPath(); ctx.arc(bubble.x, bubble.y, bubble.diameter / 2 + 2, 0, Math.PI * 2);
            ctx.strokeStyle = value === "ABCD"[k] ? "#1d4ed8" : "#16a34a"; ctx.lineWidth = 1; ctx.stroke();
          });
        });
        offsets[test] = offset + column.length;
      });
      await writeFile(process.argv[4], canvas.toBuffer("image/jpeg", 90));
    }
    console.log(JSON.stringify({ issues: reading.issues, columns: reading.rows.map((col) => col.map((row) => ({ x: row[0].x, y: row[0].y }))) }));
    return;
  }
  const blank = new Uint8ClampedArray(REF_WIDTH * REF_HEIGHT).fill(255);
  assert.throws(() => rescanPages([blank]), /two complete/);
  assert.throws(() => rescanPages([blank, new Uint8ClampedArray(1)]), /two complete/);
  const unreadable = rescanPages([blank, blank]);
  assert.equal(Object.values(unreadable.answers).flat().length, 240);
  for (const test of TESTS) assert.deepEqual(unreadable.answers[test.code], Array<string>(test.questions).fill("UNCERTAIN"));
  assert.ok(unreadable.issues.some((issue) => issue.includes("Review Pending")));
  const pages = ([1, 2] as const).map((page) => {
    const canvas = createCanvas(REF_WIDTH, REF_HEIGHT), ctx = canvas.getContext("2d");
    ctx.fillStyle = "white"; ctx.fillRect(0, 0, REF_WIDTH, REF_HEIGHT);
    const codes = page === 1 ? ["LA", "AR", "VR", "MR"] : ["NA", "SA", "PA", "PA"];
    for (let column = 0; column < 4; column++) {
      const draw = (y: number, answer: number, shift = 0) => {
        for (let k = 0; k < 4; k++) {
          ctx.beginPath(); ctx.arc(120 + column * 180 + k * 30 + (y - 350) * 0.02 + shift, y, 7, 0, Math.PI * 2);
          ctx.strokeStyle = "black"; ctx.lineWidth = 1.5; ctx.stroke();
          if (k === answer) { ctx.fillStyle = "black"; ctx.fill(); }
        }
      };
      for (let q = 0; q < 3; q++) draw(230 + q * 25, 0);
      for (let q = 0; q < 30; q++) draw(430 + q * 24 + PART_BREAKS[codes[column]].filter((n) => q >= n).length * 24, (q + column) % 4);
      for (let q = 0; q < 2; q++) draw(1210 + q * 24, 0, column === 3 ? -65 : 0);
    }
    const rgba = ctx.getImageData(0, 0, REF_WIDTH, REF_HEIGHT).data;
    return Uint8ClampedArray.from({ length: REF_WIDTH * REF_HEIGHT }, (_, i) => rgba[i * 4]);
  });
  const reading = rescanPages(pages);
  for (const [index, code] of ["LA", "AR", "VR", "MR", "NA", "SA", "PA"].entries()) {
    const column = index < 4 ? index : index - 4;
    const expected = Array.from({ length: code === "PA" ? 60 : 30 }, (_, q) => "ABCD"[(q % 30 + column + (q >= 30 ? 1 : 0)) % 4]);
    assert.deepEqual(reading.answers[code], expected, code);
  }
  assert.ok(!Object.values(reading.answers).flat().includes("UNCERTAIN"));
  assert.equal(Object.values(reading.answers).flat().length, 240);
  const mixed = rescanPages([pages[0], blank]);
  assert.deepEqual(mixed.answers.LA, reading.answers.LA);
  assert.ok(mixed.answers.PA.every((value) => value === "UNCERTAIN"));
  console.log("Rescan checks passed: both pages, all 240 positions, PA columns, skew, practice/footer exclusion, and explicit unreadable states.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
