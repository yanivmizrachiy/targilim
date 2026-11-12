# Evidence — workbook vertical slice (2026-11-12)

Before = PR #56 head `d274b44` (same code as `main` for `generator/`). After = branch `feat/workbook-vertical-slice`.
Both were captured from a local static server of `generator/` with Playwright (Chromium, headless), using the scripts in [`scripts/`](scripts/) (`python -I scripts/capture_after.py <base_url> <out_dir>`). The before run seeds `Math.random`; the after run uses the document code `K7M2QF`. Questions therefore differ between the runs, but the settings are the same: grade, topic, 6 exercises, רמה 2, mixed question types.

## Images

| File | Shows |
|---|---|
| `print-pythagoras-before-after.jpg` | Chromium A4 print, before (3 pages, ≈5–7 pt drawing labels, card UI on paper) vs after (3 sheets: blue title + double rule + circled page number, drawings beside the text, labels ≈10.5 pt, "?" for the unknown, marking squares for MCQ) |
| `print-percent-uncertainty-before-after.jpg` | percent: 4 pages → 2 sheets (verified family); uncertainty tables/charts from the existing engines on the new sheets |
| `exam-quiz-key-after.jpg` | a 3-chapter grade-8 exam (points summing to 100, instructions, chapter titles), a black-and-white quiz, and an answer-key sheet |
| `downloaded-pdf-after.jpg` | pages rendered back from the files produced by the in-app "הורד PDF" button |
| `phone-before-after.jpg` | 390 px: before (cards) vs after (whole A4 sheets scaled to the width, dark divider, compact action row) |
| `desktop-before-after.jpg` | settings card and the start of the document at 1280 px |
| `exercise-image-after.jpg` | one exercise exported as an image (full question, drawing, answer box; no buttons) |

PDF samples: `after-geometry-pythagoras-download.pdf` (in-app download, 3 A4 pages, raster ≈240 dpi) and `after-geometry-pythagoras-print-key.pdf` (Chromium print with the key shown, vector).

## Measured results (after)

From `harness-after.json` (8 cases: 5 single-topic worksheets, a 3-chapter exam, a graduated black-and-white quiz, and the runtime topic "אי־שוויונות ומגבלות"):

| Check | Result |
|---|---|
| Print pages (key hidden) = sheets on screen | 8/8 |
| Print pages (key shown) = student + key sheets | 8/8 |
| Downloaded PDF pages = sheets, all A4 (595×842 pt) | 8/8 |
| Clipped sheet content at 1280 px / 390 px | 0 / 0 |
| Drawing labels outside their drawing | 0 |
| Answer markers on student sheets | 0 |
| Raw TeX or `undefined`/`NaN` on sheets | 0 |
| Horizontal scroll at 390 px | none |
| Page errors | none (snapDOM probes the `.ttf` KaTeX fonts that cdnjs does not host; the woff2 fonts are used) |

Capture fidelity (`scripts/capture_compare.py`, one A4 sheet against Chromium's own screenshot): mean absolute pixel difference **0.71** for snapDOM vs **5.51** for html2canvas 1.4.1 (text band 0.38 vs 4.62). This is why the PDF and the exercise images use snapDOM.

Before (from `harness-before.json`): the correct MCQ choice was in the student page DOM in every set (2 per 6-exercise mixed set); print pages 3 / 2 / 4 / 4 / 3 for the five topics; no PDF download.

## Not covered

Safari and Firefox, real printers, and screen readers were not tested. The downloaded PDF is a raster file (text not selectable); vector output is available through Print → Save as PDF.
