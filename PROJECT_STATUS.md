# Project Status — Targilim תרגילים

**Last updated:** 2026-11-12 · baseline 2026-06-14
**Central rules:** see `RULES.md` (authoritative operating guide; this file is the status snapshot).  
**Default branch:** `main`.
**Live site:** GitHub Pages serves `generator/` from `main` — https://yanivmizrachiy.github.io/targilim/ . The live site reflects `main` only.  
**Current repo state:** Phase 1 + PRs #21–#34 + PRs #46–#52 + main commit `7db6ab4` + the Pythagoras terminology guard + task-generation-only main UI guard + source-06 uncertainty deep coverage + topic-dropdown cleanliness guard are merged into `main`. Local/GitHub sync is checked by `npm run verify:sync`. **In review, not merged:** PR #56 (product requirements in `RULES.md`) and PR #57, the workbook vertical slice on `feat/workbook-vertical-slice` (stacked on #56, see below).
**Package version:** `0.78.0`

## In review — workbook vertical slice (PR #57, branch `feat/workbook-vertical-slice`, not merged)

Plan, decisions and milestones: [`docs/planning/WORKBOOK_IMPLEMENTATION_PLAN_20261112.md`](docs/planning/WORKBOOK_IMPLEMENTATION_PLAN_20261112.md). Nothing below is live until merged with Yaniv's approval and a green GitHub Actions `verify:deep`.

- **Teacher options:** grade, one or more topics (one chapter each), number of exercises, document type (דף תרגילים / בוחן / מבחן with whole points summing to 100), רמה 1/2/3 mapped to below / at / above the curriculum level, uniform or graduated order (independent of the level; graduated at רמה 1 is explained and stays uniform), question types, MCQ mode, colour / black-and-white, and a 6-character document code that rebuilds the same document (also kept in the page link).
- **Document model:** one seeded document per request (count 1 included) → A4 sheets on screen, print and PDF from the same sheets; separate answer-key sheets shown only on request; answer markers never on the student side (also for the 50 existing engines and the 11 runtime topics).
- **Verified families:** G7-03 (find_side, check_right_triangle, rectangle_diagonal) and N8-04 (percent_of_amount, percent_find_whole, percent_find_percent) — constructive numbers, new millimetre-based drawings (givens with full units, the unknown as "?", labels inside the drawing), and an independent checker for every item.
- **Book / print / PDF:** sheet design follows the district Pythagoras reader; one action bar (answers, print, PDF download) and chapter navigation; PDF download = each sheet captured at ≈240 dpi (snapDOM 3.7.4) into jsPDF 4.2.1, both pinned with SRI; per-exercise copy/download as image kept.
- **Fixed on the way:** the question-type controls were hidden for 25 of the 50 engine topics (`E.updatePanel`); the correct MCQ choice was written into the student HTML.
- **Measured results (2026-11-12):** `npm run verify:deep` exit 0 locally; new gate `verify:workbook` (in `verify:all`) — 3,600 seeded items per verified topic with 0 checker failures, 61/61 dropdown topics compose clean documents, 61/61 rebuild identically from the document code in a fresh page. Browser harness (Playwright/Chromium, 8 cases incl. a 3-chapter exam, a black-and-white quiz and a runtime legacy topic): print pages = screen sheets = downloaded PDF pages in 8/8, with and without the key; A4 595×842 pt; no clipped sheet or label at 1280 px or 390 px; no answer marker on student sheets; no page errors. Evidence: [`docs/evidence/2026-11-12-workbook-slice/`](docs/evidence/2026-11-12-workbook-slice/README.md).
- **Still open:** 48 engines not yet in the verified-family contract (M2); intake of the Sep–Oct 2026 re-issued curriculum documents, terminology "שכיחות", grade-placement fixes and the curriculum-plan selector (M3, needs approval); Grade 9 (M4, needs approval); cleanup and a CI browser job (M5); Safari/Firefox and real-printer checks not done. See the plan §4–§5.

