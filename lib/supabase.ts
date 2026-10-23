import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createDemoBrowserClient } from "./demo/client";
import { isDemo } from "./env";

/** Browser client (singleton). In demo mode (no keys) it talks to the built-in sample data instead. */
export const supabase: SupabaseClient = isDemo()
  ? (createDemoBrowserClient() as unknown as SupabaseClient)
  : createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
