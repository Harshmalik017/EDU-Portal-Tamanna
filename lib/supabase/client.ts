import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicKey } from "@/lib/supabase/env";

let client: SupabaseClient | undefined;
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    client ??= createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, publicKey());
    const value = Reflect.get(client, property);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
