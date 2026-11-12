> Prepared 2026-11-12 for the workbook implementation plan ([WORKBOOK_IMPLEMENTATION_PLAN_20261112.md](../planning/WORKBOOK_IMPLEMENTATION_PLAN_20261112.md)). Read-only research: findings marked UNVERIFIED were not confirmed. Line references point at commit `d274b44` unless stated.

# Pythagoras reader — design reference for the `targilim` worksheet generator

Read-only extraction, 2026-11-12. Goal: let a separate static Hebrew-RTL worksheet generator match the Jerusalem-district
"Pythagoras reader" in reading, A4 pagination, print and PDF behaviour. Each section ends with **Replicate** bullets.

## 0. Sources, versions, how to read the references

| Tag | Source | Version / status |
|---|---|---|
| `J2 <path>:<line>` | `jerusalem2`, read only via `git show origin/main:<path>` | `3cfb199`, 2026-11-09 |
| `REQ:<line>` | `J2 docs/REQUIREMENTS.md` (each numbered requirement is ONE physical line) | same |
| `PY <path>:<line>` | canonical worksheet source `yanivmizrachiy/pythagoras` = local clone `pythagoras`, `origin/main` | `4d4528d`, 2026-10-19. Every file cited as `PY` was sha1-checked **byte-identical** to the live site |
| `PY-live <path>:<line>` | the same repo as served by `https://yanivmizrachiy.github.io/pythagoras/` (what the district reader actually loads), fetched 2026-11-12 | **newer than the local clone** for: 28 page CSS files, `styles/topics/pythagoras-foundations.css`, `styles/topics/pythagoras-live.css`, `index.html`, `SOURCE_OF_TRUTH.md`, `tools/build-static-pdf.js`, `tools/validate.js`, `pythagoras-workbook.pdf`. Saved copies: `(working notes)/live-diff\live__*` |
| `LIVE` | `https://jerusalem2.vercel.app/chativat-beynayim/h/topics/h-pythagoras/` (WebFetch returned only rendered text, so the raw HTML was also fetched with curl to `...\scratchpad\live-page\page.html`) | its inline `<pythagoras-native>` script is byte-identical to `J2 src/components/PythagorasNative.astro` (27,047 chars) |

All 53 page HTML files, `styles/a4-base.css`, `styles/topics/pythagoras.css`, `styles/topics/geometry7.css`,
`styles/topics/pythagoras-inline-units.css`, `vendor/fonts/rubik.css`, `WORKBOOK_MANIFEST.json`, `DESIGN.md`, `book-design.css`
and `tools/smoke.js` are identical live vs local. Shorthands: `…foundations.css` = `PY-live styles/topics/pythagoras-foundations.css`,
`…pythagoras-live.css` = `PY-live styles/topics/pythagoras-live.css`, `NWR` = `J2 src/components/documents/NativeWorkbookReader.astro`,
`spec` = `J2 tests/e2e/pythagoras-solo-control-ownership.spec.ts`; a bare `J2 :n` means `J2 src/components/PythagorasNative.astro:n`.

### Architecture in one paragraph
`<pythagoras-native data-source="https://yanivmizrachiy.github.io/pythagoras/" data-instance="…">` is a custom element with an
**open ShadowRoot** (isolates the worksheet's global `html/body/@page` CSS from the district site and stops district themes
recolouring the paper) — `J2 src/components/PythagorasNative.astro:2-5,9-16`. It fetches `WORKBOOK_MANIFEST.json`, insists on
exactly 53 pages (:121-124), builds 53 fixed-A4 cells (:144-151), lazily fetches each `עמוד-N.html`, takes its `main.a4-page`,
links that page's own CSS into the shadow root, MathJax-typesets it and reveals it (:174-225). It exposes exactly two actions:
`הדפסה` (builds a dedicated print document in a popup) and `הורדה` (serves the pre-built static PDF, or a pdf-lib page range).
No iframe, no OCR, no PDF-as-viewer, no second copy of the pages in the district repo (REQ:48).
Surfaces: topic page lead (`J2 src/components/TopicLeadResource.astro:37,67-68` — full-width "site lead", host `TaskActions`
suppressed at :93), grade-book solo mode (`J2 src/pages/chativat-beynayim/[grade]/chomarim.astro:141,430-433`), resource page
(`J2 src/pages/chativat-beynayim/[grade]/resources/[resourceId].astro:222`).
The generic successor engine for other workbooks is `J2 src/components/documents/NativeWorkbookReader.astro` (cited as `NWR`).

---

## 1. Page model

### 1.1 Sheet geometry (source sheet)
- `.a4-page { width:210mm; height:297mm; background:var(--bg-paper); padding:10mm 18mm; box-shadow:0 0 10px rgba(0,0,0,0.15);
  display:flex; flex-direction:column; justify-content:space-between; page-break-after:always; position:relative; margin:30px;
  overflow:hidden; }` — `PY styles/a4-base.css:26-39`.
- Margins = sheet padding: **10 mm top/bottom, 18 mm left/right** → content box 174 × 277 mm (657.6 × 1046.9 CSS px).
- Natural pixel size used by the reader: `210*96/25.4 = 793.70px` × `297*96/25.4 = 1122.52px` (`J2 PythagorasNative.astro:170`).
- Vertical structure (always): `header.header-container` → `.question-block{flex-grow:1;display:flex;flex-direction:column;
  justify-content:space-between}` → `footer.gz-footer` (`PY a4-base.css:91-113`).
- Footer bleeds to the sheet edges: `margin-inline:-18mm; margin-bottom:-8mm; min-height:13mm; border-top:1px solid
  var(--title-blue); display:grid; grid-template-columns:auto auto; column-gap:10px; justify-content:center` + 40 px round
  district logo via `::before` (`PY a4-base.css:41-74`). The credit is mandatory on every sheet; topic layers may restyle it,
  never reword it (comment at `PY a4-base.css:41`).
- Contract: "every page stays 210×297 mm; no internal responsive reflow; screen fitting is external scaling; no horizontal
  overflow" (`PY DESIGN.md:5-9`; `PY-live SOURCE_OF_TRUTH.md:63`).

### 1.2 Sheet styling by context
| Context | Background around sheet | Sheet shadow | Gap between sheets | Ref |
|---|---|---|---|---|
| Standalone source page | body `#e0e0e0` | `0 0 10px rgba(0,0,0,0.15)` (symmetric — `PY DESIGN.md:20`) | `margin:30px` | `PY a4-base.css:14-16,31,37` |
| District reader, screen | white cells on the host card (topic page: white card, 1px `--line` border, 16px radius, `--shadow-1`) | **none**: `.pyn-paper .a4-page{margin:0!important;box-shadow:none!important}` | **0** (`gap:0`), sheets touch; a 3 px dark divider is painted over the top edge of every sheet after the first (§3.3) | `J2 PythagorasNative.astro:78-82`; `J2 TopicLeadResource.astro:128-135` |
| Print popup / PDF | `#fff` | none | hard page break | `J2 PythagorasNative.astro:323-327` |

### 1.3 How pages are formed — fixed-height sheets, not flowing content
- **No pagination engine.** One HTML file = exactly one `main.a4-page` = one printed page (`PY-live tools/validate.js:29-30`).
  Content is hand-fitted into the fixed 297 mm box; `overflow:hidden` clips anything that does not fit.
- Reader cell per manifest entry: `<section class="pyn-cell" data-page="N" aria-label="עמוד N">` containing
  `.pyn-paper{position:absolute;top:0;left:0;width:210mm;height:297mm;transform-origin:top left;background:#fff}` and a
  `.pyn-loading` placeholder (`J2 PythagorasNative.astro:79-83,144-151`).
- Scaling (JS): `scale = max(.2, min(1, (pagesColumnWidth − 6) / 793.70))`; the cell gets `width/height = natural × scale`,
  the paper gets `transform:scale(scale)` (`J2 :168-173`). Recomputed by a ResizeObserver on host, pages column and bar
  (`J2 :152-160`). Desktop never upscales (max 1).
- Lazy loading: IntersectionObserver `rootMargin:'1300px 0px'`; page 1 awaited, page 2 pre-warmed (`J2 :161-165`).
- Per-page load: fetch `עמוד-N.html` → `DOMParser` → `main.a4-page` → re-tag as `<div>` keeping every attribute/child (one `main`
  landmark per document) → link `styles/pages/עמוד-N.css` into the shadow root and **wait for its `load`** (20 s timeout,
  error `CSS חסר בעמוד N`) → insert → MathJax typeset (§8) → remove placeholder (`J2 :174-225`).
- Shared stylesheets linked once into the shadow root: `vendor/fonts/rubik.css`, `styles/a4-base.css`,
  `styles/topics/pythagoras.css` (`J2 :105-107`). Each page CSS `@import`s its topic layer: `pythagoras-foundations.css`
  (pages 1-20, 45-47), `pythagoras-live.css` (25-43), `pythagoras.css` (21-24, 44), `geometry7.css` + `pythagoras.css` (48-53);
  every topic layer imports `pythagoras.css` (all inside `@layer topic`).

