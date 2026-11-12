> Prepared 2026-11-12 for the workbook implementation plan ([WORKBOOK_IMPLEMENTATION_PLAN_20261112.md](WORKBOOK_IMPLEMENTATION_PLAN_20261112.md)). Read-only research: findings marked UNVERIFIED were not confirmed. Line references point at commit `d274b44` unless stated.

# Israeli middle-school mathematics (grades 7–9): curriculum and capability matrix

Prepared 2026-11-12. This was read-only research. Nothing in either repo was modified.

**Method**
- **District entry point.** The district collection page (https://jerusalem2.vercel.app/chativat-beynayim/tochnit-limudim/) was fetched live. Its source was read with `git show`/`git grep` on `origin/main` @ `3cfb1994` (2026-11-09): `src/pages/chativat-beynayim/tochnit-limudim/index.astro`, `[doc].astro`, `src/lib/curriculum.ts`, `src/lib/curriculum-doc.ts` and `src/content/curriculum/*.json`.
- **Ministry portal.** The page the district site mirrors (https://pop.education.gov.il/tchumey_daat/matmatika/chativat-beynayim/teaching-mathematics/tohnit-limudim/) was fetched live.
- **Official documents.** All 20 linked PDFs were downloaded through WebFetch on 2026-11-12. WebFetch itself could not read them because the streams are compressed, so the text was extracted locally with PyMuPDF. The extracted text is in `scratchpad/text/*.txt` and the PDFs are in `scratchpad/pdfs/`.
- **Edition dates.** These come from the PDF metadata (pdfinfo). In this document, "p." means the page in the edition fetched today.
- **Page ranges are approximate.** They were located by searching the extracted text for section headings, and a range runs to the start of the next section.
- **targilim.** Branch `feat/workbook-vertical-slice` @ `d274b44`. Intake PDFs were compared to the live files by SHA-256 and by a word-level diff.
- **Quotations.** Hebrew is used only for short topic labels. Everything else is paraphrased.
- **Labels.** `UNVERIFIED` marks anything I could not confirm from a primary source.

---

## 0. Key findings

1. **Current curriculum.** For grades 7–8 it is the update "עדכון תוכנית הלימודים במתמטיקה (החל משנת תשפ״ז)". The pre-update program `math_7_9.pdf` (2019 file) is explicitly labelled "לפני עדכון" on both the portal and the district site.
2. **Grade 9 has no updated curriculum yet.**
   - The outline is titled for grades ז׳–ט׳, but the update's domain documents cover only grades ז and ח.
   - For grade 9 in תשפ״ז, the governing documents are:
     - the regular plan `prisa_9A`;
     - the reduced plan `prisa_9B`, for students heading to 3 units (at most 25% of a cohort);
     - the profile for at most 4 units (dated 26/3/2025) and its three sub-profiles;
     - as background, the grade-9 chapter of the pre-update program (pp. 101–158).
3. **Grade 8 in תשפ״ז is a transitional year.**
   - `prisa_8` calls it a special plan that bridges the old and updated programs. No new textbooks arrive until תשפ״ח.
   - Some grade-7-update topics are still taught in grade 8 this year: Pythagoras completions, Pythagoras in space, transformations, and frequency/relative frequency.
4. **The Ministry re-issued all six domain documents at the same URLs between 2026-09-14 and 2026-10-25.**
   - targilim intake files 01–06 are the **older May-2026 editions**. Their hashes differ, and the word-level similarity is 0.86–0.89.
   - Intake files 07, 08, 09 and 10 are byte-identical to the live files.
   - The jerusalem2 internal transcriptions of the six domain documents (made 18–31 Aug 2026) also pre-date the re-issue: their page counts are 40/99/103/93/78/62, against 39/100/102/85/77/63 live.
   - Concrete drift example: the grade-7 Pythagoras summary question (cable bridge, option B). The May edition moved the anchor *farther*, to 35 m. The October edition moves it *closer*, to 15 m. The district Pythagoras booklet (p. 53) still uses the May (35 m) version.
5. **Pythagoras is a grade-7 topic in the current plan.**
   - It is in the grade-7 geometry update (8 h) and in `prisa_7` (March, 6 h).
   - Grade 8 gets transitional "completions" plus "Pythagoras in space" in תשפ״ז only.
   - The pre-update program had it in grade 8.
   - targilim `G7-03` is therefore placed correctly. Its content, however, covers only integer Pythagorean triples. It has no coordinate distance, no non-integer roots, no 2-decimal or √ conventions and no applied contexts.
6. **Grade-placement mismatches in targilim** (details in §7):
   - `U7-08` (mean/median/range) is grade-8 content.
   - `U7-02` is only partly grade 7: complement and classical probability are grade 8.
   - `A7-04` includes factoring by common factor, which is not in the G7–8 texts and appears in the grade-9 plan.
   - `U7-06` (misleading graphs) has no explicit objective in the documents.
7. **Terminology.**
   - targilim worksheets say "תדירות" / "טבלת תדירות". The official documents never use that term (0 occurrences); they use "שכיחות", "שכיחות יחסית" and "טבלת שכיחויות".
   - The official line form is `y = mx + b`, and targilim A8-02 matches it. CURRICULUM_MAP's "f(x)=ax+b" comes from the superseded program.
8. **targilim `curriculum-map/CURRICULUM_MAP.md` and `source-learning/…/00_official_curriculum_7_9.learning.md` are mostly wrong about the current plan.**
   - They encode the superseded program as "corrections": functions in grade 7, parallel lines and circle in grade 7, the three-rounds structure, and the old hour totals.
   - Their grade-9 list is not supported by any document. "Arithmetic and geometric sequences", "advanced circle" and "Pythagoras formal proof" are not grade-9 chapters, even in the old program.
   - `sources/official/SOURCE_REFERENCE.md` itself says the PDF was never in the handoff.
9. **Coverage.** There is **no grade-9 engine**. Of the 50 engines, 31 are grade 7 and 19 are grade 8. Several grade-7/8 objectives have no engine (§8.1).

---

## 1. Status model — which document governs what (as of 2026-11-12)

| Grade | Governing documents in תשפ״ז | Status notes |
|---|---|---|
| ז׳ (7) | Update domain docs: A7, G7, N78 pp. 1–45, U78 pp. 1–27. Also: companions cA/cG/cN/cU, sequence R7, plan P7. | P7 says the updated program enters in תשפ״ז, new approved textbooks are published in two parts, and the plan's order must be followed. |
| ח׳ (8) | Update domain docs: A8, G8, N78 pp. 46–77, U78 pp. 28–63, and the companions. **For this year:** R8 (titled "for school year תשפ״ז") and the transitional plan P8. | P8 describes a special transitional plan. Old textbooks are used, both parts; new books come in תשפ״ח. P8 carries extra items that the update puts in grade 7: Pythagoras completions, parallel-line angles "if not learned in ז", transformations/congruent shapes, and frequency. |
| ט׳ (9) | P9A (regular); P9B (reduced, aimed at 3 units, at most 25% of a cohort); PROF9 plus three sub-profiles (minimum for students heading to at most 4 units, dated 26/3/2025, folder תשפ״ה); OLD grade-9 chapter pp. 101–158 (pre-update). | No updated grade-9 domain document is published. The P9A/P9B notes say to consult the "detailed curriculum", which for grade 9 can only mean OLD (an interpretation; UNVERIFIED). |
| ז–ט overview | OUT (outline, titled grades ז׳–ט׳); PRES (update presentation). | Framing documents only. They contain no topic hours. |

**Changes the update itself announces** (PRES pp. 3–6; N78 p. 1; G7 p. 1):
- Statistics and probability leave the numeric domain and become a new "אי־ודאות" (uncertainty) domain.
- Mathematical modelling is integrated throughout.
- The three "rounds" per year are replaced by a 3-year spiral.
- Accessible topics move to grade 7: statistics, linking pre-deductive and analytic geometry, translation/rotation/reflection, and solids.
- Challenging topics move to grade 8.
- Elementary-school topics are removed: order of operations and arithmetic laws on positive numbers, and the first geometry topics.
- Deductive proof starts only in the second half of grade 8.

---

## 2. Sources (every document reachable from the district page)

Abbreviations are used throughout. "Intake" means `targilim/sources/intake/2026-06-09/`. "j2" means jerusalem2 `origin/main`.

**Base URLs**
- `U` = https://meyda.education.gov.il/files/Pop/0files/matmatika/Chativat-Beynayim/curriculum/updating/
- `Z` = https://meyda.education.gov.il/files/Pop/0files/matmatika/Chativat-Beynayim/tashpaz/
- `H` = https://meyda.education.gov.il/files/Pop/0files/matmatika/Chativat-Beynayim/tashpah/

| Abbr | Portal label (printed title) | URL | Grade / domain | Edition evidence (fetched 2026-11-12) | Status | In targilim intake? | j2 internal page |
|---|---|---|---|---|---|---|---|
| P7 | פריסת הוראה שכבה ז ("פריסת הוראה כיתה ז - תשפ״ז") | Z prisa_7.pdf | 7, all domains | 4 pp, Google-Docs export, no PDF date; assessment dates 1.11.26 – 4.6.27 | Current plan for תשפ״ז | **No** | Row routes to `/prisot/prisa-7/` (not checked) |
| P8 | פריסת הוראה שכבה ח ("…כיתה ח - תשפ״ז") | Z prisa_8.pdf | 8 | 4 pp; assessment dates 25.10.26 – 4.6.27 | Current; **transitional** | **No** | Routes to prisa page |
| P9A | פריסת הוראה שכבה ט (פריסה רגילה) ("…כיתה ט - תשפ״ז") | Z prisa_9A.pdf | 9 | 8 pp | Current, **regular** plan | **No** | Routes to prisa page |
| P9B | פריסת הוראה שכבה ט (פריסה מצומצמת) ("…כיתה ט מצומצמת - תשפ״ז") | Z prisa_9B.pdf | 9 | 6 pp. Targets students planning 3 units; at most 25% of the cohort | Current, **reduced** plan | **No** | Routes to prisa page |
| OUT | מתווה לעדכון תוכנית הלימודים ("מתווה לתוכנית לימודים בחטיבת הביניים במתמטיקה כיתות ז׳–ט׳") | U curriculum_outline.pdf | 7–9 framework | PDF 2026-05-25; 6 pp | Current (update intro) | **No** | Internal page, 6 pp, matches |
| PRES | מצגת עדכון תוכנית הלימודים | U curriculum_updating.pdf | 7–9 framework | PDF 2026-02-11; 7 slides | Current (update intro) | **No** | Slide deck |
| A7 | תחום אלגברי לכיתה ז ("אלגברה לכיתה ז") | U algebra_7.pdf | 7, algebraic | **PDF 2026-10-14/15; 39 pp** | Current (update, from תשפ״ז); a formal approval statement is not printed | **Older edition** in intake (01: PDF 2026-05-20, 40 pp, sha 66740E05…) | Stale (40 pp transcription, Aug 2026) |
| A8 | תחום אלגברי לכיתה ח ("אלגברה לכיתה ח") | U algebra_8.pdf | 8, algebraic | **PDF 2026-10-19/25; 100 pp** | Current | **Older edition** (02: 2026-05-20, 99 pp) | Stale (99 pp) |
| G7 | תחום גאומטרי לכיתה ז ("גאומטריה קדם היסקית לכיתה ז") | U geometry_7.pdf | 7, geometric | **PDF 2026-10-17; 102 pp.** An invisible 1-pt "מעודכן לתאריך" artifact appears on every page; no visible date | Current | **Older edition** (03: 2026-05-28, 102 pp) | Stale (103 pp) |
| G8 | תחום גאומטרי לכיתה ח ("גאומטריה לכיתה ח") | U geometry_8.pdf | 8, geometric | **PDF 2026-09-16/18; 85 pp** | Current | **Older edition** (04: 2026-05-20, 93 pp) | Stale (93 pp) |
| N78 | תחום מספרי לכיתות ז-ח (p. 1 "תחום מספרי - כיתה ז"; p. 46 "תחום מספרי – כיתה ח'") | U numerical_7_8.pdf | 7 (pp. 1–45) and 8 (pp. 46–77), numeric | **PDF 2026-09-14/18; 77 pp** | Current | **Older edition** (05: 2026-05-20, 78 pp). The intake labels it "grade-7" only, but it also contains grade 8 from p. 47 | Stale (78 pp) |
| U78 | תחום אי-ודאות ("תחום אי וודאות") | U Uncertainty_7_8.pdf | 7 (pp. 1–27) and 8 (pp. 28–63), uncertainty | **PDF 2026-10-07/15; 63 pp** | Current | **Older edition** (06: 2026-05-20, 62 pp) | Stale (62 pp) |
| cN | Companion: תחום מספרי כיתות ז-ח | U numerical_Rational.pdf | 7–8 numeric; concepts, skills, didactics | PDF 2026-05-19/20; 16 pp | Current (companion) | **Identical** (07; sha 3B63ADDF…) | Matches (16 pp) |
| cA | Companion: תחום אלגברי כיתות ז-ח | U algebra_Rationale.pdf | 7–8 algebraic | PDF 2026-05-19/20; 19 pp | Current | **Identical** (08) | Matches |
| cG | Companion: תחום גאומטרי כיתות ז-ח | U geometry_Rationale.pdf | 7–8 geometric | PDF 2026-05-19/20; 34 pp | Current | **Identical** (09) | Matches |
| cU | Companion: תחום אי-ודאות כיתות ז-ח | U Uncertainty_Rational.pdf | 7–8 uncertainty | PDF 2026-05-28; 11 pp | Current | **No** | Matches (11 pp) |
| R7 | רצף הוראה לשכבה ז ("…רצף הוראה מומלץ לכיתה ז'") | Z retzef7_2026.pdf | 7 | PDF 2026-02-12; 1 p | Current recommended sequence | **No** | Matches |
| R8 | רצף הוראה לשכבה ח ("…רצף הוראה לכיתה ח' בשנת הלימודים תשפ״ז") | Z retzef8_2026.pdf | 8 | PDF 2026-05-25; 1 p | Current; transitional year | **Identical** (10) | Matches |
| OLD | תוכנית הלימודים במתמטיקה לכיתות ז-ט - לפני עדכון | https://meyda.education.gov.il/files/Curriculum/math_7_9.pdf | 7–9; three domains (numeric includes statistics/probability) | PDF 2019-09-05/08; 158 pp; grade-9 section pp. 101–158 | **Superseded for grades 7–8.** Background for grade 9 (labelled "לפני עדכון") | **No file**; URL only, in `sources/official/SOURCE_REFERENCE.md` | Internal page, 158 pp. j2-only row "תוכנית הלימודים לכיתה ט׳" points to `#page=101` |
| PROF9 | פרופיל תלמיד בוגר כיתה ט לקראת 4 יח״ל | H profil-9g-4.pdf | 9 | Printed date 26/3/2025; PDF 2025-06-15; 1 p | Prior-year document (תשפ״ה) still listed under "מידע כללי" | **No** | Matches |
| PROF9-G | (linked from PROF9) geometry profile, 4 units | H "geometry profile 4 units.pdf" | 9 geometry | 7 pp | As PROF9 | **No** | — |
| PROF9-F | (linked) functions profile, 4 units | H "functions profile 4 unit.pdf" | 9 functions | 4 pp | As PROF9 | **No** | — |
| PROF9-A | (linked) algebraic-technique profile, 4 units (title says תשפ״ה) | H "algebraic profile 4 unit.pdf" | 9 algebra | 9 pp | As PROF9 | **No** | — |

**Links on the Ministry portal only.** These are not on the district page and were **not fetched**:
- the עמ״ט site;
- the "ישראל ריאלית" program;
- a Google-Drive presentation on high-school-curriculum emphases for middle school;
- "תוכנית הלימודים המוארת" (newhighmath.haifa.ac.il).

The P9A/P9B literacy-task attachments `H orianut9A-3th.pdf` and `orianut9B-3th.pdf` were also not fetched.

**Fetch outcome.** All 20 district-linked PDFs, plus the three sub-profiles, were fetched successfully (HTTP binary). None failed.

**District page versus portal**
- The section headings and labels match.
- The district page adds the j2-only grade-9 anchor row.
- The district page omits the four portal-only links above.
- District rows open internal transcriptions instead of the PDFs. For the six domain documents those transcriptions are of the pre-September editions.

---

## 3. Grade ז׳ (7) matrix

**How to read the columns**
- "Seq." gives the recommended hours from the domain document's overview, then the R7 block (weeks/hours) and the P7 month/hours.
- "Engine → placement": ✓ means the targilim grade matches the current document. ⚠ means mismatch or partial match. — means no engine.

### 3.1 מספרי (numeric) — N78 pp. 1–45; cN pp. 2–3. Overview total 35 h; R7 block 1 = 12 weeks, 36 h

| Topic / objective | Seq. and prerequisites | Boundaries | Terms, notation, definitions | Provenance | Engine → placement |
|---|---|---|---|---|---|
| מערכת צירים ברביע I: mark and read points; length of segments parallel to an axis (by subtraction); area of known polygons on the grid; represent shapes | 5 h; Sep (P7 5 h). The document says to open the year with it. Prerequisite: elementary number line | Only the part of the plane where both coordinates are non-negative. Both axes on the same scale when representing shapes | ציר x, ציר y, שיעורי נקודה, שיעור ה-x (ראשון) / ה-y (שני); points written as A(4,1) | N78 p. 2 (overview), pp. 3–8 | N7-01 ✓ |
| הכרת המספרים השליליים; מספרים נגדיים; ערך מוחלט; order on the number line | 5 h; Sep–Oct (P7 1 h + 4 h) | — | Absolute value is a number's distance from 0; opposite numbers have the same absolute value | N78 pp. 9–14 | N7-03, N7-08, N7-09 ✓ |
| חיבור וחיסור מספרים מכוונים | 7 h; Oct. Must come **before** solving equations (algebra) | — | מספרים מכוונים | N78 p. 1 (sequencing), pp. 14–19 | N7-04, N7-10, N7-11 ✓ |
| הרחבת מערכת הצירים (all quadrants) | 5 h; Oct–Nov (P7 1 h + 4 h) | — | Full coordinate system | N78 p. 2, pp. 20–30; cN p. 3 | — **gap** (N7-01 covers quadrant I only) |
| כפל וחילוק מספרים מכוונים | 8 h; Nov | — | Sign rules | N78 pp. 31–36 | N7-05, N7-12, N7-13 ✓ |
| חזקות עם מעריך טבעי; base may be positive, zero or negative | 5 h shared with roots; Dec (P7 6 h) | Begin with positive bases | בסיס חזקה, מעריך חזקה; power precedes other operations; sign of a negative base with even or odd exponent; distinguish (−3)² from −3² | N78 pp. 37–39 | N7-06 ✓ |
| שורש ריבועי חיובי, first integer/rational, then non-integer; אומדן | Dec. **Must precede Pythagoras** (geometry) | Initially only natural-number roots and roots of simple fractions. Know roots of perfect squares up to 144 and of even powers of 10. Estimate non-integer roots at least to the nearest integer | √ denotes the **positive** root; a positive number has two square roots (±). Defined as: b is a square root of a when b² = a | N78 pp. 40–45; cN p. 3 | N7-07 ✓ |
| Removed from grade 7 compared with OLD | — | Order of operations and arithmetic laws on positive numbers are assumed from elementary school. Statistics and probability moved to uncertainty | — | N78 p. 1 | (old-program N7-08 in CURRICULUM_MAP is obsolete) |

### 3.2 אלגברי (algebraic) — A7 pp. 1–39; cA pp. 3–4. Overview 25 + 20 + 5 = 50 h. R7: 15 h + 10 h + 24 h

| Topic / objective | Seq. and prerequisites | Boundaries | Terms, notation, definitions | Provenance | Engine → placement |
|---|---|---|---|---|---|
| המשתנה; ביטויים אלגבריים: substitution and evaluation following order of operations; describe situations and patterns or sequences with expressions; the four operations plus powers 2 or 3 | 25 h for the whole unit; Dec–Feb (P7 3 h + 10 h + 8 h) | Gradual pace; meaning before procedure. Word problems integrated at every stage | משתנה: a sign standing for a numerical value that can be set or changed; letters denote variables. ביטוי אלגברי: numbers and/or variables joined by operations | A7 pp. 1–2, 3–14; cA p. 4 | A7-01, A7-02 ✓ |
| שוויון בין ביטויים אלגבריים (זהות) | Within the 25 h; Jan | At this stage, identity comes from describing the same situation in different ways, **without algebraic simplification** | Two expressions are equal (identical) when they agree for every substitution | A7 p. 15 | A7-04 ⚠ partial (see the common-factor note in the next row) |
| כינוס איברים דומים; חוק הפילוג | Within the 25 h; Feb–Mar | Rely on the laws learned in elementary school and the numeric domain; do not re-teach them. Two variables and simple fractions are allowed. **Factoring by common factor does not appear in A7, A8 or cA** | חוק הפילוג is the law to emphasise | A7 pp. 17–18 | A7-01, A7-04 ✓. ⚠ A7-04's "גורם משותף" family goes beyond the G7–8 text; factoring appears in P9A (Oct) |
| משוואות ופתרונן: the meaning of an equation and of a solution (even when the student cannot solve it); first-degree equations, including unknowns on both sides; simplifying via like terms and the distributive law; word and literacy problems | 20 h; Mar–May (P7 10 h + 3 h + 8 h). Prerequisite: addition/subtraction of directed numbers | Explain each step orally; operating on both sides preserves balance | משוואה, פתרון, נעלם | A7 pp. 20–31 | A7-03 ✓ |
| נקודות על גרף ברביע I | 5 h; May (P7 3 h) | All expressions use **only positive numbers and zero** at this stage. Start from reading a graph with no expression | Table ↔ expression ↔ point graph | A7 pp. 32–39 | A7-05 ✓ |

### 3.3 גאומטרי (geometric) — G7 pp. 1–102; cG pp. 3–4, 15–18. Overview 50 h. R7: 34 h + 16 h

| Topic / objective | Seq. and prerequisites | Boundaries | Terms, notation, definitions | Provenance | Engine → placement |
|---|---|---|---|---|---|
| זוויות: marking and comparing; measuring and estimating; angle bisector; sum and difference; adjacent and vertical angles; bisectors of adjacent angles are perpendicular; angles in equilateral, isosceles and right triangles; angle sum in a triangle and in a quadrilateral | 20 h; Sep–Nov (P7 4 h + 8 h + 8 h) | Informal reasoning only (direct comparison, symmetry). The 60° of an equilateral triangle is justified via a straight angle, because the angle sum has not been learned yet | Angle: two rays from one point (קודקוד, שוקי הזווית). Marked by one capital Latin letter, three capital letters, or a Greek letter. Types: חדה, ישרה, קהה, שטוחה; צמודות, קודקודיות | G7 p. 2, pp. 3–33; cG p. 4 | G7-04 ✓ (angle sum only). — no engine for measuring, bisector, adjacent or vertical angles |
| חפיפת צורות במישור: הזזה, סיבוב, שיקוף | 5 h; Nov–Dec (P7 2 h + 3 h) | Intuitive | Congruent shapes: one can be placed exactly on the other by moving, rotating or flipping it | G7 pp. 34–51 | G7-05 ✓ partial (no rotation) |
| שטחים א: areas in the plane and in space, including tilings and the coordinate system | 4 h; Dec–Jan | — | — | G7 p. 2, pp. 52–57 | G7-02 ✓ partial; G7-01 |
| גופים במרחב: קובייה, תיבה (after Areas A): volume, net, surface area | Part of 9 h; Jan (P7 4 h). Prerequisites: third power and cube root (integer result) | — | Volume, net (פריסה), surface area (שטח פנים) | G7 pp. 58–74; cG p. 16 | G7-01 ✓ (box). Cube and nets UNVERIFIED |
| **משפט פיתגורס ושימושיו** | 8 h (P7 March: 6 h). Prerequisites: positive square root and estimation (N78), full coordinate system | No formal proof (comes later, at a deductive stage). In complex calculations 2 digits after the decimal point suffice. A calculator may be allowed for special calculations. The converse is **not stated** | See §6 | G7 p. 2, pp. 75–81; cG p. 17; P7; R7 | G7-03 ✓ grade. ⚠ content gaps (§6) |
| שטחים ב: parallelogram (side × height to that side), trapezoid, composite areas **with Pythagoras**; heights inside or outside the shape; area of a quadrilateral with perpendicular diagonals | 4 h; Apr (P7 2 h) | — | Parallelogram: both pairs of opposite sides parallel. Trapezoid: exactly one pair parallel | G7 pp. 82–99; cG pp. 15, 18 | G7-02, G7-06 ✓ (no Pythagoras integration) |
| היקפים (continued) | May (P7 3 h) | — | — | P7; R7 | G7-01 partial |
| מנסרה משולשת ישרה (after Areas B): volume, net, surface area; express them with unknowns; use Pythagoras as needed | Part of 9 h; May (P7 5 h) | — | — | G7 pp. 100–102 | — **gap** |

### 3.4 אי־ודאות (uncertainty) — U78 pp. 1–27; cU pp. 2–5. R7 block = 5 weeks, 15 h; P7 Jan–Feb, 15 h

| Topic / objective | Seq. and prerequisites | Boundaries | Terms, notation, definitions | Provenance | Engine → placement |
|---|---|---|---|---|---|
| סטטיסטיקה: read, collect and organise data in tables, lists and diagrams (bar/"מקלות", pictogram, pie); categorical (שמיים) and quantitative data | Jan–Feb (P7 3 h); also "throughout the year" | — | משתנה; שכיחות = how many times an item appears. Three organising principles: a meaningful criterion, disjoint classes, exhaustive classes | U78 pp. 1–17; cU p. 3 | U7-01, U7-04, U7-07 ✓. ⚠ terminology: engines print "תדירות" |
| שכיחות יחסית: first **without percent** (simple and decimal fractions), then percent; compare groups | Feb (P7 5 h) | No percent at the first stage | שכיחות יחסית | U78 pp. 18–23; cU p. 2 | U7-03, U7-05, U7-07 ✓ |
| הסתברות ברמה אינטואיטיבית, in the context of relative frequency | Feb (P7 4 h) | Intuitive level. Complement and the classical definition belong to grade 8 | Probability on a 0–1 scale (certain = 1, impossible = 0); estimate it from the relative frequency of repeated trials; oral justification required | U78 pp. 24–27; cU p. 2 | U7-02 ⚠ partial: its complement and "expected count" families are grade-8 content or not in the documents |
| (Measures of centre and range) | **Grade 8** | — | — | cU p. 2; U78 p. 28+ | U7-08 ⚠ **mismatch** (duplicates U8-01 one grade early) |
| (Misleading graphs) | Not an explicit objective; only a general critical-thinking principle (cU p. 1) | — | — | cU p. 1 | U7-06 ⚠ unclear basis |

---

## 4. Grade ח׳ (8) matrix

Note: in תשפ״ז, P8 and R8 also carry transitional content (marked **T** below).

### 4.1 מספרי — N78 pp. 46–77; cN p. 3. Overview 20 h. R8: 5 weeks, 15 h; P8 Sep–Oct

| Topic / objective | Seq. | Boundaries | Terms and definitions | Provenance | Engine → placement |
|---|---|---|---|---|---|
| יחס; חלוקה ביחס נתון; פרופורציה; קנה מידה | 10 h; Sep–Oct (P8 6 h + 2 h) | These topics stand alone and also serve percent, slope, rate, probability and similarity | יחס: the quotient of two positive numbers, used for "how many times"; read left to right | N78 pp. 46–60; cN p. 3 | N8-01, N8-02, N8-03 ✓. Source attribution in targilim is the companion only (§8.2) |
| אחוזים: static; increase or decrease by a percentage (dynamic) | 10 h; Oct (P8 7 h) | — | — | N78 pp. 61–77 | N8-04, N8-05 ✓ |

### 4.2 אלגברי — A8 pp. 1–100; cA p. 3. Overview 54 h

| Topic / objective | Seq. | Boundaries | Terms and notation | Provenance | Engine → placement |
|---|---|---|---|---|---|
| גרפים שימושיים – קריאה וסרטוט: y for a given x; x for a given y; max/min; range of y over a domain | 5 h; Nov | "Domain" is limited to a segment, a ray, a finite set, or a union of these | תחום | A8 pp. 3–6 | A8-01 ✓ |
| מבוא לפונקציה; graphical representation; introduction to the algebraic representation | 6 h; Nov (P8 8 h incl. increase/decrease) | Functions are introduced through real situations | f(x), g(x) notation | A8 pp. 7–12 | A8-01 ✓ partial |
| עלייה וירידה; graphical description of linear phenomena | 4 h | — | — | A8 pp. 13–29 | — (A8-01/A8-02 partial) |
| קצב שינוי (uniform / non-uniform); שיפוע ישר; matching a line to its equation | 16 h; Nov–Dec (P8 2 h + 6 h) | — | **y = mx + b** | A8 pp. 30–73 | A8-02 ✓ |
| פתרון משוואות הכוללות הגדלה או הקטנה באחוזים | 5 h; Dec | Calculator allowed | — | A8 pp. 74–80 | — **gap** (N8-05 computes percent change but sets no equations) |
| אי שוויונות ממעלה I ופתרונן | 5 h; May (P8) | — | — | A8 pp. 81–89 | — **gap** |
| מערכת משוואות: given in explicit form (f(x)=g(x)), then two unknowns; graphical and algebraic solution; word problems | 13 h; Feb, Apr–May (P8 "basic level" 6 h, then 1 h + 10 h) | Basic level this year (P8) | Intersection point of two lines | A8 pp. 90–100 | A8-03 ✓ (word systems; graphical solution UNVERIFIED) |

### 4.3 גאומטרי — G8 pp. 1–85; cG pp. 3–4. Overview 48 h

| Topic / objective | Seq. | Boundaries | Key definitions and theorems | Provenance | Engine → placement |
|---|---|---|---|---|---|
| המעגל וחלקיו: compass work; a circle centred at the origin | Part of 10 h | — | Circle: all points at the same distance from a fixed point. מרכז, רדיוס, קוטר, מיתר, זווית מרכזית, גזרה. Every diameter is a chord (not conversely); the diameter is the longest chord | G8 pp. 3–5 | G8-06, G8-05 ✓ |
| היקף מעגל ושטחו | Part of 10 h. P8 says teach these **before** cylinder/cone if not yet learned | — | 2πr, πr²; the link to π | G8 pp. 4–6; cG p. 3 | G8-01 ✓ |
| גליל וחרוט: surface area including lateral surface (מעטפת), volume, net, axial section (חתך צירי); apply Pythagoras; unit conversion | Part of 10 h; Oct–Nov (P8 4 h + 2 h) | **Right cylinder and right cone only** | Cone volume | G8 pp. 14–19; cG p. 4 | G8-02 ✓ (cylinder). — **gap** for the cone |
| גאומטריה קדם-היסקית: parallel lines with corresponding, alternate and co-interior angles; triangle angle sum; exterior angle; triangle sides; median | 10 h; P8 Sep ("complete parallel-line angles if not learned in ז" — **T**) and Feb–Mar | — | Exterior angle = sum of the two non-adjacent interior angles. Two sides of a triangle together are longer than the third; in a right triangle the hypotenuse is longer than each leg. Median: vertex to midpoint of the opposite side | G8 pp. 20–35 | G8-03 ✓. — **gap** for exterior angle, triangle inequality, median |
| המעבר לחשיבה היסקית: deductive chain (השתלשלות היסקית); congruence SAS (צ.ז.צ), ASA, SSS; uses of congruence; isosceles triangle; kite | 20 h; Jan–Mar (P8 4 h + 12 h + 12 h) | No congruent triangles with a shared part yet. Isosceles triangle limited to results from ASA. Kite only as an application of congruence | ASA: two angles and the side between them equal → congruent. SSS: three sides equal → congruent. **ניצב-יתר** (hypotenuse-leg) is a result of SSS plus Pythagoras. Kite: the main diagonal splits it into two congruent triangles and is the perpendicular bisector of the other diagonal | G8 pp. 36–73 | G8-07, G8-08 ✓. — **gap** for proof writing and kite |
| דמיון: similar triangles; similar polygons with emphasis on rectangles | 8 h; Mar–Apr (P8 3 h + 4 h) | — | Similar triangles: equal corresponding angles and one common ratio for all three side pairs. Similarity ratio; the area ratio is the square of the ratio (cG) | G8 pp. 74–85; cG p. 3 | G8-04, G8-09 ✓ |
| **T**: השלמות משפט פיתגורס (combined with grade-7 learning) | R8: 3 weeks, 6 h; P8 Sep–Oct 4 h; assessed in task 1 (25.10–6.11.26) | Transitional year only | — | R8; P8 | G7-03 (grade 7) |
| **T**: שימוש במשפט פיתגורס במרחב | R8: 2 weeks, 6 h; P8 May 6 h, plus June review | Not in G8. It comes from OLD grade 8 (cube/box diagonals; face diagonal versus space diagonal). cG lists "Pythagoras in a box" under grade-7 box | — | R8; P8; OLD pp. 97–98; cG p. 16 | — **gap** (no 3-D engine) |
| **T**: טרנספורמציות, צורות חופפות | P8 Nov 5 h | Grade-7 content in the update | — | P8; R8 | G7-05 (grade 7) |

### 4.4 אי־ודאות — U78 pp. 28–63; cU p. 2. R8: 8 + 12 + 4 + 6 = 30 h

| Topic / objective | Seq. | Boundaries | Key definitions | Provenance | Engine → placement |
|---|---|---|---|---|---|
| **T**: איסוף וקריאת מידע, שכיחות, שכיחות יחסית | P8 Oct–Nov 3 h + 5 h | Grade-7 content in the update | — | P8; R8 | U7-01, U7-03, U7-07 (grade 7) |
| טווח נתונים ומדדי מרכז (שכיח, חציון, ממוצע) | Dec–Jan (P8 6 h + 6 h) | — | Range = largest minus smallest value (a rough spread measure). Median is defined for quantitative data only. Mean = sum ÷ count. Deviations from the mean sum to 0. Effect of changing the data; mean from a frequency table; in a symmetric distribution mean = median | U78 pp. 28–42 | U8-01 ✓ |
| הסתברות: basic concepts, calculation, complementary outcome (תוצאה משלימה); "deepened in ט" | Mar (P8 6 h) | — | Symmetric outcomes: each has probability 1/n, and an event made of k of them has k/n. An outcome and its complement sum to 1. Estimate via relative frequency. Oral justification | U78 pp. 43–49 | U8-02 ✓; U7-02 complement family belongs here |
| אינטרפולציה; אקסטרפולציה | Jan (P8 4 h) | — | — | U78 pp. 50–55 | — **gap** |
| פירוש נתונים משני מקורות מידע | Jan (P8 6 h incl. measures) | — | — | U78 pp. 56–63 | — **gap** |

---

## 5. Grade ט׳ (9) — two current plans, no engines

**Engine column: none for every row.** targilim has no grade-9 engine, and CURRICULUM_MAP blocks grade-9 generation.

### 5.1 P9A — regular plan, תשפ״ז

**General emphases**
- Geometry is adapted for students heading to 4 units: graded questions, medium complexity, plane geometry combined with the coordinate system.
- Algebraic technique comes at the start of the year; laws of exponents come in the third trimester.
- The 30-60-90 triangle is taught in grade 9.
- **Not taught in תשפ״ז at this level:** midsegment of a triangle and of a trapezoid (קטע אמצעים).

| Month (h) | Domain | Topic | Detail and boundaries (paraphrased) |
|---|---|---|---|
| Sep (10) | Algebraic 6 | טכניקה אלגברית | Extended distributive law (simplify, solve equations, compare areas). Short multiplication formulas, developed algebraically and illustrated geometrically. Laws of exponents only at a basic level, as needed for the technique |
| Sep | Geometric 4 | דלתון | Kite, its angles, main diagonal; place it in the coordinate system |
| Oct (20) | Algebraic 12 | technique, continued | Factoring: common factor; quadratic trinomial with leading coefficient 1; short multiplication formulas. Basic quadratic equations by factoring. Reduce, multiply and divide algebraic fractions |
| Oct | Geometric 8 | משולש שווה שוקיים | Converse theorems to prove a triangle is isosceles. Grade 8 had only the coincidence of apex bisector, altitude and median to the base. Coordinate system |
| Nov (22) | Algebraic 14 | פונקציה ריבועית; משוואות ריבועיות | f(x)=ax², a≠0 (a used only to decide max or min, **not** stretch or compress). Qualitative properties from a graph (extremum, increase/decrease, axis intersections, sign). Shifts: ax²+k, a(x−b)², a(x−b)²+k. Product form and standard form. Quadratic formula for ax²+bx+c=0. Sketch from the standard form. **No need to convert between representations** |
| Nov | Geometric 2 + 2 + 4 | יחסי צלעות וזוויות; משולש ישר זווית 30°-60°-90°; ישרים מקבילים, טרפז | See theorem list below. Converse of the parallel-lines theorem. Co-interior angles **not mandatory**. Trapezoid, isosceles trapezoid, proving a quadrilateral is a trapezoid, trapezoid area and perimeter |
| Dec (15) | Algebraic 6 + 3 | Quadratic equations, applications; quadratic inequalities | Inequalities only in the context of the quadratic function |
| Dec | Geometric 2 + 4 | Trapezoid, continued; מקבילית | Definition; properties of sides, angles and diagonals; converse theorems; coordinate system |
| Jan (21) | Algebraic 8 | משוואות רציונליות | Factorised denominators; domain of substitution; includes an inadmissible solution |
| Jan | Geometric 6 + 2 | Parallelogram, continued; מלבן | Definition, properties, converse theorems |
| Jan | Uncertainty 3 | הסתברות | Basics, **including completing grade-8 material**. Relative frequency, complementary event, two-stage events; table, tree diagram, area model; review statistics |
| Jan | Algebraic + geometric 2 | Integrative literacy tasks | — |
| Feb (20) | Algebraic 6 | מערכת משוואות ממעלה שנייה | Algebraic and graphical meaning (two parabolas; parabola and line) |
| Feb | Uncertainty 10; Geometric 4 | Probability, continued; rectangle, continued | — |
| Mar (18) | Algebraic 12 | תכונות של פונקציה | Axis intersections, sign intervals, extremum points, increase/decrease, equations versus graph, vertical and horizontal shift, reflection in the x-axis. Local versus absolute extremum (from the graph only). An extremum point is an ordered pair; the max/min value is its y-coordinate. Cases with no extremum. Sketch from given properties. Students tend to shift right when a>0 |
| Mar | Geometric 4 + 2 | מעוין; ריבוע | Definition, properties of sides, angles and diagonals; converse theorems |
| Apr (5) | Geometric 2 + 3 | Square, continued; **התיכון ליתר** in a right triangle | Practised together with quadrilaterals |
| May (19) | Algebraic 5 | חוקי חזקות | Natural or zero exponents; square-root laws; **do not teach negative exponents** |
| May | Algebraic 10 | שאלות מילוליות | Including quadratic equations or second-degree systems; geometric, general, motion and percent problems; literacy |
| May | Geometric 4 | דמיון משולשים | Area ratios of similar triangles |
| Jun (12) | — | Completions and review | — |

**Theorems stated in P9A**
- **Side–angle relations.** In a triangle with two unequal sides, the larger angle is opposite the larger side. Conversely, the larger side is opposite the larger angle.
- **30-60-90 triangle.** In a right triangle with a 30° angle, the leg opposite that angle is half the hypotenuse.
- **Converse of 30-60-90.** In a right triangle where a leg is half the hypotenuse, the angle opposite that leg is 30°.
- Teach these within the equilateral triangle.

### 5.2 P9B — reduced plan (מצומצמת), תשפ״ז

**Audience.** Students planned for 3 units in high school. Aligned with the new high-school curriculum. At most 25% of the cohort.

**Emphases**
- Literacy and real-world contexts.
- Computational questions, not only algebraic ones.
- Technological and concrete aids.
- Reading data.
- Linear function taught **without** technique or formulas.
- Quadratic function taught only partially.

| Month (h) | Domain | Topic | Detail and boundaries |
|---|---|---|---|
| Sep (10) | Algebraic 6 | קריאת גרפים | Phenomena shown by graphs |
| Sep | Geometric 4 | גאומטריה חישובית – משולש | Angle sum, area, perimeter, special segments, coordinate system |
| Oct (20) | Algebraic 10 | פונקציה קווית | Slope as rate of change; algebraic and graphical representations; point on a line; intercepts; parallel lines. Slope from two points, line through two points and point-slope form **only where time allows**. Do not focus on the slope formula |
| Oct | Algebraic 5 | טכניקה אלגברית | Distributive law and extended distributive law; simple equations |
| Oct | Geometric 2 + 3 | Computational triangle, continued; **משפט פיתגורס** | Side calculations in triangles and in composite shapes; perimeters and areas. Integrate with functions and later with similarity. **Practise cases where the root is not an integer** |
| Nov (22) | Uncertainty 6 | סטטיסטיקה | Tables, lists, diagrams; frequency and relative frequency; range, mean, mode, median |
| Nov | Geometric 3 + 6 | Pythagoras, continued; kite and isosceles triangle | Special lines, angles, converse theorems; kite properties; area and perimeter calculations |
| Nov | Numeric 7 | אחוזים | Part, whole, increase/decrease; simple word and literacy problems |
| Dec (15) | Uncertainty 8; Geometric 7 | Statistics, continued; דמיון משולשים | Enlarging and reducing; proportional sides; **AA (ז.ז)**; side and angle calculations. Taught because it is part of the 3-unit level |
| Jan (21) | Geometric 6; Algebraic 6; Uncertainty 9 | Parallel lines and parallelogram; equations; probability | First-degree equations with a numeric denominator; probability basics, link to relative frequency, complementary event |
| Feb (20) | Uncertainty 4; Geometric 6; Algebraic 10 | Probability; rectangle; quadratic function and equations | Substitute x to get y; solve by the quadratic formula; **properties of the quadratic function not taught this year** |
| Mar (18) | Algebraic 4 + 8; Geometric 6 | Quadratic, continued; word problems; rhombus | Rhombus area as half the product of the diagonals; integrate Pythagoras |
| Apr (5) | Geometric 5 | ריבוע | Including area via the diagonals; Pythagoras |
| May (19) | Algebraic 7; Geometric 4 + 8 | Literacy word problems; trapezoid; areas and perimeters, including the circle | — |
| Jun (12) | — | Review | — |

### 5.3 PROF9 (+ sub-profiles) — minimum for students heading to at most 4 units (26/3/2025)

- **Scope.** Minimal topics in three areas: algebraic technique, functions and geometry. Statistics and probability follow the תשפ״ה plans.
- **Geometry (PROF9-G p. 1)**
  - Properties and theorems, including converses, applied in calculation and proof.
  - Low complexity: about 2–3 steps per item. Complex proofs are split into sub-items.
  - Plane geometry combined with the coordinate system.
  - Middle-school tools are limited to:
    - coordinates;
    - slope, **for parallelism only, not perpendicularity**;
    - lengths of segments parallel to an axis, with **non-parallel segments via Pythagoras**.
  - **Do not use the midpoint or distance formulas in middle school.**
- **Functions (PROF9-F)**
  - Continuous graphs only.
  - Axis intersections, positive and negative intervals, local versus absolute extremum.
  - Number of solutions of f(x)=n, read from the graph.
  - Shifts f(x)+k and f(x−m).
  - f(x)=x², −x², x²+k, (x−m)², (x−m)²+k.
  - Axis of symmetry and vertex.
  - From the quadratic function to quadratic equations.
- **Algebra (PROF9-A)**
  - Extended distributive law, illustrated with rectangle areas. "No need for high difficulty or fractions."
  - Factoring by common factor.
  - Factoring by short multiplication formulas.
  - Equations.

### 5.4 OLD grade-9 chapter (pre-update; background only), pp. 101–158

- Two parallel domains:
  - **Algebra including probability, 90 h:** powers and roots 20, probability (including conditional) 15, algebraic technique 20, quadratic functions 30, applications 5.
  - **Geometry, 60 h:** kite and isosceles triangle 10, basic constructions 12, parallel lines and trapezoid 8, parallelogram 10, rectangle 8, proof by contradiction 4, rhombus and square 8.
- Pitched at the level of "הקבצה א".
- Pythagoras appears only as a fact to be used (p. 116), and in the roots chapter as a way to construct square-root lengths (p. 105). It is **not** a grade-9 chapter.
- No sequences chapter. No "advanced circle" chapter.

---

## 6. Pythagoras — official placement versus the district page versus targilim

### 6.1 Grade placement

| Source | Placement |
|---|---|
| G7 (current) | Grade 7: "משפט פיתגורס ושימושיו", 8 h, followed by Areas B (composite, with Pythagoras) and the triangular prism |
| R7 / P7 | Last geometry block of grade 7. P7 has it in **March**, 6 h |
| N78 p. 1, p. 42 | Square root must be taught first |
| R8 / P8 (תשפ״ז only) | Completions (Sep–Oct, 4 h, assessed in task 1) and Pythagoras in space (May, 6 h) |
| G8 | Pythagoras is used in cylinder/cone axial sections, and HL congruence = SSS + Pythagoras |
| P9B | Taught in the reduced grade-9 plan (Oct–Nov, 6 h) and integrated into the quadrilaterals |
| OLD | Grade 8, 12 h, "in the plane and in space, cylinder" |

**District page.** `/chativat-beynayim/h/topics/h-pythagoras/` sits under **grade ח** (topic `h-pythagoras`, order 13, 15 resources).
- Its featured resource, the booklet "משפט פיתגורס — החוברת המלאה" (53 A4 pages, fetched live from GitHub Pages via `src/components/PythagorasNative.astro`), is attached to grades **ז, ח and ט** (`resources.json` gradeIds z/h/t).
- The booklet manifest tags every page `g7.geo.pythagoras`, and the sampled page headers read "גאומטריה ז".
- So the content is grade-7 material, filed for grade 8 as well.
- `src/lib/nativeWorkbooks.ts` deliberately does not list Pythagoras.

### 6.2 Official objectives and conventions (G7 pp. 75–81, October 2026 edition; cG p. 17)

**Objectives**
- Uses the full coordinate system, squaring and the positive square root.
- The theorem is accepted on the basis of simple area calculations and area-equivalence activities. There is **no formal proof**; it comes later, at a deductive stage.
- Find the third side of a right triangle from the other two.
- Find the length of a segment on the coordinate grid **even when it is not parallel to an axis**. Do this by computing the hypotenuse of a right triangle whose legs are parallel to the axes, with the drawing attached.
  - The October edition adds this explicit wording. The May edition already mentioned segments not parallel to an axis.
  - PROF9-G forbids the distance formula in middle school.

**Accuracy and calculator**
- In complex calculations, 2 digits after the decimal point are enough.
- Discuss practical versus absolute precision.
- A calculator is allowed for special calculations. The October edition adds this explicitly; cG already had it.

**Statement and converse**
- **The converse is not stated** in G7, G8, cG or OLD.
- A formal statement is printed only in OLD (grade 8): in a right triangle, the sum of the squares of the legs equals the square of the hypotenuse, a²+b²=c².
- HL congruence: two right triangles with an equal leg and an equal hypotenuse are congruent (OLD; G8 p. 64).

**Official example types**
- Coordinate distance, e.g. A(5,7)–B(0,0).
- Rectangle diagonals from vertex coordinates, e.g. (−1,3), (6,3), (6,8), (−1,8).
- A ladder whose foot is 50 cm from the wall and whose top is 1.5 m high, then slides to 60 cm. Note the deliberately mixed units.
- A square on a grid with an interior point, using the areas of triangles.
- Summary question (cable-stayed bridge, tower 60 m):
  - 80 m from the tower base → cable 100 m;
  - a 61 m cable → horizontal distance 11 m;
  - the question asks for the **square** of a cable length (7200) rather than its root;
  - 25 m from the base → cable 65 m;
  - compare alternatives: option B is **15 m** in the October edition and **35 m** in the May edition.
- A GPS task.
- Units used: ס"מ, מ', יח"ר. Answers are multiple-choice or open with full working.

### 6.3 District booklet conventions (18 of 53 pages sampled through WebFetch summaries)

Sampled pages: 1, 5, 8–11, 15, 17, 20, 21, 27, 33–35, 41, 43–48, 50, 53. The other pages are UNVERIFIED.

**Terminology**
- **ניצב / ניצבים, יתר, אורך היתר, זווית ישרה**, marked with a small square at the vertex.
- Theorem phrasings: "the sum of the squares of the legs equals the square of the hypotenuse" (p. 48); "leg² + leg² = hypotenuse²" (p. 15).
- **a²+b²=c²**, where c names the hypotenuse only when that letter is on the side opposite the right angle (p. 15).
- Rule of thumb (p. 20): looking for the hypotenuse → add; looking for a leg → subtract. Written as x²=9²+12² or x²=25²−7².

**Layout and answers**
- One step per line, x² rewritten on each line, equal signs aligned (p. 17), then x = √….
- Exact answers in √ form, e.g. a hypotenuse of √13 cm (pp. 33, 45, 48).
- Or decimals to **2 places** with ≈ (pp. 10, 11, 47, 50).
- Reported inconsistency: the p. 21 answer key gives √130 ≈ 11.4 (one decimal; UNVERIFIED formatting).
- Roots are bracketed between consecutive integers, e.g. 4<√20<5 (p. 10), with a calculator check.

**Units**
- ס״מ, מ׳, סמ״ר, מ״ר, "יחידות" / "יחידות אורך" for grid problems.
- Explicit warning to watch units when cm and m are mixed (p. 50).

**Converse**
- **Not stated** on any sampled page.
- p. 48(c) asks whether a triangle with vertices at the origin, (8,1) and (2,9) is right-angled "using Pythagoras", which uses the converse implicitly.

**Question types**
- Identifying legs and the hypotenuse; correcting a wrong labelling (p. 5).
- Right-angle concept (p. 1).
- Computing roots and their non-negativity (p. 8).
- Equations x²=a with ± solutions and approximations (pp. 9, 11). This goes beyond the grade-7 text, which only notes that a positive number has two square roots; UNVERIFIED as an official grade-7 objective.
- Writing the Pythagoras equation and fixing errors (p. 15).
- Mixed hypotenuse/leg practice (pp. 17, 20).
- Find x from triples (p. 21).
- Composite figures (p. 27).
- Choose the triangle whose hypotenuse is √13 (pp. 33, 45, 48).
- Rectangle-midpoint and trapezoid perimeter (p. 34).
- Area of the square on the hypotenuse (p. 35).
- Isosceles triangle with an altitude, giving a base of 12 (p. 41).
- Two-equation set-up (p. 43).
- Rectangle problem from area and side, giving a triangle perimeter of 60 m (p. 44).
- Curriculum questions on the coordinate grid: distance, rectangle diagonals, classifying the triangle A(2,3), B(5,−1), C(−2,0) (pp. 45–48).
- Ladder (p. 50).
- Cable bridge in the **May-edition version** (p. 53).

### 6.4 targilim G7-03 versus the official objectives (`generator/engine/pilot-g7-03.js`)

- **Grade is correct** (7).
- **Families:**
  - find hypotenuse or leg, from 8 integer triples;
  - check whether a triangle is right-angled (the converse, which is **not an official grade-7 objective**);
  - rectangle diagonal (3 fixed rectangles).
  - Units are always ס״מ.
- **Missing compared with G7/P7/PROF9-G:**
  - coordinate-grid segment length (with no distance formula);
  - non-integer roots, with a choice between exact √ and 2-decimal rounding;
  - applied contexts (ladder, bridge, ramp, GPS) and mixed units;
  - composite areas (Areas B), the triangular prism and Pythagoras in a box (grade-8 "space" in תשפ״ז);
  - cylinder/cone axial-section items (G8);
  - squared-length answers (e.g. C² = 7200).

---

## 7. Grade-placement and terminology mismatches (targilim versus the current documents)

| Engine | targilim placement | Current documents | Verdict |
|---|---|---|---|
| U7-08 mean, median, range | Grade 7 | Range and measures of centre are **grade 8** (cU p. 2; U78 p. 28+; P8 Dec–Jan) | **Mismatch.** Duplicates U8-01 |
| U7-02 basic probability: die, bag, **complement**, expected count | Grade 7 | Grade 7 = intuitive probability through relative frequency. The complementary outcome and the classical definition are grade 8 (U78 pp. 43–45; cU p. 2). "Expected count" does not appear | **Partial mismatch** |
| A7-04 equivalent expressions, **common factor** | Grade 7 | Factoring by common factor is absent from A7, A8 and cA. It appears in P9A (Oct) and PROF9-A | **Beyond grade 7** (verify what the family actually generates) |
| G7-03 check-right-triangle family | Grade 7 | The converse is not stated in any official document; the booklet uses it implicitly | **Unclear basis** |
| U7-06 misleading graphs | Grade 7 | Only a general principle (cU p. 1); no objective in U78 | **Unclear basis** |
| U7-05 pie chart and central angle from a percentage | Grade 7 | Pie charts and percent for relative frequency are grade 7. The circle and central-angle concept is formally G8 geometry | Agree (borderline) |
| G7-05 transformations | Grade 7 | Grade 7; in תשפ״ז also taught in grade 8 (P8 Nov, transitional) | Agree; rotation is missing |
| G8-03 parallel-line angles | Grade 8 | G8 pre-deductive section; P8 Sep completion | Agree |
| All other engines | — | — | Agree (see §3–§4) |

**Terminology**
- U7-01 / U7-07 (and helpers) print **"תדירות" / "טבלת תדירות"**. The official documents use **"שכיחות" / "שכיחות יחסית" / "טבלת שכיחויות"**; "תדירות" occurs 0 times across the ten update documents.
- Official grade-8 line form: **y = mx + b**. A8-02 uses m and b, so it is consistent.

---

## 8. Gaps

### 8.1 Official objectives with no engine

- **Grade 7**
  - Extending the coordinate system to all quadrants.
  - Angle measurement, bisector, adjacent and vertical angles.
  - Rotation.
  - Tilings and area on the grid.
  - Triangular prism (volume, net, surface).
  - Pythagoras on the coordinate grid, with non-integer roots and applied contexts (G7-03 is too narrow).
  - Area of a quadrilateral with perpendicular diagonals.
- **Grade 8**
  - Increase/decrease of functions and linear phenomena (only partially covered).
  - Equations with percent change.
  - **First-degree inequalities.**
  - Graphical solution of systems (UNVERIFIED).
  - **Cone.**
  - Exterior angle; triangle inequality; median.
  - Deductive proof writing.
  - Kite.
  - **Interpolation, extrapolation, and two data sources.**
  - Pythagoras in space (transitional, תשפ״ז).
- **Grade 9 — everything** (no engine).
  - **P9A:** extended distributive law; short multiplication formulas; factoring; algebraic fractions; quadratic function (shifts, product and standard forms, quadratic formula); quadratic inequalities; rational equations; second-degree systems; function properties and reflection; exponent laws (no negative exponents); word problems; kite; isosceles converses; side–angle relations; 30-60-90 and its converse; parallel-lines converse; trapezoid; parallelogram; rectangle; rhombus; square; median to the hypotenuse; area ratios of similar triangles; probability (two-stage events, tree diagram, area model).
  - **P9B:** reading graphs; linear function (no formulas); computational triangle; Pythagoras; statistics; percent; AA similarity; quadrilaterals with Pythagoras; quadratic formula without properties; literacy word problems; circle perimeter and area.

### 8.2 Engines whose source basis is superseded or unclear

1. **45 engines cite May-2026 editions that have since been re-issued** at the same URLs:
   - G7-01…06 (file 03);
   - G8-01…09 (file 04);
   - A7-01…05 (file 01);
   - A8-01…03 (file 02);
   - N7-01, N7-03…13 (file 05);
   - U7-01…08 and U8-01/02 (file 06).
   - Topic lists and hours are unchanged, but wording and examples changed (word similarity 0.86–0.89). G8 is 8 pages shorter. G7's Pythagoras text was expanded and its cable-bridge example changed.
2. **N8-01…05 cite only file 07**, the numeric *companion*. The detailed grade-8 numeric objectives and examples are in the domain document's grade-8 section: N78 pp. 46–77 now, pp. 47+ in intake 05. Intake 05 is mislabelled "grade-7" and its learning note does not mention grade 8.
3. **U7-06** and the **G7-03 check family** have no explicit objective (§7).
4. **U7-08, U7-02 (part) and A7-04 (part)** are misplaced by grade (§7).

### 8.3 targilim documentation inconsistencies (read-only observations)

- **`curriculum-map/CURRICULUM_MAP.md` v1.1**
  - Its grade-7/8 structure follows the **superseded** program: three rounds, "functions in grade 7, 38 h", "angles between parallel lines also grade 7", "quadrilaterals" and "circle intro" in grade 7, old hours 68/30/52 and 58/54/38.
  - Its "Critical corrections" table applies the old program **over** the update documents, which is the wrong direction.
  - **Its grade-9 list is unsupported by any document:** exponent laws with integer exponents 10 h, quadratic functions 25, quadratic equations 20, complex probability 20, arithmetic and geometric sequences 15, formal proofs 20, advanced circle 20, constructions 10, Pythagoras formal proof 10.
  - Compare OLD p. 102 and P9A/P9B in §5.
- **`source-learning/2026-06-09/00_official_curriculum_7_9.learning.md`**
  - It treats OLD as the highest authority.
  - Its grade-9 geometry claims are not in OLD: "advanced circle: tangent, central and inscribed angles" and "Pythagoras — formal proof".
  - Its claim of conditional probability in grade 9 does match OLD p. 106.
  - `sources/official/SOURCE_REFERENCE.md` itself says the PDF and notes were never in the handoff.
- **`docs/SOURCE_ALIGNMENT.md`** puts CURRICULUM_MAP third in the authority order, so these errors can propagate.
- **`10_grade-8_teaching_sequence…learning.md`** is broadly right, but it calls the Pythagoras completions just "geometric completions" and omits cylinder/cone.

---

## 9. Unverified or not done

- P7/P8/P9A/P9B have no internal date (Google-Docs export). Their "תשפ״ז" and assessment dates come from the text.
- Formal "approved" wording: the domain documents print no approval line. Their status comes from the portal heading ("החל משנת תשפ״ז") and P7 ("נכנסת תוכנית לימודים מעודכנת").
- Whether OLD is the "detailed curriculum" that P9A/P9B point to is UNVERIFIED.
- The content of the 35 unsampled booklet pages. Whether the cube or net are covered by G7-01. Whether A8-03 has a graphical family.
- The jerusalem2 `/prisot/prisa-*` route pages were not inspected.
- Portal-only links and the `orianut9A/B` attachments were not fetched.
- Edition comparison used text extraction; a few Hebrew lines are bidi-scrambled in extraction. Page numbers are for the fetched 2026-11-12 editions.
