import { randomBytes } from "node:crypto";
import { appendFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_EMAIL } from "@/lib/supabase/admin-identity";

async function main() {
  process.loadEnvFile(".env.local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Could not set up admin. Add the project URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.");
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  let userId: string | undefined;
  for (let page = 1; ; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error(`Could not check the admin account: ${error.message}`);
    userId = data.users.find((u) => u.email === ADMIN_EMAIL)?.id;
    if (userId || data.users.length < 100) break;
  }
  const rotate = process.argv.includes("--rotate");
  if (!userId || rotate) {
    let password = process.env.ADMIN_PASSWORD;
    if (!password) {
      password = randomBytes(30).toString("base64url");
      await appendFile(".env.local", `\n# Local admin provisioning only. Never NEXT_PUBLIC.\nADMIN_PASSWORD=${password}\n`, { mode: 0o600 });
    }
    if (password.length < 16) throw new Error("Could not set up admin. Use an ADMIN_PASSWORD with at least 16 characters.");
    if (userId) {
      const { error } = await sb.auth.admin.updateUserById(userId, { password });
      if (error) throw new Error(`Could not update the admin password: ${error.message}`);
    } else {
      const { data, error } = await sb.auth.admin.createUser({ email: ADMIN_EMAIL, password, email_confirm: true });
      if (error) throw new Error(`Could not create admin: ${error.message}`);
      userId = data.user.id;
    }
  }
  const { error } = await sb.from("admins").upsert({ user_id: userId }, { onConflict: "user_id" });
  if (error) throw new Error(`Could not grant admin access. Run supabase/schema.sql, then run this command again: ${error.message}`);
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (token) {
    const ref = new URL(url).hostname.split(".")[0];
    const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ disable_signup: true }),
    });
    if (!response.ok) throw new Error(`Admin exists, but could not disable public sign-ups (${response.status}). Disable sign-ups in Supabase before sharing the portal.`);
  }
  console.log("Admin account ready. Sign in as admin. The password is in .env.local under ADMIN_PASSWORD. Existing passwords are not changed without --rotate.");
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Could not set up admin."); process.exitCode = 1; });
