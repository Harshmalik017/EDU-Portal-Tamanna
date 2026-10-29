# Architecture (v0.3.1)
## Rendering
| Route | Rendering | Notes |
|---|---|---|
| `/` | Static (SSG) | no JS beyond shell |
| `/login` | Server page + client form | middleware redirects signed-in users |
| `/admin` | Server (dynamic) | zero client JS; reads SQL views |
| `/admin/results`, `/students/[id]`, `/key`, `/calibrate` | Server fetch → client island | interactivity only where needed |
| `/admin/scan` | Server fetch of key + template → client scanner | camera lazy-loaded, OMR runs in browser |
Auth: `proxy.ts` (session refresh + redirect) → `admin/layout.tsx` (`is_admin()` check) → RLS (final authority).
## Network rules
- Read compact result rows through `scan_results()` on the server once per navigation. SQL aggregates known-answer marks and uncertain counts against the current validated key; provisional sections receive no Sten interpretation. Fetch one student's sheet through the authenticated same-origin API only when its dialog opens; never preload all responses, answer keys, or signed URLs into results props.
- Browser Supabase calls are user actions (writes/uploads). Sheet-dialog reads use an AbortController; close/unmount cancels them, and private responses use `Cache-Control: private, no-store`. Report links do not prefetch.
- `createServer` and `getServerUser` use React request-scoped caching so layouts and pages share their session client/auth read, never cross-user global data.
- Account settings are server-fetched props with browser-only Auth writes. Logs use server-side category filters and 25-row pagination. The additive portal migration supplies admin-readable event history, database triggers, and a restricted RPC for client-reported account actions.
- Images are compressed before upload; original PDFs are stored unchanged in private storage.
- Browser PDF rendering produces unmasked previews; the original PDF is stored unchanged in private Supabase storage. Local batch imports preserve every page and verify source/image checksums. No real student files are bundled publicly.
- Signed URLs expire in 1 hour; bucket is private.
## Security
RLS on every table via `is_admin()`; `admins` table has no API policies; views use `security_invoker`; only the public anon key is in the browser; security headers in `next.config.js`.
## Known limits / next
- Client-side OMR runs on the main thread (move to a Web Worker for batches).
- Results are loaded in full and paginated in the browser (fine for thousands; move to server pagination beyond ~5k).
- No strict CSP yet (needs nonces with Next inline scripts). Script-based checks exist; Vercel builds without running them. v0.14.0 uses lint-only local validation and manual testing as requested.
- Pages using the Supabase browser client ship ~60 kB extra JS; unavoidable for uploads and auth.

## Code layout (v0.7.0)
`app/` routes (thin server pages) · `components/ui` base parts · `components/layout` sidebar · `components/features` page logic · `components/report` report pages · `lib/tamanna` programme rules and content · `lib/omr` sheet reading · `lib/supabase` clients and data · `scripts/` local private imports.

## Private school imports (v0.10.0)
Missing public connection settings redirect to setup, not an unauthenticated demo. The publishable key is preferred over the older anon key. All clients share `lib/supabase`.

Local scripts render PDF previews on white, keep originals unchanged, and upload to the private bucket. Admin-only RPCs write each student's records atomically. Storage writes use deterministic retryable paths, followed by checksum reconciliation. Private manifests and owner credentials remain outside Git. Key edits invalidate old scores; uncertain answers must be checked before scoring. Synthetic data exists only in isolated check scripts.
