> Prepared 2026-11-12 for the workbook implementation plan ([WORKBOOK_IMPLEMENTATION_PLAN_20261112.md](../planning/WORKBOOK_IMPLEMENTATION_PLAN_20261112.md)). Read-only research: findings marked UNVERIFIED were not confirmed. Line references point at commit `d274b44` unless stated.

# Static Hebrew RTL math-worksheet generator: techniques and libraries (verified 2026-11-12)

Constraints assumed: GitHub Pages, no server, no bundler, scripts from cdnjs/jsDelivr with exact pinned versions.

How the facts below were obtained:
- **Registry/activity data:** versions and publish dates from the npm registry; open issues+PRs and last push from the GitHub API; browser support from MDN browser-compat-data 8.1.8 (2026-11-02).
- **URL checks:** every CDN URL in this file was fetched on 2026-11-12 and returned HTTP 200 with `Access-Control-Allow-Origin: *`; sizes are raw / gzip -9; SRI hashes computed from the served bytes.
- **Local experiments (scratchpad, no project code touched):**
  - Node: jsPDF 4.2.1's bidi engine compared against bidi-js 1.1.0 (a UAX#9 implementation) on typical worksheet lines.
  - Headless Chrome (Windows) test page: Hebrew text + KaTeX 0.19.1 + MathJax 4.1.3 + inline SVG. Each A4 sheet was captured with snapDOM, modern-screenshot and html2canvas-pro, assembled with jsPDF, and also printed via Chrome print-to-PDF. PDFs were rendered back with pdf.js, captures were pixel-diffed against a native Chrome screenshot, and math order was checked from DOM geometry.
  - fast-check + node:test sanity run, KaTeX Hebrew-in-`\text{}` check, and font `cmap` coverage checks.
  - Everything was **Chromium-only**. Safari, iOS and Firefox were not tested.

---

## 0. Recommendations at a glance

