import { readFile } from "node:fs/promises";

async function main() {
  if (!process.argv.includes("--apply")) throw new Error("Run with --apply to create or migrate the school database.");
  process.loadEnvFile(".env.local");
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url !== "https://zhrlfkvmmrgwainsfyha.supabase.co") throw new Error("Could not set up: the configured project does not match the school project.");
  if (!token) throw new Error("Could not set up the tables. Save SUPABASE_ACCESS_TOKEN in .env.local first.");
  const response = await fetch("https://api.supabase.com/v1/projects/zhrlfkvmmrgwainsfyha/database/query", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: `${await readFile("supabase/schema.sql", "utf8")}\n${await readFile("supabase/portal-update.sql", "utf8")}` }),
  });
  if (!response.ok) throw new Error(`Could not set up the database (${response.status}): ${await response.text()}`);
  console.log("School tables, private storage, and admin-only rules are ready.");
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Could not set up the database."); process.exitCode = 1; });
