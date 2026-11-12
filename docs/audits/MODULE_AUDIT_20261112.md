> Prepared 2026-11-12 for the workbook implementation plan ([WORKBOOK_IMPLEMENTATION_PLAN_20261112.md](../planning/WORKBOOK_IMPLEMENTATION_PLAN_20261112.md)). Read-only research: findings marked UNVERIFIED were not confirmed. Line references point at commit `d274b44` unless stated.

# Targilim — module audit for the redesign

Code audited: commit `d274b44` (branch `feat/workbook-vertical-slice`). Audit date 2026-11-12. Read-only: nothing in the repository was modified.

All runtime numbers were produced by scripts in this scratchpad, run against a `git archive d274b44` snapshot (`scratchpad/head-d274b44`). During the audit another process rewrote `generator/exercise-set.js` and added an untracked `generator/workbook/` folder in the working tree. Those uncommitted changes are **not** covered here. The rewritten `exercise-set.js` header mentions a seeded document model, which is relevant to problem 5 below.

**Artifacts** (all in the scratchpad):
- `module-audit.md` (this file)
- `samples.json` holds 600 representatives (50 ids × 3 levels × 4 question types), the first successful draw of each.
- `engine-stats.json` holds the per-engine statistics and the aggregate.
- `ui-runtime.json` holds the dropdown, engine panel, single-card and worksheet simulation.
- `static-analysis.json` is the acorn AST inventory: `E.*` assignments, override chains, globals, registrations, helper closures, duplicates.
- Supporting files: `tool-run-results.json`, `tools-inventory.json`, `css-usage.json` and `tables.md`.
- Scripts: `analyze-static.mjs`, `corpus.mjs` (imports `loadEngines` from `file:///targilim/tools/engine-load.mjs`), `css-usage.mjs`, `tools-inventory.mjs`, `run-tools.mjs`, `build-tables.mjs`, `probe-*.mjs`.

**How the numbers were produced**

*The two stacks*
- **browser stack**: a Node VM that executes `generator/index.html`'s 55 local `<script>` tags in page order with a DOM stub. It includes `pattern-engine.js`, `exercise-set.js` and the 16 files that `phase2-loader.js` injects. It calls `E.getEngineExercise(id, diff, qtype, {mcqMode})` exactly as `exercise-set.js:16` does.
- **harness**: `tools/engine-load.mjs` `loadEngines()`, the loader that 19 tools use.

*Sample sizes*
- 20 draws per id × level × qtype on both stacks.
- 20 extra MCQ draws per id × level with `mcqMode:'multi'`.
- 60 extra draws per combo for the difficulty comparison, so 320 per level.
- 4 real 10-question worksheets per visible topic × level, built through `generateSet()`.
- A replay test: each combo is run twice from the same `mulberry32` seed injected as `Math.random`.

*Heuristics*
- SVG checks are static approximations. "anchor outside" means the label's x/y (plus any `<g translate>`) falls outside the `viewBox`.
- "est. overflow" assumes 0.55 em per character and RTL direction inherited from `<html dir=rtl>`: `start` extends left, `end` extends right. Confirm with a real `getBBox()` before acting on it.
- Two difficulty levels count as **SAME** when template-Jaccard ≥ 0.6, number-set Jaccard ≥ 0.6 and the emitted families are identical. The 11 engines flagged SAME below were flagged in all 3 independent runs.

---

## 1. Top structural problems (with evidence)

1. **Three divergent runtimes. The verifier harness never runs the production dispatcher.**
   - `tools/engine-load.mjs:32-48` loads neither `engine/pattern-engine.js`, which defines the base `E.getEngineExercise` (`pattern-engine.js:86-109`), nor `core.js`, `exercise-set.js` or the legacy files.
   - Measured: in the harness, `E.getEngineExercise` returns `null` 240/240 times for 21 pilot ids. For the 4 uncertainty pilots it returns null whenever the random overlay does not fire (386/960). That is 5,426 of 12,000 calls. The browser stack returned 0 nulls and 0 exceptions on the same 12,000 calls.
   - Verifiers work around this with `callEngine()`, which calls `E.generateXxxEngine` directly (`engine-load.mjs:82-99`). As a result the production dispatch, the `correctLabel` extraction and the wrapper chain are unverified for 25 engines.
   - `verify-copy-export.mjs:54-55` silently `continue`s on null. It passes while skipping 21–25 engines.
   - `verify-real-generator-runtime.mjs:95-98` uses a third load list: no source-fit, no `pedagogy-attach`, no diagram overrides.
   - `gallery.html:47-98` and `visual-qa.html:41-92` omit `source-fit-uncertainty-deep.js` and still use `?v=20260617c` (index uses `20260619a`). The QA pages therefore render different engines from production for 9 uncertainty ids.

2. **Dispatch is assembled from 9 monkey-patch layers** (table in §5).
   - `E.getEngineExercise` is defined at `pattern-engine.js:86`, then wrapped 8 times, ending at `pedagogy-attach.js:79`. `E.isEngineTopic` has 7 layers.
   - Also patched:
     - `window.onDomain` and `window.onGrade` (`pattern-engine.js:351-354`)
     - 4 pilot functions, through `E[fnName]` (`source-fit-uncertainty-deep.js:711-725`)
     - 9 `generators[id]` entries (`…:727-737`)
   - Measured consequences:
     - (a) `E.updatePanel` tests the closure array (`pattern-engine.js:114`), while the source-fit files push their ids into the copy `E.ENGINE_TOPIC_IDS` (`pattern-engine.js:83`, e.g. `source-fit-dedicated.js:378`). So the question-type / difficulty / MCQ-mode panel is hidden for all **25** non-pilot engine topics. Its hidden `<select>`s still drive generation (`exercise-set.js:57-58`).
     - (b) For 9 uncertainty ids, each call picks between two implementations at random: `shouldUse` uses p = .42/.62/.78 by level (`source-fit-uncertainty-deep.js:202-209`). The single-card path always uses the overlay (`…:734`, `forceUncertaintySourceDeep`).

3. **Answer isolation depends on CSS.**
   - `engine/question-types.js:49` writes `mcq-correct` into the **student** `questionHTML`. This happened in 3,000/3,000 MCQ generations.
   - The answer key is parsed back out of that student HTML by regex: `exercise-set.js:163-165`, `pattern-engine.js:94`, plus 4 copies in the source-fit files.
   - The marker is neutralised only inside `.exset` (`style.css:489-496`).
   - With count = 1 (`core.js:16` → `generators[id]` → `E.renderEngineCard`, `pattern-engine.js:34-51`), the card is rendered outside `.exset`. There `engine/engine.css:50-56` and the inline `index.html:16` paint the correct choice green. In print, `style.css:610` also forces `.answer{display:block}`.
   - VM check: the count=1 MCQ card contains `mcq-correct` and no `.exset` (`ui-runtime.json → singleCardPath`).

4. **Difficulty comes from two different controls and is often a no-op.**
   - The single card reads `#selDiff` first (`pattern-engine.js:194` and 24 copies). Worksheets read `#sl` first (`exercise-set.js:50`).
   - VM: with the visible level set to "רמה 3", count = 1 passed `standard` to the engine; count = 5 passed `challenge`.
   - Pilots pick a family subset per level (e.g. `pilot-n8-04.js:101-103`, `pilot-g7-01.js:17-21`), but every level draws its numbers from the same small hard-coded case tables, so the numbers do not scale.
   - Levels are statistically **SAME** in 11 engines:
     - G8-03: all three levels. `source-fit-geometry.js:67` only re-weights `equal`/`supp`.
     - basic ≈ standard: G8-02 (`source-fit-geometry.js:37`), N8-01, N8-05.
     - standard ≈ challenge: A7-02, A7-05, G7-04, G8-04, N7-05, N7-06, N8-04. N8-04 picks from the same 3 subtypes at both levels.
   - The 11 visible legacy topics ignore difficulty completely.
   - MCQ "multi" mode is honoured only by A7-04 (`source-fit-algebra-g7.js:98-117`). In multi mode, 2,940/3,000 draws still had exactly one correct answer.

5. **No reproducibility, hidden state and no answer validation.**
   - All randomness goes through `Math.random`: `random.js:4-20` (`E.pick` / `E.shuffle`) plus 1–13 direct calls per file. `generator/engine` contains no seed parameter. The only deterministic code is the layout hash in `diagram-ultra-autopilot.js:30`.
   - Three module-level counters make output depend on call history: `pilot-n8-02.js:5`, `source-fit-dedicated.js:197`, `source-fit-uncertainty-deep.js:12`. With a fixed seeded RNG, replays differed in 9 engines.
   - No engine checks that question, diagram and answer agree. `validators.js` has `isTriple`, used once to compute a truth value (`pilot-g7-03.js:58`), and `uniqueValues`, which is never used.
   - Defects found by sampling:
     - **G8-07 basic/open**: one question text and one fixed diagram (`source-fit-dedicated-2.js:52-59`) come with **three different "correct" answers**: ז.צ.ז 26, צ.צ.צ 22, צ.ז.צ 12 out of 60. The theorem is picked at random at `:131` and the diagram shows no angle marks.
     - **N7-06 `compare_both` MCQ**: asks for two expressions (sub-items א/ב collide with the choice labels) but marks only `64` correct while `−64` is also a computed result.
     - Duplicate distractors: N7-01, e.g. `(7,2)` twice; U7-04, e.g. `4` twice.
     - MCQ option count varies between 2 and 4 in 16 engines (16–19 across runs).
     - N7-09 `opposite_in_context` answers carry units (`מ׳`) for context-free questions.

6. **Provenance metadata is mostly synthetic.**
   - 26 of 50 engines never return `questionFamily`. `pedagogy-attach.js:47-62` then fills `meta.questionFamily` with the registry's first family (`familyProvenance:'default'`); this applied to 6,597 of 12,000 generations.
   - `source-fit-dedicated.js:358-360` and `source-fit-dedicated-2.js:395-397` re-register 17 sources. At runtime this silently changes 5 `cognitiveDemand` values from `source-registry.js`: U7-06, G8-07, G8-09 and G7-06 go from challenge to standard, and N7-08 from basic to standard.

7. **Dead and duplicated code ships to production.**
   - `diagram-premium-overrides.js` (472 lines) is fully overridden by `diagram-ultra-autopilot.js` and never executes. Four functions in `diagrams.js` are overridden twice.
   - 44 of 55 legacy bare-id generators are unreachable: `core.js:14` hides a bare id whenever its `-ENGINE` twin exists. **15 of the 20 legacy files** contain only unreachable generators, yet `phase2-loader.js:1` and `index.html:32-35` still load them.
   - `teacher-mode.js` has a DOM layer that no page can reach; the only part any page uses is `Teacher.buildTeacherCardHTML` (`gallery.html:140`).
   - `follow-up.js` is loaded by `index.html:81` but has no caller there.
   - Copy-paste skeletons:
     - `choices()` in 27 files
     - `question()` and `answer()` in 24 each
     - `pickFamily()` in 23
     - 4 byte-identical `getEngineExercise` wrappers
     - `rnd()` identical in 8 files
   - There are three html2canvas export paths: `export.js:16-58`, `mobile-share.js:6-8` (which copies only the first card on the page, `:4`), and `teacher-mode.js:218-235`.

8. **CI is mostly red noise.** According to `gh run list`:
   - **11 of 15 workflows have failed in 100% of their recorded runs.**
     - 9 browser jobs select bare legacy ids that the dropdown no longer contains, for example `verify-n8-02.yml:37 'N8-02'`, `verify-phase2-batch.yml:54-62` and `verify-generator-live.yml:96 'G7-03'`.
     - 2 jobs run stale static verifiers.
   - `pages-healthcheck.yml` only greps a hand-written JSON file (`site-health.json`: `"activeSlices": 25`).
   - `gemini-agent.yml` calls a script that does not exist (`scripts/validate_app_canonical_coverage.py`). It auto-commits on any issue comment containing `/fix`.
   - Only `verify.yml` (`npm run verify:deep`, 36 tools) and `deploy-pages.yml` do real work. `verify.yml` also triggers on a stale branch name (`verify.yml:10`).

9. **Gate verifiers pin dead code.**
   - `verify:source-fit` (`verify-chatgpt-source-fit-sync.mjs:31-37,105-145`), `verify:geometry8` (`verify-geometry-g8-source-fit.mjs:16-25`), `verify:numeric7` and others read legacy files such as `u7-02.js`, `n7-03.js` and `g8-01.js`. They assert bare-id registrations that are now unreachable, labelling them "active source-fit topics".
   - `verify:geometry-language` loads the legacy `geo.js` and `diagrams.js` without the overrides, so it validates code paths production never executes.
   - RULES.md forbids weakening a verifier, so these assertions must be migrated before the dead code is removed.

---

## 2. Runtime composition — who loads what

| stack | base `getEngineExercise` (pattern-engine) | source-fit chain | uncertainty-deep overlay | diagram overrides | legacy files | teacher-mode | used by |
|---|---|---|---|---|---|---|---|
| `generator/index.html` (production) | yes (`:72`) | yes (`:73-78`) | yes (`:79`) | yes (`:44-45`) | yes: 4 static (`:32-35`) + 16 via `phase2-loader.js` | no | teachers |
| `gallery.html` / `visual-qa.html` | yes | yes | **no** | yes | 4 static only | yes | internal QA |
| `tools/engine-load.mjs` | **no** | yes | yes | yes | no | opt-in | 19 tools |
| `verify-real-generator-runtime.mjs` | yes | **no** | **no** | **no** | `numeric.js` only | no | verify:runtime |
| `verify-topic-dropdown-clean.mjs` | yes | yes | yes | yes | **no** (phase2 not executed) | no | verify:topic-dropdown |
| `harness-engines` / `verify-variety` / `verify-geometry-diagram-quality` | no | no | no | **no** (dead variants) | no | no | orphans |
| `verify-geometry-terminology.mjs` | no | no | no | **no** | `geo.js` (dead) | no | verify:geometry-language |

