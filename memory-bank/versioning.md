# Versioning
Semantic Versioning: `MAJOR.MINOR.PATCH`.
- PATCH: bug fixes, copy, style tweaks (0.2.1)
- MINOR: new backwards-compatible features (0.3.0)
- MAJOR: breaking changes, e.g. database schema that needs migration (1.0.0)
Single source of truth: `version` in `package.json` (shown in the footer via `NEXT_PUBLIC_APP_VERSION`).
Release steps: update `memory-bank/changelog.md` → `npm version minor|patch` → `git push --follow-tags`.
Pre-1.0 until the template is calibrated on real sheets and a teacher has verified 200 sheets.
