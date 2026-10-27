import { createServer } from "@/lib/supabase/server";
import { DEFAULT_TEMPLATE, type Column } from "@/lib/omr/template";
import type { Key } from "@/lib/types";

export async function getKey(): Promise<Key> {
  const { data } = await (await createServer()).from("answer_keys").select("test_code,question_no,correct_option");
  const k: Key = {};
  (data ?? []).forEach((r) => ((k[r.test_code] ??= [])[r.question_no - 1] = r.correct_option));
  return k;
}
export async function getTemplate(): Promise<Column[]> {
  const { data } = await (await createServer()).from("settings").select("value").eq("key", "template").maybeSingle();
  const v = data?.value;
  if (!Array.isArray(v) || v.length !== DEFAULT_TEMPLATE.length) return DEFAULT_TEMPLATE;
  return v.map((saved, index) => {
    const column = saved && typeof saved === "object" ? saved as Partial<Column> : {};
    return {
      ...DEFAULT_TEMPLATE[index],
      ...column,
      xSlope: typeof column.xSlope === "number" && Number.isFinite(column.xSlope) ? column.xSlope : DEFAULT_TEMPLATE[index].xSlope,
    };
  });
}
