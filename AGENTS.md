# Agent Guide
1. Read `memory-bank/index.md` first, then the relevant module note.
2. Use `components/ui` and the clay classes in `app/globals.css`; icons from lucide-react only.
3. Keep OMR logic in `lib/omr/reader.ts`; layout numbers only in `lib/omr/template.ts`.
4. Never commit secrets; env vars go in `.env.local`.
5. After any change, update `memory-bank/changelog.md` (and the module note if behavior changed).
6. Keep every screen responsive (mobile first) and keyboard accessible.
7. Bump the version per `memory-bank/versioning.md` when you ship a change.
8. Rendering: `app/**/page.tsx` stay server components that fetch data (`lib/supabase/server.ts`, `lib/supabase/data.ts`) and pass props to `components/features/*` client components. Use the browser client (`lib/supabase/client.ts`) only for user actions.
9. Revoke every `URL.createObjectURL`, stop camera tracks, close ImageBitmaps. Never fetch the same data twice.
10. Analysis uses ONLY the Tamanna booklet. Read `memory-bank/booklet-source.md`. No totals, ranks or outside interpretation.
11. Demo mode: keep `lib/demo` in step with any new Supabase query you use (see `memory-bank/modules/demo.md`).
12. Never add a data table without RLS using `is_admin()`.
14. Writing style: short plain sentences, no subtitle under page titles, no explanatory paragraphs where a label will do. Toast wording decides its category (see `kindOf` in `components/Toast.tsx`): start errors with "Could not", prompts with "Enter"/"Select"/"No".
15. Code layout: `lib/tamanna` (programme rules), `lib/omr`, `lib/supabase`, `lib/demo`; import with `@/lib/...`.
