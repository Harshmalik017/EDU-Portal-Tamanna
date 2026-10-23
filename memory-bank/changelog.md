# Changelog
Format: [Keep a Changelog](https://keepachangelog.com), versions follow [SemVer](https://semver.org). See `versioning.md`.

## [0.8.1] - 2026-10-23
### Fixed
- Added `vercel.json` pinning the Next.js framework preset, install/build commands and output directory, so the Vercel project deploys to a working app instead of a platform 404 (a zip upload with a nested folder or a wrong Root Directory used to leave Vercel without `package.json`)

## [0.8.0] - 2026-10-23
### Changed
- **UI aligned with the LMS shell**: left sidebar with grouped navigation and active state, sticky top bar with user name and red Logout button, mobile drawer with red close button, content area with VersionBadge
- Sidebar now pins Set-up items (Answer key, Calibrate, Logs) in a System group; demo chip kept in the footer
- New `/admin/logs` page listing recent scan activity
- PageHeader gains an optional icon and meta slot; StatCard supports coloured tones (green, blue, amber, violet, red)
- Dashboard stat cards use distinct colours; landing-page cards (key facts, sub-tests, in-schools) are colour-accented; landing header gains a section menu
### Added
- `components/layout/TopBar.tsx` top bar component
### Fixed
- Landing page section navigation now reachable from the header on large screens

## [0.7.0] - 2026-10-23
### Changed
- **Code organised by area**: `lib/tamanna` (tests, norms, booklet, profile, programme text), `lib/omr` (reader, template, image), `lib/supabase` (client, server, data, env), `lib/demo`, `lib/types.ts`
- **Simpler language** everywhere: page titles without subtitles, shorter labels, short messages, trimmed landing copy and headings
- **Categorised messages**: toasts are success, warning, error or info, each with its own colour and icon (`components/Toast.tsx`); statuses (Verified, Mismatch, Pending, Excluded) are colour-coded badges
- Landing page: plain section headings, shorter text; programme content in `lib/tamanna/program.ts`
- Performance: brand images cached for a year, hero image sized per screen
### Fixed
- Results page showed every student as Pending: it did not load verification and excluded status

## [0.6.0] - 2026-10-23
### Changed
- **Navigation moved to a left sidebar** (grouped: Workspace, Set-up; active state; Sign out; demo chip). On phones and tablets it is a slide-in drawer from the left (menu button in a slim bar, Esc and tap-outside close it). The old top navigation is removed
- Landing page: section menu is a sticky left "On this page" rail (chip row on small screens); the header holds only the logo and Admin login
- Refined, more professional look: Inter font, restrained soft-clay surfaces (16px radius, hairline borders, softer shadows), smaller consistent buttons, structured page headers
- New shared components: `PageHeader`, `Badge`, `StatCard`; `Card` accepts `title`, `description`, `actions`; dashboard rebuilt with stat cards and a class filter
### Removed
- `components/AdminNav.tsx` (replaced by `components/layout/Sidebar.tsx`)

## [0.5.1] - 2026-10-23
### Changed
- Landing page now leads with the Tamanna programme (what aptitude is, the three components, seven sub-tests with item formats and related areas, how the test is conducted, scoring, Sten levels, the booklet's Manju example, careers linked to aptitudes, cautions, credits) and presents the portal as the scoring and reporting support used for the programme
- Copyright line with the developer's LinkedIn link below the footer
- Landing content lives in `lib/tamanna/program.ts`; every item comes from the guide only

## [0.5.0] - 2026-10-23
### Added
- **Demo mode**: with no real Supabase keys the app runs on built-in sample data (24 students including the booklet's Manju example; verified, mismatch, excluded and pending cases; a made-up answer key) and skips login. Everything works: scan, review, verify, reports, key editor, calibration. "Reset demo data" button; "Use sample answers (demo)" on the scan page. Switches off automatically when real keys are set (the demo API returns 404)
- `lib/demo/*`: mock of the Supabase calls this app uses, backed by in-memory data on the server
### Fixed
- npm: removed the vulnerable build-tool chain (Tailwind 3 and ESLint plugin dependencies); `npm audit` reports 0 and install shows no deprecation warnings
### Changed
- Tailwind CSS 3 to 4 (CSS-first config in `app/globals.css`; `tailwind.config.ts` removed); clay styles are now `@utility` rules
- ESLint removed (it caused the deprecated and vulnerable packages); use `npm run typecheck`
- `/setup` explains demo mode; the browser needs Chrome 111+, Safari 16.4+ or Firefox 128+ (Tailwind 4)
### Notes
- Demo data lives in server memory: it resets when the server restarts and is not shared between serverless instances (fine locally; do not use for real records)

## [0.4.1] - 2026-10-23
### Fixed
- Crash "Your project's URL and Key are required" when `.env.local` is missing: the app now redirects to a `/setup` guide; `npm run dev` creates `.env.local` from the example automatically; placeholder keys are detected
- A missing database now shows a setup hint instead of a confusing "not an admin" message
- Security: upgraded Next.js 14.2.15 to 16.4.2 (14.x has unpatched advisories) with React 19
### Changed
- Brand and theme: project is now **Tamanna Portal**; palette from the booklet (lime `#cadd69`, green `#6eaf4d`); logo, cover illustration and icons extracted from the guide PDF (`public/brand/`)
- Next 16 migration: async `cookies()`/`params`/`searchParams`, `middleware.ts` renamed `proxy.ts`, ESLint 9 flat config (`npm run lint` runs `eslint .`)
- Requires Node 20.9 or newer (`.nvmrc` = 22)

## [0.4.0] - 2026-10-22
Aligned the app with the Tamanna Guide for Teachers and Parents (NCERT). Rule from the manager: analysis must use only the booklet.
### Added
- Sten conversion from Appendix IV/V norms (Class IX and X; boys, girls, combined) and Low/Average/High levels (Appendix VI)
- Personal report, 3 pages per student (booklet Report Sheet layout: score, Sten, performance, Sten profile chart, descriptions, remarks, occupations from Appendix VII); print or save as PDF; bulk "Print all reports" by class
- Cross-verification: `/admin/verify` serves a batch of 10-20 sheets; enter manual scores and the app compares; status Verified / Mismatch / Pending, shown on reports, results and dashboard; prompt when 10+ are waiting
- Pattern rule (p.10): sheets with all-same or alternating answers are flagged and can be excluded from analysis
- Dashboard now shows High/Average/Low counts and average raw score per sub-test, with class filter
- `npm run check:norms` (table consistency + booklet's Manju example) and `npm run check:report`
### Changed
- Double-marked items are "not scored" (booklet), no longer counted as wrong
- Class is IX or X only; gender Male/Female/Not specified (combined norms)
- Answer sheet sides are labelled Side 1 / Side 2 (the booklet's sample sheet is pages 16-17)
- Results and CSV show raw score + Sten + level per sub-test
### Removed
- Total score and total-score distribution (not in the booklet), and the SQL views behind them
### Migration
- Re-run `supabase/schema.sql`
### Known data issue
- 4 overlapping ranges in the printed norms (see `booklet-source.md`)

## [0.3.1] - 2026-10-22
Hardening release: structure, rendering, security, performance. No new user features.
### Changed
- Pages are now thin server components; interactive parts live in `components/features/*`
- Auth moved to `@supabase/ssr` cookies + `middleware.ts`: `/admin` is blocked before render (no more "Checking session" flash)
- Dashboard, results, student, answer key, scan and calibrate data is fetched on the server (no client round-trips on load; answer key and template are no longer re-fetched on every "Check sheet")
- Dashboard reads two small SQL views instead of downloading every student
- Uploaded sheet photos are compressed (max 1800px, JPEG 0.8) to protect the free 1 GB storage
- Camera screen is lazy-loaded; `lucide-react` imports are optimised
- Mobile: `100dvh`, iOS-safe background, safe-area padding, lighter shadows, 44px minimum touch targets
### Fixed
- Camera stream could stay on if the dialog closed before permission was granted
- Preview/CSV object URLs and image bitmaps were never released (memory leak)
- A failed save could leave a student without scores; it now rolls back
### Security
- Any signed-in user could read data. Access is now limited to users in the `admins` table (`is_admin()` in RLS and storage)
- Security headers (nosniff, frame deny, referrer policy, camera-only permissions policy); `X-Powered-By` removed
- Added `.eslintrc.json`, `engines`, `loading.tsx`, skip-to-content link
### Migration
- Re-run `supabase/schema.sql`, then add yourself: `insert into admins (user_id) select id from auth.users where email = 'you@school.org';` (without this you will be redirected to login)

## [0.3.0] - 2026-10-22
### Added
- Answer key editor (tap grid per test, CSV paste/upload, per-test counts)
- Calibration page with sliders and live overlay; layout saved in Supabase `settings` and shared across devices
- In-app camera with page frame; rotate, retake and drag-and-drop for each page
- Review screen shows a zoomed crop of each flagged row
- Dashboard (student count, average per test, score distribution), Results page with sorting and pagination, card layout on mobile
- Student detail page: edit, delete, scorecard, original scanned sheets (Supabase Storage bucket `sheets`)
- Class/gender dropdowns, duplicate-student warning, toasts, loading skeletons
- Login: show/hide password, forgot password; 404 and error pages; favicon; PWA manifest; landing "How it works" and footer
### Changed
- Faded text darkened for contrast; larger touch targets on review buttons
- `inspectPage` takes a template argument; `TEMPLATE` renamed `DEFAULT_TEMPLATE`
### Migration
- Run the "v0.3.0 additions" block at the end of `supabase/schema.sql`.

## [0.2.0] - 2026-10-22
### Added
- Debug overlay: shows sampled bubbles over each scanned page (green read, red double-marked, orange blank)
- Image quality check (too dark, overexposed, low contrast, blurry)
- Review screen: fix double-marked or blank answers in one tap; scores update live
- Results: search by name or school, filter by class, total column
- App version shown in footer; version is read from `package.json`
### Changed
- OMR threshold now scales with each row's background brightness
- `readPage` replaced by `inspectPage` (returns answers, quality, overlay)
- CSV export respects filters and quotes names

## [0.1.0] - 2026-10-22
- Project scaffold: landing, admin login, results table, scan page
- Supabase schema with RLS, OMR reader with grid template
- Memory bank, README, agent files
