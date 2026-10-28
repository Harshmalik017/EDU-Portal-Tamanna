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

Quality: `npm run typecheck`, `npm run check:norms`, `npm run check:report` (ESLint was removed in 0.5.0 because its dependencies caused npm vulnerability warnings).

Local PDF imports use pinned PDF.js and `@napi-rs/canvas` as development dependencies; no PDF/OCR service receives student documents. Node 20.16+ (24 recommended). Run `npm run check:import` for identity, key, and reading checks. Runtime records are Supabase-only; missing settings show setup guidance.