**What the teacher actually sees** (VM, after `phase2-loader` completes):
- The dropdown has 61 topics: 50 engines plus **11 legacy topics**: A8-04, A8-05, A8-06, A8-07, A8-08, G7-07, G7-08, G7-09, G7-10, G8-10 and G8-11.
- The legacy topics are served by fixed case lists that have 1–4 cases and no difficulty, so 10-question worksheets repeat cards heavily:

| legacy topic | file | worksheet duplicates b/s/c (of 40) |
|---|---|---|
| A8-04 | a8-03.js:14 | 1/2/2 |
| A8-05 | a8-03.js:32 | 24/24/24 |
| A8-06 | a8-03.js:44 | 24/24/24 |
| A8-07 | a8-02.js:5 | 28/28/28 |
| A8-08 | a8-02.js:18 | 36/36/36 |
| G7-07 | g7-01.js:5 | 36/36/36 |
| G7-08 | g7-01.js:13 | 24/24/24 |
| G7-09 | g7-02.js:25 | 24/24/24 |
| G7-10 | g7-02.js:34 | 24/24/24 |
| G8-10 | g8-04.js:40 | 36/36/36 |
| G8-11 | g8-04.js:48 | 28/28/28 |

Overall: 878 duplicate cards in 7,320 simulated worksheet cards (12.0%). 857 of them come from the legacy topics. Among the engines, G8-07 (basic 12/40, standard 4/40), A7-05 (basic 4/40) and U8-02 (basic 1/40) contribute the rest. The cause is the dedup loop in `exercise-set.js:61-72`, which gives up after 8 tries and falls back to `ex=last`.

---

## 3. Engine inventory (all 50 registry ids)

Columns:
- **implementation**: the file and line of the function that produces the exercise. "dispatch" is the `pattern-engine.js` `ENGINE_FN` row; "overlay" is the probabilistic replacement in `source-fit-uncertainty-deep.js`.
- **families**: the families registered in `pedagogy-registry.js` (`E.getFamilies`), followed by the families the engine actually returned as `questionFamily` across 960 draws.
- **difficulty**: the lines in the implementation that branch on the level, then pairwise level comparisons as `verdict (template-Jaccard / number-Jaccard)` over 320 draws per level.
- **visuals**: share of generations with an SVG or table. Instrumented `E.*Svg` / `E.*Html` calls are shown with the file whose definition actually runs; local SVG builders are found statically.
- **qtypes**: all 50 engines return the requested structure for open, mcq, tf and mistake (0 mismatches in 12,000).

