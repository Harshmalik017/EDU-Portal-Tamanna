# Module: Report
`components/report/ReportPages.tsx` renders 3 pages (1: score table + Sten chart, 2: meaning of each score, 3: remarks, occupations, notes, signature). Server-rendered; print CSS in `globals.css`; PDF via browser print. Routes: `/admin/students/[id]/report`, `/admin/reports?class=IX`. Only booklet content may appear (see `booklet-source.md`).
