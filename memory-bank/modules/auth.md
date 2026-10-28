# Module: Auth
Supabase Auth email/password, refreshed by `proxy.ts`. The admin server layout checks `is_admin()` before rendering; every data table and the private `sheets` bucket use admin-only RLS.

- Use `lib/supabase/client.ts` for browser actions and `lib/supabase/server.ts` for server reads.
- Prefer `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; the older anon-key variable remains a fallback. Missing or placeholder settings lead to setup, never a fake login.
- Username `admin` maps to `admin@tamanna.school`. Existing email logins remain supported.
- Run `npm run setup:admin` locally with the private service-role key. It creates admin membership, disables public signup, and saves a generated password as `ADMIN_PASSWORD` only in ignored `.env.local`. Existing passwords change only with `--rotate`.
- Vercel needs only the public project URL and publishable key. Never deploy owner tokens, service-role keys, or the admin password.
- Keep the login branding, Home link, programme footer, developer link, and version. Password recovery is not offered in the UI.