| # | id | implementation (file:line → fn) | registered families → emitted by engine | difficulty: static branches · runtime tier comparison (template/number Jaccard) | visuals (svg% / table%) · helpers (final definer) | randomness · state | self-check | verifiers (explicit; + generic set) |
|---|---|---|---|---|---|---|---|---|
| 1 | G7-01-ENGINE | pilot-g7-01.js:109 `E.generateG701Engine`<br>dispatch pattern-engine.js:56 | 5: rectangle_area, rectangle_perimeter, rectangle_missing_side, box_volume, box_missing_dim → **none emitted** (meta defaults to first family) | pilot-g7-01.js:18,19<br>b~s structural (0.4/0.766); s~c structural (0.333/0.694); b~c structural (0/0.5)<br>mean max number b/s/c: 31.2/32.2/44.2 | 100% / 0%<br>rectangleSvg(diagram-ultra-autopilot.js), boxSvg(diagrams.js) | Math.random (direct 1 + E.pick/E.shuffle); 3 draws/gen; no seed | none | ~~release-audit~~, ~~phase2-static~~, ~~phase3a-static~~, topic-question-variety |
| 2 | G7-02-ENGINE | pilot-g7-02.js:87 `E.generateG702Engine`<br>dispatch pattern-engine.js:57 | 4: triangle_area, parallelogram_area, trapezoid_area, triangle_missing_height → **none emitted** (meta defaults to first family) | pilot-g7-02.js:18,19<br>b~s structural (0.5/0.848); s~c structural (0.5/0.848); b~c structural (0/0.697)<br>mean max number b/s/c: 28.5/29.9/28.2 | 100% / 0%<br>triangleBaseHeightSvg(diagrams.js) | Math.random (direct 1 + E.pick/E.shuffle); 3.57 draws/gen; no seed | none | ~~release-audit~~, ~~phase2-static~~, ~~phase3a-static~~ |
| 3 | G7-03-ENGINE | pilot-g7-03.js:73 `E.generateG703Engine`<br>dispatch pattern-engine.js:58 | 3: find_side, check_right_triangle, rectangle_diagonal → **none emitted** (meta defaults to first family) | pilot-g7-03.js:11,12,41,75,…<br>b~s structural (0.235/0.542); s~c structural (0.588/0.793); b~c structural (0/0.464)<br>mean max number b/s/c: 11.3/13.6/20.4 | 100% / 0%<br>rightTriangleSvg(diagram-ultra-autopilot.js), rectangleDiagonalSvg(diagrams.js) | Math.random (direct 2 + E.pick/E.shuffle); 2.9 draws/gen; no seed | none (only E.isTriple to decide truth value) | ~~release-audit~~, geometry-g7-source-fit, geometry-terminology, ~~phase2-static~~, ~~phase3a-static~~ |
| 4 | G7-04-ENGINE | pilot-g7-04.js:128 `E.generateG704Engine`<br>dispatch pattern-engine.js:59 | 3: missing_angle, possible_triangle, classify_triangle → **none emitted** (meta defaults to first family) | pilot-g7-04.js:34,35<br>b~s structural (0.355/1); s~c **SAME** (0.653/1); b~c structural (0.28/1)<br>mean max number b/s/c: 112.1/106.2/105.9 | 100% / 0%<br>triangleAnglesSvg(diagram-ultra-autopilot.js) | Math.random (direct 3 + E.pick/E.shuffle); 5.82 draws/gen; no seed | none | ~~release-audit~~, geometry-diagram-quality, geometry-g7-source-fit, ~~phase2-static~~, ~~phase3a-static~~ |
| 5 | N7-03-ENGINE | pilot-n7-03.js:108 `E.generateN703Engine`<br>dispatch pattern-engine.js:60 | 4: order_negatives, compare_negatives, absolute_and_opposite, place_on_number_line → **none emitted** (meta defaults to first family) | pilot-n7-03.js:34,35<br>b~s structural (0.5/0.7); s~c structural (0.5/1); b~c structural (0/0.7)<br>mean max number b/s/c: 12/10.6/9.1 | 100% / 0%<br>numberLineSvg(diagrams.js) | Math.random (direct 2 + E.pick/E.shuffle); 4.2 draws/gen; no seed | none | ~~release-audit~~, ~~phase2-static~~, ~~phase3a-static~~, real-generator-runtime |
| 6 | N7-04-ENGINE | pilot-n7-04.js:152 `E.generateN704Engine`<br>dispatch pattern-engine.js:61 | 5: add_same_sign, add_diff_sign, subtract_negative, missing_addend, estimate_sign → **none emitted** (meta defaults to first family) | pilot-n7-04.js:48,49<br>b~s structural (0.491/1); s~c structural (0.34/0.897); b~c structural (0/0.897)<br>mean max number b/s/c: 20.6/22.9/25 | 82% / 0%<br>numberLineSvg(diagrams.js)<br>local: lineSvg | Math.random (direct 3 + E.pick/E.shuffle); 4 draws/gen; no seed | none | ~~release-audit~~, ~~phase2-static~~, ~~phase3a-static~~, topic-question-variety |
| 7 | N7-05-ENGINE | pilot-n7-05.js:82 `E.generateN705Engine`<br>dispatch pattern-engine.js:62 | 3: directed_multiplication, directed_division, missing_factor → **none emitted** (meta defaults to first family) | pilot-n7-05.js:29,30<br>b~s structural (0.375/0.772); s~c **SAME** (0.625/0.783); b~c structural (0/0.655)<br>mean max number b/s/c: 25.7/26.9/27 | 0% / 0%<br>— | Math.random (direct 3 + E.pick/E.shuffle); 5.67 draws/gen; no seed | none | ~~release-audit~~, ~~phase2-static~~, ~~phase3a-static~~ |
| 8 | N7-06-ENGINE | pilot-n7-06.js:57 `E.generateN706Engine`<br>dispatch pattern-engine.js:63 | 3: parentheses_even_exponent, parentheses_odd_exponent, compare_both → **none emitted** (meta defaults to first family) | pilot-n7-06.js:15,16<br>b~s structural (0.5/0.625); s~c **SAME** (1/1); b~c structural (0.5/0.625)<br>mean max number b/s/c: 31.5/74.6/76 | 0% / 0%<br>— | Math.random (direct 3 + E.pick/E.shuffle); 2.72 draws/gen; no seed | none | ~~release-audit~~, numeric-g7-source-fit, ~~phase2-static~~, ~~phase3a-static~~, real-generator-runtime |
| 9 | N7-07-ENGINE | pilot-n7-07.js:103 `E.generateN707Engine`<br>dispatch pattern-engine.js:64 | 4: exact_root, estimate_between, side_from_area, sum_under_root_trap → **none emitted** (meta defaults to first family) | pilot-n7-07.js:22,23<br>b~s structural (0.333/0.535); s~c structural (0.471/0.889); b~c structural (0/0.444)<br>mean max number b/s/c: 85.5/80.8/65.7 | 63% / 0%<br>—<br>local: squareSvg | Math.random (direct 1 + E.pick/E.shuffle); 2.67 draws/gen; no seed | none | ~~release-audit~~, numeric-g7-source-fit, ~~phase2-static~~, ~~phase3a-static~~ |
| 10 | A7-01-ENGINE | pilot-a7-01.js:362 `E.generateA701Engine`<br>dispatch pattern-engine.js:65 | 11: expression_from_words, simplify_like_terms, match_expression, rectangle_expression, two_variable_cost, generalize_concrete_to_general, sequence_general_term, tower_general_term, simplify_mixed_terms, equal_expressions, polygon_perimeter_expression → equal_expressions, match_expression, simplify_like_terms, expression_from_words, two_variable_cost, generalize_concrete_to_general, sequence_general_term, rectangle_expression, polygon_perimeter_expression, tower_general_term, simplify_mixed_terms | pilot-a7-01.js:128,129<br>b~s structural (0.219/0.581); s~c structural (0.229/0.871); b~c structural (0/0.516)<br>mean max number b/s/c: 10.4/11.4/11.6 | 23% / 0%<br>algebraRectangleSvg(diagrams.js), polygonSidesSvg(diagrams.js), cupTowerSvg(diagrams.js) | Math.random (direct 3 + E.pick/E.shuffle); 3.42 draws/gen; no seed | none | ~~release-audit~~, math-bidi-quality, ~~phase2-static~~, ~~phase3a-static~~, topic-question-variety |
| 11 | A7-02-ENGINE | pilot-a7-02.js:193 `E.generateA702Engine`<br>dispatch pattern-engine.js:66 | 7: substitute_positive, substitute_negative, substitute_power, substitute_two_variables, substitute_two_var_powers, substitute_applied_formula, expression_value_range → **none emitted** (meta defaults to first family) | pilot-a7-02.js:59,60<br>b~s structural (0.129/0.581); s~c **SAME** (0.718/0.759); b~c structural (0.026/0.556)<br>mean max number b/s/c: 15.1/34.7/36.8 | 0% / 0%<br>— | Math.random (direct 7 + E.pick/E.shuffle); 4.97 draws/gen; no seed | none | ~~release-audit~~, ~~phase2-static~~, ~~phase3a-static~~ |
| 12 | A7-03-ENGINE | pilot-a7-03.js:214 `E.generateA703Engine`<br>dispatch pattern-engine.js:67 | 9: one_step, two_step, parentheses_equation, verify_solution, build_equation_from_word_problem, identify_equation_with_solution, word_build_equation, given_solution_equation, missing_box_for_solution → **none emitted** (meta defaults to first family) | pilot-a7-03.js:56,57<br>b~s structural (0.244/0.611); s~c structural (0.584/0.762); b~c structural (0.023/0.476)<br>mean max number b/s/c: 23.3/22.6/22.5 | 0% / 0%<br>—<br>local: eqLine | Math.random (direct 4 + E.pick/E.shuffle); 2.93 draws/gen; no seed | none | ~~release-audit~~, ~~phase2-static~~, ~~phase3a-static~~ |
| 13 | U7-01-ENGINE | pilot-u7-01.js:158 `E.generateU701Engine`<br>+ overlay source-fit-uncertainty-deep.js:672 `make()` (p=.42/.62/.78, :202-209)<br>dispatch pattern-engine.js:68<br>pilot fn wrapped by uncertainty-deep.js:722 | 9: read_frequency, most_frequent, total_count, relative_frequency, raw_to_table, bar_chart_read, source_penguin_frequency_table, source_grade_raw_to_table, source_clubs_missing_frequency → source_penguin_frequency_table, source_clubs_missing_frequency, source_grade_raw_to_table | pilot-u7-01.js:15,16<br>b~s structural (0.346/0.65); s~c structural (0.375/0.949); b~c structural (0.229/0.684)<br>mean max number b/s/c: 74.4/73.5/74.8 | 20% / 100%<br>freqTableHtml(diagrams.js)<br>local: tableSvg, barSvg, compareSvg, lineSvg, pieSvg, tableHtml, tenSectorSvg | Math.random (direct 4 + E.pick/E.shuffle); 3.25 draws/gen; no seed<br>state: source-fit-uncertainty-deep.js:12 tfFlip<br>replay differs in 2/12 combos | none | ~~release-audit~~, ~~phase2-static~~, ~~phase3a-static~~, topic-question-variety, uncertainty-source-deep |
| 14 | U7-02-ENGINE | pilot-u7-02.js:159 `E.generateU702Engine`<br>+ overlay source-fit-uncertainty-deep.js:672 `make()` (p=.42/.62/.78, :202-209)<br>dispatch pattern-engine.js:69<br>pilot fn wrapped by uncertainty-deep.js:723 | 8: die_probability, bag_probability, complement_probability, expected_count_over_trials, given_probability_count, weather_probability_complement, fairness_symmetry_probability, forecast_interpretation → given_probability_count, weather_probability_complement, forecast_interpretation, fairness_symmetry_probability | pilot-u7-02.js:46,47<br>b~s structural (0.217/0.333); s~c structural (0.43/0.786); b~c structural (0.141/0.382)<br>mean max number b/s/c: 21.6/44.3/41.8 | 52% / 67%<br>freqTableHtml(diagrams.js)<br>local: bagSvg, dieSvg, modelSvg, spinnerSvg, barSvg, compareSvg, lineSvg, pieSvg, tableHtml, tenSectorSvg | Math.random (direct 3 + E.pick/E.shuffle); 3.05 draws/gen; no seed<br>state: source-fit-uncertainty-deep.js:12 tfFlip<br>replay differs in 2/12 combos | none | ~~release-audit~~, ~~phase2-static~~, ~~phase3a-static~~, uncertainty-source-deep |
| 15 | G8-01-ENGINE | pilot-g8-01.js:88 `E.generateG801Engine`<br>dispatch pattern-engine.js:70 | 5: circumference_from_radius, area_from_radius, circumference_from_diameter, radius_from_circumference, formula_distinction → **none emitted** (meta defaults to first family) | pilot-g8-01.js:15,16<br>b~s structural (0.5/0.962); s~c structural (0.19/0.759); b~c structural (0/0.786)<br>mean max number b/s/c: 23.6/27.4/19.8 | 100% / 0%<br>circleSvg(diagram-ultra-autopilot.js) | Math.random (direct 1 + E.pick/E.shuffle); 3 draws/gen; no seed | none | ~~release-audit~~, ~~phase2-static~~, ~~phase3a-static~~, topic-question-variety |
| 16 | G8-04-ENGINE | pilot-g8-04.js:98 `E.generateG804Engine`<br>dispatch pattern-engine.js:71 | 4: scale_factor, corresponding_side, area_ratio, is_similar → **none emitted** (meta defaults to first family) | pilot-g8-04.js:27,28<br>b~s structural (0.19/0.435); s~c **SAME** (0.773/1); b~c structural (0/0.435)<br>mean max number b/s/c: 11.3/13.9/16.8 | 100% / 0%<br>similarTrianglesSvg(diagrams.js) | Math.random (direct 1 + E.pick/E.shuffle); 5.6 draws/gen; no seed | none | ~~release-audit~~, ~~phase2-static~~, ~~phase3a-static~~ |
| 17 | N8-01-ENGINE | pilot-n8-01.js:138 `E.generateN801Engine`<br>dispatch pattern-engine.js:72 | 3: ratio_simplify, ratio_share, ratio_missing → **none emitted** (meta defaults to first family) | pilot-n8-01.js:26,27<br>b~s **SAME** (0.75/0.619); s~c structural (0.5/0.976); b~c structural (0.25/0.595)<br>mean max number b/s/c: 36.9/108.7/180.9 | 100% / 0%<br>ratioBarSvg(diagrams.js) | Math.random (direct 1 + E.pick/E.shuffle); 3.26 draws/gen; no seed | none | ~~release-audit~~, ~~phase2-static~~, ~~phase3a-static~~ |
| 18 | N8-02-ENGINE | pilot-n8-02.js:111 `E.generateN802Engine`<br>dispatch pattern-engine.js:73 | 3: proportion_missing, proportion_rate, proportion_verify → **none emitted** (meta defaults to first family) | pilot-n8-02.js:27,28<br>b~s structural (0.424/0.667); s~c structural (0.525/0.917); b~c structural (0.211/0.583)<br>mean max number b/s/c: 29.6/47.8/65.6 | 100% / 0%<br>proportionTableSvg(diagrams.js) | Math.random (direct 0 + E.pick/E.shuffle); 2.75 draws/gen; no seed<br>state: pilot-n8-02.js:5 N802_TF_TOGGLE<br>replay differs in 1/12 combos | none | ~~release-audit~~, ~~phase2-static~~, ~~phase3a-static~~ |
| 19 | N8-03-ENGINE | pilot-n8-03.js:93 `E.generateN803Engine`<br>dispatch pattern-engine.js:74 | 3: scale_real_distance, scale_map_distance, scale_factor → **none emitted** (meta defaults to first family) | pilot-n8-03.js:26,27<br>b~s structural (0.368/0.395); s~c structural (0.5/0.868); b~c structural (0/0.263)<br>mean max number b/s/c: 64984.4/873802.5/1197525.8 | 100% / 0%<br>scaleMapSvg(diagrams.js) | Math.random (direct 1 + E.pick/E.shuffle); 2.67 draws/gen; no seed | none | ~~release-audit~~, ~~phase2-static~~, ~~phase3a-static~~ |
| 20 | N8-04-ENGINE | pilot-n8-04.js:97 `E.generateN804Engine`<br>dispatch pattern-engine.js:75 | 3: percent_of_amount, percent_find_whole, percent_find_percent → **none emitted** (meta defaults to first family) | pilot-n8-04.js:101,102<br>b~s structural (0.352/0.757); s~c **SAME** (0.907/0.946); b~c structural (0.396/0.8)<br>mean max number b/s/c: 136.7/136.5/128.9 | 100% / 0%<br>—<br>local: pctGridSvg | Math.random (direct 1 + E.pick/E.shuffle); 3 draws/gen; no seed | none | ~~release-audit~~, ~~phase2-static~~, ~~phase3a-static~~ |
| 21 | N8-05-ENGINE | pilot-n8-05.js:119 `E.generateN805Engine`<br>dispatch pattern-engine.js:76 | 3: percent_increase, percent_decrease, percent_original → **none emitted** (meta defaults to first family) | pilot-n8-05.js:32,33<br>b~s **SAME** (0.667/0.696); s~c structural (0.235/0.529); b~c structural (0/0.255)<br>mean max number b/s/c: 143.7/143.2/155.1 | 100% / 0%<br>percentChangeSvg(diagrams.js) | Math.random (direct 1 + E.pick/E.shuffle); 3 draws/gen; no seed | none | ~~release-audit~~, ~~phase2-static~~, ~~phase3a-static~~ |
| 22 | A8-02-ENGINE | pilot-a8-02.js:80 `E.generateA802Engine`<br>dispatch pattern-engine.js:77 | 5: slope_two_points, value_at, rising_falling, equation_from_points, applied_linear_read → **none emitted** (meta defaults to first family) | pilot-a8-02.js:16,17<br>b~s structural (0.398/1); s~c structural (0.32/0.6); b~c structural (0/0.6)<br>mean max number b/s/c: 12.2/11.3/9.8 | 100% / 0%<br>linearGraphSvg(diagrams.js) | Math.random (direct 1 + E.pick/E.shuffle); 2.93 draws/gen; no seed | none | ~~release-audit~~, algebra-g8-source-fit, ~~phase2-static~~, ~~phase3a-static~~, topic-question-variety |
| 23 | A8-03-ENGINE | pilot-a8-03.js:116 `E.generateA803Engine`<br>dispatch pattern-engine.js:78 | 4: sum_and_difference, more_than, verify_pair, system_count_and_value → **none emitted** (meta defaults to first family) | pilot-a8-03.js:40,41<br>b~s structural (0.485/0.338); s~c structural (0.515/0.74); b~c structural (0/0.29)<br>mean max number b/s/c: 34.7/34.9/34.8 | 0% / 0%<br>— | Math.random (direct 2 + E.pick/E.shuffle); 3.04 draws/gen; no seed | none | ~~release-audit~~, algebra-g8-source-fit, ~~phase2-static~~, ~~phase3a-static~~ |
| 24 | U8-01-ENGINE | pilot-u8-01.js:174 `E.generateU801Engine`<br>+ overlay source-fit-uncertainty-deep.js:672 `make()` (p=.42/.62/.78, :202-209)<br>dispatch pattern-engine.js:79<br>pilot fn wrapped by uncertainty-deep.js:724 | 13: mean, median, range, missing_from_mean, add_constant_effect, replace_value_mean, boost_failures_mean, source_combined_mean_groups, source_salary_outlier_measures, source_monkey_reverse_measures, source_smartphone_distribution_measures, source_flower_field_measures, source_interpolation_extrapolation → source_combined_mean_groups, source_salary_outlier_measures, source_interpolation_extrapolation, source_smartphone_distribution_measures, source_flower_field_measures, source_monkey_reverse_measures | pilot-u8-01.js:35,36<br>b~s structural (0.168/0.297); s~c structural (0.506/0.931); b~c structural (0.106/0.319)<br>mean max number b/s/c: 41.2/1617.4/954.1 | 52% / 72%<br>freqTableHtml(diagrams.js)<br>local: dotPlotSvg, barSvg, compareSvg, lineSvg, pieSvg, tableHtml, tenSectorSvg | Math.random (direct 3 + E.pick/E.shuffle); 3.3 draws/gen; no seed<br>state: source-fit-uncertainty-deep.js:12 tfFlip<br>replay differs in 2/12 combos | none | ~~release-audit~~, ~~phase2-static~~, ~~phase3a-static~~, uncertainty-source-deep |
| 25 | U8-02-ENGINE | pilot-u8-02.js:80 `E.generateU802Engine`<br>+ overlay source-fit-uncertainty-deep.js:672 `make()` (p=.42/.62/.78, :202-209)<br>dispatch pattern-engine.js:80<br>pilot fn wrapped by uncertainty-deep.js:725 | 9: prob_cell, prob_row, prob_complement, compare_groups, source_satisfaction_probability, source_weather_probability_table, source_athletics_multi_source, source_coffee_multi_source, source_ticket_sales_extrapolation → source_satisfaction_probability, source_athletics_multi_source, source_coffee_multi_source, source_ticket_sales_extrapolation, source_weather_probability_table | pilot-u8-02.js:19,20<br>b~s structural (0.232/0.394); s~c structural (0.411/0.97); b~c structural (0.091/0.373)<br>mean max number b/s/c: 137.8/162/210.2 | 71% / 41%<br>freqTableHtml(diagrams.js)<br>local: barSvg, compareSvg, lineSvg, pieSvg, tableHtml, tenSectorSvg | Math.random (direct 3 + E.pick/E.shuffle); 3.02 draws/gen; no seed<br>state: source-fit-uncertainty-deep.js:12 tfFlip<br>replay differs in 3/12 combos | none | ~~release-audit~~, ~~phase2-static~~, ~~phase3a-static~~, uncertainty-source-deep |
| 26 | N7-01-ENGINE | source-fit-extensions.js:96 `buildN701` (map :193) | 4: plot_and_shape, read_coordinate, segment_length_axis_parallel, rectangle_area_on_grid → **none emitted** (meta defaults to first family) | source-fit-extensions.js:154,155<br>b~s structural (0.474/0.625); s~c structural (0.429/0.852); b~c structural (0.111/0.519)<br>mean max number b/s/c: 10.1/11/11.2 | 100% / 0%<br>—<br>local: coordinateSystemSvg | Math.random (direct 4 + E.pick/E.shuffle); 7.92 draws/gen; no seed | none | chatgpt-source-fit-sync, coordinate-grid-source-fit |
| 27 | U7-03-ENGINE | source-fit-extensions.js:159 `buildU703` (map :194)<br>+ overlay source-fit-uncertainty-deep.js:672 `make()` (p=.42/.62/.78, :202-209) | 6: compare_relative_frequency, which_group_higher, explain_trap, source_transport_relative_decision, source_free_throw_relative_success, source_equal_relative_target → source_transport_relative_decision, source_free_throw_relative_success, source_equal_relative_target | no explicit branch<br>b~s structural (0.514/0.571); s~c structural (0.547/0.943); b~c structural (0.364/0.514)<br>mean max number b/s/c: 211.1/107.7/105.2 | 65% / 35%<br>freqTableHtml(diagrams.js)<br>local: compareGroupsSvg, barSvg, compareSvg, lineSvg, pieSvg, tableHtml, tenSectorSvg | Math.random (direct 5 + E.pick/E.shuffle); 3.47 draws/gen; no seed<br>state: source-fit-uncertainty-deep.js:12 tfFlip<br>replay differs in 2/12 combos | none | chatgpt-source-fit-sync, uncertainty-source-deep |
| 28 | A8-01-ENGINE | source-fit-graphs.js:100 `genA801` (map :237) | 5: fuel_cost_graph, heating_rate_graph, value_from_rule, complete_table_graph, is_function → **none emitted** (meta defaults to first family) | source-fit-graphs.js:102<br>b~s structural (0.394/0.588); s~c structural (0.426/1); b~c structural (0.262/0.588)<br>mean max number b/s/c: 31.5/33.2/43.1 | 100% / 0%<br>freqTableHtml(diagrams.js)<br>local: combinedTableGraphSvg, graphSvg, mappingSvg, tableHtml | Math.random (direct 3 + E.pick/E.shuffle); 4.25 draws/gen; no seed | none | algebra-g8-source-fit, chatgpt-source-fit-sync |
| 29 | U7-04-ENGINE | source-fit-graphs.js:167 `genU704` (map :238)<br>+ overlay source-fit-uncertainty-deep.js:672 `make()` (p=.42/.62/.78, :202-209) | 8: read_value, highest_lowest, bar_to_table, pictogram_read, total_from_bars, source_football_bar_to_table, source_bottle_bar_chart, source_smartphone_missing_graph_table → source_football_bar_to_table, source_bottle_bar_chart, source_smartphone_missing_graph_table | source-fit-graphs.js:170,171<br>b~s structural (0.121/0.579); s~c structural (0.412/0.833); b~c structural (0.15/0.574)<br>mean max number b/s/c: 23.4/35/37.9 | 100% / 34%<br>freqTableHtml(diagrams.js)<br>local: barSvg, pictogramSvg, tableHtml, compareSvg, lineSvg, pieSvg, tenSectorSvg | Math.random (direct 6 + E.pick/E.shuffle); 6.75 draws/gen; no seed<br>state: source-fit-uncertainty-deep.js:12 tfFlip<br>replay differs in 2/12 combos | none | chatgpt-source-fit-sync, uncertainty-source-deep |
| 30 | G8-02-ENGINE | source-fit-geometry.js:34 `genG802` (map :90) | 3: cylinder_volume, cylinder_surface, cylinder_net → **none emitted** (meta defaults to first family) | source-fit-geometry.js:37<br>b~s **SAME** (0.703/0.977); s~c structural (0.538/0.841); b~c **SAME** (0.711/0.86)<br>mean max number b/s/c: 35.8/37.7/27.7 | 100% / 0%<br>—<br>local: cylinderSvg | Math.random (direct 3 + E.pick/E.shuffle); 6.06 draws/gen; no seed | none | chatgpt-source-fit-sync, geometry-g8-source-fit |
| 31 | G8-03-ENGINE | source-fit-geometry.js:64 `genG803` (map :91) | 3: corresponding_alternate, cointerior_supplementary, identify_angle_relation → **none emitted** (meta defaults to first family) | source-fit-geometry.js:67<br>b~s **SAME** (1/1); s~c **SAME** (1/1); b~c **SAME** (1/1)<br>mean max number b/s/c: 87/86.2/87.7 | 100% / 0%<br>—<br>local: parallelSvg | Math.random (direct 2 + E.pick/E.shuffle); 4.88 draws/gen; no seed | none | chatgpt-source-fit-sync, geometry-g8-source-fit |
| 32 | A7-04-ENGINE | source-fit-algebra-g7.js:104 `genA704` (map :182) | 5: plus_distribution, minus_distribution, factor_common, like_terms, identity_check → **none emitted** (meta defaults to first family) | source-fit-algebra-g7.js:143,144<br>b~s structural (0.438/0.786); s~c structural (0.364/0.769); b~c structural (0.358/0.833)<br>mean max number b/s/c: 11.4/9.3/8.1 | 100% / 0%<br>—<br>local: smallSvg | Math.random (direct 4 + E.pick/E.shuffle); 7.72 draws/gen; no seed | none | chatgpt-source-fit-sync, multi-correct-coverage |
| 33 | A7-05-ENGINE | source-fit-algebra-g7.js:148 `genA705` (map :183) | 4: fuel_table_plot, parking_table_plot, square_area_graph, folded_paper_graph → **none emitted** (meta defaults to first family) | no explicit branch<br>b~s structural (0.448/0.846); s~c **SAME** (0.702/0.731); b~c structural (0.259/0.577)<br>mean max number b/s/c: 46.3/45.7/39.5 | 100% / 25%<br>freqTableHtml(diagrams.js)<br>local: graphCase, graphRows, graphSvg, tableHtml | Math.random (direct 3 + E.pick/E.shuffle); 4.25 draws/gen; no seed | none | chatgpt-source-fit-sync |
| 34 | U7-05-ENGINE | source-fit-dedicated.js:82 `genU705` (map :346)<br>+ overlay source-fit-uncertainty-deep.js:672 `make()` (p=.42/.62/.78, :202-209) | 6: pie_central_angle, pie_missing_percent, pie_largest_sector, source_favorite_color_total_from_pie, source_phone_ten_sector_model, source_club_missing_percent → pie_central_angle, source_favorite_color_total_from_pie, source_phone_ten_sector_model, source_club_missing_percent, pie_largest_sector, pie_missing_percent | source-fit-dedicated.js:85<br>b~s structural (0.451/0.881); s~c structural (0.214/0.435); b~c structural (0.031/0.326)<br>mean max number b/s/c: 938.3/504.8/178 | 100% / 19%<br>freqTableHtml(diagrams.js)<br>local: pieSvg, barSvg, compareSvg, lineSvg, tableHtml, tenSectorSvg | Math.random (direct 6 + E.pick/E.shuffle); 3.34 draws/gen; no seed<br>state: source-fit-uncertainty-deep.js:12 tfFlip<br>replay differs in 2/12 combos | none | chatgpt-source-fit-sync, follow-up-generation, question-family-provenance, source-fit-inventory, uncertainty-source-deep |
| 35 | U7-06-ENGINE | source-fit-dedicated.js:118 `genU706` (map :347)<br>+ overlay source-fit-uncertainty-deep.js:672 `make()` (p=.42/.62/.78, :202-209) | 6: identify_misleading, propose_fair_representation, real_change, source_medicine_misleading_3d, source_choose_graph_audience, source_representational_ethics → source_medicine_misleading_3d, identify_misleading, real_change, source_choose_graph_audience, source_representational_ethics, propose_fair_representation | source-fit-dedicated.js:121<br>b~s structural (0.236/0.743); s~c structural (0.345/1); b~c structural (0.079/0.743)<br>mean max number b/s/c: 476.7/315.5/194.4 | 80% / 48%<br>freqTableHtml(diagrams.js)<br>local: misleadingBarSvg, barSvg, compareSvg, lineSvg, pieSvg, tableHtml, tenSectorSvg | Math.random (direct 5 + E.pick/E.shuffle); 2.89 draws/gen; no seed<br>state: source-fit-uncertainty-deep.js:12 tfFlip | none | chatgpt-source-fit-sync, follow-up-generation, question-family-provenance, source-fit-inventory, uncertainty-source-deep |
| 36 | U7-07-ENGINE | source-fit-dedicated.js:155 `genU707` (map :348) | 3: read_frequency, relative_frequency, total_count → read_frequency, relative_frequency, total_count | source-fit-dedicated.js:158<br>b~s structural (0.394/0.485); s~c structural (0.435/0.861); b~c structural (0/0.444)<br>mean max number b/s/c: 37.8/42.9/53.3 | 0% / 100%<br>freqTableHtml(diagrams.js) | Math.random (direct 4 + E.pick/E.shuffle); 3.67 draws/gen; no seed | none | chatgpt-source-fit-sync, follow-up-generation, question-family-provenance, source-fit-inventory |
| 37 | U7-08-ENGINE | source-fit-dedicated.js:198 `genU708` (map :349)<br>+ overlay source-fit-uncertainty-deep.js:672 `make()` (p=.42/.62/.78, :202-209) | 6: mean, median, range, source_average_total_reasoning, source_shell_average_constraints, source_satisfaction_survey_measures → source_average_total_reasoning, mean, range, median, source_shell_average_constraints, source_satisfaction_survey_measures | source-fit-dedicated.js:200,204<br>b~s structural (0.394/0.439); s~c structural (0.141/0.559); b~c structural (0.042/0.318)<br>mean max number b/s/c: 14.2/65.2/90.3 | 56% / 44%<br>freqTableHtml(diagrams.js)<br>local: barSvg, compareSvg, lineSvg, pieSvg, tableHtml, tenSectorSvg | Math.random (direct 5 + E.pick/E.shuffle); 4.73 draws/gen; no seed<br>state: source-fit-dedicated.js:197 U708_TF_TOGGLE; source-fit-uncertainty-deep.js:12 tfFlip<br>replay differs in 3/12 combos | none | chatgpt-source-fit-sync, follow-up-generation, question-family-provenance, source-fit-inventory, uncertainty-source-deep |
| 38 | G8-06-ENGINE | source-fit-dedicated.js:218 `genG806` (map :350) | 3: identify_part, radius_diameter_relation, longest_chord → identify_part, radius_diameter_relation, longest_chord | source-fit-dedicated.js:221<br>b~s numbers-only (0.719/0.333); s~c structural (0.078/1); b~c structural (0/0.333)<br>mean max number b/s/c: 4.4/6.4/7.4 | 100% / 0%<br>circleSvg(diagram-ultra-autopilot.js) | Math.random (direct 3 + E.pick/E.shuffle); 2.67 draws/gen; no seed | none | chatgpt-source-fit-sync, follow-up-generation, geometry-g8-source-fit, question-family-provenance |
| 39 | G8-08-ENGINE | source-fit-dedicated.js:247 `genG808` (map :351) | 3: find_apex, find_base_angles, classify_isosceles → find_apex, find_base_angles, classify_isosceles | source-fit-dedicated.js:250<br>b~s structural (0.5/0.8); s~c structural (0.129/0.85); b~c structural (0/0.65)<br>mean max number b/s/c: 80.4/88/84.2 | 100% / 0%<br>—<br>local: isoTriSvg | Math.random (direct 3 + E.pick/E.shuffle); 2.67 draws/gen; no seed | none | chatgpt-source-fit-sync, follow-up-generation, geometry-g8-source-fit, question-family-provenance |
| 40 | N7-08-ENGINE | source-fit-dedicated.js:279 `genN708` (map :352) | 3: order_negatives, compare_negatives, integer_between → integer_between, compare_negatives, order_negatives | source-fit-dedicated.js:281<br>b~s structural (0.246/1); s~c structural (0.403/1); b~c structural (0.114/1)<br>mean max number b/s/c: 10/10/10 | 100% / 0%<br>numberLineSvg(diagrams.js) | Math.random (direct 4 + E.pick/E.shuffle); 4.22 draws/gen; no seed | none | chatgpt-source-fit-sync, follow-up-generation, numeric-g7-source-fit, question-family-provenance, source-fit-inventory |
| 41 | N7-09-ENGINE | source-fit-dedicated.js:315 `genN709` (map :353) | 3: opposite_number, absolute_value, opposite_in_context → absolute_value, opposite_number, opposite_in_context | source-fit-dedicated.js:318<br>b~s structural (0.568/1); s~c numbers-only (0.649/1); b~c structural (0.216/1)<br>mean max number b/s/c: 12/12/12 | 100% / 0%<br>numberLineSvg(diagrams.js) | Math.random (direct 4 + E.pick/E.shuffle); 3.09 draws/gen; no seed | none | chatgpt-source-fit-sync, follow-up-generation, numeric-g7-source-fit, question-family-provenance, source-fit-inventory |
| 42 | G8-05-ENGINE | source-fit-dedicated-2.js:98 `genG805` (map :381) | 3: angle_from_part, part_from_angle, compare → angle_from_part, part_from_angle, compare | source-fit-dedicated-2.js:101<br>b~s structural (0.5/0.821); s~c structural (0.208/0.607); b~c structural (0/0.429)<br>mean max number b/s/c: 752/515.4/110.3 | 100% / 0%<br>—<br>local: sectorSvg, svgWrap | Math.random (direct 3 + E.pick/E.shuffle); 2.83 draws/gen; no seed | none | chatgpt-source-fit-sync, follow-up-generation, geometry-g8-source-fit, question-family-provenance, teacher-advanced-mode |
| 43 | G8-07-ENGINE | source-fit-dedicated-2.js:129 `genG807` (map :382) | 3: name_theorem, missing_datum, why → name_theorem, why, missing_datum | source-fit-dedicated-2.js:133<br>b~s structural (0.257/1); s~c structural (0.149/1); b~c structural (0/1)<br>mean max number b/s/c: 2/2/2 | 100% / 0%<br>—<br>local: congruenceSvg, svgWrap | Math.random (direct 3 + E.pick/E.shuffle); 2.67 draws/gen; no seed | none | chatgpt-source-fit-sync, follow-up-generation, geometry-g8-source-fit, question-family-provenance |
| 44 | G8-09-ENGINE | source-fit-dedicated-2.js:159 `genG809` (map :383) | 3: find_height, find_ratio, why → find_height, find_ratio, why | source-fit-dedicated-2.js:167<br>b~s structural (0.5/0.714); s~c structural (0.147/0.667); b~c structural (0/0.381)<br>mean max number b/s/c: 11.5/10.7/9.7 | 100% / 0%<br>—<br>local: poleShadowSvg, svgWrap | Math.random (direct 3 + E.pick/E.shuffle); 4.62 draws/gen; no seed | none | chatgpt-source-fit-sync, follow-up-generation, geometry-g8-source-fit, question-family-provenance |
| 45 | G7-06-ENGINE | source-fit-dedicated-2.js:192 `genG706` (map :384) | 3: subtract, decompose, perimeter → subtract, decompose, perimeter | source-fit-dedicated-2.js:198<br>b~s structural (0.364/0.784); s~c numbers-only (0.727/0.831); b~c structural (0.091/0.694)<br>mean max number b/s/c: 52.1/45.6/40.5 | 100% / 0%<br>—<br>local: compositeSvg, svgWrap | Math.random (direct 3 + E.pick/E.shuffle); 5.67 draws/gen; no seed | none | chatgpt-source-fit-sync, follow-up-generation, geometry-g7-source-fit, question-family-provenance |
| 46 | G7-05-ENGINE | source-fit-dedicated-2.js:225 `genG705` (map :385) | 3: translate, reflect, rotate → translate, reflect, rotate | source-fit-dedicated-2.js:227<br>b~s structural (0.395/1); s~c structural (0.539/1); b~c structural (0.427/1)<br>mean max number b/s/c: 0/0/0 | 100% / 0%<br>—<br>local: svgWrap, transformSvg | Math.random (direct 3 + E.pick/E.shuffle); 3 draws/gen; no seed | none | chatgpt-source-fit-sync, follow-up-generation, geometry-g7-source-fit, question-family-provenance |
| 47 | N7-10-ENGINE | source-fit-dedicated-2.js:242 `genN710` (map :386) | 3: add, subtract, three_terms → add, three_terms, subtract | source-fit-dedicated-2.js:245<br>b~s structural (0.23/0.96); s~c structural (0.459/0.923); b~c structural (0/0.962)<br>mean max number b/s/c: 24/24/24 | 100% / 0%<br>numberLineSvg(diagrams.js) | Math.random (direct 4 + E.pick/E.shuffle); 4.61 draws/gen; no seed | none | chatgpt-source-fit-sync, follow-up-generation, numeric-g7-source-fit, question-family-provenance |
| 48 | N7-11-ENGINE | source-fit-dedicated-2.js:274 `genN711` (map :387) | 3: find_result, find_change, find_start → find_result, find_start, find_change | source-fit-dedicated-2.js:282<br>b~s structural (0.228/0.84); s~c structural (0.373/0.857); b~c structural (0/0.778)<br>mean max number b/s/c: 24/24/24 | 100% / 0%<br>numberLineSvg(diagrams.js) | Math.random (direct 4 + E.pick/E.shuffle); 8.58 draws/gen; no seed | none | chatgpt-source-fit-sync, follow-up-generation, numeric-g7-source-fit, question-family-provenance |
| 49 | N7-12-ENGINE | source-fit-dedicated-2.js:316 `genN712` (map :388) | 3: multiply, divide, three_factors → multiply, three_factors, divide | source-fit-dedicated-2.js:320<br>b~s structural (0.25/0.711); s~c structural (0.546/0.822); b~c structural (0/0.623)<br>mean max number b/s/c: 25.3/23.6/23.7 | 0% / 0%<br>— | Math.random (direct 5 + E.pick/E.shuffle); 6.14 draws/gen; no seed | none | chatgpt-source-fit-sync, follow-up-generation, numeric-g7-source-fit, question-family-provenance |
| 50 | N7-13-ENGINE | source-fit-dedicated-2.js:351 `genN713` (map :389) | 3: product_sign, quotient_sign, three_factor_sign → product_sign, three_factor_sign, quotient_sign | source-fit-dedicated-2.js:353<br>b~s structural (0.17/1); s~c structural (0.289/1); b~c structural (0/1)<br>mean max number b/s/c: 0/0/0 | 0% / 0%<br>— | Math.random (direct 3 + E.pick/E.shuffle); 3.95 draws/gen; no seed | none | chatgpt-source-fit-sync, follow-up-generation, numeric-g7-source-fit, question-family-provenance |

