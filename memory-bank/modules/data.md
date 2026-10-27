# Module: Data
Tables: `students`, `answer_keys`, `submissions` (raw marked answers as jsonb and private scanned-file paths), `scores` (per test). Uploaded PDFs are stored as name-masked archives in the `sheets` bucket and their paths are listed with the corresponding submission. See `supabase/schema.sql`. Seed keys with `supabase/answer_key.sql`.
