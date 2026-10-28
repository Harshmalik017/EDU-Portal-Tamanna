# Module: Demo mode (retired)
Runtime demo mode was removed in v0.13.0 for the real school database.

- No mock Supabase clients, fake login, generated students, invented keys, or bundled student scans.
- Missing public connection settings show setup guidance.
- `POST /api/demo` always returns 404.
- New queries use real Supabase with admin-only RLS. Keep tests synthetic and separate from runtime data.
