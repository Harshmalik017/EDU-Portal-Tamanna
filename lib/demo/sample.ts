import { TESTS } from "@/lib/tamanna/tests";
import type { PageResult } from "@/lib/omr/reader";
import type { Key } from "../types";

/** Made-up marked answers for trying the scan flow without a photo (demo mode only). */
export function sampleAnswers(key: Key): PageResult {
  const out: PageResult = {};
  for (const t of TESTS) {
    out[t.code] = Array.from({ length: t.questions }, (_, i) => {
      const r = Math.random(), k = key[t.code]?.[i];
      if (r < 0.62 && k) return k;
      if (r < 0.7) return null;
      if (r < 0.72) return "MULTI";
      return "ABCD"[Math.floor(Math.random() * 4)];
    });
  }
  return out;
}
