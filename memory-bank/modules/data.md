# Module: Data
Supabase stores `students`, `submissions`, `answer_keys`, `scores`, and `settings`; RLS uses `is_admin()`. Files live in private `sheets` storage and are opened with expiring signed URLs.

- Student `name` and `roll_number` are separate. A one-time migration moves legacy roll values from `name`, leaving names empty for review. School/class/roll and import hashes prevent duplicate imports.
- Keep school, block, district, class, gender, source filename, and review issues. Names proposed from filenames and demographic defaults need human checking.
- Submissions keep response JSON, page-image paths, `pdf_path`, source SHA-256, and the scoring-key fingerprint. Read older PDFs stored inside `image_paths` too.
- Originals are uploaded unchanged. No masking, redaction, public student files, or real student manifests in Git.
- `import_copy` atomically creates a student and submission. `score_copy` validates all 240 official answers and complete responses, rejects uncertain marks and stale keys, and saves all seven scores transactionally. `review_copy` updates checked responses and scores together; failed reviews roll back.
- Key edits invalidate scores and hand verification. Class/gender edits reset verification and change the booklet norms.
- `getKey` fetches the key once. `keyHashOf` fingerprints that exact snapshot, matching SQL `answer_key_hash`; scoring cannot silently use a newer key than the displayed one.
- Results call admin-only `scan_results()` on the server. SQL aggregates the latest saved responses against a validated 240-answer key into per-section correct and uncertain counts. Only compact student rows leave the database; no submissions, keys, or file URLs reach initial results props. A section with uncertain answers is provisional and has no final Sten interpretation; do not persist provisional values into `scores`.
- `/api/admin/students/[id]/sheet` checks the signed-in user and admin role, loads only the latest submission plus key, and signs that student's files. Responses are private/no-store; cancellable queries follow the dialog's request signal.
- Signed results are checked for missing entries, errors, empty paths, and null URLs, then normalized to non-null strings before creating image/PDF links. Invalid signing results fail explicitly rather than returning partial or nullable image links.
- Local scripts prepare, upload, reconcile, and score resumably. Keep manifests outside the repository. No import is a hand check.
- `supabase/portal-update.sql` adds the scan-results RPC and `activity_logs`. Run after the base schema; `npm run setup:database` includes both files. Logs have admin-only SELECT RLS and no direct browser write/delete grants. Restricted database triggers record changes; an admin-checked RPC records client-reported account actions. Never record response JSON, keys, passwords, tokens, or settings values.
- Backfill historical uploads once using their submission ID/timestamp. Do not invent historical edits. Log pagination counts matching rows, clamps out-of-range pages by redirect, and fetches only 25 entries ordered by timestamp and ID.
- The base schema and portal update were applied to the configured school project on 2026-10-29 for v0.15.0. Migration execution succeeded; runtime checks remain manual under the user's lint-only instruction.
- Do not seed `supabase/answer_key.sql`: its old example rows are not the official key. Review and upload the supplied official key with `copies:key`.
