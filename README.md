# Tamanna Portal

Tamanna Portal is a private web application for school teams to digitise, review, score, and report NCERT Tamanna assessments.

## What it supports

- Capture answer sheets with a phone camera or upload scanned files.
- Calibrate sheet reading and maintain the official answer key.
- Review uncertain responses before confirming results.
- Search, filter, update, archive, and export student records.
- Generate individual and bilingual bulk reports.
- Track administrative activity and manage account settings.
- Use the portal across mobile, tablet, and desktop screens.

## Data and reporting

The portal is designed for controlled school use. Student records and uploaded documents remain private, and application access is limited to authorised administrators.

Assessment handling follows the official NCERT Tamanna booklet. Reports do not create totals, ranks, predictions, or interpretations outside the source guide. Teacher review remains required before results are shared.

## Local development

### Requirements

- Node.js 24.x
- npm
- A configured Supabase project

### Install and run

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

### Environment

Create `.env.local` in the project root:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Keep `.env.local` outside version control. Do not expose service-role credentials or administrative passwords through `NEXT_PUBLIC_` variables.

Database provisioning, private import operations, archive maintenance, and other restricted procedures are intended for authorised maintainers. Project guidance is maintained in the [memory bank](memory-bank/index.md).

## Quality checks

Run the complete local validation suite:

```powershell
npm run ci
```

This covers linting, type checking, UI and domain regression checks, and a production build.

## Project structure

| Area | Purpose |
|---|---|
| `app/` | Application routes and server-rendered pages |
| `components/` | Shared UI and feature components |
| `lib/tamanna/` | Tamanna programme rules and report content |
| `lib/omr/` | Sheet reading and calibration |
| `lib/supabase/` | Server, browser, and data access helpers |
| `supabase/` | Database, access, and lifecycle migrations |
| `scripts/` | Local checks and authorised maintenance tools |

## Maintainer documentation

- [Documentation index](memory-bank/index.md)
- [Product requirements](memory-bank/PRD.md)
- [Architecture](memory-bank/architecture.md)
- [UI conventions](memory-bank/modules/ui.md)
- [Changelog](memory-bank/changelog.md)

## Version

The package version is the single source of truth for the current release. Tamanna Portal is currently distributed as a pre-1.0 application.
