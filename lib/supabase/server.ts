import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { envReady, publicKey } from "@/lib/supabase/env";
import { redirect } from "next/navigation";
import { cache } from "react";
type C = { name: string; value: string; options: CookieOptions };

/** Server client bound to the session cookies. */
export const createServer = cache(async (): Promise<SupabaseClient> => {
  if (!envReady()) redirect("/setup");
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, publicKey(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: C[]) => { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* read-only in server components */ } },
    },
  });
});

export const getServerUser = cache(async () => (await createServer()).auth.getUser());
