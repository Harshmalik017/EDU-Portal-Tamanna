import { strict as assert } from "node:assert";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = (directory: string): string[] => readdirSync(join(root, directory), { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name);
  return entry.isDirectory() ? files(path) : /\.(?:ts|tsx|css)$/.test(entry.name) ? [path] : [];
});
const source = [...files("app"), ...files("components")].map((path) => ({ path, text: readFileSync(join(root, path), "utf8") }));
const tsx = source.filter(({ path }) => path.endsWith(".tsx"));

for (const pattern of [
  /\btransition-all\b/,
  /\bautoFocus\b/,
  /\bconfirm\s*\(/,
  /onPaste[\s\S]{0,40}preventDefault/,
  /outline-none(?!.*focus-visible)/,
]) {
  assert.equal(tsx.concat(source.filter(({ path }) => path.endsWith(".css"))).some(({ text }) => pattern.test(text)), false, `Forbidden UI pattern: ${pattern}`);
}

for (const { path, text } of tsx) {
  for (const tag of text.matchAll(/<img\b[^>]*>/g)) {
    assert.match(tag[0], /\bwidth=\{?\d+/, `${path}: image needs width`);
    assert.match(tag[0], /\bheight=\{?\d+/, `${path}: image needs height`);
    assert.match(tag[0], /\balt=/, `${path}: image needs alt`);
  }
  for (const main of text.matchAll(/<main\b[^>]*>/g)) assert.match(main[0], /id="main"/, `${path}: main needs id="main"`);
}

for (const path of [
  "components/AdminNav.tsx",
  "components/features/AnswerReview.tsx",
  "components/features/ManualCheckDialog.tsx",
  "lib/omr.ts",
  "lib/template.ts",
]) assert.equal(existsSync(join(root, path)), false, `${path} should remain removed`);

assert.match(readFileSync(join(root, "app/layout.tsx"), "utf8"), /SkipLink/);
assert.match(readFileSync(join(root, "components/ui/Dialog.tsx"), "utf8"), /overscroll-contain/);
assert.match(readFileSync(join(root, "components/ui/Input.tsx"), "utf8"), /useId/);
assert.match(readFileSync(join(root, "components/ui/Select.tsx"), "utf8"), /useId/);
console.log("UI checks passed: shared accessibility primitives, no forbidden anti-patterns, complete image/main semantics, and no stale modules.");
