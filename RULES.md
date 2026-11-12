# Targilim — Central Rules & AI Operating Guide
# תרגילים — דף כללים מרכזי לבינה מלאכותית ולמפתחים

Repository: `yanivmizrachiy/targilim` · Hebrew name: `תרגילים`
**Last updated: 2026-11-12** · Baseline: 2026-06-14

> **This file is the central operating guide.** Any AI or developer must read it
> (and `PROJECT_STATUS.md`) before any change. It overrides older claims found in
> historical docs. When this file and code disagree, **the code + verifiers win** —
> fix this file.

---

## Product requirements — curriculum-aligned generator and digital workbooks

This section is the sole canonical product specification for this expansion. The target scope is Israeli middle-school mathematics, Grades 7–9 only. The shipped baseline described elsewhere still covers Grades 7–8. Grade 9 is authorized for staged implementation after source review and engine planning. The digital book, A4 print and PDF download described here are authorized; the historical removal note does not apply to this workflow.

### Curriculum and provenance

- Use the [Jerusalem district curriculum collection](https://jerusalem2.vercel.app/chativat-beynayim/tochnit-limudim/) as the entry point. Verify the official documents and applicability behind its links. Map the current curriculum by grade, domain, objective, prerequisite, teaching sequence, assessment boundaries, notation, mathematical terminology, definitions and theorems, including their hypotheses and conclusions. Record document, edition, page or section and approval status. Distinguish the Grade 7–8 update, the Grade 9 curriculum and regular/reduced teaching plans. Do not apply superseded content to a current plan by default.
- Extend the existing Source Bible and approved intake process. Preserve provenance on existing families. For new families, record both curriculum alignment and the approved source basis before enabling generation. Official documents from the supplied collection are candidates for documented intake; inventory changes must follow the existing planning and approval rules. Mark unresolved or unsupported mappings clearly.
- Generate varied and original questions through source-grounded mathematical structures, contexts and representations. Preserve curricular terminology, notation and boundaries at every level. Use independently verifiable answers, valid distractors, accurate diagrams and explicit constraints for each family. Use mathematics-aware tests for equivalence, degeneracy, uniqueness where required, and consistency between question, diagram and solution.

### Teacher workflow and output

- Keep direct access to the generator. Let teachers select grade, applicable curriculum plan, topic(s), question count and document type (worksheet, quiz or exam). Make progression (uniform or graduated) independent of the curricular level (easier, curriculum-level or harder). Uniform sets use the selected level; graduated sets use an intentional order appropriate to the selected target, with genuine changes in cognitive demand. Explain unsupported combinations and keep controls bound to verified capabilities.
- Generate complete, numbered student documents and an optional separate answer key. Use the same generated document model for the digital book, print and downloadable PDF, keeping text, formulas, diagrams and pagination consistent. Preserve existing per-question PNG export. Offer real whole-document print and PDF download with legible RTL/BiDi, reliable A4 breaks, readable monochrome output, and sufficient writing space. Keep answers out of student output.
- Study the district site's [Pythagoras presentation](https://jerusalem2.vercel.app/chativat-beynayim/h/topics/h-pythagoras/) and its PythagorasNative implementation in jerusalem2. Derive the reader and print design from the verified reference: white A4 pages, distinct dark-blue page separators on screen, readable Hebrew mathematics, one consistent action bar, and chapter navigation when the generated structure warrants it. Optimize the generator and reader for desktop and mobile, accessible interaction, crisp vector diagrams, and professional page composition.

### Engineering and verification

- Audit the existing engines, registries, renderers, export paths, sources and CI before editing. Research strong, maintained techniques for constrained generation, deterministic replay, symbolic or independent validation, property-based testing, vector rendering and A4/PDF pagination. Compare viable options using measured correctness, coverage, output fidelity, performance and maintenance cost. Prefer clear, compact, maintainable code, shared data contracts and removal of proven dead or duplicate code. Preserve existing public behavior and protected material throughout incremental migration.
- Establish a baseline with existing verification commands. Ship a representative vertical slice through the real generator, digital book and print/PDF before expanding the verified matrix. Test source coverage, all supported teacher options, seeded generations, solutions, RTL, visual output, desktop/mobile, answer isolation, and PDF parity. Keep the existing quality gates and deployment protections. Record actual test results and pending scope in PROJECT_STATUS.md. Production release follows the existing merge and approval process.

---

## 1. Shipped baseline

- A **Hebrew, RTL** smart math **exercise generator** for **Grades 7–8 only** (no Grade 9).
- Fully source-bound: every question maps to one of the **10 approved source PDFs**.
- It is a **print-first teaching product**, not an online auto-graded task.
- Main-page capabilities: single-exercise + numbered worksheet generation,
  mixed question types, answer key, print flow, and **image export**
  (copy/download a whole question as PNG).
- Historical/internal gallery, visual-QA, and teacher-support files may remain
  in the repo for audits, but they are **not linked from `generator/index.html`**
  and are not part of the primary product flow.
- **Live site:** GitHub Pages serves `generator/` from `main`:
  https://yanivmizrachiy.github.io/targilim/
  - **The live site reflects `main` only.** Changes on open branches do **not**
    appear on the site until they are merged into `main` and Pages redeploys.

---

## 2. Source-of-truth map (do not duplicate; reference these)

| Concern | Source of truth |
|---|---|
| Product requirements / operating rules / merge order | **`RULES.md`** (this file) |
| Current project status snapshot | **`PROJECT_STATUS.md`** |
| Pedagogy / per-topic intent | **`docs/SOURCE_BIBLE.md`** |
| Approved source materials | **`sources/intake/2026-06-09/`** (10 PDFs) |
| Live engine inventory (the real list) | **`generator/engine/source-registry.js`** |
| Quality gates | **`package.json`** scripts (`verify:deep`) |
| Local worktree + GitHub sync | `docs/reference/ACTIVE_WORKTREE_AND_SYNC.md` · `npm run verify:sync` |
| Coverage gaps roadmap | `docs/reports/SOURCE_BACKED_COVERAGE_GAPS_20260614.md` |
| PDF duplicate audit | `docs/reports/PDF_DUPLICATE_AUDIT_20260614.md` |
| Verifier/tool index | `tools/README.md` · Docs index `docs/README.md` |

Before adding any fact to docs, check it does not already live in one of the
above. If it does, **link to it — do not copy it**.

---

## 3. Repository structure

```text
generator/              the live site + the generator runtime
generator/engine/       engines, source-registry, pedagogy-registry, diagrams
sources/                approved source PDFs (protected)
docs/                   documentation
docs/reports/           audit, coverage and hardening reports
tools/                  verifiers and deep checks (run via package.json)
.github/workflows/      CI + GitHub Pages deployment
PROJECT_STATUS.md       current status snapshot
RULES.md                this central operating guide
```

---

## 4. Iron rules (forbidden without explicit approval)

- **Do not work directly on `main`.** Feature branches only; merge via PR.
- **No force push.**
- **No merge to `main`** without `verify:deep` green in GitHub Actions **and** Yaniv's explicit approval.
- **Do not delete** source PDFs or `sources/.../originals/`.
- **Do not change** `generator/engine/source-registry.js` without a proven reason.
- **No new engine without full planning** (registry + pedagogy + docs + verifiers + count update). Check first whether it already exists.
- **No `A8-04-ENGINE`** — A8-04 (inequalities) is a **legacy/source-fit topic in `a8-03.js`**, intentionally not a dedicated engine. (A8-05 = percent equations, also legacy.)
- **No "engine 51".** The inventory is **50 engines / 0 fallback** — keep it unless a planned, approved change updates the count everywhere.
- **Do not weaken a verifier.** Adding guards is fine; loosening existing checks is not.
- **Verifiers are read-only by default.** A normal `verify:*` run must not dirty
  the working tree; generated report refreshes require `--write` or an explicit
  update flag.
- **No demo / mock / placeholder / fake controls.** All output must be real and source-grounded.
- **Do not invent questions** without a source. No new Grade-8 numeric/uncertainty content without **new** source intake.
- **Do not claim something is done if it only exists on a branch** and is not merged.
- **Every PR must pass `npm run verify:deep`.**
- **Update docs** (`PROJECT_STATUS.md`, this file) after any meaningful change — truthfully.

---

## 5. Changelog — merged improvements (most recent first)

All entries below are **merged to `main`, live, and `verify:deep`-green**. Newest first.

| PR | Date | Improvement |
|---|---|---|
| main | 2026-06-18 | **Proportional worksheet answer boxes** — free-write answer spaces now scale to the task instead of using a fixed oversized box; guarded by `verify:worksheet-polish`. |
| main | 2026-06-18 | **Repo foundation guard** — added `verify:topic-dropdown` so the visible topic dropdown stays at 50 teacher-facing topics with no duplicates and no internal jargon. |
| main | 2026-06-18 | **Source-06 uncertainty deep coverage** — 33 PDF-mapped families across U7/U8 uncertainty with tables, bar/pie/line graphs and multi-source tasks. |
| main | 2026-06-18 | **Task-generation-only main UI** — teacher/gallery/visual-QA links are absent from `generator/index.html` and guarded by `verify:task-ui`. |
| main | 2026-06-17 | **Pythagoras Hebrew terminology guard** — student and teacher wording now uses the standard Hebrew terms **ניצב/ניצבים** and **יתר**; `verify:geometry-language` prevents "רגל/רגליים" from returning to G7-03 Pythagoras output. |
| **#52** | 2026-06-17 | **A8-03 count-and-value system word problem** — coins/stamps style elimination family added and documented. |
| main `7db6ab4` | 2026-06-17 | **Source-fit/UI sync** — A7-05 aligned to value tables + first-quadrant graphs; A7-03/U7-01/U8-01 families expanded; mobile share reduced to copy-image only; premium typography guards added. |
| **#51** | 2026-06-17 | **A7-02 expression-value range** — questions of the form "if x is in [a,b], where is kx+c?" |
| **#50** | 2026-06-17 | **Topic dropdown dedupe/order cleanup** — canonical engine topic display without stale duplicate rows. |
| **#49** | 2026-06-17 | **Registry/source-bible sync** — shipped families documented in `pedagogy-registry` and regenerated `SOURCE_BIBLE`. |
| **#48** | 2026-06-17 | **A7-01 polygon perimeter with algebraic sides** — labeled diagram + source-backed family. |
| **#47** | 2026-06-17 | **Source-level family expansion** — applied-formula substitution and equal-expressions families. |
| **#46** | 2026-06-17 | **Difficulty tiers integration** — new families wired into real רמה 1/2/3 paths. |
| **#34** | 2026-06-16 | **Pythagoras (legacy G7-03) fixes** — diagram no longer reveals the answer (the unknown side is marked **`?`**, like `angleSvg` already did for the unknown angle); fixed the clipped "ס\"מ" label (`text-anchor="middle"`); precise Hebrew around unknown side length; **premium student answer box** (rounded, soft shadow, ruled writing lines). |
| **#33** | 2026-06-16 | **Source-faithful topic labels** — `G7-02` "שטחי צורות שטוחות" → **"שטחי מצולעים"** (source: "שטחי מצולעים" / "Areas of polygons"); `G8-04` "ניידות משולשים" → **"דמיון משולשים"** (curriculum-map "Triangle similarity"; engine + questions already used "דמיון"). `U7-01` "טבלת תדירות" kept — the source uses "תדירות". |
| **#32** | 2026-06-16 | **Removed the landing splash** — the main page opens **directly** to the "הגדרות תרגיל" topic-selection tool (no hero/benefits/CTA/marketing). `generator/landing.css` deleted. |
| **#30** | 2026-06-16 | **Level selector = רמה 1 / רמה 2 / רמה 3**, and the visible `#sl` selector now actually drives difficulty for every topic (it was previously a hidden no-op reading `#selDiff`). |
| #20 | 2026-06-15 | Central rules + status refresh. |
| #28 | 2026-06-15 | Real **A7-04 multi-correct** — forward `mcqMode` through the wrapper chain; `verify:multi-correct` wired into `verify:deep` (multi → 2 correct, single → 1). |
| #27 | 2026-06-15 | Worksheet polish — sharp math rectangles (`sharpenMathRects`); no question-type badge on the student card. |
| #21–#24 | 2026-06-15 | UI premium round — professional card + Assistant typography; one clean untitled answer box; color/שחור-לבן only + per-card image export; `verify:premium-ui` guard. |

Earlier history: PR #7/#8 (Phase 1, 50-engine generator), #15–#18 (A7-04 + stress + PDF audit, inventory = 20 = 10 working + 10 `originals/` backups). Detail in `docs/reports/`.

---

## 6. Current state (verified 2026-06-18)

- The live site reflects `main`; GitHub Pages publishes `generator/` from `main`.
- Local sync is checked with `npm run verify:sync`; it must pass before continuing work in a local copy.
- The main page **opens directly to the generator** — there is no landing/marketing page.
- **50 engine topics (`*-ENGINE`) / 0 fallback** — counted from `source-registry.js`.
- **No `A8-04-ENGINE`** (A8-04 inequalities is legacy in `a8-03.js`; A8-05 percent equations is legacy too).
- `verify:deep` aggregates the deep gates and includes `verify:premium-ui` + `verify:worksheet-polish` + `verify:multi-correct`.
- The visible topic dropdown is guarded by `verify:topic-dropdown`: 50
  teacher-facing topics, no duplicate visible labels/values, and no
  internal jargon such as `fallback`, `QA`, `Registry`, or `מנוע`.
- Real A7-04 multi-correct works; **U7-03 single-answer MCQ already exists** in `source-fit-extensions.js` — do **not** duplicate it.

### Guarded cleanup note
- Legacy generator files may still exist where they are part of shipped
  behavior or historical compatibility, but the main dropdown must show only a
  clean teacher-facing topic list. Do not delete legacy files during cleanup
  unless a verifier proves they are unreachable and unnecessary.

### Do NOT
- Add Grade-8 numeric or uncertainty engines without **new** source intake.
- Start new content before checking existing engine coverage.

---

## 8. Permanent design requirements (UI)

- **It is a work tool, not a landing page.** The main page opens **directly** to the
  "הגדרות תרגיל" topic-selection card — no hero/benefits/CTA splash.
- **No marketing / demo language anywhere user-facing.** Dry, factual, teacher-oriented
  copy only (e.g. "מחולל דפי תרגול במתמטיקה", not "מחולל חכם ומעוצב"). No "דמו", no slogans,
  no unproven claims, no `fallback`/`QA`/`מנוע`/`Registry` developer jargon in visible text.
- The interface must look **premium**; fonts must read like a real math textbook.
- View options are **`צבע` / `שחור־לבן` only** — never the words "גווני אפור".
- The level selector is **`רמה 1` / `רמה 2` / `רמה 3`** (the visible `#sl`) and must
  actually drive difficulty for every topic.
- **Diagrams must never reveal the answer.** The unknown side/angle/value is marked **`?`**;
  only the givens carry values. Labels must sit fully inside the viewBox (`text-anchor="middle"`),
  never clipped, with full units (`ס"מ`, not `ס`).
- **Topic labels and wording must be source-faithful** — verified against `source-learning/`
  and `curriculum-map/` — and use precise Hebrew (e.g. "אורך היתר", not "היתר").
- Every exercise card carries central primary buttons **`העתק כתמונה`** and **`הורד כתמונה`**.
- The copied/downloaded image must include **the full question and all drawings**.
- The student answer area is **one** clean, untitled, proportional **premium writing box**
  with ruled lines sized to the task — present only for free-write types (open/mistake);
  mark-the-answer types (mcq/tf) get **no** box. A stable `data-student-answer-box="true"`
  hook identifies it.
- Diagrams must be **sharp, readable, not clipped**.
- Mobile must look professional; print must be clean.
- Teacher-only content must never appear in the student print/export.

---

## 9. Mandatory tests

Automated gate (required for every PR, must be green in GitHub Actions):
```bash
npm install
npm run verify:deep
```

Manual UI checks (required when a UI PR is reviewed, on the **live** site after deploy):
```text
- open the live site
- generate a worksheet
- check color view
- check black-and-white view
- copy as image
- download as image
- open the PNG
- confirm all drawings appear in the image
- check mobile layout
- check print output
- confirm teacher-only content does not appear on the student page
```

---

## 10. AI Work Report Template

Every AI must end its work by filling this in:

```text
Branch:
PR:
Changed files:
What changed:
UI / logic / docs:
Sources touched:
Engines touched:
Registry touched:
verify:deep:
GitHub Actions:
Live URL checked:
Screenshot before:
Screenshot after:
Risks:
What remains:
Estimated improvement:
```

---

## 11. Roles

- **Yaniv** — product owner and teacher; should not be asked to manage routine technical decisions or to repeat the documented vision.
- **Claude** — project manager / pedagogy / design / quality-gate owner.
- **ChatGPT/Codex** — execution assistants that preserve repository reality.

---

## Appendix — historical note

Earlier docs reference **"25 engines"**. That is historical: the current inventory is
**50 engines** (25 dedicated `*-ENGINE` source-fit engines + 25 pilot engines), 0 fallback.
The authoritative live list is `generator/engine/source-registry.js`. Removed scope
(Grade 9, separate booklet/PDF-workbook/A4-bulk/answer-key-booklet modes) is **not** backlog
except for the expansion explicitly authorized in the product requirements above.