Generic verifiers that iterate all 50 ids: stress, coverage-deep, variety, visual-deep, graphics-quality, math-bidi, visual-coverage, family-provenance (callEngine: pilots via direct E.generateXxxEngine), copy-export (getEngineExercise, skips null), follow-ups (generateOne). ~~struck~~ = orphan tool not in any npm gate (and currently failing).

---

## 4. Generation statistics (browser stack, 12,000 generations)

**Aggregate**

| measure | value |
|---|---|
| Exceptions / null returns | **0 / 0** (browser stack) |
| Same calls in the harness (`loadEngines`) | 0 exceptions, **5,426 null** (21 pilots always; U7-01 91, U7-02 106, U8-01 87, U8-02 102) |
| `undefined` / `NaN` / `[object Object]` / `Infinity` in question or answer | **0 / 0 / 0 / 0** |
| Requested qtype ≠ returned structure | 0 |
| Distinct questions over 20 draws | 166 of 600 combos < 50% distinct. Worst: G8-07 basic open/mistake 1/20; A7-05 basic 2/20; U8-02 basic open 2/20; A7-05 challenge, A8-01 basic, G7-03 basic, G7-05 std/challenge 3/20 |
| MCQ, single mode | 3,000/3,000 exactly one `mcq-correct` |
| MCQ, multi mode | 2 correct: 60 (A7-04 only); 1 correct: 2,940 |
| `mcq-correct` (answer marker) inside student `questionHTML` | **3,000 / 3,000** MCQ generations; no other answer markers (`tf-verdict` etc.) were found in questions |
| MCQ with duplicate option texts | N7-01 3/60, U7-04 2/60 |
| MCQ with fewer than 4 options | 16 engines in this run, 16–19 across runs (2–3 options) |
| SVGs | 9,160 in 12,000 generations; 0 without `viewBox` |
| SVG `<text>` labels | 64,668. Anchor outside `viewBox`: **0**. Est. overflow: **1,387 (2.1%)**. Effective `text-anchor` not `middle`: **16,749 (25.9%)**; RULES.md §8 requires `middle` |
| Family provenance | exact 5,403 / default 6,597 (26 engines never emit a family) |
| Replay from the same seed differs | 9 engines (all on tf combos; caused by the module counters in §1.5) |
| Engines with no visual | 7: A7-02, A7-03, A8-03, N7-05, N7-06, N7-12, N7-13. 42 engines emit SVG and 11 emit tables |