| Area | Use | Avoid |
|---|---|---|
| 1. Replay | Hand-rolled **sfc32** seeded by **cyrb128** over `genVersion\|sheetSeed\|itemIndex\|template` (about 30 lines, no dependency). Use **splitmix32** if you only have one 32-bit seed. | mulberry32 for serious use; `Math.random`; seedrandom (last release 2019) |
| 2. Generation | **Constructive / back-solve** by default. **Enumerate-then-pick** for small finite domains. Rejection sampling only with a capped retry count and a deterministic fallback. Dedupe by canonical key. | Unbounded "retry until nice" loops |
| 3. Validation | **Fraction.js 5.3.4** exact rationals. Recompute each answer by an independent second path, plus seeded random-point identity tests. Add **mathjs 15.2.0** only if you must parse or simplify free-form expressions. | Algebrite (last release 2021); nerdamer 2.0 (one-month-old rewrite); Compute Engine (pre-1.0, multi-MB) |
| 4. Tests | **node:test** seed sweeps as the main generator test, plus `t.assert.snapshot` goldens. **fast-check 4.10.2** as an npm devDependency, for helpers. | Importing from a CDN in Node (not possible); vendoring fast-check |
| 5. Math | **KaTeX 0.19.1** + `.katex{direction:ltr;unicode-bidi:isolate}` | MathJax 4.1.3 in RTL pages without the isolate workaround (open bug #3589, fix targeted for 4.2) |
| 6. Pages/PDF | **One DOM model.** A JS paginator fills fixed 210×297 mm `.sheet` boxes, with `@page{size:A4;margin:0}`. Vector PDF comes from browser print. The "Download PDF" button runs **snapDOM 3.7.4** per sheet at 2× and adds each image with **jsPDF 4.2.1** `addImage`. | jsPDF/pdfmake text layout for Hebrew; html2pdf.js; Paged.js |
| 7. Diagrams | Hand-written SVG builder with `direction="ltr"` on `<svg>`. Place labels greedily from ranked candidate positions and give them a white `paint-order` halo. | Mafs (React + bundler); JSXGraph for static sheets (253 KB gz, built for interaction) |

### Pinned URLs (all verified 200 on 2026-11-12)

| Purpose | URL | Raw / gz | SRI |
|---|---|---|---|
| KaTeX JS | https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.19.1/katex.min.js | 266.7 / 74.3 KB | `sha384-a1WQdjRj162i159OYq041X6I4K8NenkrI09LlPmiHg0YOb7CR+wJOraXwK9abpnE` |
| KaTeX CSS (fonts load relative, woff2) | https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.19.1/katex.min.css | 24.2 / 3.4 KB | `sha384-WwGtaC6ywCHxA5cstpj/3+xIZvTez8dq2IcBQaXRkenHZ7FVVq1ZROtURwfbtTlG` |
| (alt) MathJax 4 SVG | https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-svg.js (same file at cdnjs `/ajax/libs/mathjax/4.1.3/tex-svg.js`) | 1806 / 599 KB | `sha384-my9P1jDckpHD+5LZsLQ0gaiCl/RMO32HaqwBtbo/25QIMVr6xXIUCg1jvdSRcvb4` |
| jsPDF | https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.2.1/jspdf.umd.min.js | 410 / 131 KB | `sha384-qovJwSBbRDPP5cEjCp8S0UP66wrvnjaa60XMOGzTNanrThcrGfXfnZkvgY8N1KT3` |
| snapDOM (IIFE, `window.snapdom`) | https://cdn.jsdelivr.net/npm/@zumer/snapdom@3.7.4/dist/snapdom.js | 296 / 101 KB | `sha384-+KaawgSiG3tZjPxoLk0gdiSkuZP58gpQ61H53DIDozcbE/YHvAlkkNMztocmmSnf` |
| (light alt) modern-screenshot (UMD `modernScreenshot`) | https://cdn.jsdelivr.net/npm/modern-screenshot@4.7.0/dist/index.js | 28.6 / 10.9 KB | `sha384-5Ua3TI0kiMYH8QdNy+vc5IWS3MTa2DzQEm/uKFDQ+/biJctek9hiSP6moIm2PVog` |
| (fallback) html2canvas-pro (`window.html2canvas`) | https://cdn.jsdelivr.net/npm/html2canvas-pro@2.6.4/dist/html2canvas-pro.min.js | 215 / 65 KB | `sha384-cdIgRLgsj7/96PN5gfNytJnHsoo2mpew4+UtLHdjtWkiOpKIiOfshwmWtwgXDjtq` |
| Fraction.js (UMD `Fraction`; ESM `dist/fraction.mjs`) | https://cdn.jsdelivr.net/npm/fraction.js@5.3.4/dist/fraction.min.js | 6.9 / 2.6 KB | `sha384-PCVZrwibUyF41r6ntG9x0zQ9BDZu1RUfBiTCUuGbNmAQM9XadLrTxRWG8k6fPxPU` |
| (optional) mathjs | https://cdnjs.cloudflare.com/ajax/libs/mathjs/15.2.0/math.min.js | 634 / 172 KB | `sha384-TXqmmbU84DoiUDuaVImpZsAMbaLXSLnnbKzWHyTOK+WETLtS5nWpNr5I95aN32D3` |
| (only if drawing Hebrew with jsPDF text) bidi-js (UMD `bidi_js`) | https://cdn.jsdelivr.net/npm/bidi-js@1.1.0/dist/bidi.min.js | 11.9 / 5.8 KB | `sha384-jDwirJ7OPGOygK8KCBBzbJGmFAq7yFbNftU2G1MD0UciVVa3p6vP6Z0FuSeMldiQ` |
| (only for vector SVG→PDF) svg2pdf.js | https://cdn.jsdelivr.net/npm/svg2pdf.js@2.9.0/dist/svg2pdf.umd.min.js | 85.7 / 24.9 KB | `sha384-vNyMZsDT/d+7kwFpauX34njiwXMRe3ZxsLNeO1NooSoUpIkeO77S39xRAJ4VQ+D2` |
| (optional, interactive graphs) JSXGraph + CSS | https://cdnjs.cloudflare.com/ajax/libs/jsxgraph/1.14.3/jsxgraphcore.js, .../jsxgraph.css | 973 / 253 KB | `sha384-/gRtLXAXiYXfed0Ajep7yLSyD64K0WQYnhZ2nAVPArQLm7X6VRHGWvhOSHgcUMBL` |
| (optional) big.js | https://cdnjs.cloudflare.com/ajax/libs/big.js/7.0.1/big.min.js | 6.7 / 2.9 KB | `sha384-n1DtVP51DuAqu1rF9UGXnKbgOsb8ir6hg5efCkHgXPih2duD9PAxHRX/RChWa/g7` |

Use `integrity="…" crossorigin="anonymous"` on every tag.

cdnjs does **not** carry fraction.js, snapDOM, modern-screenshot, html2canvas-pro, bidi-js, svg2pdf.js, pagedjs or nerdamer, so those must come from jsDelivr. cdnjs **does** carry KaTeX 0.19.1, MathJax 4.1.3, jsPDF 4.2.1, mathjs 15.2.0, JSXGraph 1.14.3, big.js 7.0.1 and html-to-image 1.11.13. Its pdfmake is 0.3.13, one patch behind npm.

---

## 1. Deterministic replay: seeded PRNG and seed derivation

| Generator | State | Quality (per bryc's survey + SO answer) | Notes |
|---|---|---|---|
| **sfc32** | 128-bit | Passes PractRand and TestU01 BigCrush. bryc rates it the best 128-bit-state JS generator, and it is very fast. | Has an internal counter, so there is no all-zero trap. Seed with 4×32-bit hash words, or pad and run 12–20 warm-up calls. |
| **splitmix32** | 32-bit | murmur3 finalizer + increment. The mulberry32 author prefers it. | Bijective: no repeats until 2^32 outputs. Fine for worksheets; use only when you have a single 32-bit seed. |
| mulberry32 | 32-bit | Passes gjrand per its author, but reportedly never produces about a third of the 32-bit output values. bryc advises skipping it for serious use. | Fast, but no advantage over splitmix32. |
| xoshiro128** | 128-bit | Fails TestU01 LinearComp/BinaryRank in the low bits. Fine when only the float `[0,1)` is used. | All-zero state is invalid. |
| `pure-rand` 8.4.2 (2026-07-10, fast-check's RNG package) | various | Maintained, with unbiased `uniformInt` distribution | Optional. Not needed if you hand-roll. |
| seedrandom 3.0.5 / random-js 2.1.0 | — | Last releases 2019 | Avoid (unmaintained). |

### Seed derivation from strings

- **cyrb128(str):** a 128-bit hash that returns four 32-bit words, which feed sfc32 directly. Its author designed and tested it only for seed generation.
- **FNV-1a (32-bit):** fine as a 32-bit seed if a strong mixer such as splitmix32 follows it. It has weak low-bit diffusion for the last character, so don't use it to fill 128 bits of state.
- **`crypto.subtle.digest('SHA-256')`:** deterministic everywhere, and available on HTTPS pages (GitHub Pages) and in Node, but async. Good if your pipeline is already async.

### Replay rules that matter more than the PRNG choice

1. **Use per-item independent streams:** `rng_i = sfc32(...cyrb128(\`${GEN_VERSION}|${sheetSeed}|${i}|${templateId}\`))`.
   - With one global stream, inserting an item or changing how many draws a template makes shifts every later item.
2. **Version the generator.**
   - Put `GEN_VERSION` in the seed string and in the share URL.
   - Keep old template versions callable (or frozen) if old links must replay forever.
   - Lock behaviour with golden snapshots (§4).
3. **Make all decisions with integers or rationals.** Never branch on `Math.sin/cos/pow/exp` results: the spec leaves them "implementation-approximated", so engines can differ in the last bits and flip a rounding.
4. **Shuffle with Fisher–Yates** driven by your PRNG.
   - Never use `arr.sort(() => rand() - 0.5)`: it is biased, and the number of comparator calls (and therefore random draws) differs between engines.
5. **Keep formatting out of the model.**
   - No `Math.random`, `Date` or `toLocaleString`/`Intl` in the model; ICU and locale data differ by browser.
   - Format numbers explicitly at render time.
6. **Integer ranges:** `lo + Math.floor(u * n)` from a 32-bit `u` has bias ≤ n/2^32, which is negligible here. Use rejection on `uint32` (Lemire) if you want exactness.

---

## 2. Constrained generation: rejection vs constructive

**Rejection sampling** (draw parameters, test, retry):
- Keeps the distribution uniform over the valid set.
- Expected tries = 1/acceptance.
- Measured: random 2×2 integer coefficients plus random right-hand sides give an integer solution only **13.1 %** of the time (about 7.6 tries). The accepted systems are also biased toward small |det|.
- STACK, a mature randomised-assessment system, explicitly discourages random search loops (infinite-loop and time-out risk). It recommends reverse-engineering the question or picking from explicit lists.

**Constructive (back-solve from the answer):** choose the answer first, then derive the givens.
- **Linear equation:** pick x, a≠0, b; set c = a·x + b.
- **2×2 system:**
  - Pick (x, y); pick a, b, c, d with det = ad − bc ≠ 0; set e = ax + by and f = cx + dy.
  - If intermediate elimination steps must also stay integral, use a **unimodular** matrix (det = ±1).
  - For 3×3, build it as a product of random elementary integer row operations; det stays 1.
- **Quadratic with integer roots:** expand a(x − r₁)(x − r₂). Require r₁ ≠ r₂ for "two solutions" and a ≠ 0.
- **Pythagorean triples:** Euclid's formula (m > n > 0, gcd = 1, m − n odd) times k.
  - Picking (m, n, k) uniformly is **not** uniform over triples.
  - For small bounds, **enumerate then pick by index**: c ≤ 100 has exactly **52** triples, 16 of them primitive.
  - This gives perfect uniformity and no retries, and the whole domain can be tested exhaustively.
- **"Nice" percentages:** p % of N is an integer ⇔ N is a multiple of 100/gcd(p, 100). So build N = k · step.
  - Steps: 5 %→20, 10 %→10, 12 %→25, 15 %→20, 20 %→5, 25 %→4, 35 %→20, 50 %→2, 75 %→4.
  - For chained changes (+p % then −q %), back-solve from the final integer.
- **Fractions:** choose denominators from a small set, build sums over a chosen LCD, reduce with gcd, then assert the intended answer type (proper fraction, mixed number, or integer).

**Hybrid:** use rejection only for cheap, high-acceptance constraints (above roughly 30 %). Cap attempts (e.g., 50), then fall back to a deterministic constructive case so a given seed never hangs.

### Uniqueness and degeneracy checklist (run as code, per template)

- **Mathematical uniqueness:**
  - det ≠ 0 for systems.
  - Discriminant > 0 or = 0 exactly as intended.
  - Geometry: strict triangle inequality, non-collinear points (cross product ≠ 0), angles strictly inside (0°, 180°).
- **Non-triviality:**
  - Answer not in {0, ±1} unless intended.
  - No coefficient 1 or 0 where it trivialises the step.
  - Answer not equal to a printed given.
  - Rows not visibly proportional.
  - Values within the display range (digit counts appropriate to the grade).
- **Distractors:** generate them from named misconceptions (sign slip, wrong operation, forgot to divide). Dedupe by **exact** value (Fraction equality), and none may equal the key.
- **Within-sheet dedupe:**
  - Build a canonical key, e.g. `templateId + normalized parameter tuple` or `templateId + exact answer + structure`.
  - This is the same idea as STACK's *question note*: two variants are "the same" iff their notes are equal.
  - On collision, derive the next sub-seed deterministically (`…|i|retry1`).

---

## 3. Independent answer validation in JS

| Library | Latest (date) | Size raw / gz | Activity (open issues+PRs) | Fit |
|---|---|---|---|---|
| **Fraction.js** | 5.3.4 (2025-08-22) | 6.9 / 2.6 KB | 10 | **Best core:** exact rationals with **BigInt** numerator and denominator (v5). UMD + ESM. jsDelivr only. Needs BigInt (all modern browsers). |
| big.js | 7.0.1 (2025-04-21) | 6.7 / 2.9 KB | 10 | Arbitrary-precision **decimal**, not rational (1/3 is inexact). Good for decimal display and rounding rules. |
| **mathjs** | 15.2.0 (2026-04-07) | 634 / 172 KB | 245, active | Parser, `simplify`, `rationalize`, `symbolicEqual` (uses fraction.js internally). `symbolicEqual` checks that the *difference simplifies to 0*; a `false` is **not conclusive**. |
| nerdamer | 2.0.1 (2026-11-01) | 616 / 157 KB | 42 | 2.0 is a brand-new TypeScript rewrite (rc.2 was 2026-09-27), and the API changed (`solveeqs`, `solveSystem`). Too fresh to depend on. |
| nerdamer-prime (fork) | 1.5.0 (2026-07-24) | 472 KB all.min | 36 | Community fork; small user base. |
| Algebrite | 1.4.0 (2021-04-14) | 831 / 164 KB | 90 | Releases stalled since 2021. |
| @cortex-js/compute-engine | 0.187.1 (2026-11-11) | ESM code-split, chunks up to 3.2 MB raw | 14, very active | Pre-1.0 with API churn and a heavy payload. Overkill for checking. |

### Recommended technique: two independent paths plus exact substitution

1. **Generator path:** the back-solved answer, for example (x, y) chosen first.
2. **Checker path:** a *different* algorithm in exact rationals.
   - Example: Cramer's rule or Gaussian elimination with Fraction.js.
   - Then substitute the answer back into the printed equations and assert exact equality.
3. **Expression equivalence (e.g., an "expand/simplify" answer key):**
   - Evaluate both expressions at k seeded random **rational** points with Fraction.js.
   - Schwartz–Zippel: a nonzero polynomial of degree d vanishes at a random point from a set S with probability ≤ d/|S|.
   - So 5–10 points from |S| ≈ 10⁶ make false acceptance negligible.
   - Skip points that zero a denominator.
   - This is deterministic (seeded), tiny, and has no CAS dependency.
   - Use mathjs only to *parse* user-typed input, or to pretty-simplify for display.

Verified in Node: a constructive 2×2 generator was checked by Cramer's rule in Fraction.js over 2,000 seeds in about 3 ms (`scripts/pbt_sanity.test.mjs`).

---

## 4. Property-based testing in plain Node

**fast-check 4.10.2** (2026-09-19):
- Facts: ESM-first (`lib/fast-check.js`, with a CJS build too); engines `node >= 12.17`; single dependency `pure-rand ^8`; 48 open issues+PRs, active.
- **Verified** under Node 22.19 with `node:test`:
  - Property runs work.
  - A failing property shrinks to the minimal counterexample (`[1000]`).
  - It prints `seed` + `path` for exact replay, passed back via `fc.assert(prop, { seed, path })`.
- **No bundler needed:** `npm i -D fast-check@4.10.2`, then `import fc from 'fast-check'` in `*.test.mjs` and run `node --test`.
- **CDN import in Node is impossible.** `--experimental-network-imports` is gone: Node 22.19 rejects it as a "bad option" (verified).
- **Vendoring is awkward.** `lib/fast-check.js` imports `pure-rand/...` subpaths as bare specifiers, so you would have to commit both packages into a `node_modules`-shaped folder. A devDependency with a lockfile is simpler.

**Zero-dependency approach: reasonable, and the right primary tool for generators.**
- The generator's only input is the seed, so `for (seed = 0; seed < N; seed++) assert(validate(generate(seed)))` is already a property test.
- The failing seed *is* the minimal reproducer, so shrinking adds little.
- 2,000 seeds of a simple template ran in about 3 ms.

Add **golden snapshots** to lock replay determinism:
- `t.assert.snapshot(generate('fixed-seed'))` works **without flags** in Node 22.19 (verified).
- `node --test --test-update-snapshots` writes `*.snapshot`.
- Keep fast-check for pure helpers where shrinking pays off: gcd/lcm, fraction formatting, bidi-wrapping of strings, the paginator's packing logic, and label placement.

Suggested layout:
- `test/templates.sweep.test.mjs`: every template × N seeds, validated by the independent checker of §3.
- `test/golden.test.mjs`: snapshots of a few seeds per `GEN_VERSION`.
- `test/helpers.prop.test.mjs`: fast-check.

---

## 5. Math typesetting for screen, print and PDF

| | **KaTeX 0.19.1** (2026-10-23) | MathJax 4.1.3 SVG (2026-07-03) |
|---|---|---|
| Output | HTML+CSS with woff2 fonts (`font-display:block`) | Self-contained SVG paths. `fontCache` defaults to `'local'` in 4.1.3, so each expression carries its own `<defs>`. |
| Payload | 74 KB gz JS + 3.4 KB gz CSS + fonts on demand (Main-Regular 25.7 KB) | `tex-svg.js` 599 KB gz (`-nofont` variant 250 KB gz). Extra font ranges load dynamically from jsDelivr. The 4.1.3 bundle appends `@<version>` to the jsDelivr font path, so they are effectively pinned. |
| API | Synchronous `katex.render` | Promise-based (`MathJax.startup.promise`, `tex2svgPromise`) |
| Maintenance | Very active in 2026 (0.17 May, 0.18 Jul, 0.19 Oct). **0.18 prefixed internal CSS classes** (breaking for custom selectors; the `.katex` root is unchanged). **0.19 routes missing-metrics warnings through `strict`.** | 4.0 (Aug 2025) added a new default font, line-breaking and an ES-module build. 207 open issues+PRs. |
| RTL behaviour (verified by DOM geometry in an `dir=rtl` page) | **Without a fix the expression renders reversed** (`−2x+5=−7` laid out right-to-left), because KaTeX's CSS sets no `direction`. Fixed by `.katex{direction:ltr;unicode-bidi:isolate}`. | **Without a fix, ordering is scrambled** (`a ≠ 0` broken) — open bug **#3589**, accepted, fix merged to develop for **v4.2** (unreleased). In v4 `direction:ltr` alone no longer works. Fixed by `mjx-container{direction:ltr;unicode-bidi:isolate}`, or by setting `dir="ltr"` on each container. |
| Print to PDF (Chrome) | Vector text with embedded font subsets. Matched the native screen rendering. | Vector paths; robust. |
| PNG capture | Correct with snapDOM, modern-screenshot and html2canvas-pro (fonts embedded or loaded) | Correct with all three (SVG paths need no fonts) |
| Hebrew *inside* math | `\text{אורך הצלע}` renders as one span (correct inside the LTR isolate). Each letter warns under the default `strict:'warn'` (16 warnings for this string) and it **throws** under `strict:'error'`. Use a strict function that ignores `unknownSymbol`/`symbolNotInFont`. Better: keep Hebrew outside math. | Possible, but RTL `\text` direction support is still an open request (#3590) |

**Recommendation: KaTeX 0.19.1.** It is small and synchronous (good for deterministic pagination), the RTL fix is one CSS rule, and its maintenance cadence is high.

Settings:
- `throwOnError:false`.
- `minRuleThickness: 0.05`: the docs recommend 0.05–0.06 so fraction and sqrt rules survive print scaling.
- Render, then `await document.fonts.ready` before measuring.

Choose MathJax SVG only if you need SVG math for svg2pdf.js or diagram embedding, or automatic line-breaking. Then apply the isolate workaround until 4.2 ships.

General rule: wrap **every** math or number fragment that sits inside Hebrew prose in an LTR isolate:
- for math: `.katex`/`mjx-container`;
- for plain coordinates or numbers: `<bdi dir="ltr">(2, -3)</bdi>` or `<span class="ltr">` with `direction:ltr;unicode-bidi:isolate`.

Without it, both screen and PDF show `(3- ,2)` and `2x + 5 = -7-` style corruption (verified in the test page, line 5).

---

## 6. A4 pagination and PDF download

### Browser support for print CSS (MDN BCD 8.1.8)

| Feature | Chrome | Firefox | Safari |
|---|---|---|---|
| `@page { size }` | 15 | 95 | **18.2** |
| `@page` margin boxes (`@top-center` …) | **131** | no | no |
| `break-inside: avoid` | 50 | 65 | 10 |
| `break-before/after: page` | 50 | 65 | 10 |
| `print-color-adjust` (unprefixed) | 136 | 97 | 15.4 |

Conclusion: don't rely on margin boxes or on browser fragmentation. Paginate yourself.

### Options compared

| Option | Output | Hebrew shaping / bidi | Maintenance | Verdict |
|---|---|---|---|---|
| **Browser print** (`@page A4` + explicit sheets) → "Save as PDF" | **Vector**, selectable, font subsets embedded. Measured: 2 sheets → **2 pages, 199 KB**. Pixel-identical to screen within antialiasing. | Browser engine: full UAX#9 + HarfBuzz shaping | Built-in | **Best quality.** Needs a print dialog; iOS printing UX varies. |
| **Per-sheet raster**: snapDOM / modern-screenshot / html2canvas-pro → `jsPDF.addImage` | **Raster**, not selectable. Measured: **116–125 KB/page (PNG)**, **143–150 KB/page (JPEG q0.92)** at 2× (1588×2246 px ≈ 192 dpi). 221–402 ms per page warm. | snapDOM and modern-screenshot use SVG `foreignObject`, so the browser renders the text itself. html2canvas-pro re-draws text with `fillText` (it sets `ctx.direction`). All three reproduced Hebrew, KaTeX and MathJax lines structurally identical to native. | snapDOM 3.7.4 (2026-11-09, very active); modern-screenshot 4.7.0 (2026-04-16, 73 open); html2canvas-pro 2.6.4 (2026-11-11) | **Most reliable one-click download.** |
| html2pdf.js 0.14.0 (2026-01-12) | Raster: one tall canvas sliced into pages, with page-break heuristics (`avoid-all`/`css`/`legacy`) | Depends on **html2canvas 1.4.1** (2022-01-22; last commit 2022; 1,054 open). Its RTL punctuation fix PR #2756 has been open and unmerged since 2021. | 502 open issues | Avoid |
| jsPDF 4.2.1 `text()` (+ svg2pdf.js 2.9.0 for math) | Vector, small (30 KB test page with an Alef subset) | Built-in bidi engine (Unicode 8 tables); **no isolate support**; no OpenType shaping (fine for unpointed Hebrew, wrong for niqqud); **no glyph fallback**. Details below. | Active, mostly security releases (4.0 2026-01, Node FS restriction) | Avoid for Hebrew prose. It duplicates layout and diverges from the screen. |
| pdfmake 0.3.14 (2026-11-08) | Vector; 289 KB gz + 835 KB VFS fonts | pdfkit/fontkit shape glyphs, but the **core has no bidi algorithm** (only a single-maintainer fork, `pdfmake-rtl` 2.1.2) | Active | Avoid for Hebrew |
| Paged.js | Print polyfill (paged preview) | Browser engine | **No release since 0.4.3 (2023-07-06)**; 0.5.0-beta.2 (2024-10); sporadic 2026 commits; 238 open | Avoid; you don't need it with explicit sheets |
| Vivliostyle core 2.46.0 (2026-11-03) | Paged-media engine | Browser engine | Active | AGPL-3.0, 240 KB gz, CJS bundle (not a drop-in `<script>`). Not a fit. |
| `@zumer/snapdom-pdf` 1.0.1 (2026-11-09) | Raster + invisible text layer, A4 paging, break-avoid | Its docs say RTL/complex scripts stay images in `vectorText` mode | 3 days old | Watch; don't adopt yet |
| pdf-lib 1.17.1 | Vector | No bidi or shaping | Last release 2021 | Avoid |

### Pixel fidelity vs a native Chrome screenshot (same sheet, 2×)

Metric: pixels differing by more than 64 levels, as a % of ink pixels. Lower is closer; about 20–30 % is antialiasing noise.

| Path | Diff |
|---|---|
| snapDOM | **19 %** |
| Chrome print → pdf.js render | 27 % |
| modern-screenshot | 43 % |
| html2canvas-pro | 51 % |

Per-question crops (`out/stack_q*.png`) show no structural differences in any of them: fraction bars, roots, minus signs and Hebrew order all match.

### jsPDF + Hebrew: detailed findings (the critical question)

**Bidi strategies** — 7 typical lines compared against bidi-js (UAX#9, RTL paragraph), and rendered with pdf.js:

| Strategy | Matches | Result |
|---|---|---|
| Defaults (the `postProcessText` hook assumes visual input) | 0/7 | Hebrew stays in logical order, so it **renders reversed**, and numbers flip (`20`→`02`, `3x`→`x3`). |
| Maintainer-suggested base-LTR options (PR #3171 thread) | 1/7 | Wrong |
| `{isInputVisual:false, isInputRtl:true, isOutputVisual:true, isOutputRtl:false}` | 5/7 | Parentheses face the wrong way |
| Same **+ `isSymmetricSwapping:true`** | **7/7** | Correct for these lines |

**Isolates:** the engine **ignores LRI/PDI and LRE/PDF**.
- `פתור: -2x + 5 = -7` still comes out as `2x + 5 = -7-`, and `(2, -3)` as `(3- ,2)`.
- Workaround: reorder each line yourself with **bidi-js** (supports isolates and mirroring), strip U+2066–2069, then call `doc.text(visual, x, y, {align:'right', isInputVisual:true, isOutputVisual:true})` (passthrough). This was correct in the render.

**Font coverage:** jsPDF has no fallback, so one font must contain *every* glyph.
- Noto Sans Hebrew static TTF (notofonts): 147 code points, **no digits/Latin/`+=(`**.
- Alef: Hebrew + Latin + digits, but no U+2212 `−`, `√`, `≤`, `π` or `²`.
- Rubik: wider coverage, but Google Fonts ships it variable-only.
- Math therefore needs a separate SVG path (svg2pdf.js), which means you are writing a layout engine.

**Text extraction is garbled:** pdf.js returns mirrored or reordered strings for mixed lines. Copy and search are unreliable.

**Verdict:** jsPDF is fine as an **image container** (`addImage`), not as the Hebrew text renderer.

### Recommended architecture: one document model, three outputs

1. **Model.** `worksheet = {genVersion, seed, items:[{templateId, params, answer, check}]}`.
2. **Render.** Model → DOM blocks (`.q`).
   - Typeset KaTeX, then `await document.fonts.ready`.
   - Also `await document.fonts.load('400 16px Rubik','אבג')` for each weight used.
3. **Paginate.** Append blocks into the current `.sheet .body` one by one.
   - If `body.scrollHeight > body.clientHeight`, move the block to a new sheet.
   - A block taller than a page splits at sub-item boundaries; otherwise scale it.
   - Run a final assertion that no sheet overflows.
   - This uses real layout, so it is deterministic per engine and font. Across browsers, slight metric differences can move a break: either leave about 5 mm slack, or persist break indices with the seed if cross-device identical pages are required.
4. **Screen.** Show the `.sheet`s themselves (WYSIWYG).
5. **Print.**

   ```css
   @page { size: A4; margin: 0; }
   .sheet { width: 210mm; height: 297mm; box-sizing: border-box; padding: 14mm 15mm;
            overflow: hidden; break-after: page; }
   .sheet:last-of-type { break-after: auto; }  /* NOT :last-child: a trailing <script> made it miss → blank 3rd page (verified) */
   @media print { html, body { margin: 0; background: none; } .sheet { margin: 0; box-shadow: none; } .no-print { display: none; } }
   .katex, mjx-container, .ltr { direction: ltr; unicode-bidi: isolate; }
   * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
   ```

6. **Download PDF** (same DOM, rasterised per sheet):

   ```js
   const { jsPDF } = window.jspdf;
   const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
   const sheets = document.querySelectorAll('.sheet');
   for (let i = 0; i < sheets.length; i++) {
     const cap = await snapdom(sheets[i], { scale: 2, dpr: 1, embedFonts: true, backgroundColor: '#fff' });
     const canvas = await cap.toCanvas();
     if (i) pdf.addPage('a4', 'portrait');
     pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297, undefined, 'FAST'); // PNG beat JPEG for line art
   }
   pdf.setDocumentProperties({ title: 'דף עבודה' }); pdf.setLanguage('he');
   pdf.save('worksheet.pdf');
   ```

   - Keep scale ≤ 3. Safari caps canvases (snapDOM's guard is 16,384 px per side, plus an area limit).
   - 3× A4 is about 2381×3368 px (≈ 288 dpi) and roughly doubles file size (not measured).
   - Load fonts so the capturer can read them: same-origin self-hosted woff2, or Google Fonts `<link crossorigin="anonymous">` (this worked in the test).
   - Offer "Print / Save as PDF" alongside for vector, selectable output.

---

## 7. Vector diagram rendering

| Option | Latest | Size gz | Fit for static printable sheets |
|---|---|---|---|
| **Hand-written SVG builder** (`el(tag, attrs, children)` + geometry from exact model values) | — | ~1–3 KB | **Best**: deterministic, prints as vector, captures cleanly, no dependency |
| JSXGraph | 1.14.3 (2026-11-06), dual LGPL-3.0/MIT, 100 open | 253 KB | Interactive-first. Has label `autoPosition` (default off; min/max distance 12/28 px). Overkill unless you need dragging. |
| function-plot (d3) | 1.26.0 (2026-10-11) | 61 KB | Function graphs only |
| Mafs | 0.21.0 (2024-10-20) | — | React + JSX, so it needs a bundler. Not a fit. |

### Techniques

- **Coordinates.** Use exact values from the model (Fraction → float only at render), a `viewBox` in mm-like units, and `vector-effect:non-scaling-stroke` for uniform line weight.
- **RTL pitfall (verified).**
  - Inline `<svg>` in a `dir=rtl` page **inherits `direction: rtl`**, so `text-anchor="start"` anchors at the label's *right* end and every label shifts.
  - Put `direction="ltr"` on each diagram `<svg>`, and set `direction="rtl"` only on Hebrew `<text>` elements.
  - Keep vertex and length labels (A, B, 5) LTR.
- **Label placement (deterministic, no library):**
  1. Generate ranked candidate anchors per label:
     - vertex labels: along the outward angle bisector at distance d, then ±30° rotations;
     - side labels: outward normal at the midpoint, then at 1/3 and 2/3;
     - points on graphs: the 8 Imhof positions (NE, NW, SE, SW, N, S, E, W).
  2. Estimate each label's box with canvas `measureText` (after `document.fonts.ready`) or `getBBox()`, plus 2–3 px padding to absorb cross-browser metric drift.
  3. Treat as obstacles: already-placed label boxes, segment/rectangle intersections, and point markers.
  4. Place the most constrained labels first and take the first collision-free candidate. Otherwise take the least-overlap candidate plus a leader line, or a smaller font.
  5. No randomness, so placement replays exactly.
- **Legibility over lines:** `paint-order: stroke; stroke: #fff; stroke-width: 3–4px; stroke-linejoin: round` (a white halo). Verified to survive print and all three capturers.
- **References for heavier needs:**
  - Vega's label transform: the occupancy-bitmap algorithm (Kittivorawong et al., IEEE VIS 2020).
  - d3-force 3.0.1 collide nudging. It is deterministic: the default `randomSource` is a fixed-seed LCG, and a static layout comes from `simulation.stop(); simulation.tick(300)`.

---

## Biggest single risk for Hebrew PDF output

**Silent bidi corruption of math inside Hebrew lines.**

What happens:
- Neutral characters at Hebrew/LTR boundaries (leading minus, parentheses, commas in coordinates, colons) get reordered.
- The page still *looks* plausible but is mathematically wrong: `-2x + 5 = -7` → `2x + 5 = -7-`, `(2, -3)` → `(3- ,2)`.
- It happens on screen and in every PDF path unless each math or number run is an LTR isolate.

Why jsPDF can't help:
- jsPDF's built-in engine **ignores isolates**.
- By default it renders Hebrew **reversed**.
- It has no glyph fallback.

Mitigation:
1. Isolate all math (`.katex`/`mjx-container`/`<bdi dir="ltr">`).
2. Generate PDFs only from the browser's own rendering: print, or per-sheet raster.
3. Add an automated DOM-geometry test (e.g., `x("2") < x("7")` inside each formula) to the test suite.

Secondary risk: the raster PDF has no selectable text. Offer browser print for vector output.

---

## Verification artifacts (scratchpad)

All paths are under `(working notes)/`.

**Scripts:**
- `scripts\bidi_test.cjs`, `scripts\bidi_isolate_test.cjs`: jsPDF bidi engine vs bidi-js.
- `scripts\pbt_sanity.test.mjs`: fast-check + node:test + Fraction.js.
- `scripts\snaptest\`: node:test snapshots.
- `scripts\katex_hebrew.cjs`: Hebrew inside KaTeX `\text{}`.
- `scripts\cmap_check.mjs`: font coverage.
- `scripts\verify_urls.mjs`, `scripts\sri.mjs`: URL checks and SRI hashes.
- `rtest\index.html` + `scripts\cdp_run.mjs`: headless Chrome test (capture, print, pixel diffs, DOM checks).

**Outputs** (in `out\`):
- `native_s1.png`, `cap_*_top.png`, `stack_q1/3/5/7.png`
- `print.pdf`, `print_page1.png`
- `jspdf_text.pdf`, `jspdf_text_page1.png`

## Sources

**Registries and CDNs**
- npm registry (versions/dates): https://registry.npmjs.org/
- GitHub API (repo activity)
- jsDelivr data API: https://data.jsdelivr.com/
- cdnjs API: https://api.cdnjs.com/
- MDN browser-compat-data 8.1.8: https://unpkg.com/@mdn/browser-compat-data/data.json

**PRNGs (§1)**
- bryc PRNG survey: https://github.com/bryc/code/blob/master/jshash/PRNGs.md
- Seeding PRNGs in JS (bryc answer, cyrb128/sfc32/splitmix32): https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
- ECMAScript Math functions are implementation-approximated: https://read262.netlify.app/numbers-and-dates/math-object

**Constrained generation (§2)**
- STACK random objects guidance: https://docs.stack-assessment.org/en/CAS/Random/
- STACK question note / deploying variants: https://docs.stack-assessment.org/en/Authoring/Question_note/, https://docs.stack-assessment.org/en/STACK_question_admin/Deploying/

**Validation and testing (§3–4)**
- mathjs symbolicEqual: https://mathjs.org/docs/reference/functions/symbolicEqual.html
- Fraction.js README (BigInt): https://cdn.jsdelivr.net/npm/fraction.js@5.3.4/README.md
- nerdamer 2.0 README: https://cdn.jsdelivr.net/npm/nerdamer@2.0.1/README.md
- fast-check replay docs: https://fast-check.dev/docs/tutorials/quick-start/read-test-reports/

**Math typesetting (§5)**
- KaTeX changelog: https://github.com/KaTeX/KaTeX/blob/main/CHANGELOG.md
- KaTeX options (`minRuleThickness`, `strict`): https://katex.org/docs/options
- MathJax RTL bug #3589: https://github.com/mathjax/MathJax/issues/3589 (and #3590)
- MathJax fonts in v4: https://docs.mathjax.org/en/latest/output/fonts.html
- MathJax 4.0.0 release: https://github.com/mathjax/MathJax/releases/tag/4.0.0

**PDF and capture (§6)**
- jsPDF bidi PR thread #3171: https://github.com/parallax/jsPDF/pull/3171
- jsPDF bidi engine source: https://github.com/parallax/jsPDF/blob/master/src/libs/bidiEngine.js
- jsPDF releases: https://github.com/parallax/jsPDF/releases
- html2canvas RTL PR #2756 (open): https://github.com/niklasvh/html2canvas/pull/2756
- snapDOM README: https://cdn.jsdelivr.net/npm/@zumer/snapdom@3.7.4/README.md
- snapDOM PDF plugin: https://snapdom.dev/plugins/pdf/
- snapDOM KaTeX capture issue #474: https://github.com/zumerlab/snapdom/pull/474
- Paged.js status: https://pagedjs.org/posts/en/a-new-chapter-in-paged.js-life/ and GitHub tags/commits
- Chrome margin boxes (131): https://developer.chrome.com/blog/print-margins
- html2pdf.js README: https://cdn.jsdelivr.net/npm/html2pdf.js@0.14.0/README.md

**Diagrams and labels (§7)**
- d3-force simulation (`randomSource`, static ticks): https://d3js.org/d3-force/simulation
- Vega label transform: https://vega.github.io/vega/docs/transforms/label
- Occupancy-bitmap labeling paper: https://idl.uw.edu/papers/fast-labels
