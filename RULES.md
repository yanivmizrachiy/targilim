# Targilim — Central Rules & AI Operating Guide
# תרגילים — דף כללים מרכזי לבינה מלאכותית ולמפתחים

Repository: `yanivmizrachiy/targilim` · Hebrew name: `תרגילים`
**Last updated: 2026-11-12** · Baseline: 2026-06-14

> **This file is the single source of truth for product requirements and operating rules.** Read it and `PROJECT_STATUS.md` before changing the project. Use code, verifiers and release evidence to establish actual behavior. Record discrepancies as implementation gaps or correct stale status claims.

---

## Product requirements — curriculum-aligned generator and digital workbooks

The product serves Israeli middle-school mathematics in Grades 7–9 only. Implement Grade 9 in stages after source review and engine planning. The current production coverage is tracked in `PROJECT_STATUS.md`.

### Curriculum and provenance

- Use the [Jerusalem district curriculum collection](https://jerusalem2.vercel.app/chativat-beynayim/tochnit-limudim/) as the entry point. Verify the official documents and applicability behind its links. Map the current curriculum by grade, domain, objective, prerequisite, teaching sequence, assessment boundaries, notation, mathematical terminology, definitions and theorems, including their hypotheses and conclusions. Record document, edition, page or section and approval status. Distinguish the Grade 7–8 update, the Grade 9 curriculum and regular/reduced teaching plans. Do not apply superseded content to a current plan by default.
- Extend the approved intake process and the pedagogy registry. Regenerate `docs/SOURCE_BIBLE.md` from the registry with its existing generator. Preserve provenance on existing families. For new families, record both curriculum alignment and the approved source basis before enabling generation. Official documents from the supplied collection are candidates for documented intake; inventory changes must follow the existing planning and approval rules. Mark unresolved or unsupported mappings clearly.
- Generate varied and original questions through source-grounded mathematical structures, contexts and representations. Preserve curricular terminology, notation and boundaries at every level. Use independently verifiable answers, valid distractors, accurate diagrams and explicit constraints for each family. Use mathematics-aware tests for equivalence, degeneracy, uniqueness where required, and consistency between question, diagram and solution.

### Teacher workflow and output

- Let teachers select grade, applicable curriculum plan, topic(s), question count and document type (worksheet, quiz or exam). Make progression (uniform or graduated) independent of the curricular level (easier, curriculum-level or harder). Uniform sets use the selected level; graduated sets use an intentional order appropriate to the selected target, with genuine changes in cognitive demand. Explain unsupported combinations and keep controls bound to verified capabilities.
- Generate complete, numbered student documents and an optional separate answer key. Use the same generated document model for the digital book, print and downloadable PDF, keeping text, formulas, diagrams and pagination consistent. Offer real whole-document print and PDF download with reliable A4 page breaks. Apply the permanent design and student-output rules below.

### Engineering and verification

- Use the highest reasoning effort available for substantive work across curriculum analysis, mathematical engine design, visual design, architecture, performance, accessibility and verification. Compare serious alternatives against representative outputs. Revisit failed assumptions and iterate until the documented acceptance criteria pass. Record the evidence behind consequential decisions.

- Before product-code changes, audit the existing engines, registries, renderers, export paths, sources and CI. Prepare an evidence-backed implementation plan with a curriculum and capability matrix, architecture decisions and tradeoffs, dependency order, migration and rollback strategy, measurable acceptance criteria, and verification for each milestone. Start implementation once this plan is grounded in the repository baseline. Research strong, maintained techniques for constrained generation, deterministic replay, symbolic or independent validation, property-based testing, vector rendering and A4/PDF pagination. Compare viable options using measured correctness, coverage, output fidelity, performance and maintenance cost. Prefer clear, compact, maintainable code, shared data contracts and removal of proven dead or duplicate code. Preserve existing public behavior and protected material throughout incremental migration.
- Establish a baseline with existing verification commands. Ship a representative vertical slice through the real generator, digital book and print/PDF before expanding the verified matrix. Test source coverage, all supported teacher options, seeded generations, solutions, RTL, visual output, desktop/mobile, answer isolation, and PDF parity. Keep the existing quality gates and deployment protections. Record actual test results and pending scope in PROJECT_STATUS.md. Production release follows the existing merge and approval process.

---

## 1. Production entry point

GitHub Pages publishes `generator/` from `main` at https://yanivmizrachiy.github.io/targilim/. See `PROJECT_STATUS.md` for shipped features and inventory.

---

## 2. Source-of-truth map (do not duplicate; reference these)

| Concern | Source of truth |
|---|---|
| Product requirements / operating rules / merge order | **`RULES.md`** (this file) |
| Current project status snapshot | **`PROJECT_STATUS.md`** |
| Pedagogy / per-topic intent | **`docs/SOURCE_BIBLE.md`** |
| Approved source materials | **`sources/intake/`** (dated, approved source collections) |
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
- Keep the verified engine inventory and topic-selector coverage in sync. Changes in engine count require a planned and approved registry update, with zero fallback topics.
- **Do not weaken a verifier.** Adding guards is fine; loosening existing checks is not.
- **Verifiers are read-only by default.** A normal `verify:*` run must not dirty
  the working tree; generated report refreshes require `--write` or an explicit
  update flag.
- **No demo / mock / placeholder / fake controls.** All output must be real and source-grounded.
- **Do not invent questions** without a source. No new Grade-8 numeric/uncertainty content without **new** source intake.
- **Do not claim something is done if it only exists on a branch** and is not merged.
- **Every PR must pass `npm run verify:deep`.**
- Update `PROJECT_STATUS.md` when verified implementation status changes. Update this file when requirements or operating rules change.

---

## 5. Repository-wide code redesign, compatibility and cleanup

- Review all repository-owned code, including the application, every exercise engine, registries, data validation, graphics and layout, book/print/PDF and other exports, shared utilities, build tooling, tests, scripts and CI. Trace each module to its callers, inputs, outputs and verification. Use this inventory to plan the redesign across the entire codebase and track each area to completion.
- For each module decide whether to redesign, refactor, consolidate, remove or retain it, and record the evidence for that decision in the implementation plan. Rewrite any existing component whose design prevents a meaningful improvement, including core components where needed. Judge the new code by correctness, readability, reduced duplication and complexity, performance, and ease of extending curriculum coverage. Apply these criteria to existing code as well as new work.
- Migrate in dependency order with small, reviewable changes. Compare baseline and revised behavior using real inputs, deterministic samples where applicable, and measured results. Verify compatibility at public entry points and across the existing engine inventory. Capture intentional behavior changes against the product requirements and run the existing gates throughout the migration.

- Keep existing behavior and entry points covered by the verification suite. Check registry and runtime usage before adding families or removing legacy code. Remove code only after proving it is unused or after migrating and verifying its callers.
- Keep historical/internal gallery, teacher-support and visual-QA tools outside the primary generator flow. See `PROJECT_STATUS.md` for implementation history.

---

## 8. Permanent design requirements (UI)

- **It is a work tool, not a landing page.** The main page opens **directly** to the
  "הגדרות תרגיל" topic-selection card — no hero/benefits/CTA splash.
- **No marketing / demo language anywhere user-facing.** Dry, factual, teacher-oriented
  copy only (e.g. "מחולל דפי תרגול במתמטיקה", not "מחולל חכם ומעוצב"). No "דמו", no slogans,
  no unproven claims, no `fallback`/`QA`/`מנוע`/`Registry` developer jargon in visible text.
- The interface must look **premium**; fonts must read like a real math textbook.
- View options are **`צבע` / `שחור־לבן` only** — never the words "גווני אפור".
- Keep three real difficulty tiers with a documented mapping to the curricular levels specified above. Each supported topic must honor its selected difficulty.
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
- Use the [district Pythagoras reader](https://jerusalem2.vercel.app/chativat-beynayim/h/topics/h-pythagoras/) and `PythagorasNative` in `jerusalem2` as design references. Use white A4 pages, dark-blue separators visible only on screen, one action bar and chapter navigation where the document has chapters. Keep the generator and reader accessible and responsive, with crisp vector graphics and readable RTL/BiDi typography, formulas and monochrome printing.
- Raise the visual quality beyond the current generator and its outputs. Treat the district Pythagoras reader as a reference for reading and pagination. Capture the baseline and compare successive designs using real exercises across numeric, algebraic, geometric and uncertainty topics. Review the generator UI, exercise cards, digital book, printed A4 and downloaded PDFs at desktop and mobile widths and in color and monochrome. Require demonstrable improvements in hierarchy, spacing, mathematical typography, vector diagrams, charts and tables, label legibility and page composition. Verify mathematical fidelity, answer isolation and absence of clipping or overlap in the actual exported files. Preserve before/after evidence and iterate on remaining weaknesses.
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