**Est. overflow hotspots**
- N8-01 `ratioBarSvg`: the labels use `text-anchor="end" direction="rtl"` at x = 304 of 340 (`diagrams.js:97-100`).
- A7-04 `smallSvg`: a header about 350 px wide sits in a 292 px `viewBox`.
- A7-05 and U8-02: the axis unit text `שקלים` / `כרטיסים` has the default `start` anchor at x = 22.
- U7-05 pie legend: anchor `end` at x = 274 of 300.

**Per-engine table**

| id | distinct q / 20 (mean · min @ combo) | 10-question worksheet duplicate cards b/s/c (of 40) | MCQ correct count (single) · multi mode | MCQ choice counts · dup-choice gens | SVG texts: not-middle / est. overflow | family provenance exact% | harness (engine-load) nulls /240 | replay with same seed |
|---|---|---|---|---|---|---|---|---|
| G7-01-ENGINE | 0.721 · 0.45 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 0/542 · 0 | 0% | 240 | identical |
| G7-02-ENGINE | 0.754 · 0.5 @ basic/mistake | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 0/525 · 0 | 0% | 240 | identical |
| G7-03-ENGINE | 0.633 · 0.15 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 0/1419 · 7 | 0% | 240 | identical |
| G7-04-ENGINE | 1 · 1 @ — | 0/0/0 | 1:60 · multi 1:60 | 2ch:16 3ch:6 4ch:38 | 0/1440 · 0 | 0% | 240 | identical |
| N7-03-ENGINE | 0.858 · 0.5 @ challenge/mistake | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 0/2310 · 0 | 0% | 240 | identical |
| N7-04-ENGINE | 0.967 · 0.9 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 0/2561 · 0 | 0% | 240 | identical |
| N7-05-ENGINE | 0.958 · 0.75 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 0/0 · 0 | 0% | 240 | identical |
| N7-06-ENGINE | 0.688 · 0.35 @ basic/mistake | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 0/0 · 0 | 0% | 240 | identical |
| N7-07-ENGINE | 0.662 · 0.3 @ basic/mistake | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 152/608 · 0 | 0% | 240 | identical |
| A7-01-ENGINE | 0.854 · 0.6 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 0/267 · 10 | 100% | 240 | identical |
| A7-02-ENGINE | 0.958 · 0.9 @ basic/tf | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 0/0 · 0 | 0% | 240 | identical |
| A7-03-ENGINE | 0.746 · 0.4 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 2ch:16 4ch:44 | 0/0 · 0 | 0% | 240 | identical |
| U7-01-ENGINE | 0.442 · 0.2 @ standard/mistake | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 294/784 · 0 | 84% | 91 | 2 differ (standard/tf, challenge/tf) |
| U7-02-ENGINE | 0.463 · 0.2 @ standard/mistake | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 522/1647 · 0 | 85% | 106 | 2 differ (standard/tf, challenge/tf) |
| G8-01-ENGINE | 0.721 · 0.4 @ challenge/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 0/240 · 0 | 0% | 240 | identical |
| G8-04-ENGINE | 0.971 · 0.85 @ basic/mistake | 0/0/0 | 1:60 · multi 1:60 | 3ch:7 4ch:53 | 0/960 · 0 | 0% | 240 | identical |
| N8-01-ENGINE | 0.65 · 0.4 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 960/1200 · 454 | 0% | 240 | identical |
| N8-02-ENGINE | 0.567 · 0.35 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 0/1200 · 0 | 0% | 240 | 1 differ (challenge/tf) |
| N8-03-ENGINE | 0.533 · 0.2 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 0/720 · 0 | 0% | 240 | identical |
| N8-04-ENGINE | 0.679 · 0.35 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 0/480 · 0 | 0% | 240 | identical |
| N8-05-ENGINE | 0.567 · 0.35 @ basic/mistake | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 0/1064 · 0 | 0% | 240 | identical |
| A8-02-ENGINE | 0.688 · 0.4 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 3ch:16 4ch:44 | 2675/4115 · 0 | 0% | 240 | identical |
| A8-03-ENGINE | 0.704 · 0.2 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 2ch:8 4ch:52 | 0/0 · 0 | 0% | 240 | identical |
| U8-01-ENGINE | 0.554 · 0.25 @ basic/mistake | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 444/1504 · 0 | 79% | 87 | 2 differ (basic/tf, challenge/tf) |
| U8-02-ENGINE | 0.496 · 0.1 @ basic/open | 1/0/0 | 1:60 · multi 1:60 | 2ch:2 3ch:2 4ch:56 | 1120/2765 · 61 | 82% | 102 | 3 differ (basic/tf, standard/tf, challenge/tf) |
| N7-01-ENGINE | 0.979 · 0.85 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 · **dup 3** | 1284/4404 · 0 | 0% | 0 | identical |
| U7-03-ENGINE | 0.483 · 0.2 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 1124/2568 · 0 | 62% | 0 | 2 differ (standard/tf, challenge/tf) |
| A8-01-ENGINE | 0.417 · 0.15 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 1122/2590 · 0 | 0% | 0 | identical |
| U7-04-ENGINE | 0.613 · 0.3 @ challenge/mistake | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 · **dup 2** | 1304/4172 · 128 | 60% | 0 | 2 differ (basic/tf, standard/tf) |
| G8-02-ENGINE | 0.633 · 0.3 @ challenge/mistake | 0/0/0 | 1:60 · multi 1:60 | 3ch:13 4ch:47 | 0/822 · 0 | 0% | 0 | identical |
| G8-03-ENGINE | 0.571 · 0.35 @ basic/mistake | 0/0/0 | 1:60 · multi 1:60 | 3ch:9 4ch:51 | 480/720 · 0 | 0% | 0 | identical |
| A7-04-ENGINE | 0.908 · 0.7 @ challenge/mistake | 0/0/0 | 1:60 · multi 2:60 | 4ch:60 | 0/720 · 240 | 0% | 0 | identical |
| A7-05-ENGINE | 0.363 · 0.1 @ basic/open | 4/0/0 | 1:60 · multi 1:60 | 4ch:60 | 1440/3120 · 190 | 0% | 0 | identical |
| U7-05-ENGINE | 0.567 · 0.3 @ challenge/open | 0/0/0 | 1:60 · multi 1:60 | 3ch:5 4ch:55 | 880/2116 · 297 | 100% | 0 | 2 differ (standard/tf, challenge/tf) |
| U7-06-ENGINE | 0.488 · 0.2 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 1274/2572 · 0 | 100% | 0 | identical |
| U7-07-ENGINE | 0.679 · 0.45 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 0/0 · 0 | 100% | 0 | identical |
| U7-08-ENGINE | 0.667 · 0.3 @ challenge/mistake | 0/0/0 | 1:60 · multi 1:60 | 3ch:3 4ch:57 | 234/1465 · 0 | 100% | 0 | 3 differ (basic/tf, standard/tf, challenge/tf) |
| G8-06-ENGINE | 0.525 · 0.2 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 0/240 · 0 | 100% | 0 | identical |
| G8-08-ENGINE | 0.612 · 0.3 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 0/424 · 0 | 100% | 0 | identical |
| N7-08-ENGINE | 0.912 · 0.75 @ basic/mistake | 0/0/0 | 1:60 · multi 1:60 | 3ch:14 4ch:46 | 0/2064 · 0 | 100% | 0 | identical |
| N7-09-ENGINE | 0.892 · 0.8 @ basic/mistake | 0/0/0 | 1:60 · multi 1:60 | 3ch:60 | 0/2160 · 0 | 100% | 0 | identical |
| G8-05-ENGINE | 0.621 · 0.3 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 3ch:5 4ch:55 | 0/480 · 0 | 100% | 0 | identical |
| G8-07-ENGINE | 0.371 · 0.05 @ basic/open | 12/4/0 | 1:60 · multi 1:60 | 4ch:60 | 0/480 · 0 | 100% | 0 | identical |
| G8-09-ENGINE | 0.892 · 0.7 @ challenge/mistake | 0/0/0 | 1:60 · multi 1:60 | 3ch:11 4ch:49 | 480/1200 · 0 | 100% | 0 | identical |
| G7-06-ENGINE | 0.929 · 0.75 @ basic/mistake | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 480/960 · 0 | 100% | 0 | identical |
| G7-05-ENGINE | 0.396 · 0.15 @ standard/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 480/720 · 0 | 100% | 0 | identical |
| N7-10-ENGINE | 0.992 · 0.95 @ basic/mistake | 0/0/0 | 1:60 · multi 1:60 | 3ch:3 4ch:57 | 0/2160 · 0 | 100% | 0 | identical |
| N7-11-ENGINE | 0.992 · 0.95 @ standard/open | 0/0/0 | 1:60 · multi 1:60 | 2ch:2 3ch:17 4ch:41 | 0/2160 · 0 | 100% | 0 | identical |
| N7-12-ENGINE | 0.983 · 0.9 @ standard/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 0/0 · 0 | 100% | 0 | identical |
| N7-13-ENGINE | 0.592 · 0.2 @ basic/open | 0/0/0 | 1:60 · multi 1:60 | 4ch:60 | 0/0 · 0 | 100% | 0 | identical |