## In review — Grade 7 equation corrections

On a branch based on PR #57. A7-03 mistake prompts show a genuinely incorrect step for positive, negative and zero constant terms. Open equation-identification questions include their four candidate equations. Hebrew plurals and explanations were corrected. The math/BiDi verifier exercises the affected generator paths. A7-03 remains in the existing engine; its migration to verified workbook families is pending.

## Executive snapshot

- Shipped coverage as of this snapshot: Hebrew RTL exercise generation for Grades 7–8. See [`RULES.md`](RULES.md) for product requirements.
- Active `*-ENGINE` topics: **50**. The live topic selector shows **61** topics: the 50 engine topics plus 11 older topics that `phase2-loader.js` adds at runtime (open questions only). `verify:topic-dropdown` counts the 50 because its stub does not run the loader (measured 2026-11-12).
- Fallback topics: **0 fallback**.
- The generator is source-bound to the approved intake PDFs.
- Source file 10 is sequencing/teaching context only; it is not a direct question source.
- Main generator UI is task-generation-only: no teacher mode, gallery, or QA links in `generator/index.html`.
- Historical/internal QA workbench files remain in the repo, but they are not linked from the main generator and are not part of the primary product flow.
- Visual coverage is enforced by `verify:visual-coverage` inside `verify:deep`, including exact family-level `requiredVisual` checks.
- Copy/export includes copy-as-image for whole question cards, including drawings.
- Documentation is indexed with `docs/README.md` and `tools/README.md`.
- GitHub Pages publishes the `generator/` directory from `main`.

## Recently merged work

- PR #7 merged the 50-engine source-backed generator, teacher mode, visual QA, copy/export, documentation organization, and verification gates.
- PR #8 merged the final Phase 1 integration into `main`, including the 1–10 exercise selector, MCQ single/multi UI support, mobile Hebrew fixes, and deterministic stress fixes for true/false sampling.
- Cleanup pass removed stale generated live-verification FAIL artifacts and added documentation policy. It did not change product behavior.
- PRs #15–#18 merged: A7-04 work, stress PER raised to 100 (#16), a standalone A7-04 multi-correct guard (#17, see caveat in the MCQ layer), and a PDF duplicate audit with no deletion (#18). PDF inventory is 20 files (10 working + 10 originals; no accidental duplicates).

## Changelog — merged improvements (newest first)

All merged to `main`, live, and `verify:deep`-green.

