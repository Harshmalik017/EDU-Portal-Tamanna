# Module: OMR (`lib/omr/reader.ts`, `lib/omr/template.ts`)
- Image is resized to 924×1300 reference space; each bubble's inner disk is sampled at template coordinates, excluding the printed ring and option letter.
- A bubble is marked when its inner disk is dark, at least 20 gray levels below its row baseline, and has the low pixel variance expected of a solid fill.
- Template coordinates support horizontal drift per vertical pixel so the sample scan's skew is corrected consistently in reading, overlays, crops, and calibration.
- 0 marked = blank, >1 = `MULTI` (counted wrong, flagged).
- The scanner accepts one two-page PDF or captures the two pages sequentially. PDF rendering and header masking happen in the browser; extra PDF pages are rejected. Redacted page images and a masked PDF archive are saved with the student.
- The header mask covers the top 14% of each page before previews, OMR, and storage. Keep the redaction high enough to protect student details while leaving printed section headings visible.
- Scanned answer review lists each student response alongside its answer-key option on the scan and student-profile pages.
- The scan and Student Reports show a masked original sheet alongside a themed OMR preview with bilingual section names. The Student Reports dialog compares the same page side by side, with four Theme UI sections per row on wide screens and a download action beside the page controls. Saved preview images are served with private signed URLs.
- In demo mode, the sample student's actual masked pages and PDF are bundled under `public/demo/omr/`, and the themed sheet uses the corresponding OMR detections from `lib/demo/student-responses.json`. The demo answer key is invented, so it is not shown as a correctness result; responses stay blue and multiple marks are red. With a real answer key, correct responses are green, incorrect responses are light red, and the keyed option is outlined green.
## Known limits / TODO
- **Template values are calibrated against the supplied scan; other scanner formats may need calibration.**
- No perspective correction: photo must be flat and cropped to the page edges. Add corner markers + warp (OpenCV.js) next.
- Practice questions are not scored. PA has 60 questions across two columns.
- Debug overlay (v0.2.0) is the calibration tool: if circles miss the printed bubbles, adjust `lib/omr/template.ts`.
- Quality thresholds in `checkQuality` are starting values; tune on real photos.

## Calibration (v0.3.0)
`/admin/calibrate` edits the layout and stores it in `settings` (key `template`). `lib/omr/template.ts` holds the defaults used when nothing is saved.
The default coordinates now match the supplied two-page scan. Recheck new scan sources with the debug overlay before changing schools or scanner formats.
