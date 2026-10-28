# Tech Stack (free tier)
| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19) + TypeScript |
| Styling | Tailwind CSS 4 + claymorphism `@utility` rules in `app/globals.css` |
| Icons | lucide-react |
| Backend/DB/Auth | Supabase (Postgres, email auth, RLS) |
| OMR engine | Browser canvas (`lib/omr/reader.ts`), no server cost |
| Hosting | Vercel Hobby |

Why client-side OMR: Vercel free functions have tight limits and no OpenCV; reading in the browser is free and fast. Upgrade path: OpenCV.js or a Python service if perspective correction is needed.

Quality: ESLint with `typescript-eslint` for lint-only checks. `npm run ci` remains an optional full validation command. For v0.14.0 the user requested lint only, no tests/build/typecheck locally; Vercel runs the production build without the optional check suite.

Local PDF imports use PDF.js and the development dependency `@napi-rs/canvas`; no PDF/OCR service receives student documents. Node 24.x is pinned in `package.json` and `.nvmrc`. Run `npm run check:import` for identity, key, and reading checks. Runtime records are Supabase-only; missing settings show setup guidance.

Vercel installs with `npm ci`. Its Linux install/build commands remove only the obsolete `NPM_CONFIG_CACHE_DIR` / `npm_config_cache_dir` variables; supported npm cache configuration remains intact. `allowScripts` approves only the installed, reviewed esbuild version. Next.js already optimizes lucide-react imports by default; no explicit experimental override is needed.