---

## 5. Overrides and monkey-patches

| member | chain in generator/index.html load order (file:line [mode]) | effect |
|---|---|---|
| `E.rightTriangleSvg` | diagrams.js:3 [define] → diagram-premium-overrides.js:319 [replace] → diagram-ultra-autopilot.js:139 [replace] | earlier definitions never execute |
| `E.rectangleSvg` | diagrams.js:150 [define] → diagram-premium-overrides.js:404 [replace] → diagram-ultra-autopilot.js:160 [replace] | earlier definitions never execute |
| `E.triangleAnglesSvg` | diagrams.js:302 [define] → diagram-premium-overrides.js:172 [replace] → diagram-ultra-autopilot.js:94 [replace] | earlier definitions never execute |
| `E.circleSvg` | diagrams.js:360 [define] → diagram-premium-overrides.js:437 [replace] → diagram-ultra-autopilot.js:167 [replace] | earlier definitions never execute |
| `E.isEngineTopic` | pattern-engine.js:84 [define] → source-fit-extensions.js:211 [wrap(oldIsEngineTopic@210)] → source-fit-graphs.js:245 [wrap(oldIs@245)] → source-fit-geometry.js:97 [wrap(oldIs@97)] → source-fit-algebra-g7.js:190 [wrap(oldIs@190)] → source-fit-dedicated.js:379 [wrap(oldIs@379)] → source-fit-dedicated-2.js:401 [wrap(oldIs@401)] | each wrapper tries its own ids first, then delegates |
| `E.getEngineExercise` | pattern-engine.js:86 [define] → source-fit-extensions.js:214 [wrap(oldGetEngineExercise@213)] → source-fit-graphs.js:246 [wrap(oldGet@246)] → source-fit-geometry.js:98 [wrap(oldGet@98)] → source-fit-algebra-g7.js:191 [wrap(oldGet@191)] → source-fit-dedicated.js:380 [wrap(oldGet@380)] → source-fit-dedicated-2.js:402 [wrap(oldGet@402)] → source-fit-uncertainty-deep.js:703 [wrap(oldGet@702)] → pedagogy-attach.js:79 [wrap(inner@78)] | each wrapper tries its own ids first, then delegates |

**Other patches and re-registrations**
- `window.onDomain` and `window.onGrade` are declared at `core.js:9-10` and wrapped at `pattern-engine.js:351-354`, adding `E.updatePanel`. Six source-fit files also call `onDomain()` again on `DOMContentLoaded` (`source-fit-extensions.js:233`, `-graphs.js:251`, `-geometry.js:103`, `-algebra-g7.js:196`, `-dedicated.js:384`, `-dedicated-2.js:406`).
- `E[fnName] = …` (`source-fit-uncertainty-deep.js:714`) wraps `generateU701Engine`, `U702`, `U801` and `U802` (`:722-725`).
- `generators[id]` is re-assigned for 9 uncertainty ids at `source-fit-uncertainty-deep.js:730`. It replaces the earlier generators from `pattern-engine.js` (U7-01, U7-02, U8-01, U8-02), `source-fit-extensions.js:226` (U7-03), `source-fit-graphs.js:249` (U7-04) and `source-fit-dedicated.js:382` (U7-05, U7-06, U7-08).
- `TOPICS` (a `const` in `core.js:1`) is mutated by 24 files. `generators` (`core.js:2`) is written by 28 files. Registration order decides behaviour: `phase2-loader.js` loads the legacy files after the engines.
- `E.defineSource` "last write wins" (`source-schema.js:43-47`) is used by `source-fit-dedicated.js:359` and `source-fit-dedicated-2.js:396` to overwrite 17 rows of `source-registry.js` (5 values change; see §1.6).
- CSS cascade overrides:
  - `credit-fix.css` overrides the `.hdr` / `.credit` rules in `style.css`.
  - `engine/engine.css` is appended at runtime (`pattern-engine.js:14-19`), so it wins over the duplicate inline `<style>` at `index.html:14-17`.
  - `style.css:489-496` overrides both to hide `mcq-correct` inside `.exset` only.

---

## 6. Non-engine modules: callers, I/O, verification, decision

### 6.1 `generator/*.js` (app shell)

| module | loaded by | inputs → outputs | covering verifiers | decision | evidence |
|---|---|---|---|---|---|
| `core.js` (22 lines) | index.html:30, gallery.html:47, visual-qa.html:41 | `#sg/#sd/#st/#sl/#sn/#sv/#selQType` + `TOPICS`/`generators` → dropdown, single legacy card (`renderCard`), B/W recolour | runtime, topic-dropdown, task-ui, brand (static) | **Redesign** (UI controller + topic catalogue) | Every seed row in `TOPICS` (`:1`) is hidden by `:14`. `generate()` (`:16`) forks count=1 and set paths, which use different renderers and different difficulty sources. `renderCard` doubles as a capture hook through `window.__captureCard` (`:22`, `exercise-set.js:32-34`). `onDomain`/`onGrade` are patched elsewhere |
| `exercise-set.js` (227) | index.html:82 only | DOM options → numbered worksheet + answer key in `#out`; `window.__exsetCtx` | runtime (VM), worksheet-polish, print-layout, premium-ui (static) | **Redesign** (document model; currently being rewritten in the working tree) | The answer key is regex-parsed from student HTML (`:163-165`). Dedup by HTML string with ≤ 8 tries (`:61-72`) produced 878 duplicate cards. `sharpenMathRects` (`:139-143`) strips the `rx` that the diagram helpers add (`diagram-ultra-autopilot.js:164`) |
| `export.js` (110) | index:31, gallery:48, visual-qa:42 | card element → PNG blob → clipboard/download | copy-export, premium-ui | **Retain**, as the single export path | Duplicated by `mobile-share.js:6-8` and `teacher-mode.js:218-235` |
| `mobile-share.js` (11) | index:83 | first `.ex-card`/`.qcard` → PNG | premium-ui (static text) | **Remove** (fold into `export.js`) | Exports only the first card (`:4`). Its own scale and filename (`:6-7`) diverge from `export.js:31,61` |
| `phase2-loader.js` (1) | index:84 | injects 16 legacy scripts asynchronously, then calls `onGrade()` | links, baseline, phase2-static | **Remove** after the 11 live legacy topics are migrated | 15 of the 20 legacy files carry no reachable generator (§7) |
| `book.js` + `book.html` + `book.css` | book.html:11,95; linked from index.html:23 | static `books[]` → reader for `assets/sources/*.pdf` | digital-book, baseline, inventory | **Retain** | The PDFs exist only after `deploy-pages.yml:25-31` copies them in. Column `b[6]` is unused (`book.js:16-19` comment) |
| `teacher-mode.js` (~250) | gallery:98, visual-qa:92; `engine-load` opt-in | `__exsetCtx` + meta → teacher cards and controls | teacher-advanced-mode, teacher-controls, teacher-gallery (orphans); copy-export, task-ui | **Remove the DOM layer**; keep the pure builders in internal QA | Neither page that loads `teacher-mode.js` loads `exercise-set.js` as well, and nothing calls `Teacher.toggle`. Only `buildTeacherCardHTML` is used (`gallery.html:140`) |
| legacy per-topic files (20) | see §7 | `renderCard()` | see §7 | **Remove 15; migrate the 11 live topics from 5 files, then remove** | §7 |

### 6.2 Engine infrastructure (`generator/engine/`)

| module | loaded by | inputs → outputs | covering verifiers | decision | evidence |
|---|---|---|---|---|---|
| `diagrams.js` (479) | all 3 pages, harness, runtime verifier | params → SVG/HTML: 15 `E.*Svg` + `freqTableHtml` | graphics-quality, visual-deep, math-bidi, premium-geometry | **Consolidate** into one diagram module | Its definitions at `:3`, `:150`, `:302` and `:360` are overridden twice |
| `diagram-premium-overrides.js` (472) | all 3 pages, harness | none (every export is replaced) | premium-ultra-geometry-main (text) | **Remove** | Replaced by `diagram-ultra-autopilot.js:94,139,160,167`. Unused locals at `:14`, `:64`, `:68` |
| `diagram-ultra-autopilot.js` (175) | all 3 pages, harness | params → SVG (scores 120 candidate layouts, picks by value hash) | premium-ultra-geometry-main | **Retain**; merge into the diagram module | Defines its own palette `U` (`:4-11`), bypassing `themes.js` |
| `pattern-engine.js` (360) | all 3 pages, runtime verifier; **not the harness** | base dispatcher, `renderEngineCard`, panel, `TOPICS` + `generators` registration | runtime, source-lock (text) | **Redesign** into a registry-driven dispatcher | 25 copy-paste generator closures (`:193-349`); 25 `if`/`push` blocks (`:117-191`); the closure-vs-copy bug (`:83` vs `:114`); dead `ensureN804Loaded` (`:21-32`, because `pilot-n8-04.js` is loaded statically at index:51); CSS injection (`:14-19`) |
| `pedagogy-attach.js` (87) | pages, harness | wraps the dispatcher → `meta` | family-provenance, coverage | **Consolidate** into the dispatcher | Silently defaults the family (`:47-62`). Production reads only `meta.difficulty(Label)` (`exercise-set.js:149`) |
| `follow-up.js` (109) | pages, harness | engine id + meta + mode → follow-up exercise | followups | **Retain** as an internal library; drop it from index.html | No production caller (only `teacher-mode`, `gallery`, `visual-qa`) |
| `question-types.js` (55) | all | `{question, answer, svg, choices}` → HTML | math-bidi, … | **Redesign**: data model plus separate student and key renderers | `:49` marks the answer inside the student HTML. `:30-44` does BiDi through regex rewriting. Of `E.fmt` (`:7-19`), production uses only `inline`; `deg`/`angle`/`signed`/`point` are referenced only by `verify-math-bidi-quality.mjs:25-26` |
| `random.js` (21) | all | `Math.random` → `pick` / `pickN` / `shuffle` | indirectly all | **Redesign** as an injectable seeded RNG | No seed. `pickN` is unused. Six files re-implement fallbacks (`E.pick ? … : Math.random`) |
| `validators.js` (6) | all | `isTriple`, `uniqueValues` | none | **Redesign** into per-family validators | `uniqueValues` is unused; `isTriple` has a single caller |
| `schema.js` (4) | all | `E.schemaVersion` | source-lock / source-bible (load only) | **Remove** | The value is never read |
| `source-schema.js` (57) | all | `defineSource` / `getSource` / `validateSource` | source-lock | **Retain** | `validateSource` is used only by tools |
| `source-registry.js` (96) | all | 50 rows → `E.SOURCE_REGISTRY` | source-lock, inventory | **Retain** as the single source; delete the re-registration | Overwritten at `source-fit-dedicated.js:358-360` and `-2.js:395-397` |
| `pedagogy-registry.js` (835 lines, 94 KB) | all | families, pedagogy, visual expectation | source-bible, family-provenance, coverage | **Refactor** into a data file + schema | Production uses only the difficulty label. `getFamilies` is unused at runtime |
| `themes.js` (14) | all | `E.themes` | none | **Consolidate** into the diagram module | `themes.print` is never read; the premium and ultra palettes ignore the tokens |

### 6.3 Pages

| page | role | callers / links | decision | evidence |
|---|---|---|---|---|
| `index.html` (repo root) | meta-refresh to `generator/index.html` | none; **not deployed** | **Remove** (or keep as a repo convenience) | The Pages artifact is `generator/` only (`deploy-pages.yml:35`) |
| `generator/index.html` | production generator | site root | **Refactor**: build the script list from one manifest and drop the inline CSS | 55 hand-versioned script tags. The inline `<style>` (`:14-17`) duplicates `engine.css`. Two difficulty selects: `#sl` (`:26`) and `#selDiff` (`:27`) |
| `generator/book.html` | PDF reader | index.html:23 | **Retain** | — |
| `generator/gallery.html`, `generator/visual-qa.html` | internal QA | not linked from index; visual-qa links gallery (`visual-qa.html:22`) | **Consolidate** into one QA page that loads the production manifest | Both omit `source-fit-uncertainty-deep.js` and use stale `?v=20260617c` |

---

## 7. Legacy per-topic files: reachability

