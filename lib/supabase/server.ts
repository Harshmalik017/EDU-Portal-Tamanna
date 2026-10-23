import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { isDemo } from "@/lib/supabase/env";
type C = { name: string; value: string; options: CookieOptions };

/** Server client bound to the session cookies. In demo mode it returns the built-in sample database. */
export async function createServer(): Promise<SupabaseClient> {
  if (isDemo()) return (await import("@/lib/demo/server-client")).createDemoServerClient() as unknown as SupabaseClient;
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: C[]) => { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* read-only in server components */ } },
    },
  });
}
