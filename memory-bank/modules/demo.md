# Module: Demo mode
Active when `envReady()` is false (no keys or placeholder keys): `isDemo()` in `lib/supabase/env.ts`.
- `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` return a mock client from `lib/demo/builder.ts` instead of Supabase.
- Browser mock sends each query to `POST /api/demo`; the server executes it in `lib/demo/exec.ts` against in-memory data seeded in `lib/demo/store.ts` (`globalThis`). Server pages call the same executor directly.
- Supported query subset: select (with embedded `scores(...)`), insert, update, upsert, delete, `eq`, `order`, `limit`, `single`, `maybeSingle`, `count/head`; `rpc('is_admin')`, `auth`, and no-op `storage`. **If you use a new Supabase feature in the app, add it to the mock too.**
- `/api/demo` returns 404 when real keys exist. Demo data is lost on restart and is not shared across serverless instances.
- Demo students: 24 students identified by roll number (`101`–`124`), where `101` is the booklet's worked example (Sten 5, 10, 9, 3, 8, 5, 6). The answer key is invented.