| PR | Date | Improvement |
|---|---|---|
| main | 2026-06-19 | Hardened A7-01 algebraic-expression visuals and Hebrew wording: cup-tower questions now render a dedicated cup-tower SVG, avoid orphan `+step` phrasing, report exact family provenance, and `verify:math-bidi`/`verify:visual-coverage`/`verify:visual` guard the family systematically. |
| main | 2026-06-18 | Tightened Hebrew/BiDi and ratio-diagram quality: N8-01 distance-ratio wording now uses route lengths and units, `ratioBarSvg` has explicit RTL-safe labels, and `verify:math-bidi` is wired into `verify:all`/`verify:deep`. |
| main | 2026-06-18 | Made worksheet answer boxes proportional for copy-to-worksheet output; `verify:worksheet-polish` now guards against returning to fixed oversized boxes. |
| main | 2026-06-18 | Added repo-foundation dropdown guard: `verify:topic-dropdown` checks 50 visible teacher-facing topics, no duplicate labels/values, and no internal jargon in the main topic selector. |
| main | 2026-06-18 | Added source-06 uncertainty deep coverage: 33 PDF-mapped families across U7/U8 uncertainty, graphics/tables/pie/line/multi-source tasks, and `verify:uncertainty-source-deep`. |
| main | 2026-06-18 | Removed teacher-mode exposure from the main generator UI; `index.html` is task-generation-only and guarded by `verify:task-ui`. |
| main | 2026-06-17 | Pythagoras Hebrew terminology guard: G7-03 now uses "ניצב/ניצבים" and "יתר"; `verify:geometry-language` prevents "רגל/רגליים" from returning to Pythagoras output. |
| #52 | 2026-06-17 | A8-03 count-and-value system word problem (coins/stamps elimination). |
| `7db6ab4` | 2026-06-17 | Source-fit/UI sync: A7-05 value tables + first-quadrant graphs, A7-03/U7-01/U8-01 family expansion, copy-image-only mobile dock, premium typography guards. |
| #51 | 2026-06-17 | A7-02 expression-value-range family. |
| #50 | 2026-06-17 | Topic dropdown dedupe/order cleanup. |
| #49 | 2026-06-17 | Registry and source-bible sync for shipped families. |
| #48 | 2026-06-17 | A7-01 polygon perimeter with algebraic sides and labeled diagram. |
| #47 | 2026-06-17 | Source-level families: applied-formula substitution and equal-expressions. |
| #46 | 2026-06-17 | Real רמה 1/2/3 integration for new families. |
| #34 | 2026-06-16 | Pythagoras (legacy G7-03): diagram marks the unknown side `?` instead of revealing the answer; fixed the clipped "ס\"מ" label; precise Hebrew ("חשבו את אורך היתר"); premium student answer box with ruled writing lines. |
| #33 | 2026-06-16 | Source-faithful topic labels: G7-02 → "שטחי מצולעים"; G8-04 → "דמיון משולשים" (U7-01 "טבלת תדירות" kept — source uses "תדירות"). |
| #32 | 2026-06-16 | Removed the landing splash — the main page opens directly to the topic-selection tool; `landing.css` deleted. |
| #30 | 2026-06-16 | Level selector shows **רמה 1 / רמה 2 / רמה 3** and the visible selector actually drives difficulty. |
| #20 | 2026-06-15 | Central rules + status refresh. |
| #28 | 2026-06-15 | Real A7-04 multi-correct (forward `mcqMode`; `verify:multi-correct` in `verify:deep`). |
| #27 | 2026-06-15 | Worksheet polish — sharp math rectangles + no question-type badge. |
| #21–#24 | 2026-06-15 | UI premium round — professional card + typography; single untitled answer box; premium image export + color/שחור-לבן only; `verify:premium-ui` guard. |

The book/learning-material viewer is served from the site (no GitHub Pages 404). `verify:deep` now includes `verify:task-ui`, `verify:premium-ui`, `verify:worksheet-polish` and `verify:multi-correct`.

## Current verification gates

Primary gate:

```bash
npm install
npm run verify:sync
npm run verify:workbench
npm run verify:deep
```

`verify:deep` includes:

- repository hygiene check;
- baseline and branding checks;
- source lock and source bible checks;
- source-06 uncertainty deep coverage check (`verify:uncertainty-source-deep`);
- visible topic dropdown cleanliness check (`verify:topic-dropdown`);
- task-generation-only main UI check (`verify:task-ui`);
- coverage and stress checks;
- question variety checks;
- SVG/visual/graphics checks;
- visual coverage checks;
- question-family provenance checks;
- follow-up generation checks;
- geometry Hebrew terminology check (`verify:geometry-language`);
- Hebrew/math BiDi and wording quality check (`verify:math-bidi`);
- copy/export checks, including copy-as-image entry points;
- print-layout checks;
- release documentation freshness check;
- on the workbook branch: the document path gate `verify:workbook` (verified families, all topics, replay, options, A4/print/PDF contracts).

## Current product capabilities

### Student / worksheet layer

- Generate one exercise or a numbered exercise set.
- Support **1–10** exercises in the main selector.
- Support mixed question types.
- Support answer key toggle.
- Support browser print.
- Student print keeps the generated worksheet focused on the tasks and answer key.
- Includes writing space shaped by question type.

### Engine layer

- 50 active engine topics.
- 0 fallback topics.
- Open / MCQ / true-false / mistake question types.
- Basic / standard / challenge difficulty support.
- Pedagogic metadata attached to each output.
- Per-question source/family provenance.
- Follow-up generation support.