### 1.4 How content is never split across pages
1. Atomic sheets: fixed `height:297mm; overflow:hidden` (`PY a4-base.css:28,38`).
2. Print wrapper per sheet: `.print-sheet{position:relative;width:210mm;height:297mm;min-height:297mm;max-height:297mm;
   overflow:hidden;break-after:page;page-break-after:always;margin:0;padding:0;background:#fff}` and
   `.print-sheet:last-child{break-after:auto;page-break-after:auto}`; `@page{size:A4;margin:0}` (`J2 PythagorasNative.astro:321-327`).
3. Authoring QA in the source repo, in **screen and print media**: adjacent sections must not overlap, cards fail if
   `scrollHeight > clientHeight + 3`, the worksheet must not overlap the footer (`PY tools/smoke.js:143-186`); real Chrome at
   320×568, 412×915, 820×1180, 1366×768, 1920×1080 with no horizontal overflow (`PY tools/smoke.js:7-11,45`).
4. Belt-and-braces `break-inside:avoid` on cards/notes/statements/worked examples (`PY-live styles/topics/pythagoras-foundations.css:64-67,84`),
   geo7 `.q` and `.figure` (`PY styles/topics/geometry7.css:24,97`), and `svg,figure,table` + headings `break-after:avoid` in the
   canonical site reader (`PY book-design.css:16-24`). These matter only if a sheet were ever allowed to flow.

### 1.5 Data model
- Pythagoras manifest (schemaVersion 2): `{schemaVersion:2, id:"pythagoras", name:"משפט פיתגורס", totalPages:53,
  pages:[{file:"עמוד-634.html", sourceNumber:634, workbookNumber:1, curriculumId:"g7.geo.pythagoras", primaryTopic:"משפט פיתגורס"}, …]}`
  (`PY WORKBOOK_MANIFEST.json:1-7`). Manifest order is the only page order; `.page-number` inside each sheet must equal
  `workbookNumber` (`PY-live tools/validate.js:21-35`). Chapters are hard-coded in the component (`J2 PythagorasNative.astro:127-135`).
- Generic schemaVersion 3 (NWR; live harut/Tnufa manifests): `pageSelector`, `assets{css[],fontsCss,mathjax,mathjaxFontRoot,
  pageCssPattern}`, `chapters[{id,title,startPage,endPage,color,tint}]`, `pdf{file,pageCount,sha256,coverPages,studentRange?}`,
  `contentHash`, `builtAt`, `version`, `credit[]`, `cover` (REQ:312, REQ:314; `NWR :174-195,243-257`).

**Replicate**
- Render each worksheet as a fixed `210mm × 297mm` box with `padding:10mm 18mm`, `overflow:hidden`, flex column (header / body / footer).
- Do your own packing: measure exercise blocks against the 277 mm content height and start a new sheet before overflow; never rely on browser fragmentation.
- On screen, scale the whole sheet with `transform:scale()` from a 793.70 px natural width; never reflow the sheet.
- Keep a manifest (ordered pages + chapter ranges + PDF metadata) as the single source for order and numbering.

---

## 2. Typography

### 2.1 Families
- Worksheet text: **Rubik**, self-hosted Google subsets incl. Hebrew, weights **400/500/700** only (`PY vendor/fonts/rubik.css`, 18
  `@font-face`, `font-display:swap`). Applied by `:is(.pythagoras,.page-375,…,.page-380).a4-page{font-family:'Rubik',Arial,sans-serif}`
  (`PY styles/topics/pythagoras.css:31-33`); standalone pages also set `html,body{font-family:'Rubik',sans-serif;font-size:16px;
  color:var(--text-main);-webkit-font-smoothing:antialiased}` (`PY a4-base.css:14-24`).
- Body math: **MathJax 4.1.3**, CHTML output, self-hosted `vendor/mathjax/tex-mml-chtml.js` (version constant inside the
  bundle) with TeX woff2 fonts in `vendor/mathjax/tex-font/chtml/woff2`; CDN only as fallback (`PY-live SOURCE_OF_TRUTH.md:92-97`). Not KaTeX.
- Math inside SVG labels: `@font-face 'PytTeX'` = `mjx-tex-n.woff2` (upright numerals/lengths) and `'PytTeXMathItalic'` =
  `mjx-tex-mi.woff2` (italic variables and points), fallback `Georgia,'Times New Roman',serif` (`PY styles/topics/pythagoras.css:5-14,44-58`).
- Reader chrome (bar, TOC, buttons) inherits the host UI font: district `--font-ui:'Heebo','Assistant',system-ui,'Segoe UI',Arial,sans-serif`
  (`J2 src/styles/tokens.css:139`); the grade book uses `'Rubik','Heebo',system-ui,sans-serif` and declares Rubik at document level
  (`J2 src/styles/grade-book.css:10-18,49`). Print-window button: `font:700 16px Arial` (`J2 PythagorasNative.astro:330`).

### 2.2 Worksheet sizes / weights / line-heights
| Role | Selector | Value | Ref |
|---|---|---|---|
| Base | standalone `html,body` | 16px, colour `#000` (line-height not set = `normal`) | `PY a4-base.css:14-24` |
| Page title | `.page-title` | **26px / 400** (light), colour `#1d4ed8` | `PY a4-base.css:100` |
| Header row | `.header-container` | flex `space-between`, `align-items:flex-end`, `padding-bottom:6px`, `margin-bottom:8px`, **`border-bottom:4px double #1d4ed8`** | `PY a4-base.css:91-98` |
| Page number | `.page-number` | 32×32 circle, `2px solid #1d4ed8`, 16px, colour `#1d4ed8` | `PY a4-base.css:101-111` |
| Instruction | `.q-text` | 16px, `line-height:22px` | `PY a4-base.css:119` |
| Note box | `.foundation-note` | 18px, lh 1.55, bg `#f8fafc`, padding `12px 16px` (frameless live) | `PY-live …foundations.css:5` |
| Sub-item letter | `.sub-label` | 500, `margin-inline-end:6px` | `PY-live …pythagoras-live.css:182-185` |
| Worked example | `.example-label` 18px/700; `.solution-step` 21px lh 1.35; `.final-answer` 21px/700, `2px solid #000`, radius 5px, padding `4px 16px` | | `PY-live …foundations.css:72-75` |
| Display maths | `.big-equation` 27px/700 centred LTR; `.practice-equation` 20px/600; `.math-card` 19px | | `PY-live …foundations.css:57,61,78` |
| Reason label | `.reason-label` | 15px/600 | `…foundations.css:54` |
| SVG labels (live sheets) | `.pyt-point` 14px/500, `.pyt-side` 14px/400, `.pyt-var` 14px/500 italic → fonts overridden to PytTeX 400 / PytTeXMathItalic italic 400; white halo `paint-order:stroke;stroke:#fff;stroke-width:1.5` | | `PY-live …pythagoras-live.css:84-115`; `PY pythagoras.css:45-58` |
| SVG labels (foundation sheets) | `.pt,.lbl` 17.5px PytTeX 400; `.lbl.var,.pt` PytTeXMathItalic italic | | `…foundations.css:40-41` |
| Answers strip | `.pyt-solutions .q-text` 12px; `.solutions-label` 500 | | `PY-live …pythagoras-live.css:242-253` |
| MC number | `.pyt-mc-num` 11px, opacity .7 | | `…pythagoras-live.css:169-174` |
| Footer | `.f1` 10.5px/500 `#1f2a44`; `.f2` 9.5px `#475569`; lh 1.2 | | `PY a4-base.css:60,76-89` |
| geo7 sheets (48-53) | `.qbody` 15px lh 1.5; `.chapter-name` 17px/500; `.page-subtitle` 14px `#475569`; `.defcard` 14px lh 1.45; table 13.5px; `.figcap` 12px; footer 12.5/11.5px | | `PY styles/topics/geometry7.css:12-26,93-111` |

Weights on sheets: 400, 500, 600, 700. Titles are deliberately **light (400)**.

### 2.3 Reader chrome sizes
`.pyn-title` `font-size:var(--fs-500,16px)` (= 1.125rem = 18px on the district site, `J2 tokens.css:150`) weight 800; TOC heading 15px
lh 1.4 (13px ≤1040px, 12px ≤600px); chapter buttons 12.5px/800 lh 1.5 (12px / 11px); action buttons 13.5px/700 (11px ≤600px);
status 12px (`--fs-200`) lh 1.5 colour `--ink-soft #334155` (`J2 PythagorasNative.astro:38,46,50,57-58,64-65,74,86`).

### 2.4 RTL / BiDi (enforced by the source validator)
- Every MathJax container on a sheet: `mjx-container[jax="CHTML"]{direction:ltr!important;unicode-bidi:isolate!important}`
  (`PY pythagoras.css:16-21`; gate `PY-live tools/validate.js:219-225`). Applies to reader, direct page and print.
- Inline math inside Hebrew prose may additionally be wrapped `<bdi dir="ltr">…</bdi>` (`PY-live SOURCE_OF_TRUTH.md:74`; page 10 must
  contain 7: `PY-live tools/validate.js:226-232`). MathJax inline line-breaking off: `output:{linebreaks:{inline:false}}`
  (`PY-live SOURCE_OF_TRUTH.md:75`; e.g. `PY עמוד-634.html:2`). Delimiters `\( … \)` inline, `\[ … \]` display (`J2 PythagorasNative.astro:235`).
