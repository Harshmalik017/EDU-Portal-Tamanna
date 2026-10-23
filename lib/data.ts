import { createServer } from "./supabase-server";
import { DEFAULT_TEMPLATE, type Column } from "./template";
import type { Key } from "./types";

export async function getKey(): Promise<Key> {
  const { data } = await (await createServer()).from("answer_keys").select("test_code,question_no,correct_option");
  const k: Key = {};
  (data ?? []).forEach((r) => ((k[r.test_code] ??= [])[r.question_no - 1] = r.correct_option));
  return k;
}
export async function getTemplate(): Promise<Column[]> {
  const { data } = await (await createServer()).from("settings").select("value").eq("key", "template").maybeSingle();
  const v = data?.value;
  return Array.isArray(v) && v.length === DEFAULT_TEMPLATE.length ? (v as Column[]) : DEFAULT_TEMPLATE;
}