### MCQ layer

- Single-answer mode exists and prints a single-answer instruction.
- Multi-answer wording exists and the answer key supports 1..N correct answers.
- **Real multi-correct MCQ is `DONE` and merged (PR #28).** Root cause: the `getEngineExercise` wrapper chain dropped the `mcqMode` argument, so the already-implemented A7-04 multi-correct path was unreachable (emitted one correct even in multi mode). PR #28 (`fix/a704-multi-correct-clean-v2`, the clean path — the earlier #25 was closed/superseded) forwards `opts` through every wrapper and wires `tools/verify-multi-correct-coverage.mjs` into `verify:deep`. Verified: A7-04 multi → 2 correct, single → 1 correct.

### Task creation / export layer

- Main page exposes only worksheet/task generation controls.
- No teacher-mode toggle, gallery link, or visual-QA link appears in `generator/index.html`.
- Topic selector exposes 50 teacher-facing topics with no duplicate visible labels/values and no internal jargon.
- Copy whole question card as image for Word/Canva-style workflows.
- Download whole question card as PNG.

### Internal visual and QA layer

- Historical/internal pages can display engines from the live registry and support visual review.
- These pages are not linked from the main generator UI.
- Visual QA statuses: יפה, צריך תיקון, בעיה בשרטוט, בעיה בהדפסה, בעיה בטקסט.
- Visual QA notes are stored locally in the browser and can be exported as JSON.
- Visual expectation badges identify topics where drawings are essential/recommended/optional.
- Empty-registry diagnostic prevents silent 0/0 failures.
- Cache-busting protects QA/gallery pages from stale browser bundles.

### Repo organization layer

- `README.md` documents the high-level repository structure.
- `docs/README.md` indexes documentation folders and source-of-truth files.
- `docs/reference/ACTIVE_WORKTREE_AND_SYNC.md` documents the active local worktree and sync checks.
- `tools/README.md` maps verifiers, generators, harnesses and standalone tools.
- Historical unreferenced docs are organized under purpose folders.
- Protected source PDFs and GitHub Pages marker files are not deleted.
- Cleanup-only work must not touch product code, engines, sources or verifier logic.

## Release and cleanup safety

Do not do any of the following without explicit approval:

- merge feature PRs to `main`;
- force push;
- reset or clean destructively;
- weaken a verifier;
- delete protected source PDFs;
- delete historical reports without an index/superseded decision;
- begin new feature work during cleanup-only work;
- commit `_audit/`, `.claude/`, `TARGILIM_*_AUDIT*.txt`, `TARGILIM_*_INTEL*.txt`, `node_modules/`, secrets, tokens or temp logs.

## Live / static entry points

Repository paths:

- Main generator: `generator/index.html`
- Digital source book: `generator/book.html`
- Source Bible: `docs/SOURCE_BIBLE.md`
- Release checklist: `docs/RELEASE_CHECKLIST.md`
- Documentation index: `docs/README.md`
- Tools index: `tools/README.md`
- Phase 1 requirements status: `REQUIREMENTS_STATUS.md`
- Cleanup execution log: `docs/reports/REPO_CLEANUP_EXECUTION_20260614.md`

## Remaining high-value work

1. **U7-03 single-answer MCQ already exists** in `source-fit-extensions.js` (verified: U7-03-ENGINE emits MCQ with choices). Do **not** duplicate it. Select next content work only after checking existing engine coverage.
2. Real A4 print review, with and without answer key.
3. Manual copy-as-image paste test into Word/Canva/Docs.
4. Optional future feature after approval only: source-question coverage gap for inequalities / A8-05.

## Release / CI gate

Before any merge to `main`, GitHub Actions must pass.

The required GitHub Actions gate is `npm run verify:deep`.

Do not merge unless `verify:deep` passes in GitHub Actions and Yaniv gives explicit approval.