- SVG "number + unit" labels (`12 ס״מ`): attribute `direction="ltr"` plus CSS `direction:ltr;unicode-bidi:isolate`
  (`PY pythagoras.css:60-66`; gate `PY-live tools/validate.js:52-54`).
- LTR islands (`direction:ltr;unicode-bidi:isolate`): `.ordered-pair`, `.math-table` (with RTL `.label-cell`), `.answer-inline`,
  `.pyt-mc-val`, `.pyt-solution`, `.solution-space`, `.pyt-final-answer`, `.full-solution-space`, `.student-final-answer`,
  `.math-card`, `.big-equation`, `.solution-stack`, `.final-answer`, `.degree-answer-unit` (`PY a4-base.css:148-157,231`;
  `PY-live …pythagoras-live.css:140-143,176-179,188-201,212-222,255-261`; `…foundations.css`; `PY …inline-units.css:6-24`).
- Notation gates (`PY-live tools/validate.js:37-50`): multiplication `·`/`\cdot`, never `×`/`\times`; units `ס״מ` / `סמ״ר` with
  gershayim U+05F4 (ASCII `"` forbidden); powers only in MathJax (no `<sup>/<sub>`, no `²³…` in body text); every `√` glyph must be
  the canonical radical component; printed roots read `√n`, never `n√` (`PY-live SOURCE_OF_TRUTH.md:66,74-77`).
- Square-root writing component (single owner `PY pythagoras.css:68-119`): `.sqrt-cell{display:inline-flex;align-items:flex-start;
  direction:ltr;unicode-bidi:isolate;min-height:23px;white-space:nowrap}`; `.radic` 19×23 px, `font-size:0` (glyph kept for a11y),
  drawn by an inline-SVG `::before` path, stroke `#334155` width 1.45, round caps; writing slot `.root-line/.root-work-fill`
  `height:20px;border-top:1.35px solid #334155;border-bottom:1.1px solid #334155`.

**Replicate**
- Self-host Rubik 400/500/700 (Hebrew subset) and declare `@font-face` at **document level**; use a TeX-style font for maths (MathJax CHTML or equivalent glyphs).
- Title 26px/400 in `#1d4ed8` over a 4px double blue rule; circled page number; body 16px with explicit line-heights.
- Wrap every formula, ordered pair, number+unit and answer field in an LTR-isolated span; use `·`, `ס״מ`, `סמ״ר`.

---

## 3. Colour tokens

### 3.1 Paper tokens (canonical, mirrored on `:host` so a grade theme can never recolour the sheet)
`--text-main:#000000; --accent-dark:#000000; --title-blue:#1d4ed8; --grid-line:#cbd5e1; --border-light:#e2e8f0;
--bg-subtle:#f8fafc; --bg-paper:#ffffff; --cell-size:20px` (`J2 PythagorasNative.astro:28-31` = `PY a4-base.css:1-10`; asserted
by `J2 tests/e2e/pythagoras-solo-control-ownership.spec.ts:165-178`). Other fixed sheet colours: answer-box border `#1f2a44`,
radical ink `#334155`, footer `#1f2a44` / `#475569`, graph paper lines `rgba(148,163,184,.35)` with border `#e2e8f0`
(`PY-live …foundations.css:46,49`; the stale local clone still has blue `rgba(96,165,250,.42)`), 22 px calculation grid `#cbd5e1`
(`PY-live …pythagoras-live.css:188-201`). Current live sheets are **frameless**: decorative card/note/statement/worked-example/
diagram-frame borders were removed (backgrounds and padding kept); answer fields keep their borders.

### 3.2 Reader chrome tokens (district, inherited through the shadow boundary)
`--ink:#0f172a; --ink-soft:#334155; --line:#e2e8f0; --surface:#ffffff; --surface-2:#f8fafc` (`J2 tokens.css:26-32`);
`--motion-ui:210ms` (:191); `--ease-standard:cubic-bezier(.2,.8,.2,1)` (:197); `--focus:#2563eb` (:113).
`.pyn-root{--pyn-ink:var(--ink);--pyn-line:var(--line);color:var(--pyn-ink)}` (`J2 PythagorasNative.astro:35`).

Chapter accents (TOC only; `J2 PythagorasNative.astro:127-135`; contrast computed with WCAG formula):
| # | Chapter (exact label) | Pages | Accent | Tint | accent on tint | white on accent |
|---|---|---|---|---|---|---|
| 1 | מושגים בסיסיים ומשולש ישר־זווית | 1-5 | `#2563eb` | `#eff6ff` | 4.75 | 5.17 |
| 2 | ריבועים, שורשים ומשוואות | 6-12 | `#0f766e` | `#ecfdf5` | 5.20 | 5.47 |
| 3 | מגלים ומנסחים את משפט פיתגורס | 13-17 | `#7c3aed` | `#f5f3ff` | 5.20 | 5.70 |
| 4 | חישוב היתר והניצב | 18-20 | `#c2410c` | `#fff7ed` | 4.88 | 5.18 |
| 5 | תרגול משפט פיתגורס | 21-44 | `#15803d` | `#f0fdf4` | 4.79 | 5.02 |
| 6 | שאלות מתוך תוכנית הלימודים | 45-47 | `#be123c` | `#fff1f2` | 5.72 | 6.29 |
| 7 | יישומים בגאומטריה ובמערכת צירים | 48-53 | `#a16207` | `#fefce8` | 4.76 | 4.92 |

### 3.3 Dark-blue inter-sheet divider (screen only)
- `.pyn-cell+.pyn-cell:before{content:"";position:absolute;inset-inline:0;top:0;height:3px;background:var(--pyn-ink);z-index:2;
  pointer-events:none}` → `#0f172a` (`J2 PythagorasNative.astro:80`; `J2 tokens.css:26`). Full sheet width, flush to both sheets,
  no gap, no "עמוד N מתוך 53" between sheets (REQ:48; `PY-live SOURCE_OF_TRUTH.md:49`).
- Hidden in print: `@media print{… .pyn-cell:before{display:none!important} …}` (`J2 :89`); absent by construction from the
  popup print document and the PDF (sheets are re-wrapped in `.print-sheet`, `J2 :340-343`).
- Sister readers: NWR uses `background:#0f3150` (validator-enforced, `NWR :99`; `J2 scripts/validate/validate-native-workbooks.mjs:69`);
  DocPages uses a separate `.dp-divider{block-size:3px;background:var(--brand-dark)}` = `#161f31`, `display:none` in print
  (`J2 src/styles/doc-pages.css:66-77,95-96`).

### 3.4 Monochrome and colour-adjust
- The colour/black-and-white choice exists **only for printing** and is revealed **only after pressing `הדפסה`** (REQ:48;
  `PY-live SOURCE_OF_TRUTH.md:44`). No on-screen greyscale preview.
- Mono = `body.print-mono` + `.print-mono .print-sheet{filter:grayscale(1)!important}`; colour = no filter; both modes force
  `@media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}` (`J2 PythagorasNative.astro:328-329,339`).
- Sheet-level exact backgrounds: footer logo, graph paper, radicals (`PY a4-base.css:72-73,442`; `…foundations.css:46,49`;
  `PY pythagoras.css:154-160`). In print, answer boxes become flat: white, no shadow, border `#1f2a44` (`PY pythagoras.css:148-153`;
  `…foundations.css:64-67`).
- No B/W PDF download in the district reader (download = the static colour PDF). The canonical site reader additionally offers
  `הורדת PDF בשחור־לבן` via client-side raster (`PY-live index.html:39-40,115`).

**Replicate**
- Keep paper tokens local to the sheet (white paper, black text, `#1d4ed8` titles); never let site theme variables reach the sheet.
- Screen-only 3px `#0f172a` (or `#0f3150`) divider between flush sheets; `display:none` in print.
- B/W = `filter:grayscale(1)` on each printed sheet behind a print-only choice; always `print-color-adjust:exact`.

---

## 4. Action bar

### 4.1 Exactly one
Exactly one `.pyn-actions` (`J2 scripts/validate/validate-em-proxy.mjs:170-171`; REQ:48 "סרגל פעולות ייעודי אחד בלבד ללא כפילויות").
The host must not add a second set: the topic page does not render `TaskActions` for pythagoras (`J2 TopicLeadResource.astro:93`);
grade-book solo hides host header/peek/TOC/pager/mode switch/search/footer (`J2 src/styles/grade-book.css:410-430`;
`J2 src/styles/sphere-system.css:239-250`; `PY-live SOURCE_OF_TRUTH.md:31,45`).

### 4.2 Contents (exact labels, `J2 PythagorasNative.astro:102`)
- Rail, two buttons only: `<button id="pynPrintBtn" aria-expanded="false" aria-controls="pynPrint">הדפסה</button>`,
  `<button id="pynDownloadBtn" aria-expanded="false" aria-controls="pynDownload">הורדה</button>`.
