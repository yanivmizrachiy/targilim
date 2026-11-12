# Workbook implementation plan — curriculum-aligned generator, digital book, A4 print and PDF

**Date:** 2026-11-12 · **PR:** #57 · **Branch:** `feat/workbook-vertical-slice` (stacked on PR #56, which holds the requirements in `RULES.md`) · **Status:** milestone M1 implemented on the branch, not merged; the live site is unchanged.

Requirements: `RULES.md` (product requirements, §5, §8). Evidence used here:
[`docs/audits/MODULE_AUDIT_20261112.md`](../audits/MODULE_AUDIT_20261112.md) (every module, file:line),
[`CURRICULUM_MATRIX_20261112.md`](CURRICULUM_MATRIX_20261112.md) (official documents, grades 7–9),
[`docs/reference/PYTHAGORAS_READER_DESIGN_20261112.md`](../reference/PYTHAGORAS_READER_DESIGN_20261112.md) (district reader),
[`docs/reference/TECHNIQUES_RESEARCH_20261112.md`](../reference/TECHNIQUES_RESEARCH_20261112.md) (libraries, measured),
[`docs/evidence/2026-11-12-workbook-slice/`](../evidence/2026-11-12-workbook-slice/README.md) (before/after outputs).

---

## 1. Baseline (measured on PR #56 head `d274b44`)

| Check | Result |
|---|---|
| `npm run verify:deep` | PASS, exit 0, 42 s, 36 verifier runs |
| Topics in the live dropdown | **61** (50 engine topics + 11 topics added at runtime by `phase2-loader.js`, e.g. "אי־שוויונות ומגבלות"). `verify:topic-dropdown` counts 50 because its stub does not run the loader. |
| Answer isolation | the correct MCQ choice is written into the student HTML (`question-types.js:49`, 3,000/3,000 MCQs); hidden only by CSS inside a worksheet; shown in green in the single-question view |
| Print | one long page flow; 6 Pythagoras exercises → 3 pages with large gaps; diagram labels print at ≈5–7 pt |
| PDF download | none (browser print only) |
| "Digital book" | `book.html` shows the 10 official curriculum PDFs, not generated documents |
| Seeds / replay | none — `Math.random` everywhere; 3 engines keep module-level counters |
| Answer checking | none per question; `validators.js` has two helpers |
| Levels | identical at two or three levels in 11 engines (e.g. G8-03; N8-04 standard = challenge) |
| Dispatch | `E.getEngineExercise` is wrapped 9 times, `E.isEngineTopic` 7 times |
| CI | `verify.yml` and `deploy-pages.yml` work; 11 of 15 workflows failed on every recorded run |

Before images (5 topics × desktop / phone / A4 print, seeded): `docs/evidence/2026-11-12-workbook-slice/`.

## 2. Architecture decisions