| legacy file | bytes | registrations: live (visible in #st) / dead (hidden by core.js:14 because `X-ENGINE` exists) | verifiers that read it | verdict |
|---|---|---|---|---|
| a7-01.js (index.html (via phase2-loader.js)) | 797 | live: — / dead: A7-01 | verify-phase2-static | **all generators unreachable → remove** (first migrate the verifiers that pin its text) |
| a7-02.js (index.html (via phase2-loader.js)) | 2687 | live: — / dead: A7-02, A7-04, A7-05 | verify-chatgpt-source-fit-sync, verify-phase2-static | **all generators unreachable → remove** (first migrate the verifiers that pin its text) |
| a8-02.js (index.html (via phase2-loader.js)) | 4643 | live: A8-07, A8-08 / dead: A8-02 | verify-algebra-g8-source-fit, verify-phase2-static | partially live → migrate live topics, then remove |
| a8-03.js (index.html (via phase2-loader.js)) | 7600 | live: A8-04, A8-05, A8-06 / dead: A8-03 | verify-algebra-g8-source-fit, verify-phase2-static, verify-source-bible | partially live → migrate live topics, then remove |
| algebra.js (index.html, gallery.html, visual-qa.html) | 1129 | live: — / dead: A7-03 | — | **all generators unreachable → remove** |
| g7-01.js (index.html (via phase2-loader.js)) | 4439 | live: G7-07, G7-08 / dead: G7-01 | verify-geometry-g7-source-fit, verify-phase2-static | partially live → migrate live topics, then remove |
| g7-02.js (index.html (via phase2-loader.js)) | 8818 | live: G7-09, G7-10 / dead: G7-02, G7-05, G7-06 | verify-chatgpt-source-fit-sync, verify-geometry-g7-source-fit, verify-phase2-static | partially live → migrate live topics, then remove |
| g8-01.js (index.html (via phase2-loader.js)) | 4112 | live: — / dead: G8-01, G8-05, G8-06 | verify-chatgpt-source-fit-sync, verify-geometry-g8-source-fit, verify-phase2-static | **all generators unreachable → remove** (first migrate the verifiers that pin its text) |
| g8-04.js (index.html (via phase2-loader.js)) | 9732 | live: G8-10, G8-11 / dead: G8-04, G8-07, G8-08, G8-09 | verify-chatgpt-source-fit-sync, verify-geometry-g8-source-fit, verify-phase2-static | partially live → migrate live topics, then remove |
| geo.js (index.html, gallery.html, visual-qa.html) | 2495 | live: — / dead: G7-03, G7-04 | verify-geometry-terminology | **all generators unreachable → remove** (first migrate the verifiers that pin its text) |
| n7-03.js (index.html (via phase2-loader.js)) | 3271 | live: — / dead: N7-03, N7-08, N7-09 | verify-chatgpt-source-fit-sync, verify-numeric-g7-source-fit, verify-phase2-static | **all generators unreachable → remove** (first migrate the verifiers that pin its text) |
| n7-04.js (index.html (via phase2-loader.js)) | 3001 | live: — / dead: N7-04, N7-10, N7-11 | verify-chatgpt-source-fit-sync, verify-numeric-g7-source-fit, verify-phase2-static | **all generators unreachable → remove** (first migrate the verifiers that pin its text) |
| n7-05.js (index.html (via phase2-loader.js)) | 2964 | live: — / dead: N7-05, N7-12, N7-13 | verify-chatgpt-source-fit-sync, verify-numeric-g7-source-fit, verify-phase2-static | **all generators unreachable → remove** (first migrate the verifiers that pin its text) |
| n8-03.js (index.html (via phase2-loader.js)) | 1197 | live: — / dead: N8-03 | verify-phase2-static | **all generators unreachable → remove** (first migrate the verifiers that pin its text) |
| n8-ratio.js (index.html (via phase2-loader.js)) | 1136 | live: — / dead: N8-01 | verify-phase2-static | **all generators unreachable → remove** (first migrate the verifiers that pin its text) |
| numeric.js (index.html, gallery.html, visual-qa.html) | 5127 | live: — / dead: N7-06, N7-07, N8-04, N8-05, N8-02 | verify-index-script-links, verify-real-generator-runtime | **all generators unreachable → remove** (first migrate the verifiers that pin its text) |
| stats.js (index.html, gallery.html, visual-qa.html) | 795 | live: — / dead: U8-01 | — | **all generators unreachable → remove** |
| u7-01.js (index.html (via phase2-loader.js)) | 582 | live: — / dead: U7-01 | verify-phase2-static | **all generators unreachable → remove** (first migrate the verifiers that pin its text) |
| u7-02.js (index.html (via phase2-loader.js)) | 5893 | live: — / dead: U7-02, U7-05, U7-06, U7-07, U7-08 | verify-chatgpt-source-fit-sync, verify-phase2-static | **all generators unreachable → remove** (first migrate the verifiers that pin its text) |
| u8-02.js (index.html (via phase2-loader.js)) | 785 | live: — / dead: U8-02 | verify-phase2-static | **all generators unreachable → remove** (first migrate the verifiers that pin its text) |

Live legacy topics have no difficulty, only the open question type, and 1–4 fixed cases each. Per RULES.md they are intentional source-fit topics (e.g. A8-04 and A8-05 are "legacy, not engines"), so the decision for them is **migrate** into the engine/family runtime, not delete.

---

## 8. CSS

| css file | loaded by | bytes | rules | classes | unused classes |
|---|---|---|---|---|---|
| book.css | book.html:11 | 5947 | 83 | 38 | — |
| credit-fix.css | index.html:12 | 688 | 7 | 3 | — |
| engine.css | injected at runtime by engine/pattern-engine.js:14-19 (?v=20260616a) | 2305 | 22 | 16 | fail, pass |
| mobile-polish.css | index.html:13 | 2443 | 24 | 31 | action-btn, container |
| style.css | index.html:11, gallery.html:9, visual-qa.html:9 | 20750 | 170 | 88 | btn-teacher, gallery-link, katex, katex-display, notice, teacher-hint, teacher-toggle-row |

13 classes are styled in 2–3 places:
- index.html's inline `<style>` and `engine.css` both style `engine-panel`, `mcq-choice`, `mcq-correct`, `mcq-label`, `tf-statement`, `tf-label`, `tf-verdict`, `mistake-prompt` and `mistake-box`.
- `style.css`, `credit-fix.css` and `mobile-polish.css` all style `hdr`, `sub` and `credit`.

`engine.css` itself claims to be "Loaded by index.html after style.css", but no HTML file loads it; `pattern-engine.js` injects it at runtime. The `katex` / `katex-display` hits in the unused-class list are false positives, because KaTeX generates those classes at runtime.

**Decision:** consolidate `credit-fix.css`, `mobile-polish.css`, `engine.css` and the inline `<style>` into `style.css`. Retain `book.css`.

---

## 9. `tools/*` (local run on 2026-11-12)

| tool | npm script | gate membership | loader | last local run | notes |
|---|---|---|---|---|---|
| engine-load.mjs | - | library (imported by 19 tools) | own VM | not run | shared loader; omits pattern-engine.js/core.js/exercise-set.js/legacy files (engine-load.mjs:32-48) |
| gen-source-bible.mjs | - | manual report generator | own VM | not run | writes docs/SOURCE_BIBLE.md (manual) |
| gen-teacher-gallery.mjs | - | manual report generator | engine-load.mjs | not run | writes docs/verification/teacher-generator-gallery.html (manual) |
| gen-visual-coverage-report.mjs | - | manual report generator | static text/regex | not run | writes docs/reports/VISUAL_COVERAGE_REPORT_20260614.md (manual) |
| harness-engines.mjs | - | **none (orphan)** | own VM | pass | loads diagrams.js without overrides; stubs question-types |
| release-audit.mjs | - | **none (orphan)** | static text/regex | **FAIL** | stale: expects old credit text and REAL_PROGRESS_PERCENT |
| verify-algebra-g8-source-fit.mjs | verify:algebra8 | all,deep,workbench | static text/regex | pass |  |
| verify-all-engines-stress.mjs | verify:stress | deep | engine-load.mjs | pass |  |
| verify-all-termux.sh | - | **none (orphan)** | static text/regex | not run | manual Termux runner of 9 verifiers |
| verify-baseline-protection.mjs | verify:baseline | all,deep,workbench | static text/regex | pass |  |
| verify-branding.mjs | verify:brand | all,deep,workbench | static text/regex | pass |  |
| verify-chatgpt-source-fit-sync.mjs | verify:source-fit | all,deep,workbench | static text/regex | pass |  |
| verify-coordinate-grid-source-fit.mjs | verify:coordinate-grid | all,deep,workbench | engine-load.mjs | pass |  |
| verify-copy-export.mjs | verify:copy-export | deep,workbench | engine-load.mjs | pass | skips engines whose getEngineExercise returns null (:54-55) → 22 pilots skipped silently |
| verify-digital-book.mjs | verify:book | all,deep,workbench | static text/regex | pass |  |
| verify-follow-up-generation.mjs | verify:followups | deep | engine-load.mjs | pass |  |
| verify-geometry-diagram-quality.mjs | - | **none (orphan)** | own VM | pass | loads diagrams.js without overrides (dead variants) |
| verify-geometry-g7-source-fit.mjs | verify:geometry7 | all,deep,workbench | static text/regex | pass |  |
| verify-geometry-g8-source-fit.mjs | verify:geometry8 | all,deep,workbench | static text/regex | pass |  |
| verify-geometry-terminology.mjs | verify:geometry-language | all,deep,workbench | own VM | pass | loads legacy geo.js + diagrams.js without the premium/ultra overrides |
| verify-graphics-quality.mjs | verify:graphics-quality | deep,workbench | engine-load.mjs | pass |  |
| verify-index-script-links.mjs | verify:links | all,deep,workbench | static text/regex | pass |  |
| verify-math-bidi-quality.mjs | verify:math-bidi | all,deep,workbench | engine-load.mjs | pass |  |
| verify-multi-correct-coverage.mjs | verify:multi-correct | deep,workbench | engine-load.mjs | pass |  |
| verify-numeric-g7-source-fit.mjs | verify:numeric7 | all,deep,workbench | static text/regex | pass |  |
| verify-phase2-static.mjs | - | **none (orphan)** | static text/regex | **FAIL** | stale: false positive on value="9" (#sn count option) |
| verify-phase3a-static.mjs | - | **none (orphan)** | static text/regex | **FAIL** | stale: expects script tags without ?v= query |
| verify-premium-exercise-ui.mjs | verify:premium-ui | deep,workbench | static text/regex | pass |  |
| verify-premium-ultra-geometry-main.mjs | verify:premium-geometry | all,deep,workbench | engine-load.mjs | pass |  |
| verify-print-layout.mjs | verify:print-layout | deep | static text/regex | pass |  |
| verify-question-coverage-deep.mjs | verify:coverage | deep | engine-load.mjs | pass |  |
| verify-question-family-provenance.mjs | verify:family | deep | engine-load.mjs | pass |  |
| verify-readonly-verifiers.mjs | verify:readonly | all,deep,workbench | static text/regex | pass |  |
| verify-real-generator-runtime.mjs | verify:runtime | all,deep,workbench | own VM | pass | own load list (:95-98): no source-fit, no pedagogy-attach, no diagram overrides |
| verify-release-readiness-docs.mjs | verify:release-docs | deep | static text/regex | pass |  |
| verify-repo-hygiene.mjs | verify:hygiene | all,deep,workbench | static text/regex | pass |  |
| verify-repo-sync.mjs | verify:sync | workbench | static text/regex | **FAIL** | fails off main / dirty tree (environmental) |
| verify-source-bible.mjs | verify:source-bible | all,deep,workbench | own VM | pass |  |
| verify-source-fit-inventory.mjs | verify:inventory | all,deep,workbench | static text/regex | pass |  |
| verify-source-lock.mjs | verify:source-lock | all,deep,workbench | own VM | pass |  |
| verify-task-generation-only-ui.mjs | verify:task-ui | all,deep,workbench | static text/regex | pass |  |
| verify-teacher-advanced-mode.mjs | - | **none (orphan)** | engine-load.mjs | pass | tests teacher-mode DOM layer that no page activates |
| verify-teacher-controls.mjs | - | **none (orphan)** | engine-load.mjs | pass | tests teacher-mode DOM layer that no page activates |
| verify-teacher-gallery.mjs | - | **none (orphan)** | engine-load.mjs | pass |  |
| verify-topic-dropdown-clean.mjs | verify:topic-dropdown | all,deep,workbench | own VM | pass |  |
| verify-topic-question-variety.mjs | verify:variety | deep | engine-load.mjs | pass |  |
| verify-uncertainty-source-deep.mjs | verify:uncertainty-source-deep | all,deep,workbench | engine-load.mjs | pass |  |
| verify-variety.mjs | - | **none (orphan)** | own VM | pass | loads diagrams.js without overrides (dead variants) |
| verify-visual-coverage.mjs | verify:visual-coverage | deep | engine-load.mjs | pass |  |
| verify-visual-qa-dashboard.mjs | - | **none (orphan)** | engine-load.mjs | pass |  |
| verify-visual-quality-deep.mjs | verify:visual | deep | engine-load.mjs | pass |  |
| verify-worksheet-polish.mjs | verify:worksheet-polish | deep,workbench | static text/regex | pass |  |
| verify-worksheet-print-quality.mjs | - | **none (orphan)** | static text/regex | **FAIL** | stale: expects removed per-type answer blanks |

Package gates:
- `verify:deep` runs 36 tools.
- 11 tools are in no gate. Four of those fail on stale assumptions: `release-audit`, `phase2-static`, `phase3a-static` and `worksheet-print-quality`.
- `verify:sync` fails off `main` and on a dirty tree; that failure is environmental.
- `tools/README.md` says not to delete the non-gate verifiers, so retiring them needs the owner's approval.

---

## 10. GitHub workflows

| workflow | trigger | what it runs | referenced script exists? | recorded runs (`gh run list`) | decision |
|---|---|---|---|---|---|
| deploy-pages.yml | push main, dispatch | copies the 10 PDFs into `generator/assets/sources`, uploads `generator/` | n/a | 30/30 success | **Retain** |
| verify.yml | PR → main; push main and `feat/source-bible-variety-dedicated-engines` (stale) | `npm install`, `npm run verify:deep` | yes | 48 success, 2 cancelled | **Retain**: drop the stale branch; repoint the harness at the production stack |
| pages-healthcheck.yml | push main (`generator/**`) | curl `site-health.json`, grep `"activeSlices": 25`; grep the app shell | `site-health.json` is a hand-edited constant | 22/22 success | **Replace** with a real smoke test, or remove |
| verify-generator-live.yml | push main (index, geo, core, `engine/**`) | Playwright on the live site; selects legacy `G7-03` (`:96`) | inline | 18/18 **failure** | **Remove** (replace with one smoke on `-ENGINE` ids) |
| verify-generator-live-report.yml | same | same plus a report artifact (`:129` `G7-03`) | inline | 18/18 **failure** | **Remove** |
| verify-generator-slices.yml | push main (index.html) | bare ids G7-03, G7-04, N7-06, A7-03 (`:36-39`) | inline | 8/8 **failure** | **Remove** |
| verify-n8-02.yml / verify-n8-04.yml / verify-n8-05.yml / verify-u8-01.yml | push main | one bare id each (`:37`) | inline | 23/23, 8/8, 22/22, 8/8 **failure** | **Remove** |
| verify-phase2-batch.yml | push main (`generator/**`) | 25 bare ids (`:54-62`) after a `site-health` wait | inline | 22/22 **failure** | **Remove** |
| verify-phase3a.yml | push main (`generator/**`) | `npm install puppeteer`; bare ids (`:156`) | inline | 22/22 **failure** | **Remove** |
| verify-phase2-static.yml | push main | `node tools/verify-phase2-static.mjs` | yes (stale) | 24/24 **failure** | **Remove** (or fix it and fold it into `verify:deep`) |
| verify-phase3a-static.yml | push main | `node tools/verify-phase3a-static.mjs` | yes (stale) | 25/25 **failure** | **Remove** |
| gemini-agent.yml | issues, issue comments containing `/fix`, dispatch | Python + `git-auto-commit-action` | **no** (`scripts/validate_app_canonical_coverage.py` is missing) | 0 runs listed | **Remove** (unrelated; write-capable on a comment trigger) |

---

## 11. Dead code, duplicated helpers, global names

**`E` members**
- Never read anywhere: `getFamilies` (`pedagogy-registry.js:63`), `pickN` (`random.js:5`), `schemaVersion` (`schema.js:5`), `uniqueValues` (`validators.js:4`), `themes.print` (`themes.js:11`).
- Read only by tools: `validateSource`, `generateUncertaintySourceDeepExercise`, `UNCERTAINTY_SOURCE_DEEP_FAMILIES`, and `fmt.deg` / `fmt.angle` / `fmt.signed` / `fmt.point`.
- `fmt.block` and `fmt.eq` are never used at all.

**Unreferenced local functions:** `diagram-premium-overrides.js:14` `pick`, `:64` `plainText`, `:68` `segmentLabel`; `source-fit-uncertainty-deep.js:17` `pct`, `:181` `attachFamily`.

**Dead branches and data**
- `pattern-engine.js:21-32` (`ensureN804Loaded`).
- Every seed row in `core.js:1` (`TOPICS`).
- The 44 unreachable legacy generators and the helpers used only by them: `geo.js:1,4-5` `TRIPLES`, `triSvg`, `angleSvg`.
- Dead in the browser: the 4 overridden helpers in `diagrams.js` and all of `diagram-premium-overrides.js`.
- Dead at the UI level: `teacher-mode.js` beyond `buildTeacherCardHTML`, and `follow-up.js` on index.
- Unreferenced file: `generator/PHASE2_VERSION.txt` (no reference anywhere at d274b44, including docs). `generator/site-health.json` is read only by `pages-healthcheck.yml` and `verify-phase2-*`.

**Duplicated helpers** (same name declared in several files; "identical" = same normalised body):

| helper name | files | identical copies | sites (first 6) |
|---|---|---|---|
| `choices` | 27 | 2 | pilot-a7-01.js:163, pilot-a7-02.js:79, pilot-a7-03.js:78, pilot-a8-02.js:25, pilot-a8-03.js:51, pilot-g7-01.js:37, … |
| `question` | 24 | 0 | pilot-a7-01.js:200, pilot-a7-02.js:106, pilot-a7-03.js:106, pilot-a8-02.js:40, pilot-a8-03.js:65, pilot-g7-01.js:51, … |
| `answer` | 24 | 0 | pilot-a7-01.js:281, pilot-a7-02.js:152, pilot-a7-03.js:146, pilot-a8-02.js:62, pilot-a8-03.js:88, pilot-g7-01.js:83, … |
| `pickFamily` | 23 | 0 | pilot-a7-01.js:125, pilot-a7-02.js:56, pilot-a7-03.js:55, pilot-a8-02.js:15, pilot-a8-03.js:39, pilot-g7-01.js:17, … |
| `pickCase` | 18 | 0 | pilot-a7-01.js:132, pilot-a7-02.js:63, pilot-a7-03.js:60, pilot-a8-02.js:20, pilot-a8-03.js:44, pilot-g7-01.js:23, … |
| `pick` | 8 | 6 | diagram-premium-overrides.js:14, source-fit-algebra-g7.js:8, source-fit-dedicated-2.js:12, source-fit-dedicated.js:13, source-fit-extensions.js:10, source-fit-geometry.js:7, … |
| `rnd` | 8 | 8 | pilot-a7-02.js:10, pilot-g7-04.js:10, pilot-n7-03.js:9, pilot-n7-04.js:10, pilot-n7-05.js:10, source-fit-dedicated-2.js:14, … |
| `correctValue` | 7 | 0 | pilot-g7-01.js:29, pilot-g7-02.js:29, pilot-n8-01.js:37, pilot-n8-02.js:42, pilot-n8-03.js:37, pilot-n8-04.js:32, … |
| `X` | 6 | 0 | diagrams.js:412, diagrams.js:441, pilot-u8-01.js:162, source-fit-algebra-g7.js:27, source-fit-extensions.js:27, source-fit-graphs.js:22, … |
| `shuf` | 6 | 5 | source-fit-algebra-g7.js:9, source-fit-dedicated-2.js:13, source-fit-dedicated.js:14, source-fit-geometry.js:8, source-fit-graphs.js:8, source-fit-uncertainty-deep.js:14 |
| `render` | 5 | 2 | book.js:20, source-fit-dedicated-2.js:87, source-fit-dedicated.js:65, source-fit-uncertainty-deep.js:38, mobile-share.js:6 |
| `esc` | 5 | 2 | diagram-premium-overrides.js:22, diagram-ultra-autopilot.js:13, diagrams.js:72, pilot-u7-02.js:56, source-fit-uncertainty-deep.js:18 |
| `Y` | 5 | 0 | diagrams.js:442, source-fit-algebra-g7.js:27, source-fit-extensions.js:28, source-fit-graphs.js:23, source-fit-uncertainty-deep.js:77, source-fit-uncertainty-deep.js:110 |
| `asExercise` | 5 | 0 | source-fit-algebra-g7.js:185, source-fit-dedicated-2.js:398, source-fit-dedicated.js:375, source-fit-graphs.js:240, source-fit-uncertainty-deep.js:680 |
| `fmt` | 4 | 0 | diagram-premium-overrides.js:38, diagram-ultra-autopilot.js:28, pilot-n8-05.js:44, source-fit-graphs.js:25 |
| `topic` | 4 | 3 | pedagogy-registry.js:36, source-fit-algebra-g7.js:12, source-fit-geometry.js:18, source-fit-graphs.js:12 |
| `wrap` | 4 | 4 | pilot-a7-02.js:77, pilot-n7-04.js:63, pilot-n7-05.js:38, source-fit-dedicated-2.js:19 |
| `unit` | 3 | 0 | diagram-premium-overrides.js:36, diagram-ultra-autopilot.js:27, diagrams.js:330 |
| `tex` | 3 | 3 | pilot-a7-03.js:6, source-fit-algebra-g7.js:10, source-fit-graphs.js:9 |
| `tableHtml` | 3 | 2 | source-fit-algebra-g7.js:17, source-fit-graphs.js:63, source-fit-uncertainty-deep.js:19 |
| `qt` | 3 | 3 | source-fit-dedicated-2.js:15, source-fit-dedicated.js:16, source-fit-uncertainty-deep.js:15 |
| `ch` | 3 | 0 | source-fit-dedicated-2.js:16, source-fit-dedicated.js:17, source-fit-geometry.js:9 |
| `add` | 2 | 0 | diagram-premium-overrides.js:31, diagram-ultra-autopilot.js:22 |
| `sub` | 2 | 0 | diagram-premium-overrides.js:32, diagram-ultra-autopilot.js:23 |
| `mul` | 2 | 0 | diagram-premium-overrides.js:33, diagram-ultra-autopilot.js:24 |
| `mid` | 2 | 0 | diagram-premium-overrides.js:34, diagram-ultra-autopilot.js:25 |

**Other duplicated logic**
- `correctLabel` is extracted by the same regex in 6 places.
- Byte-identical copies:
  - the `topic` / `topicReg` registration helpers in 5 files
  - `tableHtml` in 2 files
  - the `generators[id]` closure in 2 files
  - `E.generateA702Engine` and `E.generateN705Engine` (identical bodies)
  - `esc` in the two diagram override files

**Global names**
- The index page's shared scope holds 39 top-level names:
  - from `core.js`: `TOPICS`, `generators`, `grade`, `domain`, `cleanTopicLabel`, `onGrade`, `onDomain`, `generate`, `visualMode`, `colorToGray`, `applyVisualMode`, `onVisualMode`, `setMainTitle`, `renderCard`
  - from `export.js`: 7 functions
  - from `geo.js`: `TRIPLES`, `triSvg`, `angleSvg`
  - from `exercise-set.js`: 15 functions
- It also holds the `window.*` objects `TargilimEngine`, `TargilimMobileShare`, `Teacher` (QA pages), `__captureCard` and `__exsetCtx`.
- No identifier is declared twice, and none shadows a `window` property, so there is no redeclaration error today. The collision risk is behavioural: `onDomain`/`onGrade` are reassigned, `TOPICS`/`generators` are shared mutable registries, and the per-page load order decides the result (§2).

---

## 12. Decision summary

**Redesign**
- `question-types.js`: introduce an exercise data model `{stem, choices, correct[], solution, visual}` with separate student and answer-key renderers.
- The dispatch layer: `pattern-engine.js`, the 7 source-fit wrappers and `pedagogy-attach.js` become one registry-driven dispatcher (id → engine module declaring its families, qtypes, levels and validators).
- The pilot skeleton duplicated across 25 files (`choices` / `question` / `answer` / `pickFamily` / `pickCase`) becomes shared family specs.
- `random.js` becomes a seeded, injected RNG; remove the module-level counters.
- `validators.js` becomes per-family validators: MCQ uniqueness and correct-count, question ↔ diagram ↔ answer consistency.
- The `core.js` + `exercise-set.js` UI/document flow becomes one path with one difficulty control and one renderer.
- The uncertainty overlay becomes explicit families selected deterministically instead of by p = .42/.62/.78.

**Refactor**
- `diagrams.js` + `diagram-ultra-autopilot.js` + `themes.js` → one diagram module.
- `generator/index.html` → manifest-driven script list, no inline CSS.
- `pedagogy-registry.js` → data + schema.
- `tools/engine-load.mjs` → load exactly the production manifest so verifiers exercise `E.getEngineExercise`.
- `verify-copy-export.mjs` → fail on null instead of skipping.

**Consolidate**
- CSS: `credit-fix.css`, `mobile-polish.css`, `engine.css` and the inline `<style>` → `style.css`.
- `gallery.html` + `visual-qa.html` → one QA page.
- Export paths → `export.js`.
- Duplicated helpers (`pick`, `shuf`, `rnd`, `tableHtml`, `qt`, `topicReg`, `asExercise`, `correctLabel`) → one util module.

**Remove** (subject to migrating the verifier assertions first, §1.9)
- `diagram-premium-overrides.js`, `schema.js`, `mobile-share.js`.
- The 15 legacy files with no reachable generator; then `phase2-loader.js` and the dead registrations in the 5 partially live files, after migrating the 11 live legacy topics.
- The `teacher-mode.js` DOM layer (or move it out of the shipped bundle), and `follow-up.js` from index.html.
- The dead `E` members and locals listed in §11, `ensureN804Loaded`, the root `index.html` and `generator/PHASE2_VERSION.txt`.
- The 11 always-failing workflows and `gemini-agent.yml`.
- Retire the stale orphan tools only with owner approval (`tools/README.md` asks not to delete them).

**Retain:** `source-schema.js`, `source-registry.js` (as the single source; drop the re-registrations), `book.html` / `book.js` / `book.css`, `export.js`, `deploy-pages.yml`, `verify.yml`, and the `verify:deep` tool set (retargeted to the production stack).
