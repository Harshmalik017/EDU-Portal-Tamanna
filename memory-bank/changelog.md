# Changelog
Format: [Keep a Changelog](https://keepachangelog.com), versions follow [SemVer](https://semver.org). See `versioning.md`.

## [0.18.0] - 2026-10-29
### Added
- Direct M controls on each themed question row. M retains the existing MULTI response and is not scored; choosing A–D replaces it. Show M = Multi select at the top right and highlight the entire multiple-mark row light red.
### Fixed
- Increase amber review-row contrast and add a visible amber border. Remove the circle-editing helper line.
- Remove the Name field from both themed pages and their two-page PDF export. Keep admin lists, dialog identification, and original scans unchanged.
- Turn OMR Sheet buttons green when all seven sections have no unresolved answers; pending, missing, and excluded copies remain blue. This readiness color is not a human-verification stamp.
- Keep the results page mounted beneath individual reports using an intercepted parallel route. Close/back restores filters, pagination, scroll, and focus instead of navigating to a fresh results page. Direct report URLs retain a results fallback.
- Narrow individual report dialogs to 820px. Increase body/recommendation text on screen and in print, distribute meaning cards over the page, enlarge the score table/chart, and keep the signature at the foot of the remarks page. Print only the report, never the underlying results list.
### Validation
- Production build/typecheck, report/themed-sheet assertions, name-free CSV, booklet norms, and changed-source lint passed.
- Authenticated browser checks passed for direct M editing and reset, full-row highlights, name-free two-page Theme UI PDF export, green ready buttons, and mobile/tablet/desktop sizing. No student answers were saved during testing.
- Report open/close preserved the original results DOM, search, pagination, scroll, and focus with no results reload. Back/forward navigation, direct URLs, Hindi default, language switching, and keyboard containment passed.
- Ten Hindi/English dense, mixed, average, pending, and all-near-High fixtures each printed exactly three unclipped A4 pages at 10.5pt body and 10pt recommendations. Intercepted printing hid the underlying table; mobile printing and zero browser runtime errors were confirmed.

## [0.17.0] - 2026-10-29
### Added
- Hindi-default individual report dialogs with a top-corner Hindi/English selector. All three pages, chart labels, booklet descriptions, suggestions, source citations, and print output switch together. Direct report URLs remain supported.
- A private, resumable two-page rescan workflow for the existing 129 students, with original-PDF checksums, recovery snapshots, and final database reconciliation. Rescans intentionally overwrite manual answers; unreadable answers and nonstandard originals explicitly require review.
- An additive admin-restricted transactional rescan RPC that checks the key, latest submission, saved responses, source hash, and demographics before replacing answers and invalidating stale final scores.
- Synthetic checks for both report languages, name-free CSV, all 240 response positions, PA coverage, and transactional rescan failure/retry behavior.
### Fixed
- Read the full lower OMR answer area. Exclude practice rows and footer glyphs by matching answer-row spacing, cluster against the median column position, and avoid duplicate reconstructed rows. Unalignable columns remain uncertain rather than shifting question numbering.
- Change STEM SCORE to STEN SCORE in desktop and mobile results.
- Remove student names and name placeholders from individual/bulk reports, report props, dialog titles, and printed output. Remove the Name column and its values from Excel-compatible CSV exports; retain admin names and original documents unchanged.
- Keep uncertain and excluded scores out of final report interpretations. Add explicit dialog focus cycling and print expansion so all three A4 pages print without modal clipping.
### Validation
- Typecheck, production build, booklet norms, calibrated OMR, importer, report, rescan, and export checks passed.
- Browser checks passed for report links/direct URLs, Hindi default/reset, language switching, keyboard containment, Escape closing, mobile layout, CSV/report privacy, and three-page A4 output without clipping in both languages, including dense recommendation fixtures.
- Applied and reconciled all 129 live replacements against their original PDFs and key snapshot: 30,960 represented answer positions; 2 fully scored copies and 127 copies with Review Pending. One stored original contains three blank pages instead of two answer pages and needs a replacement scan. All 259 source pages were retained; no student identity or original file reference changed.
- Spot-checked both-page first/last answer crops at nine checkpoints spanning batches of 15 records, including both PA columns. This is not a human verification of every answer.
- Rescan transaction checks passed with rolled-back synthetic records, covering overwrite, atomic scoring, stale-score invalidation, stale keys, concurrent edits, incomplete scans, retries, and anonymous/non-admin denial.
- Changed-source lint passed with zero warnings. Full-repository lint remains blocked by the pre-existing `console` no-undef error in `scripts/setup.js`.

## [0.16.1] - 2026-10-29
### Fixed
- Remove the inherited soft-clay background gradient from the OMR Sheet action. White labels now sit on solid dark blue, including the Review Pending line.
- Keep an 80px desktop icon rail when the sidebar is collapsed, with accessible link labels, tooltips, active indicators, and matching content/loading offsets. Mobile drawer behavior is unchanged.
### Validation
- Changed-source lint passed with zero warnings. No tests, builds, typechecks, browser checks, or live-data checks were run, as requested.

## [0.16.0] - 2026-10-29
### Added
- Top-bar desktop sidebar collapse/expand and mobile menu controls through a client shell, preserving server-rendered page data. Mobile navigation supports focus trapping, Escape, focus restoration, and responsive scroll-lock cleanup.
- Direct correction through Theme UI circles on both OMR pages and student details. Question-number menus retain Blank, Multiple marks, and Needs checking choices; page controls show outstanding review counts.
### Changed
- Blue OMR Sheet buttons show Review Pending on a smaller second line inside the button only when answers are uncertain. Remove Review scan / Confirm blurry answers captions and per-section Provisional/blurry lines without changing marks or final-Sten safeguards.
- Replace the editable Check marked answers section with the themed editor. Keep transactional Confirm and score, key fingerprint checks, explicit uncertainty, private on-demand loading, and disabled edits while saving.
- Widen OMR dialogs to 1600px, reserve a full theme panel in wide comparisons, stack smaller comparisons, and adapt sheet columns to eliminate internal horizontal scrolling. PDF export retains two read-only four-column pages.
### Validation
- Changed-source lint passed with zero warnings. No tests, builds, typechecks, browser checks, or live-data checks were run, as requested.

## [0.15.1] - 2026-10-29
### Changed
- Merge Check into one OMR Sheet action that opens the scan and answer confirmation together; remove the duplicate sheet action.
- Move class and gender from separate results columns into differently colored pills below student names, including mobile cards.
- Show Section Score above a colored STEM SCORE pill in every section. The pill uses the existing booklet Sten value; blurry sections retain provisional marks and withhold final Sten.
### Validation
- Changed-source lint passed with zero warnings. No tests, builds, typechecks, browser checks, or live-data checks were run, as requested.

## [0.15.0] - 2026-10-29
### Added
- Profile settings with display-name editing and password changes after current-password confirmation. Passwords stay in Supabase Auth, never in logs.
- Dedicated activity logs with category filters, 25-row server pagination, stable time/ID ordering, IST timestamps, and read-only admin RLS. Database triggers record scans, scoring, student edits, answer-key edits, and settings; account-settings actions are explicitly client-reported.
- Additive `supabase/portal-update.sql`, included in the database setup command. Historical uploads are backfilled once; historical edits are not invented.
- Two-page Theme UI PDF export through the browser's Print / Save as PDF dialog.
### Changed
- Results show current-key marks from saved scans. Blurry sections show the known-answer marks as provisional with unreadable-answer counts, not invented answers or final Sten levels.
- Replace verification badges with Review scan / Confirm blurry answers buttons; remove hand-check actions from results and student details. Answer correction still saves final scores atomically after all uncertain answers are resolved.
- Scan-result aggregates run inside admin-only `scan_results()` and return compact rows; no per-student responses, keys, or signed URLs are preloaded.
### Fixed
- Use a stable four-column themed sheet for both pages, keeping PA across two columns. Fixed-size bubbles and dedicated number cells no longer spill when the comparison panel is narrow; narrow panels scroll horizontally.
- Remove the page-number suffix from the answer-sheet subheading.
### Validation
- Changed-source lint passed with zero warnings. Applied the schema and additive portal update to the school Supabase project. No tests, builds, typechecks, browser checks, or live-data checks were run, as requested.

## [0.14.1] - 2026-10-29
### Fixed
- Validate and normalize nullable Supabase signed-file paths and URLs before creating sheet responses, fixing the Vercel TS2322 build error without type assertions or nullable image links. Incomplete signing results fail explicitly.

## [0.14.0] - 2026-10-29
### Added
- Results-page profile dialogs without a scorecard, sharing the existing student detail form.
- A Check answers button under Check, opening original scans and editable responses with atomic Confirm and score.
- A private, admin-only, uncached endpoint for one student's sheet; requests cancel when its dialog closes.
### Changed
- Results SSR loads only compact student rows. Answer keys, submissions, and signed file links load on user action, not for every student upfront.
- Lazy-load dialog code, share auth reads per server render, disable report/print prefetch, and show a results loading state.
- Remove Verified by hand, Score differences, and Excluded sheets cards. Keep search, sorting, CSV, reports, OMR comparison, and hand checks.
- Add ESLint for lint-only local validation. Vercel runs the production build without the optional test/check suite; manual testing is requested for this release.
### Fixed
- Pin Node to 24.x in the package manifest and local version file; install reproducibly with `npm ci` on Vercel.
- Remove obsolete npm cache-dir environment settings from Vercel's install/build commands and explicitly approve only the reviewed esbuild install script.
- Remove the redundant experimental lucide-react import setting; Next.js already optimizes it by default.
- Label the four documented booklet overlaps as known source issues, preserve lower-Sten first-match behavior, and fail CI for unexpected norm problems or source-baseline changes. No scoring values changed.

## [0.13.0] - 2026-10-28
### Added
- Private, resumable school-PDF import commands with stable five-digit rolls, separate names, editable demographics, checksum reconciliation, and explicit review reports.
- Fixed `admin` login backed by Supabase Auth; local database/admin setup commands and publishable-key support.
- Answer correction and transactional scoring against the current official key. Uncertain readings stay pending; key and demographic changes reset verification.
### Changed
- Remove runtime demo data, sample scans, and fake-login fallback. Missing connection settings show setup guidance.
- Preserve original PDFs byte-for-byte, with no black header mask. Keep private signed links, sequential camera capture, calibrated reading, OMR comparison, manual checking, and the newer three-page report layout.
- Show student names and rolls separately in results, search, CSV, profiles, and report headers; include block and district.

## [0.12.7] - 2026-10-27
### Fixed
- **Theme OMR page two**: give the PA section two columns and wrap bilingual headings to prevent overlap; clarify green correct, light-red incorrect, and unkeyed response colors

## [0.12.6] - 2026-10-27
### Fixed
- **OMR detection**: classify filled bubble interiors using brightness, row-relative contrast, and variance; account for page skew; preserve older saved calibrations; and restore every response in the bundled demo scan
- **OMR correctness colors**: show correct responses in green and incorrect responses in light red when a real answer key is available; keep invented demo-key results neutral. Add `npm run check:omr` to verify detector cases and response counts for every test.

## [0.12.5] - 2026-10-27
### Changed
- **OMR comparison**: enlarge the original scanned page and dialog, use four Theme UI columns on wide screens, and place the original scan download beside the page controls
- **Scrollbars**: apply the Tamanna green theme to scrollbars throughout the portal

## [0.12.4] - 2026-10-27
### Changed
- **Report navigation**: keep Back to Student Reports on the left and move print to the right; remove Back to profile
- **Results exports and legend**: label CSV export clearly, style it green, and show performance ranges as colored pills
- **OMR comparison**: display the same selected original page beside its Theme UI page in the sheet dialog
### Fixed
- **Sten chart**: move band labels outside the plot so they no longer overlap the final bar

## [0.12.3] - 2026-10-27
### Changed
- **Student reports**: use a single report title, remove the verification stamp, and redesign score meanings and suggestions as cited, color-coded icon cards
- **Report printing**: align all three pages to A4 portrait and refine the Sten chart typography and proportions

## [0.12.2] - 2026-10-27
### Fixed
- **OMR sheet masking**: reduce the identifying header mask so section headings remain visible
- **Theme OMR layout**: show three sections per row on wide screens to better match the original sheet

## [0.12.1] - 2026-10-27
### Added
- **Demo OMR record**: include the masked two-page student sheet, PDF record, and detected responses in Student Reports
### Fixed
- **OMR response preview**: color detected responses blue and multiple marks red in the themed sheet

## [0.12.0] - 2026-10-27
### Added
- **OMR sheet preview**: show the original masked scan and a themed response sheet with Hindi and English section names after scanning and from Student Reports
### Fixed
- **OMR section labels**: make bilingual section names clear in the themed sheet preview

## [0.11.0] - 2026-10-27
### Added
- **Student answer review**: show each detected response beside its keyed answer on the scan and student profile pages; incorrect responses are red and correct responses blue
- **PDF records**: keep a private, name-masked copy of each uploaded answer-sheet PDF with the student's scanned pages
### Changed
- **PDF upload**: process both pages and reject PDFs with additional pages for one student

## [0.10.0] - 2026-10-27
### Added
- **Answer-sheet scanning**: upload one two-page PDF or scan pages sequentially; student-name areas are masked before review and storage
### Changed
- **Demo data**: reduced the sample dataset to one male Class IX student with school information blank

## [0.9.17] - 2026-10-26
### Changed
- **Dashboard and demo banner**: expanded dashboard summary cards across the row and renamed the notice to "Demo Data Mode: showing sample student records."

## [0.9.16] - 2026-10-26
### Changed
- **Student reports**: moved verified, score difference, and excluded counts from Dashboard to Student Reports; completed checks now show Recheck instead of Hand Check
- **Admin navigation loading**: show an immediate skeleton when switching pages from the sidebar or mobile navigation

## [0.9.15] - 2026-10-26
### Changed
- **Login page**: styled the demo notice red, added a branded logo and Home action to the top bar, and matched the landing-page footer with programme note, developer details, and version

## [0.9.14] - 2026-10-26
### Changed
- **Landing page**: removed the In schools section, scoring-key request contact, guide credits, and the now-unused Schools menu link

## [0.9.13] - 2026-10-26
### Changed
- **Regional branding**: added Uttar Pradesh beneath the Tamanna logo throughout the portal and identified Uttar Pradesh on the landing page

## [0.9.12] - 2026-10-26
### Changed
- **Admin navigation and charts**: added a mobile bottom navigation with a round center Check Sheets action, icons beside admin page headings, and a two-column dashboard chart layout on wider screens
### Fixed
- **Student report navigation**: added a direct Back to Student Reports action on individual report pages

## [0.9.11] - 2026-10-26
### Changed
- **Sidebar and demo controls**: applied the Tamanna green theme to sidebar surfaces and styled Reset sample data as a button
- **Student report actions**: replaced View Report text with Report, added Profile navigation, and added a red delete action that removes student files and records

## [0.9.10] - 2026-10-26
### Changed
- **Student reports and dashboard gender counts**: show gender in the desktop and mobile student reports list and display Male and Female student counts on the dashboard
- **Demo records**: explicitly type all demo student genders and document the 12/12 sample distribution

## [0.9.9] - 2026-10-26
### Changed
- **Student reports table**: added a brand-green table header, defined cell borders, and row hover styling while retaining horizontal scrolling on smaller screens

## [0.9.8] - 2026-10-26
### Changed
- **Dashboard performance chart**: added level-colored legend pills and labels inside each bar; moved student counts below the bars with matching level colors

## [0.9.7] - 2026-10-26
### Changed
- **Dashboard and demo label**: removed scan, print-report, and hand-check prompt actions from the dashboard; renamed the sidebar indicator to Demo Data

## [0.9.6] - 2026-10-26
### Changed
- **Student reports and manual check**: moved individual manual score comparison into Student Reports, with a page-level action and per-student action; the former Hand Check route now redirects to Student Reports
- **Report action**: added a light-blue View Report button to student rows

## [0.9.5] - 2026-10-26
### Changed
- **Responsive content width**: remove narrow max-width constraints on admin pages and the landing page, using consistent responsive gutters across the available viewport

## [0.9.4] - 2026-10-26
### Changed
- **Demo indicators**: style sample-data notices with light red backgrounds, red text, and an exclamation icon

## [0.9.3] - 2026-10-26
### Fixed
- **Footer version**: read the displayed app version directly from `package.json` to keep it in sync with the release version

## [0.9.2] - 2026-10-26
### Fixed
- **Landing-page mobile menu**: replaced the always-visible horizontal section links with a hamburger menu that expands and collapses a vertical section list

## [0.9.1] - 2026-10-26
### Changed
- **Login and mobile navigation**: added Home links to the login page top bar and footer, removed the forgot-password option, and shortened the landing-page Admin login button to Login
- **Demo indicators**: added a reduced-motion-safe pulse animation to visible demo labels
### Fixed
- **Mobile menu scrolling**: prevent the page behind the drawer from scrolling while it is open and contain scrolling within the menu

## [0.9.0] - 2026-10-23
### Added
- **Key notes under Logs (`/admin/logs`)**: added 7 plain-language portal notes covering roll-number privacy, NCERT booklet source rules, when recommendations are given, no-High counselling guidance, hand-checking batches of 10–20 sheets, sheet exclusion rules, and suggestive-only score use
- **Near-High Average recommendations (`lib/tamanna/norms.ts`, `lib/tamanna/profile.ts`)**: `highMinOf` and `isNearHigh` identify Average scores close to the High score's lower bracket (Sten 7 or within 2 marks of High); recommendations are now given for High scores and Near-High Average scores only, with no recommendations for other Average (Sten 4–6) or Low (Sten 1–3) scores
- **Demo examples (`lib/demo/store.ts`)**: Roll `101` (High-score example), Roll `102` (Class X Boys no-High example with Sten 2, 3, 3, 5, 4, 4, 2), and Roll `103` (Near-High Average example)
### Changed
- **Report sheet table & remarks (`components/report/ReportPages.tsx`, `lib/tamanna/profile.ts`, `lib/tamanna/booklet.ts`)**: matched the NCERT Aptitude Test Report Sheet layout (`S. No.`, `Sub-Test`, `Score Obtained`, `Sten Score`, and `Performance` split into `High | Average | Low` columns with `✓`), exact norm table citation (`Appendix IV/V, Table 1–6`), full band summary, Section 5 (p. 11) counselling and self-exploration guidance when a student has no High scores, and bold p. 12–13 caution notice
- **Non-technical language & streamlined Admin UI**: replaced technical terms (`OMR`, `Cross-verify`, `Export CSV`, `Demo mode`, `Connect Supabase`, `Overlay`) with plain school-friendly labels (`Check Sheets`, `Hand Check`, `Student Reports`, `Download list`, `Practice mode`, `Checked bubbles`); removed unrequested technical features (`Calibrate` link from sidebar and raw CSV text import from `KeyEditor`)

## [0.8.2] - 2026-10-23
### Added
- GitHub Actions CI/CD workflow (`.github/workflows/ci.yml`) running `npm ci`, `npm run typecheck`, `npm run check:norms`, `npm run check:report`, and `npm run build` on pushes and pull requests to `main`
### Changed
- **Roll numbers only**: replaced student names across the entire portal (landing page example, demo data, scan form, results table, CSV export, student view, cross-verification, activity logs, and 3-page report sheets) with student roll numbers
- **Simplified language**: shortened copy across the landing page and admin pages; removed subtitles under page headers
### Fixed
- **Landing page gaps and menu**: removed duplicate left rail navigation and `12rem` side column gap; made the top bar sticky with desktop section links and a compact mobile section row; spanned the 7th sub-test card across 2 columns on `md+` screens to close the grid gap; unified section spacing
- **Admin UI gaps**: merged duplicate mobile top bars into a single `h-14` sticky header aligned with the sidebar header; added consistent vertical spacing (`space-y-6`) between `PageHeader` and content on Results, Scan, Answer key, Calibrate, Verify, Logs, and Student detail pages; aligned cards with `items-start` and styled the Calibrate file upload button

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
