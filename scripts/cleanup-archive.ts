import { createClient } from "@supabase/supabase-js";
import { purgeArchivedStudents } from "../lib/supabase/archive";

async function main() {
  if (!process.argv.includes("--apply")) throw new Error("Run with --apply to permanently delete students archived for at least 30 days.");
  if (!process.env.CI) process.loadEnvFile(".env.local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Could not clean the archive: missing server connection settings.");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const deleted = await purgeArchivedStudents(client);
  console.log(`Archive cleanup complete: ${deleted} expired students permanently deleted.`);
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Could not clean the archive."); process.exitCode = 1; });
