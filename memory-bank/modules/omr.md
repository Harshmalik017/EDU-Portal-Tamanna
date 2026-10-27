# Module: OMR (`lib/omr/reader.ts`, `lib/omr/template.ts`)
- Image is resized to 924×1300 reference space; each option is sampled in a radius-4 inner disk to avoid the printed bubble ring and option letter. A sample is marked when its mean gray is below 175, at least 20 gray levels below the row baseline (the third-lowest of four option means), and its pixel variance is below 5000.
- Template coordinates support horizontal drift per vertical pixel: `x = xA + optionIndex * xStep + xSlope * (y - y0)`. This shared geometry keeps reading, overlays, crops, and calibration aligned on skewed scans.
- The default template is calibrated to the bundled scan. A saved template from before `xSlope` was introduced inherits each column's default slope when loaded, preserving old calibration settings.
- 0 marked = blank, >1 = `MULTI` (counted wrong, flagged).
- The scanner accepts one two-page PDF or captures the two pages sequentially. PDF rendering and header masking happen in the browser; extra PDF pages are rejected. Redacted page images and a masked PDF archive are saved with the student.
- The header mask covers the top 14% of each page before previews, OMR, and storage. Keep the redaction high enough to protect student details while leaving printed section headings visible.
- Scanned answer review lists each student response alongside its answer-key option on the scan and student-profile pages.
- The scan and Student Reports show a masked original sheet alongside a themed OMR preview with bilingual section names. On page two, PA spans two grid columns so both 30-question blocks and its bilingual heading fit without overlap. The Student Reports dialog compares the same page side by side, with four Theme UI grid columns on wide screens and a download action beside the page controls. Saved preview images are served with private signed URLs.
- With a real answer key, a selected correct response is filled green, an incorrect selected response is filled light red, and an unselected keyed option is outlined green. When no trusted key is available, a selected response is blue rather than being assigned a guessed correctness color; multiple marks are labeled red. In demo mode, the sample student's actual masked pages and PDF are bundled under `public/demo/omr/`, and the themed sheet uses the corresponding OMR detections from `lib/demo/student-responses.json`. The demo answer key is invented and must not be used to label responses correct or incorrect.
## Known limits / TODO
- **Template values are calibrated against the supplied scan; other scanner formats may need calibration.**
- Detection thresholds have been verified against the bundled two-page scan, not a representative set of scanners or camera photos. Review the checked-bubble overlay and manually correct uncertain reads before saving.
- No perspective correction: photo must be flat and cropped to the page edges. Add corner markers + warp (OpenCV.js) next.
- Practice questions are not scored. PA has 60 questions across two columns.
- Debug overlay (v0.2.0) is the calibration tool: if circles miss the printed bubbles, adjust `lib/omr/template.ts`.
- Quality thresholds in `checkQuality` are starting values; tune on real photos.

## Calibration (v0.3.0)
`/admin/calibrate` edits the layout and stores it in `settings` (key `template`). `lib/omr/template.ts` holds the defaults used when nothing is saved.
The default coordinates now match the supplied two-page scan. Recheck new scan sources with the debug overlay before changing schools or scanner formats.
