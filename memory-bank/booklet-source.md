# Booklet source of truth
Source: *Tamanna: An Aptitude Test for Senior School Students, Guide for Teachers and Parents* (NCERT, Oct 2019). Manager instruction: use no lens of analysis other than the booklet; cross-verify after every 10-20 reports; provide a dashboard plus a 2-3 page personal report per child.

## Where each rule comes from
| App behaviour | Booklet |
|---|---|
| Raw score per sub-test = number of correct answers; each sub-test counted separately | p.10 "How to score" |
| Items with more than one response are not scored | p.9 point 4 |
| Exclude sheets with an obvious pattern (all A, A/B alternating) | p.10 note |
| Raw -> Sten using class and gender norms | p.11, Appendix IV (Class IX), V (Class X) |
| Low 1-3, Average 4-7, High 8-10 | Appendix VI |
| Description text per level | Appendix VI (condensed in `lib/tamanna/booklet.ts`) |
| Report layout (score, Sten, High/Average/Low, Sten graph, remarks) | p.12-13, Appendix III |
| "Likely to do well in subjects like..." | p.13 example, Section 2 lists |
| Occupations list | Appendix VII; areas Appendix VIII |
| Disclaimers (suggestive only; not for choosing subjects; no pass/fail; cluster of aptitudes; note when no High score) | p.6-7, 9, 11-13 |
| Practice items are not scored | Answer sheet (Appendix I) |

## Not in the booklet, so NOT in the app
Total score across sub-tests, percentiles, ranks, class averages as a judgement, career predictions, any AI-generated interpretation.

## Decisions to confirm with the manager
1. **Printed misprints in the norms** (overlapping ranges, first match wins, so the lower Sten is used for the shared score): Class X combined AR score 11 (Sten 4 and 5), MR 15 (6 and 7), SA 21 (8 and 9); Class X boys MR 22 (9 and 10). Likely 12-15, 16-17, 22-23, 23-30. Confirm with NCERT.
2. Gender "Not specified" uses the **combined** norms table.
3. **Occupation list ordering**: the booklet gives no matching rule. The report lists Appendix VII occupations that include at least one High aptitude, sorted by the share of their listed aptitudes that are High (top 14 shown). Confirm or simplify.
4. Pattern rule needs 10+ answered items in a test (threshold is ours; the booklet gives no number).
5. Condensed wording of Appendix VI/VII/Section 2 was written from images; compare with the printed booklet and check NCERT's permission for the app and printed reports.
6. The **scoring key** (Appendix II) is not in the guide: principals request it from tamanna.ncert@ciet.nic.in. Enter it under Answer key. Practice items are not scored.
7. Norm tables were transcribed from page images. Re-verify every cell against the booklet before use (`npm run check:norms` only checks structure and the Manju example).

## Landing page content (v0.5.1)
All programme text on `/` comes from `lib/tamanna/program.ts`, condensed from the guide: Foreword (NCERT development, CBSE pilot, three components), Section 1 (aptitude, benefits), Section 2 (seven sub-tests), Section 4 (timing, procedure), Section 5-6 (Sten, example), Appendix I (items per sub-test), VII (careers), notes on pp.7, 11-13. Do not add facts from elsewhere. Item counts (30, PA 60) come from the sample answer sheet. The scoring-key email is printed in Appendix II.
