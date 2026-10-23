import type { Query, Result } from "./builder";
import { getDb, type Db, type Row } from "./store";

const fail = (message: string): Result => ({ data: null, error: { message } });

function splitTop(s: string) {
  const out: string[] = []; let d = 0, cur = "";
  for (const ch of s) { if (ch === "(") d++; if (ch === ")") d--; if (ch === "," && d === 0) { out.push(cur); cur = ""; } else cur += ch; }
  if (cur) out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}
/** Supports "a,b", "*", and embedded child rows like "scores(test_code,correct)". */
function project(row: Row, cols: string, db: Db): Row {
  const out: Row = {};
  for (const p of splitTop(cols)) {
    const m = p.match(/^(\w+)\((.*)\)$/);
    if (m) out[m[1]] = (db[m[1]] ?? []).filter((r) => r.student_id === row.id).map((r) => project(r, m[2], db));
    else if (p === "*") Object.assign(out, row);
    else out[p] = row[p];
  }
  return out;
}
function defaults(table: string): Row {
  const base: Row = { id: crypto.randomUUID() };
  if (table === "students") return { ...base, excluded: false, exclude_reason: null, verification_status: "pending", verified_by: null, verified_at: null, manual_scores: null, verification_note: null, created_at: new Date().toISOString() };
  if (table === "submissions") return { ...base, created_at: new Date().toISOString() };
  if (table === "scores") return base;
  return {};
}
function shape(q: Query, rows: Row[], db: Db, cols: string | undefined): Result {
  const data = cols === undefined ? null : rows.map((r) => project(r, cols, db));
  if (data && q.single) return data.length === 1 ? { data: data[0], error: null } : fail("Expected a single row");
  if (data && q.maybe) return { data: data[0] ?? null, error: null };
  return { data, error: null };
}

/** Runs one recorded query against the in-memory demo database (server only). */
export async function execDemo(q: Query): Promise<Result> {
  const db = getDb(); const rows = db[q.table];
  if (!rows) return fail(`Unknown table ${q.table}`);
  const match = (r: Row) => q.filters.every(([c, v]) => r[c] === v);
  const list = (v: unknown) => (Array.isArray(v) ? v : [v]) as Row[];

  if (q.action === "select") {
    let found = rows.filter(match); const count = found.length;
    if (q.order) { const { col, asc } = q.order; found = [...found].sort((a, b) => ((a[col] as string) > (b[col] as string) ? 1 : (a[col] as string) < (b[col] as string) ? -1 : 0) * (asc ? 1 : -1)); }
    if (q.limit !== undefined) found = found.slice(0, q.limit);
    if (q.head) return { data: null, error: null, count };
    return { ...shape(q, found, db, q.columns ?? "*"), count: q.count ? count : null };
  }
  if (q.action === "insert") {
    const added = list(q.values).map((v) => ({ ...defaults(q.table), ...v }));
    rows.push(...added); return shape(q, added, db, q.returning);
  }
  if (q.action === "upsert") {
    const keys = q.onConflict?.split(",") ?? (q.table === "settings" ? ["key"] : []);
    const out: Row[] = [];
    for (const v of list(q.values)) {
      const hit = keys.length ? rows.find((r) => keys.every((k) => r[k] === v[k])) : undefined;
      if (hit) { Object.assign(hit, v); out.push(hit); } else { const n = { ...defaults(q.table), ...v }; rows.push(n); out.push(n); }
    }
    return shape(q, out, db, q.returning);
  }
  if (q.action === "update") {
    const hit = rows.filter(match); hit.forEach((r) => Object.assign(r, q.values as Row)); return shape(q, hit, db, q.returning);
  }
  // delete (students cascade to their scores and submissions, like the real schema)
  const gone = rows.filter(match); const ids = new Set(gone.map((r) => r.id));
  db[q.table] = rows.filter((r) => !gone.includes(r));
  if (q.table === "students") { db.scores = db.scores.filter((r) => !ids.has(r.student_id)); db.submissions = db.submissions.filter((r) => !ids.has(r.student_id)); }
  return shape(q, gone, db, q.returning);
}