- Print popover `#pynPrint` (hidden): `הדפסה בצבע` (`#pynPrintColor`), `הדפסה בשחור־לבן` (`#pynPrintMono`).
- Download popover `#pynDownload` (hidden): `הורדת כל 53 הדפים` (`#pynFullDownload`), `מעמוד <input id="pynFrom" type="number"
  inputmode="numeric" min="1" max="53" value="1">`, `עד עמוד <input id="pynTo" … value="53">`, `הורדת טווח` (`#pynRangeDownload`).
- Separate title bar (not actions): `<h2 class="pyn-title">משפט פיתגורס – 53 דפים להדפסה</h2><p id="pynStatus" role="status">`.
- Deliberately absent: page counter, prev/next, zoom, view modes, fullscreen, answers toggle, permanently visible colour buttons
  (REQ:48). (The canonical site reader and NWR do have pager/counter/modes/zoom/fullscreen — `NWR :137-150`.)

### 4.3 Placement and styling
- RTL three-column grid: `.pyn-layout{display:grid;grid-template-columns:minmax(192px,224px) minmax(0,1fr) minmax(90px,108px);
  gap:10px;align-items:start;min-width:0;direction:rtl}` → TOC physically **right** (col 1), sheets centre (col 2), actions
  physically **left** (col 3) at every width (`J2 :40,41,44,52`; e2e spec:28-43,279-283).
- Title bar: `position:sticky;top:0;z-index:10;background:#fff;border-bottom:1px solid var(--pyn-line,#e2e8f0);padding:5px 9px;
  padding-inline-start:var(--pyn-bar-start,9px);margin:0 0 4px;display:flex;gap:10px;align-items:center;
  justify-content:space-between;min-height:35px;box-shadow:0 2px 9px rgba(15,23,42,.06)` (`J2 :37`; the comment on :36 says
  "non-sticky" but CSS and e2e spec:93-105 require sticky). Grade-book solo sets `--pyn-bar-start:58px` so the floating back
  button never covers the title (`J2 grade-book.css:419-421`; spec:107-123).
- Actions rail: `.pyn-left{position:sticky;top:52px}` — clears the ~39px bar so `הדפסה` is never tucked behind it (`J2 :42-44`).
- Rail buttons: column, `gap:9px`, full rail width; `min-height:44px;font-weight:700;font-size:13.5px;border-radius:12px;
  border:1px solid color-mix(in srgb,#1d4ed8 22%,#e2e8f0);background:linear-gradient(180deg,#fff,#f6faff);
  box-shadow:0 1px 2px rgba(15,39,65,.05)`; hover `border-color:#1d4ed8;background:linear-gradient(180deg,#fff,#eef4ff);
  box-shadow:0 6px 16px rgba(29,78,216,.14)`; `:active{transform:translateY(1px)}`; `[aria-expanded=true]{background:#1d4ed8;
  border-color:#1d4ed8;color:#fff;box-shadow:0 6px 18px rgba(29,78,216,.26)}` (`J2 :45-49`).
- Popovers: `position:absolute;top:100%;left:0;z-index:20;width:min(300px,88vw)` (≤1040px: `min(260px,75vw)`),
  `background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-top:8px;max-height:55vh;overflow:auto;
  box-shadow:0 12px 35px rgba(15,39,65,.16)` (`J2 :51,59,71`). They overlay the sheets and never change sheet width (spec:198-203).
- Popover controls: `.pyn-control-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}`; buttons `border:1px solid #e2e8f0;
  border-radius:9px;background:#fff;padding:9px 13px;min-height:42px`, hover `#f8fafc`; inputs `width:82px;min-height:42px;
  padding:6px;border:1px solid #e2e8f0` (`J2 :67-68,76-77`).

### 4.4 Behaviour
- Toggle: opening one popover closes the other; `aria-expanded` mirrors state; re-clicking closes. No Escape / outside-click close
  in this component (`J2 :108-116`); the canonical site reader does close on both (`PY-live index.html:115`).
- `הדפסה בצבע` / `הדפסה בשחור־לבן` → popup print document (§6.2). `הורדת כל 53 הדפים` / `הורדת טווח` → §7.1.
- Status line: `טוען דפי HTML מקוריים…` while loading, then emptied and hidden — no status/"demo" text above the bar once loaded
  (`J2 :20,102,166`; REQ:48). Errors: `לא ניתן לטעון את הדפים: <msg>` and the fallback link `פתיחת דפי פיתגורס במקור` appears (`J2 :21`).
- NWR adds fail-closed: on any error every `.nwr-actions button` is disabled so an unverifiable version can't be downloaded (`NWR :59-65`).

**Replicate**
- One action group only: `הדפסה` + `הורדה`, each opening a small popover; colour/B&W inside the print popover only.
- Sticky title bar at top; action rail sticky just below it (top ≈ bar height + 13px); popovers absolutely positioned, never resizing the sheet.
- 44px targets, 13.5px/700 labels, 12px radius, `#1d4ed8` pressed state; add Escape/outside-click close (improvement over the reference).

---

## 5. Chapter navigation

- Markup: `<aside class="pyn-right" aria-label="תוכן עניינים – משפט פיתגורס"><h3 class="pyn-toc-heading" id="pynTocHeading">
  תוכן עניינים – משפט פיתגורס</h3><nav id="pynToc" aria-labelledby="pynTocHeading"><div id="pynChapterList">` then per chapter
  `<section class="pyn-chapter" style="--pyn-accent:…;--pyn-tint:…"><button type="button">{chapter name}</button></section>`
  (`J2 :102,136-143`).
- Content rules: 7 chapters, label = chapter name only — no digits, no per-page buttons, no `<summary>` expanders, no
  "בחירת עמוד מסוים בפרק" row, no TOC toggle button (REQ:48; spec:46-65,157-163,206-214).
- Rail: `position:sticky;top:43px;min-height:440px;height:calc(100dvh - 118px);max-height:940px;overflow-y:auto;
  overscroll-behavior:contain;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px 10px;z-index:2` (`J2 :41`);
  heading `border-bottom:2px solid #1d4ed8;padding-bottom:10px;margin:0 0 12px` (`J2 :50`).
- Chapter card: `margin:0 0 9px;border:1px solid color-mix(in srgb,var(--pyn-accent) 28%,#e2e8f0);border-inline-start:4px solid
  var(--pyn-accent);border-radius:9px;overflow:hidden;background:var(--pyn-tint)`; button `display:block;width:100%;border:0;
  text-align:start;font-weight:800;font-size:12.5px;line-height:1.5;padding:9px 7px;white-space:normal;overflow-wrap:anywhere;
  color:var(--pyn-accent);background:var(--pyn-tint)`; hover/focus-visible: white text on the accent (`J2 :73-75`).
- Jump: `navigate(startPage)` → load target first → overlay `#pynFade` (`position:fixed;inset:0;background:#fff;opacity 0→1`,
  `transition:opacity 210ms cubic-bezier(.2,.8,.2,1)`) → wait 245 ms → `scrollIntoView({behavior:'instant',block:'start'})` →
  wait 65 ms → fade out. With `prefers-reduced-motion:reduce`: instant jump, no fade (`J2 :84-85,88,277-285`; REQ:48).
  `.pyn-cell{scroll-margin-top:8px}` (`J2 :53`) — the sheet's own 10 mm top padding keeps its title below the ~35px bar
  (NWR uses `scroll-margin-top:52px`, `NWR :98`).
- No deep links / hash sync / page counter in PythagorasNative. NWR supports `#<id>-page=N`, `#page=N`, `#N` and keeps the hash in
  sync with `history.replaceState` (`NWR :213-217,333-347`), plus keyboard: ArrowLeft = next, ArrowRight = previous (RTL),
  Home/End, `+`/`=`/`-` zoom (`NWR :293-303`).
- Desktop: TOC permanently visible on the right; in grade-book solo the host TOC is hidden; at 1920×1080 the first sheet renders
  780-805 px wide (≈ natural 793.7) and the TOC is taller than 500 px (spec:180-204; `J2 grade-book.css:414-417`).
- Mobile: the three columns are kept at every width ("TOC always remains on the right; never lays over, beneath or between papers",
  `J2 :54`): container ≤1040px → `minmax(142px,164px) minmax(0,1fr) minmax(78px,94px)`, gap 6px; ≤600px →
  `minmax(114px,132px) minmax(0,1fr) 60px`, gap 4px, rail `height:calc(100dvh - 80px)`, chapter text 11px (`J2 :55-66`).
  NWR instead collapses at ≤720px: one column, TOC static above the sheets (`max-height:50dvh`), actions a sticky wrapping row
  at the top (`flex:1 1 44%`) (`NWR :121-127`).

**Replicate**
- Right-hand sticky chapter rail with one coloured button per chapter (name only), own scroll, 4px inline-start accent.
- Jump = instant scroll to the sheet top hidden behind a ~245 ms white fade; skip the fade under reduced motion.
- On phones prefer NWR's single-column collapse (see §10.1) and add `#page=N` deep links.

---

## 6. Print CSS

