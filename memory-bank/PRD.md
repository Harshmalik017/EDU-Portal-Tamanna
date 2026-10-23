# Product Requirements: Tamanna Portal
**Goal:** Let a school scan OMR sheets (phone camera or uploaded scans), auto-score them against an answer key, and store every student's marks in a structured, exportable form.

## Users
- Admin / teacher (single role, Supabase email login).

## Hard rule
Analysis must use **only** the Tamanna test booklet / Guide for Teachers and Parents (NCERT). No totals, percentiles, rankings or predictions from any other source. Cross-verify every 10-20 reports. (Manager instruction.)

## Scope (v0.4)
- Landing page + admin login
- Dashboard, results (sort, search, paginate), student detail, answer key editor, calibration (v0.3.0)
- Scan or upload 2 pages per student (page 21: LA, AR, VR, MR; page 22: NA, SA, PA)
- Per-test scoring: correct / wrong / blank / double-marked
- Results table + CSV export
- Responsive on phone, tablet, desktop

## Out of scope (next)
- Batch upload of 200+ files, PDF scorecards, roll-number bubbles, automatic corner/perspective detection, dark mode, Hindi labels, offline mode.

## Success
200 students scanned and exported with ≥99% bubble accuracy after teacher review of flagged answers.
