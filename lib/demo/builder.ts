/** Tiny PostgREST-style query builder used by demo mode. It records a query and hands it to an executor. */
export type Query = {
  table: string; action: "select" | "insert" | "update" | "delete" | "upsert";
  columns?: string; returning?: string; values?: unknown; filters: [string, unknown][];
  order?: { col: string; asc: boolean }; limit?: number; single?: boolean; maybe?: boolean;
  count?: boolean; head?: boolean; onConflict?: string;
};
export type Result = { data: unknown; error: { message: string } | null; count?: number | null };
export type Exec = (q: Query) => Promise<Result>;

export const DEMO_EMAIL = "demo@tamanna.local";

class Builder implements PromiseLike<Result> {
  private q: Query;
  constructor(table: string, private exec: Exec) { this.q = { table, action: "select", filters: [] }; }
  select(cols = "*", opts?: { count?: string; head?: boolean }) {
    if (this.q.action === "select") { this.q.columns = cols; this.q.count = !!opts?.count; this.q.head = !!opts?.head; } else this.q.returning = cols;
    return this;
  }
  insert(v: unknown) { this.q.action = "insert"; this.q.values = v; return this; }
  update(v: unknown) { this.q.action = "update"; this.q.values = v; return this; }
  upsert(v: unknown, opts?: { onConflict?: string }) { this.q.action = "upsert"; this.q.values = v; this.q.onConflict = opts?.onConflict; return this; }
  delete() { this.q.action = "delete"; return this; }
  eq(col: string, val: unknown) { this.q.filters.push([col, val]); return this; }
  order(col: string, opts?: { ascending?: boolean }) { this.q.order = { col, asc: opts?.ascending !== false }; return this; }
  limit(n: number) { this.q.limit = n; return this; }
  single() { this.q.single = true; return this; }
  maybeSingle() { this.q.maybe = true; return this; }
  then<A = Result, B = never>(ok?: ((v: Result) => A | PromiseLike<A>) | null, no?: ((e: unknown) => B | PromiseLike<B>) | null) {
    return this.exec(this.q).then(ok, no);
  }
}

/** Mirrors the small part of the Supabase client this app uses (from, rpc, auth, storage). */
export function makeClient(exec: Exec) {
  const user = { id: "demo-user", email: DEMO_EMAIL };
  return {
    from: (table: string) => new Builder(table, exec),
    rpc: async (name: string) => ({ data: name === "is_admin" ? true : null, error: null }),
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
      getSession: async () => ({ data: { session: { user } }, error: null }),
      signInWithPassword: async () => ({ data: { user }, error: null }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ data: {}, error: null }),
    },
    // Demo mode does not store photos: uploads succeed, there is nothing to show.
    storage: { from: () => ({
      upload: async () => ({ data: {}, error: null }),
      remove: async () => ({ data: [], error: null }),
      createSignedUrls: async () => ({ data: [], error: null }),
    }) },
  };
}