### 6.1 In-page `@media print` (shadow-scoped, `J2 PythagorasNative.astro:89`)
`.pyn-bar,.pyn-right,.pyn-left,#pynStatus,#pynFade{display:none!important} .pyn-layout{display:block!important}
.pyn-pages{display:block!important;padding:0!important;width:210mm!important} .pyn-cell{width:210mm!important;height:297mm!important;
break-after:page;page-break-after:always;max-width:none!important} .pyn-cell:before{display:none!important}
.pyn-paper{transform:none!important}`. Caveats: it only governs the reader subtree (the host page's header/table still print),
it has no `:last-child` reset, and not-yet-loaded sheets would print blank — hence the dedicated popup below (`J2 :287-289,302-304`).

### 6.2 Popup print document (the supported path, `J2 :286-354`)
1. `window.open('','_blank')` synchronously inside the click (popup-blocker safe); if blocked: status `יש לאפשר חלונות קופצים כדי להדפיס`.
   Popup title `משפט פיתגורס – 53 דפים להדפסה`, interim text `מכין את 53 דפי החוברת המקוריים להדפסה…`; `printBusy` guard.
2. Load and typeset **every** sheet in manifest order (`for(let i=0;i<this.cells.length;i++)await this.loadPage(i)`); abort unless
   exactly 53 `.a4-page` nodes exist.
3. `html lang="he" dir="rtl"`; clone every shadow `<link rel=stylesheet>` into the popup head and **await each `load`**; clone the
   MathJax CHTML `<style data-j2-mjx>` blocks; append the page style:
```css
@page{size:A4;margin:0}
mjx-box{display:inline-block}mjx-root{display:inline-block;white-space:nowrap}mjx-sqrt{display:inline-block;padding-top:.075em}
mjx-sqrt>mjx-box{border-top:.075em solid;padding-left:.03em;margin-left:-.03em}mjx-sqrt.mjx-tall>mjx-box{padding-left:.3em;margin-left:-.3em}
html,body{margin:0!important;padding:0!important;display:block!important;height:auto!important;min-height:0!important;background:#fff!important;overflow:visible!important}
#pythagoras-print{display:block!important;margin:0!important;padding:0!important}
.print-sheet{display:block!important;position:relative!important;width:210mm!important;height:297mm!important;min-height:297mm!important;max-height:297mm!important;overflow:hidden!important;break-after:page!important;page-break-after:always!important;margin:0!important;padding:0!important;background:#fff!important}
.print-sheet:last-child{break-after:auto!important;page-break-after:auto!important}
.print-sheet>.a4-page{width:210mm!important;height:297mm!important;margin:0!important;border:0!important;box-shadow:none!important}
.print-mono .print-sheet{filter:grayscale(1)!important}
@media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
@media screen{.print-actions{position:sticky;top:0;padding:12px;background:#eaf0f6;text-align:center;z-index:999}.print-actions button{font:700 16px Arial;padding:10px 25px}}
@media print{.print-actions{display:none!important}}
```
4. Body = `.print-actions` (screen-only bar with button `הדפסת 53 הדפים` → `popup.print()`) + `#pythagoras-print` of 53
   `section.print-sheet` each holding an imported `.a4-page`; mono adds `body.print-mono`.
5. `await doc.fonts.ready`, `popup.focus()`, `popup.print()`; status `53 דפי A4 הוכנו להדפסה`; on failure status
   `הכנת ההדפסה נכשלה: …` and the popup shows `ההדפסה נכשלה: …`.

### 6.3 Source-sheet print rules
- `PY a4-base.css:438-444`: `@page{size:A4;margin:0}`; `html,body{background:none;display:block;width:auto;height:auto}`;
  `.a4-page{box-shadow:none;margin:0;width:100%;zoom:1!important;print-color-adjust:exact;overflow:visible}`; `.preview-nav{display:none}`.
- `PY pythagoras.css:148-161`: answer boxes white, no shadow, border `#1f2a44`; radical lines `#334155` with `print-color-adjust:exact`.
- `PY-live …foundations.css:64-67,84`; `PY geometry7.css:24,97`: `break-inside:avoid` on cards/figures.
- Canonical site reader (`PY-live index.html:20`): `@page{size:A4;margin:0}`, `.top,.stage{display:none}`, `#printHost{width:210mm}`,
  `.print-page{width:210mm;height:297mm;min-height:297mm;overflow:hidden;break-after:page}`, `:last-child{break-after:auto}`;
  B/W `filter:grayscale(1)` (`PY book-design.css:32-36`).

### 6.4 District site-wide print conventions (context; not used by PythagorasNative)
REQ:260 (#163) A4 with 12 mm margins, deterministic print scaling, no horizontal cut, no blank page, sheet without shadow/border/
radius; REQ:261 and REQ:303 (#164/#177) shared Hebrew print dialog (`print-menu.css`) with a live paper miniature, choices
`צבע מלא`/`שחור־לבן`, `ביטול` + Escape, `afterprint` cleanup, ≥44px targets. Pythagoras is not one of the surfaces listed in #177.

**Replicate**
- Print from a purpose-built document: every sheet a fixed `210×297mm` block with `break-after:page` (reset on the last), `@page{size:A4;margin:0}`.
- Wait for stylesheets, `document.fonts.ready` and maths before calling `print()`; hide all chrome in print.

---

## 7. PDF download

### 7.1 District reader mechanism (`J2 PythagorasNative.astro:355-385`)
- Downloads the **pre-built static vector PDF** `pythagoras-workbook.pdf` from the source origin (no server generation in the
  district site, no print-to-PDF automation in the browser).
- Range check first: integers, `1 ≤ from ≤ to ≤ 53`, else status `טווח הדפים אינו תקין`.
- Full 1-53 → the fetched bytes are served as-is (no client page-count check on this path).
- Sub-range → lazily load **pdf-lib 1.17.1** from `https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js` (memoised in
  `window.__j2PythagorasPdfLibPromise`), `PDFDocument.load`, require `getPageCount()===53` (`קובץ המקור אינו כולל 53 עמודים`),
  `copyPages` for `from..to`, `save()`.
- Delivery: `new Blob([bytes],{type:'application/pdf'})` → `URL.createObjectURL` → temporary `<a download>` click → revoke after 15 s.
- Filename: `משפט-פיתגורס-דפים-{from}-{to}.pdf` (full download = `משפט-פיתגורס-דפים-1-53.pdf`).
- Status: `מכין קובץ PDF להורדה…` → `ההורדה הוכנה — עמודים {from}–{to}`.

### 7.2 How the static PDF is built (source repo)
- `PY-live tools/build-static-pdf.js`: `puppeteer-core` + headless Chrome (`CHROME_BIN`), viewport 1280×900 @1x (:6,17,20); stubs
  `window.print`, opens the canonical reader, clicks `#printColor` so the reader builds `#printHost` with 53 `.print-page .a4-page`
  (:33-36). QA before capture: 53/53 sheets, no raw LaTeX, no legacy nav, radical geometry, SVG unit labels LTR (:84-90);
  re-checks radicals under `emulateMediaType('print')` (:92-103); aborts on any same-origin asset 4xx/`requestfailed` or
  `pageerror` (:22-29,104-105). Capture: `page.pdf({printBackground:true,preferCSSPageSize:true,margin:0})` (:106); fails if
  < 100 KB (:108); writes `pdf-provenance.json` (:109-116).
- Live artefact checked 2026-11-12: 3,655,764 bytes, 53 pages, MediaBox `594.96 × 841.92 pt`, producer `Skia/PDF m155`; Chrome embeds
  Rubik/MathJax as **Type3 vector glyphs** (`PY-live SOURCE_OF_TRUTH.md:111`). Provenance: `sourceSha256 18b42779…`, 146 inputs.

### 7.3 Parity screen ↔ print ↔ PDF
- One source: the same `עמוד-N.html` + same CSS + same MathJax feed the screen reader, the popup print and the PDF capture
  (`PY-live SOURCE_OF_TRUTH.md:99-104`). "No third PDF mechanism" (:104).
- Gate "מה שרואים = מה שמורידים" (`PY-live SOURCE_OF_TRUTH.md:106-112`): the provenance sha256 covers every page HTML, all CSS,
  font binaries (`vendor/fonts/rubik/*.woff2`, MathJax woff2), manifest, `index.html`, `book-design.js` and the MathJax engine;
  `validate.js` recomputes it and fails a stale PDF. CI (`pypdf`): exactly 53 pages, each A4 595.3×841.9 pt ±3, ≥40 text characters
  per page, Hebrew anchors `משפט/פיתגורס/היתר/ניצב` survive (`PY-live SOURCE_OF_TRUTH.md:125`).
- District side: print uses the very nodes typeset on screen; range downloads reject a PDF that is not 53 pages. NWR generalises
  this: before copying pages it requires `src.getPageCount() === pdf.pageCount` from the manifest (validator-enforced,
  `validate-native-workbooks.mjs:70`); manifest `contentHash` + `pdf.sha256` tie HTML↔PDF in the source repo (REQ:312 ד) — the
  district code stores `contentHash` but does not verify `sha256` client-side (`NWR :180`).
- Canonical site reader (context): `הורדה` serves the same static PDF as `משפט-פיתגורס.pdf` (`PY-live index.html:99`); fallback
  client raster html2canvas 1.4.1 + jsPDF 2.5.1 (`index.html:60`), scale 1.25, JPEG q 0.9, A4 mm (`:100`), names
  `משפט-פיתגורס-{צבע|שחור-לבן|מקורי}.pdf` (`:95`).

### 7.4 Filenames
| Path | Name |
|---|---|
| District download | `משפט-פיתגורס-דפים-{from}-{to}.pdf` |
| District print → "Save as PDF" | popup title `משפט פיתגורס – 53 דפים להדפסה` |
| NWR | `{name}.pdf`, `{name} — עמודים {from}-{to}.pdf`, `{name} — לתלמידים.pdf`, `{name} — כולל מחוון.pdf` (`NWR :513,535`) |
| Source static file | `pythagoras-workbook.pdf` |

**Replicate**
- Ship a pre-built vector PDF rendered by headless Chrome from the exact print document (`preferCSSPageSize`, margin 0, `printBackground`).
- Record a source hash next to it and fail the build when stale; verify page count / A4 size / text floor after building.
- Client side: whole file as-is; ranges via pdf-lib `copyPages` after checking the page count; Blob + `<a download>`; Hebrew filename with the range.

---

## 8. Math and diagrams

### 8.1 Engine and readiness contract
- District config (installed only if no MathJax exists; an existing engine is reused without touching its config):
  `{tex:{inlineMath:[['\\(','\\)']],displayMath:[['\\[','\\]']]},options:{a11y:{inTabOrder:false}},startup:{typeset:false}}`,
  engine `vendor/mathjax/tex-mml-chtml.js` from the source origin (`J2 PythagorasNative.astro:229-247`).
- A page is ready only after: script load → `await MathJax.startup.promise` → `await MathJax.typesetPromise([holder])` → reject if any
  `\(` or `\[` remains (`נשארו נוסחאות TeX שלא עובדו`); on failure the holder is emptied (`J2 :212-218,248-257`; REQ:48; spec:303-310).
- Shadow DOM: MathJax's single CHTML stylesheet lives in `document.head` and grows lazily; after **every** typeset the reader clones/
  refreshes `style[id*="MJX"],style[id*="MathJax"]` into the shadow root (`J2 :258-271`) and pins the radical structure rules
  (`mjx-sqrt>mjx-box{border-top:.075em solid;…}`) because lazily typeset pages may never emit them (`J2 :90-99`; also in print :322).
- Standalone pages configure `chtml:{fontURL:'vendor/mathjax/tex-font/chtml/woff2'}` (+ `output.linebreaks.inline:false`)
  (`PY עמוד-13.html:9`; `PY עמוד-634.html:2`); the district config sets no `fontURL`.

### 8.2 Diagrams = inline SVG authored per sheet
- `svg.pyt-fig-svg` with `role="img"` and a Hebrew `aria-label` that states the givens, e.g. `מרובע ABCD: AB=8, AD=17, BC=25, DC=x,
  זוויות ישרות ב-B וב-D`; `viewBox` e.g. `0 0 400 230`; `display:block;max-width:100%;height:auto;shape-rendering:geometricPrecision`
  (`PY עמוד-13.html:26-34`; `PY-live …pythagoras-live.css:42-47`).
- Strokes (`vector-effect:non-scaling-stroke`, round caps/joins, `currentColor` = black): edges **1.85**; right-angle marks **1.55**
  (14 px square polyline); braces **1.4**; filled shapes `fill:#f8fafc` + 1.85 (`PY-live …pythagoras-live.css:49-82`). Foundation
  sheets: `.edge` 1.6, `.mark` 1.15, `.soft{fill:#f8fafc;stroke:#e2e8f0;stroke-width:1.25}` (`…foundations.css:26-27,42`).
  geo7 charts: non-scaling strokes, Rubik text, grid lines `#e7eaf1` 1px (`PY geometry7.css:100-106`; `PY עמוד-375.html`).
- Labels: vertices = italic maths capitals; lengths = upright TeX numerals; **unknowns = italic Latin letters (`x`, `y`, …)** —
  no "?" label appears in any of the 53 sheets; white halo behind label text (`…pythagoras-live.css:84-115`; `PY pythagoras.css:44-58`).
- Containers: `.pyt-diagram-frame{display:flex;justify-content:center;align-items:center;width:var(--fig-w,440px);max-width:100%;
  padding:10px;color:#000}` — frameless on the live site (`PY-live …pythagoras-live.css:32-40`); page CSS sets `--fig-w` and SVG
  height (e.g. `.page-13{--fig-w:410px}`); multi-figure `.pyt-fig-row{display:flex;flex-wrap:wrap;justify-content:center;gap:14px}`.
- Several sheets in one DOM: NWR namespaces every SVG `id` per sheet and rewrites `href`/`url(#…)` references (`NWR :405-415`).

### 8.3 Tables and grids
- None of the 53 sheets uses `<table>`. Available styles: `.math-table{border-collapse:collapse;table-layout:fixed;direction:ltr;
  text-align:center}` with `td{border:1px solid #000;height:40px}` and RTL `.label-cell{background:#f8fafc;width:150px}`
  (`PY a4-base.css:148-161`); `.side-table` cells `1px solid #e2e8f0`, padding 8px (`…foundations.css:62-63`); geo7 `.gz-table`
  cells `1px solid #cbd5e1`, `4px 12px`, 13.5px, min-width 74px, height 30px, `th{background:#f8fafc;font-weight:500}`
  (`PY geometry7.css:92-94`). Coordinate plane `.coordinate-system` 440×440, 22px grid `rgba(203,213,225,.4)`, 1px black axes with
  CSS arrowheads (`PY a4-base.css:200-219`).

**Replicate**
- Typeset everything before showing/printing; treat leftover `\(`/`\[` as failure. If you lazy-typeset, keep MathJax's CHTML structural rules globally available.
- Diagrams as inline SVG with non-scaling strokes (1.85 edges / 1.55 right-angle marks), TeX-font labels, italic variables, `role="img"` + Hebrew `aria-label`.

---

## 9. Exercise layout

### 9.1 Sheet skeleton (pattern from `PY עמוד-13.html:16-61`)
```html
<main class="a4-page page-13 pythagoras pyt-live">
  <header class="header-container"><h1 class="page-title">משפט פיתגורס</h1><div class="page-number">25</div></header>
  <div class="question-block">
    <div class="q-main"><div class="bullet-container"><div class="bullet-large"></div></div><div class="q-text">…\(ABCD\)…</div></div>
    <div class="visual-container"><div class="pyt-diagram-frame" aria-label="תרשים: …"><svg class="pyt-fig-svg" viewBox="0 0 400 230" role="img" aria-label="…">…</svg></div></div>
    <div class="pyt-step-grid">
      <section class="pyt-calc-block">
        <div class="pyt-sub-line"><span class="sub-label">א.</span><span>מצאו את אורך \(DC\).</span></div>
        <div class="solution-space" data-required-lines="5" aria-label="מקום להצגת דרך למציאת DC"></div>
        <div class="pyt-final-row"><span>\(DC=\)</span><span class="pyt-final-answer" aria-label="תשובה סופית DC"></span><span>ס״מ</span></div>
      </section>
      …ב. / ג.…
    </div>
    <div class="pyt-footer"><div class="pyt-solutions"><div class="q-sub"><div class="bullet-container"><div class="bullet-small"></div></div><div class="q-text"><span class="solutions-label">תשובות:</span><span class="pyt-solution">\(DC=20\) ס״מ</span>…</div></div></div></div>
  </div>
  <footer class="gz-footer"><div class="f1">…</div><div class="f2">…</div></footer>
</main>
```
Page CSS distributes height: e.g. three equal calculation columns `grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;flex:1 1 auto`
with `.solution-space{flex:1 1 auto;min-height:140px}` (`PY-live styles/pages/עמוד-13.css:9-13`).

### 9.2 Numbering
- Only the page is numbered: circled `.page-number` in the header (left side in RTL) = manifest `workbookNumber`.
- Exercises are **not** numbered: each task starts with an 8px black dot `.bullet-large`, secondary lines a 5px `.bullet-small`;
  bullets sit on the first text baseline (`align-items:first baseline`), `margin-left:10px` gap (`PY a4-base.css:113-123`).
- Sub-items: Hebrew letter + period `א.` `ב.` `ג.` (`.sub-label` 500; geo7 `.subl` `#1d4ed8` 500 min-width 16px)
  (`PY-live …pythagoras-live.css:182-185`; `PY geometry7.css:35-39`).
- Multiple choice: 19px square `.pyt-mc-box` (`1.35px solid #1f2a44`, radius 4px) + 11px number at 0.7 opacity + LTR value
  (`…pythagoras-live.css:146-179`); geo7: 21px circle `.ol` (`1.5px solid #cbd5e1`, 12px number) in 2-5 column grids (`geometry7.css:41-48`).
  True/false box `.check` 18px `1.35px solid #000` (`…foundations.css:60`).

### 9.3 Answer and writing areas ("answer space sized to the expected answer", `PY-live SOURCE_OF_TRUTH.md:70`)
| Component | Spec | Ref |
|---|---|---|
| Inline answer box ("סגנון 5") | `.answer-box`: height 30px, `border:1.35px solid #1f2a44`, radius 8px, `background:linear-gradient(180deg,#fff 0%,#fdfefe 100%)`, `box-shadow:0 1px 0 rgba(15,23,42,.13),0 4px 8px rgba(15,23,42,.11),inset 0 1px 0 rgba(255,255,255,.98)`; `.box-sm` 58px, `.box-md` 140px; print: white, no shadow | `PY pythagoras.css:121-138,148-153`; `PY a4-base.css:125-137` |
| Sized inline fills | `.foundation-fill` same look; widths symbol 42, number 58, edge 70, short 82, medium 112, term 118, product 128, expression 220 px | `PY-live …foundations.css:7-17` |
| Final answer | `.pyt-final-row` (label → box → unit, RTL flex gap 7px) with `.pyt-final-answer` 118×30 (page may override, e.g. 72px) | `PY-live …pythagoras-live.css:204-222` |
| Calculation grid | `.solution-space`: min-height 60px, `1px solid #e2e8f0`, radius 6px, padding `6px 8px`, 22px squares of `#cbd5e1`, LTR; size hint `data-required-lines` | `…pythagoras-live.css:188-201` |
| Graph paper | `.work-lines` (min 92px; `.short` 64px) / `.full-solution-space` (min 140px): 12px squares `rgba(148,163,184,.35)`, border `#e2e8f0`, radius 0, `print-color-adjust:exact` | `PY-live …foundations.css:46,49,79` |
| Reasoning lines | `.reason-space`: min 56px, a `#cbd5e1` rule every 27px, radius 7px; `.reason-label` 15px/600 | `…foundations.css:53-55` |
| Underline | `.response-line`: min-width 100px (`.long` 210px), height 24px, `border-bottom:1.5px solid #000` | `…foundations.css:43-44` |
| Root writing | `.sqrt-cell` component (§2.4) | `PY pythagoras.css:68-119` |
| geo7 | `.ln` 24px dotted `1.5px #94a3b8`; `.wline` inline underline `1.5px #111827`; `.drawbox` dashed `1.5px #cbd5e1` with 14px dot grid | `PY geometry7.css:57-81` |
| Legacy base | `.explain-box` 38px with one rule; `.answer-box` default `1px #cbd5e1` (contrast 1.48 — superseded by "סגנון 5") | `PY a4-base.css:125-146` |

### 9.4 Answer key and teacher-only content
- Pythagoras has **no teacher-only layer and no answers toggle**. 14 of 53 sheets (workbook pages 21-28 and 37-42) end with a
  student-facing answers strip: `.pyt-footer{margin-top:auto}` > `.pyt-solutions{border-top:1px solid #e2e8f0;padding-top:6px}`,
  12px text, label `תשובות:` (`תשובה:` when single), each answer an LTR-isolated nowrap `.pyt-solution` (`PY-live
  …pythagoras-live.css:225-261`; pages 21-24 repeat the same rules in their page CSS, e.g. `PY-live styles/pages/עמוד-9.css`). It prints.
- Teacher isolation pattern (sister reader, Tnufa exam): the key lives only in the PDF after the student pages — manifest
  `pdf.studentRange:[1,19]`, `pdf.pageCount:20`; the reader shows 19 pages; downloads `הורדה לתלמידים (ללא מחוון)` (extract 1-19)
  and `הורדה כולל מחוון` (the whole verified PDF) (`NWR :163,271-282,520-541`; REQ:314 ג).
- Footer credit is mandatory on every sheet (`PY a4-base.css:41`).

**Replicate**
- Bullet-led tasks, Hebrew-letter sub-items, circled page number; no exercise numerals unless your product needs them.
- Size each answer field to its expected answer (42-220 px fills, 30 px height, `#1f2a44` border); grids/graph paper for working.
- Keep answer keys out of the student sheets (separate trailing pages / separate file) and expose "students" vs "with key" downloads.

---

## 10. Mobile behaviour and accessibility

### 10.1 Scaling at narrow widths (computed from the CSS cascade, not measured in a browser)
| Viewport (topic page) | Reader host width | Column template | Sheets column | Scale | Rendered sheet |
|---|---|---|---|---|---|
| 1440 / 1280 | ≈1076 | 224 / 1fr / 108, gap 10 | ≈724 | 0.90 | ≈717 px |
| 1024 | ≈937 | ≤1040: 164 / 1fr / 94, gap 6 | ≈667 | 0.83 | ≈661 px |
| 768 | ≈697 | 164 / 1fr / 94 | ≈427 | 0.53 | ≈421 px |
| 600 | ≈536 | ≤600: 132 / 1fr / 60, gap 4 | ≈336 | 0.42 | ≈330 px |
| 390 | ≈332 | 132 / 1fr / 60 | ≈132 | floor 0.20 | 159 px **clipped to 132** |
| 375 | ≈317 | 132 / 1fr / 60 | ≈117 | floor 0.20 | 159 px **clipped to 117** |

Inputs: `.container` = `100% − 2×clamp(1rem,2.4vw,2rem)` max 1120px (`J2 src/styles/base.css:112-118`; `tokens.css:186,211`); topic card
padding `var(--space-fluid-2)`, 12px inline ≤560px (`J2 TopicLeadResource.astro:145,173-175`). Because of the 0.2 floor,
`.pyn-cell{max-width:100%;overflow:hidden}` and the paper anchored `left:0`, sheets narrower than the column floor lose their **right
edge — the RTL start side (titles, line starts)** below roughly 423 px viewport. Do not copy this; NWR's ≤720px single-column collapse
gives ≈0.42 scale at 375px. The grade-book solo surface (sheet `min(1360px, 100vw − 28px)`) behaves similarly on phones.
- No zoom/pinch controls in PythagorasNative; sheets never reflow (`PY DESIGN.md:7`). Standalone source pages instead apply stepped
  `zoom`: .42 (≤350px), .44, .46 (371-390), .49 (391-410), .51 (411-430), .54, .59, .64, .70, .76, .84, .93, .99 (801-820), with
  `overflow-x:hidden; touch-action:pan-y pinch-zoom` (`PY a4-base.css:358-436`).
- ≤600px the action buttons shrink to `font-size:11px;padding:6px 2px;min-height:36px` — below the 44px target (`J2 :65`).

### 10.2 Accessibility
- Landmarks/names: `aside[aria-label="תוכן עניינים – משפט פיתגורס"]`, `nav[aria-labelledby="pynTocHeading"]`,
  `aside[aria-label="פעולות החוברת"]`, each sheet `section[aria-label="עמוד N"]`; imported `<main>` re-tagged `<div>` so the page keeps
  one `main` (`J2 :102,147,186-193`; `J2 tests/e2e/grade-book-layout.spec.ts:375` "a11y-math-10").
- Disclosure: `aria-expanded` + `aria-controls` on `הדפסה`/`הורדה`; live status `role="status"` (`J2 :102,108-116`). Popups use `hidden`.
- Focus: `button:focus-visible,summary:focus-visible{outline:3px solid var(--pyn-ink);outline-offset:2px}`; chapter buttons invert on
  focus (`J2 :69,75`). Focus is not moved to the target sheet after a jump; no focus trap/Escape in popovers.
- Maths: MathJax `a11y.inTabOrder:false` (`J2 :236`); diagrams `role="img"` with descriptive Hebrew `aria-label`; answer fields carry
  `aria-label` (`תשובה סופית DC`, `מקום להצגת דרך …`); decorative check squares `aria-hidden="true"` (`PY עמוד-634.html:7`).
- Keyboard: the grade-book host ignores keys originating inside `pythagoras-native`/`native-workbook` (composedPath guard), so
  PageUp/PageDown/arrows and the number inputs never trigger host navigation (`J2 chomarim.astro:845-848`; spec:125-146).
- Contrast (WCAG, computed): title `#1d4ed8`/white 6.70; chrome ink `#0f172a` 17.85; status `#334155` 10.35; footer `#1f2a44` 14.26 and
  `#475569` 7.58; white on `#1d4ed8` 6.70; all seven chapter pairs 4.75-5.72 (accent on tint) and 4.92-6.29 (white on accent).
- Motion: fade transition `none` and JS fade skipped under `prefers-reduced-motion:reduce` (`J2 :88,280-284`); NWR also stops its
  loading shimmer (`NWR :102-104`).
- Language/direction: shadow root `dir="rtl"`; popup `html lang="he" dir="rtl"` (`J2 :102,309`).

**Replicate**
- At ≤720px switch to one column (TOC collapsible above the sheet, sticky action row), fit the sheet to the full width, keep pinch-zoom.
- Keep ≥44px targets at all widths, `role="status"` progress, `aria-expanded` disclosures, Escape to close, move focus to the jumped-to sheet.

---

## 11. Acceptance criteria encoded in validators and tests

### A. District validators (run on the product, `J2`)
1. No `<iframe>` in the reader; exactly **one** `class="pyn-actions"` (`validate-em-proxy.mjs:169-171`).
2. Only canonical pythagoras is a booklet; booklet enters solo mode; host guards `.gbk-app.is-solo .gbk-mode-switch/.gbk-page-nav/
   .gbk-foot/.gbk-search` are force-hidden with `display:none!important` (`validate-em-proxy.mjs:172-183`).
3. Shared engine (NWR): no `<iframe>`; exactly one `class="nwr-actions"`; uses `attachShadow`; fetches `WORKBOOK_MANIFEST.json`;
   draws the divider `background:#0f3150`; enforces `src.getPageCount() !== pdf.pageCount` before download; disables actions on error;
   pythagoras is NOT in the NWR registry; every workbook origin is in CSP `connect/script/style/font/img-src` and `EMBED_HOSTS`
   (`validate-native-workbooks.mjs:43-74`).

### B. District e2e (`J2 tests/e2e/pythagoras-solo-control-ownership.spec.ts`)
1. Right TOC + left actions + top-aligned pages: `.pyn-right{grid-column:1;grid-row:1`, `.pyn-left{grid-column:3;grid-row:1`,
   `.pyn-pages{display:flex;flex-direction:column;align-items:center;gap:0;padding:0 0 28px`, `.pyn-cell{scroll-margin-top:8px}`,
   width measured from `#pynPages`, `scrollIntoView({behavior:'instant',block:'start'})`, no `<iframe` (:28-43).
2. Exactly 7 chapters with 7 distinct `--pyn-accent`; 7 chapter buttons; no `.pyn-grid`; no digit in any chapter label; no `<summary>`;
   heading text exactly `תוכן עניינים – משפט פיתגורס`; title exactly `משפט פיתגורס – 53 דפים להדפסה` (:46-65).
3. Page 1 `.a4-page` visible within 35 s with no raw TeX; `renderMath` on `\(\sqrt{81}=9\)` yields `mjx-container`; status never shows
   `לא ניתן לטעון` (:67-91).
4. `.pyn-bar` computed `position:sticky; top:0px`; no duplicate host header (:93-105).
5. The floating back button never covers the title at 1280×800, 768×1024, 393×851, 360×740 (:107-123).
6. PageDown/PageUp/ArrowLeft/ArrowRight never navigate the host; number input ArrowUp 10→11; arrows keep focus in the input (:125-146).
7. No placeholder `בחירת עמוד מסוים בפרק`; one group per chapter; `position:sticky;top:0;z-index:10` (:157-163).
8. Paper tokens on `:host`: `--bg-paper:#ffffff`, `--bg-subtle:#f8fafc`, `--title-blue:#1d4ed8`, `--accent-dark:#000000`,
   `--text-main:#000000`; white cell and paper backgrounds (:165-178).
9. 1920×1080: first sheet width 780-805 px; TOC right of the sheet and taller than 500 px; opening `הדפסה` shows colour + mono and does
   not change the sheet width (:180-204).
10. Grid template exactly `minmax(192px,224px) minmax(0,1fr) minmax(90px,108px)`; `#pynToc` static; no `pynTocBtn`; popovers
    `position:absolute;top:100%;left:0;z-index:20` (:206-214).
11. Print builds a complete canonical document: no `?printMode=`; loads all pages; requires 53 sheets; print button calls `popup.print()`;
    mono class `print-mono`; `@page{size:A4;margin:0}` (:216-225).
12. Per grade z/h/t: one booklet, one reader, no iframe; computed paper `rgb(255, 255, 255)`; `.page-title` colour `rgb(29, 78, 216)`
    even on the green grade-8 theme; TOC to the right of both action buttons; host chrome hidden; no `.embed-cap, .ec-actions` (:242-300).
13. MathJax waits for `startup.promise`, uses `typesetPromise([holder])`, rejects leftover TeX (:303-310).

### C. Requirement 29ד contract (REQ:48) — owner rules not all automated
Fixed sticky title; A4 210×297 responsive scale with unchanged content; flush dark-blue divider, not printed; no "עמוד N מתוך 53"
between sheets; TOC = chapter links only, instant jump under a soft fade honouring reduced motion; one action group (print + download)
always visible below the title, never hidden behind it, no status/demo text after load; near-natural A4 size on wide desktops; panels
overlay without resizing the sheet; white paper / blue titles regardless of host theme; each sheet opens at its top; all actions on
the left at every width; colour vs B/W only after `הדפסה`; download all 53 or a real range; only verified PDF operations; full CSS
isolation; MathJax fully rendered before a page counts as ready.

### D. Source-repo gates (what makes screen = print = PDF)
1. Exactly 53 pages; unique files/numbers; one `main.a4-page` per file; `.page-number` = `workbookNumber`; no `preview-nav`
   (`PY-live tools/validate.js:12-35`).
2. Notation: no `×`/`\times`; `ס״מ`/`סמ״ר` only; no raw `x²`, `<sup>/<sub>` or Unicode superscripts in body; every `√` canonical;
   SVG number+unit labels `direction="ltr"` (`PY-live tools/validate.js:37-54`).
3. No dangling `@import` anywhere (one missing file once aborted the whole PDF) (`PY-live tools/validate.js:57-78`).
4. Shared radical owner and MathJax LTR isolation present; page 10 has 7 `<bdi dir="ltr">` (`PY-live tools/validate.js:178-232`).
5. Static PDF ≥100 KB; provenance hash matches current sources (`PY-live tools/validate.js:234-249`).
6. Smoke (real Chrome, 5 devices): no horizontal overflow; 53 sheets; no duplicate IDs; TOC right / actions left / first sheet top
   visible under the bar; print colour choices only after `הדפסה`; page-6 layout and radicals valid in screen and print media
   (`PY tools/smoke.js:7-11,45-96,143-230`).
7. PDF build: abort on asset 4xx/requestfailed/pageerror; QA radicals/units/raw TeX; CI `pypdf`: 53 pages, A4 ±3 pt, ≥40 chars/page,
   Hebrew anchors (`PY-live tools/build-static-pdf.js:22-29,84-108`; `PY-live SOURCE_OF_TRUTH.md:110,125`).

### E. Suggested acceptance list for `targilim` (derived)
1. Every sheet box is exactly 210×297 mm with 10/18 mm padding and `overflow:hidden`; nothing overflows (assert `scrollHeight ≤ clientHeight`
   per block, in screen and print media).
2. Printed/PDF page count = sheet count; every PDF page 595.3×841.9 pt ±3; no blank trailing page.
3. One action group (`הדפסה`, `הורדה`); colour/B&W only inside the print popover; no duplicate controls.
4. Screen-only 3px dark divider between flush sheets; absent in print and PDF.
5. No raw `\(`/`\[` after typesetting; all formulas LTR-isolated; `·`, `ס״מ`, `סמ״ר` enforced.
6. Sheet colours fixed (white paper, `#000` text, `#1d4ed8` titles) regardless of site theme.
7. PDF rebuilt whenever any sheet, CSS or font changes (hash gate); range downloads verify the page count.
8. Answer keys never appear on student sheets unless explicitly requested; separate "with key" output.
9. At ≤720px the sheet uses the full width and no Hebrew start-edge is clipped; targets ≥44px; reduced motion honoured.

---

## Appendix — parity caveats found while reading (inferred from code; not browser-verified)
1. **Line-height drift:** sheets inside the district reader inherit `line-height:1.55` from the district `body` (`J2 base.css:69-73`)
   wherever page CSS sets none, while standalone/print/PDF use `normal` (a4-base sets none). With fixed-height `overflow:hidden`
   sheets this can shift or clip content on screen only. Set an explicit line-height on the sheet root.
2. **Text colour:** reader sheets inherit `#0f172a` (`J2 PythagorasNative.astro:35`), print/PDF use `#000` (`PY a4-base.css:21`).
3. **Fonts inside a ShadowRoot:** Rubik and PytTeX `@font-face` are linked only inside the shadow root on the topic page; Chromium has
   historically ignored `@font-face` declared in shadow trees (the grade book avoids this by declaring Rubik at document level,
   `J2 grade-book.css:10-18`). Verify; for a static site declare fonts globally.
4. **Sticky overlap on the topic page:** the site header is `position:sticky;top:0;z-index:40` (`J2 src/components/layout/SiteHeader.astro:84-90`)
   and the reader bar is also sticky at `top:0` (rail at 43/52px) — on that page the reader's bar and the top of its rails can slide
   under the site header. The e2e tests cover only the grade-book solo surface.
5. **Phone clipping** of the RTL start edge below ~423px viewport (§10.1).
6. District MathJax config omits `chtml.fontURL` that the standalone pages set (§8.1).
7. Full-range download serves bytes without a page-count/sha256 check; only ranges check 53 pages (§7.1).
8. Stale-comment: `.pyn-bar` is commented "non-sticky" but is sticky (`J2 PythagorasNative.astro:36-37`); `--pyn-header-height` is
   computed (:155) but never used.
9. The local `pythagoras` clone is behind GitHub Pages (frameless cards, grey graph paper, PDF provenance gate, static-PDF download);
   use the live copies for exact CSS.
