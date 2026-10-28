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
- Read data on the server once per navigation; client calls only for writes/uploads.
- Images are compressed before upload; originals never leave the browser.
- Browser PDF rendering produces unmasked previews; the original PDF is stored unchanged in private Supabase storage. Local batch imports preserve every page and verify source/image checksums. No real student files are bundled publicly.
- Signed URLs expire in 1 hour; bucket is private.
## Security
RLS on every table via `is_admin()`; `admins` table has no API policies; views use `security_invoker`; only the public anon key is in the browser; security headers in `next.config.js`.
## Known limits / next
- Client-side OMR runs on the main thread (move to a Web Worker for batches).
- Results are loaded in full and paginated in the browser (fine for thousands; move to server pagination beyond ~5k).
- No strict CSP yet (needs nonces with Next inline scripts). No automated tests yet (add Vitest for `lib/omr/reader.ts` scoring).
- Pages using the Supabase browser client ship ~60 kB extra JS; unavoidable for uploads and auth.

## Code layout (v0.7.0)
`app/` routes (thin server pages) · `components/ui` base parts · `components/layout` sidebar · `components/features` page logic · `components/report` report pages · `lib/tamanna` programme rules and content · `lib/omr` sheet reading · `lib/supabase` clients and data · `scripts/` local private imports.

## Private school imports (v0.10.0)
Missing public connection settings redirect to setup, not an unauthenticated demo. The publishable key is preferred over the older anon key. All clients share `lib/supabase`.

Local scripts render PDF previews on white, keep originals unchanged, and upload to the private bucket. Admin-only RPCs write each student's records atomically. Storage writes use deterministic retryable paths, followed by checksum reconciliation. Private manifests and owner credentials remain outside Git. Key edits invalidate old scores; uncertain answers must be checked before scoring. Synthetic data exists only in isolated check scripts.
