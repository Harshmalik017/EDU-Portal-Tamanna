# Tamanna Portal
Scan school aptitude OMR sheets (LA, AR, VR, MR, NA, SA, PA) with a phone or upload scans, auto-score, and store results. Next.js + Supabase + Vercel, all free tier. Claymorphism blue UI.

## Quick start (Windows PowerShell, macOS, Linux)
Requires **Node 20.9 or newer** (check with `node -v`; install the LTS from nodejs.org).
```
npm install
npm run dev
```
**No database needed to try it.** Without Supabase keys the app runs in **demo mode** on sample data (24 students, a made-up answer key, no login wall). Open http://localhost:3000/admin. The first `npm run dev` also creates `.env.local` for you.

To use real data, open http://localhost:3000/setup and follow the three steps:
1. Paste your Supabase **Project URL** and **anon key** into `.env.local`, then stop (Ctrl+C) and run `npm run dev` again.
2. Run `supabase/schema.sql` in the Supabase SQL Editor (safe to re-run).
3. Create your login under Authentication, turn off sign-ups, then run: `insert into admins (user_id) select id from auth.users where email = 'you@school.org';`

Checks: `npm run typecheck`, `npm run check:norms`, `npm run check:report`.

Demo mode switches off by itself as soon as real keys are in `.env.local`. The demo answer key is made up and is not the Tamanna scoring key.

## Tamanna rules
Scores convert to Sten using the booklet norms; reports are built only from the booklet. Get the scoring key from NCERT (tamanna.ncert@ciet.nic.in) and enter it under **Answer key**. Cross-verify every 10-20 sheets under **Verify**. Read `memory-bank/booklet-source.md`.

## Deploy
Push to GitHub, import in Vercel, add the two env vars.

## Structure
```
app/            routes (landing, login, admin)
components/ui/  reusable clay components
lib/            supabase client, OMR engine, template, tests
supabase/       SQL
memory-bank/    PRD, tech stack, design, modules, changelog
```
Current version: see `package.json` (0.9.0). Docs start at `memory-bank/index.md`.
