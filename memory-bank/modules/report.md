# Module: Report
`components/report/ReportPages.tsx` renders 3 pages:
1. Page 1: Official NCERT report sheet table (`S. No.`, `Sub-Test`, `Score Obtained`, `Sten Score`, and `Performance` sub-columns `High | Average | Low` with `✓`), exact norm table citation (`Appendix IV / V, Table 1–6`), and `APTITUDE PROFILE` Sten chart.
2. Page 2: Meaning of each score (Appendix VI). Subject and field recommendations are shown ONLY for **High** scores (`Sten 8–10`) and **Average scores close to the High bracket** (`Sten 7` / within 2 marks of High's lower cutoff). No recommendations are shown for other Average (`Sten 4–6`) or Low (`Sten 1–3`) scores.
3. Page 3: Suggestions/Remarks (including performance summary by band, Section 5 p. 11 counselling & self-exploration remarks when no High score is obtained, Appendix VII occupations for High and near-High scores only, bold p. 12–13 caution notice, and Teacher's Signature).
Server-rendered; print CSS in `globals.css`; PDF via browser print. Routes: `/admin/students/[id]/report`, `/admin/reports?class=IX`. Only booklet content may appear (see `booklet-source.md`).
