# Module: OMR (`lib/omr/reader.ts`, `lib/omr/template.ts`)
- Image is resized to 924×1300 reference space; each bubble is sampled at template coordinates.
- A bubble is "marked" if it is darker than the unfilled baseline by max(35, 18% of baseline) in its row.
- 0 marked = blank, >1 = `MULTI` (counted wrong, flagged).
- The scanner accepts one two-page PDF or captures the two pages sequentially. PDF rendering and header masking happen in the browser; only redacted page images are saved.
- The header mask covers the top 23% of each page before previews, OMR, and storage. The student name is never captured in the student record.
## Known limits / TODO
- **Template values are calibrated against the supplied scan; other scanner formats may need calibration.**
- No perspective correction: photo must be flat and cropped to the page edges. Add corner markers + warp (OpenCV.js) next.
- Practice questions are not scored. PA has 60 questions across two columns.
- Debug overlay (v0.2.0) is the calibration tool: if circles miss the printed bubbles, adjust `lib/omr/template.ts`.
- Quality thresholds in `checkQuality` are starting values; tune on real photos.

## Calibration (v0.3.0)
`/admin/calibrate` edits the layout and stores it in `settings` (key `template`). `lib/omr/template.ts` holds the defaults used when nothing is saved.
The default coordinates now match the supplied two-page scan. Recheck new scan sources with the debug overlay before changing schools or scanner formats.
