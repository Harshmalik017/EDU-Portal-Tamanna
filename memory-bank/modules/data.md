# Module: Data
Supabase stores `students`, `submissions`, `answer_keys`, `scores`, and `settings`; RLS uses `is_admin()`. Files live in private `sheets` storage and are opened with expiring signed URLs.

- Student `name` and `roll_number` are separate. A one-time migration moves legacy roll values from `name`, leaving names empty for review. School/class/roll and import hashes prevent duplicate imports.
- Keep school, block, district, class, gender, source filename, and review issues. Names proposed from filenames and demographic defaults need human checking.
- Submissions keep response JSON, page-image paths, `pdf_path`, source SHA-256, and the scoring-key fingerprint. Read older PDFs stored inside `image_paths` too.
- Originals are uploaded unchanged. No masking, redaction, public student files, or real student manifests in Git.
- `import_copy` atomically creates a student and submission. `score_copy` validates all 240 official answers and complete responses, rejects uncertain marks and stale keys, and saves all seven scores transactionally. `review_copy` updates checked responses and scores together; failed reviews roll back.
- Key edits invalidate scores and hand verification. Class/gender edits reset verification and change the booklet norms.
- `getKey` fetches the key once. `keyHashOf` fingerprints that exact snapshot, matching SQL `answer_key_hash`; scoring cannot silently use a newer key than the displayed one.
- Local scripts prepare, upload, reconcile, and score resumably. Keep manifests outside the repository. No import is a hand check.
- Do not seed `supabase/answer_key.sql`: its old example rows are not the official key. Review and upload the supplied official key with `copies:key`.
