# Tamanna Portal

Private school records, answer-sheet checking, and NCERT Tamanna reports. Next.js, Supabase, and Vercel.

## Run locally

Use Node 24.x (`nvm use` reads `.nvmrc`).

```powershell
npm install
npm run dev
```

Save these settings in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your-school-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
```

The older `NEXT_PUBLIC_SUPABASE_ANON_KEY` is a fallback. The publishable key takes precedence. Missing settings show setup guidance, not sample students or an open admin area.

## School database and admin

1. Run `supabase/schema.sql` in the Supabase SQL Editor. It creates private storage and admin-only rules. It is safe to rerun. Existing legacy roll numbers move to `roll_number`; historical names are left empty for checking. Resolve any existing duplicate rolls in the same class and school before adding the unique identity index.
2. Alternatively, save a Supabase personal access token in `.env.local` as `SUPABASE_ACCESS_TOKEN`, then run `npm run setup:database`. This command is restricted to this school's project.
3. Save the project's server-only secret/service-role key as `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
4. Run `npm run setup:admin`. Sign in as **admin**. Its generated password is saved only in `.env.local` as `ADMIN_PASSWORD`; it is not printed or committed. Existing passwords are unchanged. To deliberately set a new password, update `ADMIN_PASSWORD` locally and run `npm run setup:admin -- --rotate`.
5. Disable public sign-ups in Supabase Authentication settings.

The `admin` username maps to `admin@tamanna.school`. Existing email logins still work. Supabase sessions, the `admins` membership check, and RLS remain mandatory.

Never put an admin password, service-role key, or personal access token in a `NEXT_PUBLIC` setting. Keep `.env.local` private. If a password was previously put in documentation, rotate it.

## Import a folder of PDFs

Run the import locally, not inside a Vercel request. Keep the output folder outside this Git repository. The folder contains names, stable roll mappings, prepared images, and review reports. Back it up privately.

```powershell
npm run copies -- prepare "C:\path\to\student-pdfs" "C:\private\tamanna-import"
npm run copies:key -- read "C:\path\to\official-answer-key.pdf" "C:\private\tamanna-key"
```

Compare **all 240 answers** in `key-candidate.json` against the supplied official key. Resolve every uncertainty before uploading it:

```powershell
npm run copies:key -- upload "C:\private\tamanna-key\key-candidate.json" CONFIRM
npm run copies -- upload "C:\private\tamanna-import"
npm run copies -- reconcile "C:\private\tamanna-import"
npm run copies -- score "C:\private\tamanna-import"
```

- Every PDF receives its own record. Duplicate names are not merged.
- Rolls start at **10001**, assigned in filename order on first preparation. The private manifest keeps them stable on retries. New PDFs get the next unused number. Existing database collisions stop that record rather than overwriting it.
- Names are proposed from filenames. Check handwriting before sharing reports.
- Defaults: Class X; Male when no written gender was read; the configured Jajaur school, Sidhauli block, Sitapur district. Admins can edit these.
- For reviewed written genders, use a private JSON object such as `{"10001":"Male"}` and run `npm run copies -- details "C:\private\tamanna-import" "C:\private\reviewed-genders.json"` before upload. Do not infer gender from names.
- Two-page PDFs propose pages 1 and 2 as the answer sides; verify their order. PDFs with other page counts need an explicit `answerPages` pair in the private manifest. All source pages are preserved even when no answers can be read.
- Uncertain, faint, missing, or misaligned answers stay pending. Open the student, compare the original sheets, correct the marked answers, then choose **Save checked answers and score**.
- Scoring requires a complete official key and complete, unambiguous responses. Changing the key invalidates old scores and verification; re-score afterward. Class or gender changes reset hand verification and use the new booklet norms.
- Import does **not** count as hand verification. Hand check batches of 10–20 before sharing reports.

Uploads use deterministic private paths. A failed operation is listed in `upload-report.json`; rerun `upload` with the same manifest to resume. Files staged before a failed database write remain private at those paths for the retry. The per-student database write is atomic. Reconciliation downloads each original and page image and verifies checksums. Originals are uploaded byte-for-byte, **without black masks or redaction**. White-background previews are separate from the original PDFs.

Results and errors are recorded per PDF. `scoring-report.json` distinguishes scored, pending review, and failed copies. No copy is silently skipped.

## Deploy and publish

Add **only** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to Vercel, then deploy. Provisioning/import commands use private local settings; Vercel does not need the admin password or owner keys.

Node is pinned to 24.x. Vercel uses `npm ci` with the committed lockfile; its install and build commands remove the obsolete `NPM_CONFIG_CACHE_DIR` / `npm_config_cache_dir` setting before starting npm. Use `NPM_CONFIG_CACHE` / `npm_config_cache` if configuring an npm cache explicitly.

The package manifest approves only the reviewed esbuild install script, pinned to its installed version. Review and renew that approval when upgrading esbuild; do not approve all dependency scripts.

Results load student rows on the server. Profiles open as details-only dialogs. Use **Check answers** under **Check** to open original scans, correct responses, and **Confirm and score**. Sheets and private file links load only on demand; closing a dialog cancels its pending read. Reports do not prefetch.

Vercel runs `npm run build`, not the optional test/check suite. For lint-only validation, run `npm run lint -- <changed source files>`. The full checks below remain available when explicitly wanted.

Committing and pushing updates GitHub and can trigger Vercel deployment. It does **not** run database migrations or upload PDFs. Run the setup/import commands separately.

## Checks and source rules

```powershell
npm run typecheck
npm run check:import
npm run check:omr
npm run check:norms
npm run check:report
npm run build
```

Analysis uses only the NCERT Tamanna guide. No combined totals, ranks, or outside interpretations. See `memory-bank/booklet-source.md`. `check:norms` reports the four documented printed overlaps as known information and checks their lower-Sten first-match handling. New gaps, overlaps, or baseline changes fail CI. No printed scoring values are silently changed.

Code: `lib/tamanna` for programme rules, `lib/omr` for reading, `lib/supabase` for connections, `components/features` for interactive screens. Start documentation at `memory-bank/index.md`. Version comes from `package.json`.