| # | Decision | Alternatives compared | Evidence |
|---|---|---|---|
| A | **One document model** per request, rendered once and laid out on fixed A4 sheets by a measuring paginator (`workbook/book.js`). The screen sheets are the print pages and the PDF pages. | Old flow + print CSS (no page control); Paged.js (no release since 2023); server PDF (no server on Pages) | Print PDF pages = screen sheets in 8/8 cases, with and without the key; downloaded PDF pages = sheets in 8/8 |
| B | **PDF download** = each visible sheet captured by snapDOM 3.7.4 at 2.5× (≈240 dpi, PNG) into jsPDF 4.2.1; vector output stays available through Print → Save as PDF | html2canvas 1.4.1 (mean pixel difference 5.5 vs Chromium's own rendering, against 0.7 for snapDOM); jsPDF/pdfmake text (Hebrew bidi breaks); html2pdf.js | `capture_compare.py` result in the evidence folder; libraries pinned with SRI |
| C | **Seeded replay**: one 6-character document code; sfc32 seeded by cyrb128 over code + settings; one stream per item; legacy engines run on a seeded `Math.random` (no engine edits) | seedrandom (unmaintained); mulberry32 | 61/61 topics rebuild the same document in a fresh page (`verify:workbook`) |
| D | **Verified families**: constructive parameters + an independent checker per family; property runs in CI | rejection sampling only; post-hoc regex checks | 2 × 3,600 seeded items, 0 failures |
| E | Keep **KaTeX** (0.16.9 today; 0.19.1 upgrade in M5) | MathJax 4.1.3 has an open RTL ordering bug (#3589) | research report §5 |
| F | Classic scripts under one namespace `TargilimWorkbook` | ES modules | engines are classic scripts that must call verified families synchronously during migration; the files also import as ESM in Node |
| G | **Answer isolation at render time** for every engine: MCQ correctness moves to the key | rewrite all 50 engines first | 61 topics × 6 items: 0 answer markers on the student side |
| H | Phone: scale whole sheets with a transform inside a sized viewport | CSS `zoom` (re-lays text out; 1 sheet clipped in the exam case); the reference reader's `transform` without a viewport (cuts the right edge below ≈423 px) | 8/8 cases: no clipping, no horizontal scroll at 390 px |

Sheet design follows the district Pythagoras reader: white A4 paper, Rubik, a 24–26 px blue title (`#1d4ed8`) over a 4 px double rule, a circled page number, 1.35 px `#1f2a44` answer boxes and marking squares, and a 3 px dark divider between sheets on screen only. Unknowns stay "?" (RULES §8 overrides the reader's italic letters).

## 3. Module decisions

Evidence and line references: `MODULE_AUDIT_20261112.md` §6–§12.

| Module | Decision | Status |
|---|---|---|
| `exercise-set.js` (set flow) | **Redesign** into the document layer: options → seeded document → student sheets + separate key | **done (M1)** |
| `core.js` `generate()` | **Refactor**: every request is one document (count = 1 included) | done (M1) |
| `question-types.js` + regex key extraction | **Redesign** to item data with separate student and key renderers (`workbook/items.js`); legacy output isolated at render | done for verified families; isolation for all (M1); engines migrate in M2 |
| `random.js`, module counters | **Redesign** to injected seeded RNG (`workbook/rng.js`) | done for the document path (M1); counters removed in M2 |
| `validators.js` | **Redesign** into per-family checkers | done for G7-03 and N8-04 (M1) |
| `pattern-engine.js` + 7 source-fit wrappers + `pedagogy-attach.js` | **Redesign** into one registry-driven dispatcher | M2. M1 fixed `E.updatePanel`, which hid the question-type controls for 25 topics |
| `diagrams.js` + `diagram-ultra-autopilot.js` + `themes.js` | **Consolidate** into the millimetre-based `workbook/figures.js` | started (M1: right triangle, rectangle + diagonal, triangle sketch); M2 |
| `diagram-premium-overrides.js`, `schema.js`, 15 unreachable legacy files, `follow-up.js` on index | **Remove** after migrating the verifier assertions that pin them | M2/M5 |
| `export.js` | **Retain**; capture now snapDOM-first, html2canvas fallback | done (M1) |
| `mobile-share.js` | **Remove** (it copies only the first card; per-exercise buttons cover it) | M5 |
| CSS files + inline `<style>` | **Consolidate**; M1 adds `workbook/workbook.css`, which owns the sheets | M5 |
| `book.html/js/css` (official PDFs viewer) | **Retain** as the teacher's curriculum library | — |
| `tools/engine-load.mjs` | **Refactor** to load the production script list | M2 (M1 adds `tools/workbook-load.mjs`, which loads `index.html` + runtime topics) |
| `verify-real-generator-runtime.mjs` | count = 1 assertion moved to the document path (intentional change); now loads the workbook core and checks replay + answer isolation | done (M1) |
| 11 always-failing workflows, `gemini-agent.yml` | **Remove** or replace with one browser smoke job | M5, needs owner approval (CI) |

## 4. Curriculum and capability matrix

Full matrix with document, edition, page and status: [`CURRICULUM_MATRIX_20261112.md`](CURRICULUM_MATRIX_20261112.md). Findings that change the plan:

1. Intake files 01–06 are the **May 2026** editions; the Ministry re-issued all six domain documents at the same URLs on 14 Sep – 25 Oct 2026 (word similarity 0.86–0.89). 07–10 are identical to the live files.
2. Not in `sources/intake/`: the uncertainty companion, the outline and presentation, the teaching plans for תשפ״ז (grade 7; grade 8 = transitional year; grade 9 regular; grade 9 reduced, at most 25 % of a cohort) and the grade-9 profile (≤ 4 units).
3. Grade 9 has no updated curriculum; it is governed by the two plans and the profile. No engine exists.
4. Placement and wording: U7-08 is grade-8 content; U7-02 is partly grade 8; A7-04 factoring appears only in the grade-9 plan; the official term is "שכיחות" (targilim says "תדירות"); `CURRICULUM_MAP.md` encodes the superseded program.
5. Pythagoras is a grade-7 topic in the current plan. Official conventions also include √ and 2-decimal answers with ≈, distance on the grid as a hypotenuse, and applied contexts. G7-03 covers only integer triples. No official document states the converse that G7-03-check uses.

**Owner decisions needed (no change without approval, RULES §4):** (a) documented intake of the re-issued 01–06 and the missing documents; (b) the terminology change to "שכיחות"; (c) moving U7-08 / parts of U7-02 / A7-04 factoring; (d) keeping or retiring G7-03-check; (e) the curriculum-plan selector (regular / reduced / transitional), which needs (a); (f) first grade-9 families.

Capability today: grades 7–8, 61 topics. Verified (seeded + independent checker): **G7-03, N8-04**. All 61: seeded replay, A4 book, print, PDF, answer isolation. Open questions only: the 11 runtime topics.

## 5. Milestones (dependency order), acceptance, verification

| Milestone | Scope | Acceptance criteria | Verification |
|---|---|---|---|
| **M0 Baseline** (done) | measurements in §1 | recorded | `verify:deep`; seeded before-capture |
| **M1 Vertical slice** (this branch) | teacher options (grade, topics as chapters, count, document type, רמה 1–3 mapped to below / at / above the plan, uniform or graduated order, question types, MCQ mode, view, replay code); seeded document; 2 verified topics; A4 book; print; PDF; answer key sheets; phone | verify:deep green; verified items 0 failures; 61 topics compose with 0 answer markers; print pages = sheets = PDF pages; no clipping at 390 px; before/after evidence | `verify:workbook` (in `verify:all`); `verify-real-generator-runtime`; Playwright harness (evidence folder) |
| **M2 Engine migration** | per domain, move each engine into the family contract with a checker; remove module counters and the 9-layer dispatch; fix sampled defects (G8-07 basic: one diagram with three "correct" theorems; N7-06 compare MCQ; duplicate distractors in N7-01, U7-04; constant 2–4 MCQ options); real level bands for the 11 flat engines | every topic verified; levels differ (kind or number band); same-session replay identical | extend `verify:workbook` per family; retire text-pinned assertions only by moving them to behaviour checks |
| **M3 Curriculum intake** (needs approval) | intake of re-issued documents; registry + `SOURCE_BIBLE.md` regenerated; terminology; placement; plan selector | each family cites current document + page; no superseded content in a current plan | `verify:source-lock`, `verify:source-bible`, matrix diff |
| **M4 Grade 9** (needs approval) | families from the plans/profile, starting with the reduced plan topics | as M2 + source basis recorded before generation is enabled | as M2 |
| **M5 Cleanup** | CSS consolidation; dead files; KaTeX 0.19.1; failing workflows; a CI browser smoke (print/PDF parity, phone) | fewer files and lines; CI all green | CI |

## 6. Rollback

M1 is additive: the old engine functions, registries and sources are untouched, and the change sits in one PR. Reverting the merge commit restores the previous UI completely; there is no stored data or migration. The site deploys only from `main` after approval (RULES §4). Inside the product, the PDF download fails safe: without snapDOM it falls back to html2canvas, and print always works.
