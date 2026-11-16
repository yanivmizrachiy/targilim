> **הקשר היסטורי בלבד, 16.11.2026.** הדוח יובא מספריית הקבצים של המשתמש, ולא נערכה כתיבה מחדש של ממצאיו. זהו snapshot חקירה, לא SOURCE_OF_TRUTH ולא עדות שהממצאים עדיין קיימים בענף הנוכחי. מקור אמת קנוני: RULES.md; אין להשתמש בממצאים כדי לעקוף PRים קיימים או לפרוס. יש להשוות כל בעיה לקוד ול-PR עדכניים לפני שינוי.

# תחקיר עומק — מחולל התרגילים Targilim

**תאריך:** 16.11.2026  
**סטטוס:** ביקורת קריאה בלבד; לא בוצעו שינויי קוד, מיזוגים, פריסות או בדיקות חדשות ב־Production.  
**ריפו ראשי שנחקר:** https://github.com/yanivmizrachiy/targilim  
**אתר שהוגדר לפרסום:** https://yanivmizrachiy.github.io/targilim/

## 1. מתודולוגיה ומגבלות

- נבדקו ישירות דרך חיבור GitHub: מטא־נתוני הריפו, קובצי קוד מרכזיים, עץ הקבצים, ענפים, PRs, קובצי בדיקה ו־GitHub Actions; נבדקו גם שלושה ריפוזיטוריז קשורים.
- ביקורת הביצועים והמתמטיקה המספרית מסתמכת על דוח שנערך ב־12.11.2026 בענף PR #57. **לא הורצו מחדש כאן 12,000 התרגילים**. חלק מהממצאים אומתו שנית בקריאת קוד פעיל.
- נסקר מדגם של 100 הרצות Actions האחרונות מתוך 2,225 שהוצגו ב־GitHub. התוצאות לגבי המדגם אינן סטטיסטיקת ההיסטוריה כולה.
- סביבת הביצוע לא הצליחה לשכפל את GitHub ישירות (פתרון שם נכשל), והאתר החי לא היה נגיש לכלי הדפדפן הזמין; אין טענה לבדיקה חזותית או Production חדשה.
- מסמכי תוכנית הלימודים נבדקו דרך דוח מיפוי מ־12.11 ואתר המחוז. לא בוצעה השוואת PDF עצמאית מלאה במסמך זה.

## 2. תמונת מצב מדויקת

| מדד | נתון | מקור |
|---|---:|---|
| HEAD של `main` | `2e8f163d91317c487dbae5fa0a963b8984cbead1` | GitHub branch main |
| תאריך הקומיט ב־main | 22.09.2026 | GitHub |
| תוכן עץ הריפו | 422 פריטים: 360 blobs ו־62 trees | Git tree של HEAD |
| מנועי `-ENGINE` רשומים | 50 | `generator/engine/source-registry.js` |
| כיתה ז׳ / ח׳ | 31 / 19 | חישוב עצמאי על registry |
| תחום מספרי / גאומטרי / אי־ודאות / אלגברי | 17 / 15 / 10 / 8 | registry |
| נושאי ממשק בפועל | 61 לפי מדידה של הביקורת מ־12.11 | MODULE_AUDIT, PR #57 |
| ענפי Git | 20 | API |
| PRs פתוחים | 7 | API |
| Branch protection / rulesets | `protected=false` / אין rulesets | API |
| הרצות Actions בהיסטוריה | 2,225 | API |
| מדגם 100 הרצות אחרונות | 36 success, 59 failure, 1 cancelled, 4 skipped | API |
| שדרוג A4 ומסמכים | בענף #57, לא מוזג | API |
| מנועי כיתה ט׳ | 0 | registry |

**הבחנה חשובה:** 50 הם מזהי ENGINE; 61 הוא מספר נושאי ממשק שנמדד בטוען הדפדפן המלא. אין לבלבל בין השניים.

## 3. ליקויים קריטיים בקוד `main`

### P0 — דליפת תשובות ברב־ברירה

`generator/engine/question-types.js` כותב `mcq-correct` ישירות ל־`questionHTML`, כלומר ל־HTML שנועד לתלמיד. `generator/index.html` כולל CSS שצובע את המחלקה הנכונה בירוק; ב־`generator/style.css` קיים כלל `@media print` שחושף רכיבי `.answer`. מצב שאלה יחידה עוקף את עטיפת ה־worksheet שבה הסתרת הסימון נעשית באמצעות CSS. יש לבנות מודל נתונים עם `studentHTML` נטול תשובות ומפתח פתרונות נפרד, ולא להסתמך על CSS כהגנה.

מקורות: [question-types.js](https://github.com/yanivmizrachiy/targilim/blob/main/generator/engine/question-types.js), [core.js](https://github.com/yanivmizrachiy/targilim/blob/main/generator/core.js), [style.css](https://github.com/yanivmizrachiy/targilim/blob/main/generator/style.css).

### P0 — שגיאות מתמטיות ושרטוטים

בדוח מדגם 12,000 יצירות נמצאו דוגמאות שבהן שרטוט G8-07 אינו תואם את משפט החפיפה בתשובה; שאלות עם סעיפי משנה מרובים ואפשרויות MCQ בודדות; ואפשרויות כפולות. הוכנו תיקונים ב־[PR #58](https://github.com/yanivmizrachiy/targilim/pull/58) עם בדיקת `verify:deep` מוצלחת ב־GitHub, אך PR זה **עדיין לא מוזג**.

### P1 — בדיקות שאינן משחזרות את Production

`tools/engine-load.mjs` אינו טוען את `generator/engine/pattern-engine.js` ואת `core.js`/`exercise-set.js`. הוא קורא חלק מהמנועים ישירות דרך `callEngine` ולכן יכול לפספס תקלות שהמשתמש יראה. דוח הביקורת מצא 5,426 החזרות `null` בקריאות החוזרות דרך הממשק הלא־מלא של harness מתוך 12,000, לעומת אפס במסלול הדפדפן המלא. `verify-copy-export` מדלג על מקרי `null` במקום להיכשל. זהו פער משמעותי בתוקף ההוכחה של `verify:deep`.

מקור: [engine-load.mjs](https://github.com/yanivmizrachiy/targilim/blob/main/tools/engine-load.mjs), [MODULE_AUDIT](https://github.com/yanivmizrachiy/targilim/blob/feat/workbook-vertical-slice/docs/audits/MODULE_AUDIT_20261112.md).

### P1 — רמות קושי ומגוון

נמצאו שני בוררי קושי (`#sl`, `#selDiff`) שמוזנים באופן שונה במסלול שאלה יחידה לעומת דף תרגילים. 11 מנועים הציגו שתי רמות או יותר דומות מאוד במדידה. ב־166 מתוך 600 צירופים של מנוע/רמה/סוג שאלה פחות מ־50% מ־20 יצירות היו ייחודיות. התוצאות מבוססות על מדידות הביקורת מ־12.11, ולא על ריצה עצמאית כעת.

### P1 — מצב שאלות וממשק

`E.updatePanel` ב־`pattern-engine.js` בודקת רשימה סגורה של 25 מנועים; עוטפי המקורות האחרים רושמים את עצמם ברשימה אחרת. כתוצאה מכך, בקרות סוג שאלה וקושי מוסתרות עבור 25 מנועים אחרים לפי דוח הביקורת.

## 4. ממצאים נוספים בענף #57 — חשוב לתקן לפני מיזוג

### P0/P1 — הזרקת HTML דרך קישור שחזור

בקובץ `generator/workbook/controls.js`, `restoreFromHash()` קוראת מזהי נושאים מתוך fragment של כתובת URL. אחרי `waitFor` גם כאשר לא זוהה נושא, ביצירת רשימת נושאים מרובה נשמרת תווית ברירת מחדל שמגיעה מהכתובת. `renderChips()` מכניסה `t.label` לתוך `innerHTML` ולתוך מאפיין `aria-label` ללא escaping. זהו מסלול סטטי אפשרי ל־DOM XSS אם קוראים קישור שחזור שיצר צד שלישי. **לא בוצעה הוכחת ניצול בדפדפן**. יש לחסום מזהים לא מוכרים, להשתמש ב־`textContent` וב־`setAttribute`, ולהוסיף בדיקות אוטומטיות ל־URL בלתי מהימן.

מקור: [controls.js](https://github.com/yanivmizrachiy/targilim/blob/feat/workbook-vertical-slice/generator/workbook/controls.js).

### P1 — סתירה בחוזה שחזור Seed

`generator/workbook/rng.js` מצהיר שהגדלת מספר התרגילים אינה משנה את התרגילים הקודמים. אך ב־`composeDocument()` של `generator/exercise-set.js` זרע הבסיס מחושב מהקוד **וגם מ־`o.count`**. מכאן ששינוי הכמות משנה את כל זרעי תתי־היצירה. יש לייצב פריטים לפי קוד/מזהה־נושא/מספר־שאלה, ולבדוק prefix identity כאשר מגדילים את כמות השאלות.

בנוסף, ב־`tools/verify-workbook.mjs` נכתב במפורש ששחזור באותו session עשוי להיות שונה עבור מנועים עם מוני מודול; בדיקת השחזור כיום מבצעת טעינה חדשה, ואינה דורשת תיקון של המונים הללו. יש להכריע אם חוזה המוצר מחייב גם שחזור בתוך אותו session.

מקורות: [rng.js](https://github.com/yanivmizrachiy/targilim/blob/feat/workbook-vertical-slice/generator/workbook/rng.js), [exercise-set.js](https://github.com/yanivmizrachiy/targilim/blob/feat/workbook-vertical-slice/generator/exercise-set.js), [verify-workbook.mjs](https://github.com/yanivmizrachiy/targilim/blob/feat/workbook-vertical-slice/tools/verify-workbook.mjs).

### P1 — כיסוי מתמטי עצמאי מוגבל

בענף M1 התשתית החדשה כוללת `verify()` עצמאי ל־G7-03 ול־N8-04 בלבד. שאר הנושאים עדיין עוברים דרך מנועי legacy/source-fit; ההפרדה של התשובות מתבצעת בחלקם באמצעות regex על ה־HTML. PR #61 התחיל אימות משפחות משוואות של A7-03, אך הוא Draft ואינו מכסה את כל 50 המנועים. אי אפשר להגדיר את כל התרגילים כמאומתים באופן מתמטי עצמאי.

### P2 — PDF, הדפסה ונגישות

PR #57 מספק דפי A4 מסודרים ומשתמש ב־snapDOM וב־jsPDF ל־PDF מבוסס תמונה. הטקסט בקובץ שהורד אינו ניתן לבחירה רגילה. `Print → Save as PDF` נותן חלופה וקטורית. הבדיקות של PR #57 כיסו 8 מקרי דפדפן והשוואת דפים, אך לא Safari, Firefox, מדפסות פיזיות וקוראי מסך. טוען ה־PDF תלוי ב־CDN צד שלישי (עם SRI), ולכן צריך לבדוק התנהגות ללא רשת. האלגוריתם `pack()` משתמש ב־CSS zoom במקרה של בלוק גבוה מדי, דבר המחייב בדיקה מול מדיניות העיצוב שאוסרת הקטנת טקסט כדי לדחוס לדף.

מקור: [book.js](https://github.com/yanivmizrachiy/targilim/blob/feat/workbook-vertical-slice/generator/workbook/book.js), [evidence](https://github.com/yanivmizrachiy/targilim/blob/feat/workbook-vertical-slice/docs/evidence/2026-11-12-workbook-slice/README.md).

## 5. CI, פריסה ותשתית

- `main` אינו מוגן ב־GitHub; אין Ruleset פעיל. לפיכך דרישת האישור המפורש אינה נאכפת טכנית.
- `.github/workflows/deploy-pages.yml` רץ ב־push ל־main ואינו תלוי בהצלחת `verify:deep`; הוא מאמת רק שקיים `generator/index.html` ומעתיק 10 קובצי מקור לאתר.
- `.github/workflows/pages-healthcheck.yml` בודק HTTP וקובץ JSON סטטי `site-health.json` שבו `activeSlices:25`, ולא את מספר המנועים האמיתי או תקינות יצירת התרגילים.
- 100 הרצות Actions האחרונות: 36 הצליחו, 59 נכשלו, אחת בוטלה וארבע דולגו. מרבית הכישלונות במדגם הגיעו מ־workflowים היסטוריים שמנסים לבחור מזהי נושאים שכבר אינם גלויים.
- סוכן `gemini-agent.yml` מפעיל סקריפט אופציונלי שאינו קיים בענף הראשי; הוא איננו הוכחה לתיקון אוטונומי, והגדרת commit אוטומטי מחייבת בדיקת הרשאות וטריגרים לפני הפעלה רחבה.
- `PR #58` מוסיף `verify:engine-integrity` שמנסה עד 6,000 שאלות MCQ. עם זאת, קוד הבדיקה מדלג על `null` ועל פלט ללא `mcq-choices`, ומסתפק ב־`mcqCount>1000` בלי כיסוי מחייב לכל 50 מנועים; יש לשפר את gate כך ששום מנוע לא יוכל להיעלם מהדגימה בלי שיתגלה כשל.
- קיימים שני Issues פתוחים בנושא נגישות SVG: [#54](https://github.com/yanivmizrachiy/targilim/issues/54) ו־[#55](https://github.com/yanivmizrachiy/targilim/issues/55). `diagram-ultra-autopilot.js` מחזיר SVG עם `role="img"` ללא שם נגיש בקובץ שנבדק.
- הריפו Public ללא רישיון תוכנה מוצהר; יש לבחון מדיניות פתיחת קוד ורישוי מקור, בלי להסיק שהפרסום אינו חוקי.

## 6. תוכנית הלימודים ומקורות

- מיפוי מ־12.11 מצא ש־6 מתוך 10 קובצי המקור המאושרים במערכת נשענים על מהדורות מאי 2026, בעוד שפורסמו מהדורות מעודכנות בספטמבר–אוקטובר 2026. יש לקלוט מקור רשמי מתוארך ולבצע diff לפני שינויים פדגוגיים.
- אין מנועי כיתה ט׳ ב־main; מסלולי ט׳ והפריסות הרגילה/המצומצמת מופיעים במידע המעודכן באתר המחוז, אך טרם הוספו למחולל.
- מיפוי המקורות מדווח על חוסר התאמה בשכבה של U7-08, חלק מ־U7-02 ו־A7-04, וכן שימוש ב־"תדירות" במקום "שכיחות" בחלק משאלות אי־ודאות. נדרש אימות מול מסמך משרד החינוך המעודכן לפני שינוי.
- `CURRICULUM_MAP.md` קיים על בסיס תוכנית לימודים ישנה, לפי דוח ביקורת נובמבר; יש להחליף/לתקן רק אחרי אישור ומיפוי מקור אמין.

מקור: [CURRICULUM_MATRIX_20261112.md](https://github.com/yanivmizrachiy/targilim/blob/feat/workbook-vertical-slice/docs/planning/CURRICULUM_MATRIX_20261112.md), [תוכנית הלימודים באתר המחוז](https://jerusalem2.vercel.app/chativat-beynayim/tochnit-limudim/).

## 7. ריפוזיטוריז קשורים — סתירת מקור אמת

| מאגר | ממצא | נדרש |
|---|---|---|
| `targilim` | מוצר הפעיל, 50 מנועים, מסמכי RULES ו־PROJECT_STATUS | להמשיך לתחזק את הקוד הקיים ללא כפילויות בלתי־מאושרות |
| `math-worksheet-wizard` (private) | `RULES.md` מצהיר שהוא הקנוני ואוסר עבודה ב־targilim. `src/pages/Index.tsx` הוא בעיקר מסך של מקור/העלאה; אין מנוע מלא. `PROJECT_STATUS.md` מצהיר על Phase 0 | הכרעה מפורשת בסמכות הפרויקטים לפני פיתוח חוצה־ריפו |
| `printperfect-worksheets` (private) | `DESIGN_SSOT.md` מצהיר שהוא מקור האמת לעיצוב A4 לכל פרויקטי המתמטיקה. כולל בפועל תצוגות והדפסה | להפנות את targilim למסמך העיצוב, ולהכריע על כל פער קיים |
| `stats-question-generator` | מחולל ייעודי פעיל של שאלות סטטיסטיקה, עם קוד TypeScript נפרד | לשמר כפרויקט נפרד אלא אם יש תכנון מפורש לשיתוף משפחות שאלות |

**הערת אבטחה:** נמצא קובץ `.env` מנוהל ב־Git במאגר הפרטי `math-worksheet-wizard`; הוא **לא נקרא**. יש לבדוק אם נכללו בו סודות ולפעול להחלפתם אם צריך. אין לשתף את הקובץ או לפרסם את תוכנו.

## 8. תוכנית פעולה מדורגת — ללא מיזוג אוטומטי

### שלב 0 — גיבוי ובסיס אמת
1. לקבע SHA מאומת של `main` ושל כל ענפי העבודה; לא למחוק פרויקטים.
2. להכריע סמכות בין `targilim`, `math-worksheet-wizard` ו־`printperfect-worksheets` בלי לפגוע בנתונים.
3. להפוך את ה־CI ל־required לפני מיזוג ולנעול את `main` רק אחרי הסכמת הבעלים על מסלול העבודה.

### שלב 1 — תיקוני בטיחות מתמטית ותלמיד
4. לבודד תשובות מתוך מודל הנתונים; לבדוק 1 ו־10 שאלות, מסך והדפסה.
5. לשלב **באופן מבוקר** תיקוני PR #58 ולבדוק 50 מנועים במנגנון Production, כולל G8-07, N7-06, A8-01, N7-01 ו־U7-04.
6. להוסיף ולידטור עצמאי לכל משפחת שאלות בהדרגה; לבדוק פתרון באמצעות הצבה, חישוב חוזר, ועקביות שרטוט/נוסח/תשובה.

### שלב 2 — חוברות ושחזור
7. לתקן את סיכון ה־DOM XSS בקישורי שחזור *לפני* מיזוג #57.
8. להחליט על חוזה Seed ולתקן יצירת פריטים שמושפעת מהכמות או ממצב פנימי קודם.
9. להשלים בדיקות A4, RTL/BiDi, פונטים, מובייל, העתקה, PDF נגיש, הדפסה אמיתית ונגישות SVG.
10. לאחד את 9 שכבות המנוע לתשתית Dispatcher אחת אחרי מעבר בטוח, עם בדיקות שלא מדלגות על מנועים.

### שלב 3 — תוכנית לימודים ופריסה
11. לקלוט מקור מאושר ועדכני, לאמת מחדש מיפוי שכבות וטרמינולוגיה, ולהציג תאריך/מהדורת מקור.
12. להוסיף שכבה ט׳ רק אחרי מיפוי מסלולים ותכנון מנועים מתמטי.
13. לתקן workflowים ישנים; לפרוס רק לאחר הוכחת בדיקות, בדיקת Preview ואישור מפורש חדש. לבצע Smoke על Production אחרי הפריסה.

## 9. בדיקות קבלה שמונעות הכרזת 100% לא מוצדקת

- כל 50 מזהי המנוע הרשומים נבדקים דרך **אותו loader ו־dispatcher** של האתר. `null` או מנוע שלא נבדק הם FAIL.
- מדגם רב־זרעים לכל משפחה, עם בדיקת **נכונות מתמטית עצמאית**, ייחוד אפשרויות וקשר שרטוט־נתונים־פתרון; אין הסתמכות על regex בלבד כתחליף לבדיקה מתמטית.
- `single/multi` ו־`open/mcq/tf/mistake` נבדקים בכל משפחה שתומכת בהם, בשילוב רמות אמיתיות.
- כל נושא גלוי בממשק קיים גם בבדיקה, לרבות נושאים שנטענים אסינכרונית. מספר הנושאים נקבע במקור קנוני אחד.
- שום סמן תשובה או תוכן מפתח לא מופיע בתצוגת התלמיד או בהדפסה כאשר לא הוחלט לחשוף פתרונות.
- קישור שחזור עם מזהי נושאים לא מוכרים או תווים מיוחדים אינו מכניס HTML חיצוני לדף; נבדק בדפדפן.
- קוד שחזור עם אותם פרמטרים מפיק אותו מסמך בדף חדש ובאותה לשונית. שינוי כמות שומר prefix אם זה חוזה המוצר שאושר.
- A4 נבדק בכל הנושאים המייצגים, בתצוגת מסך וב־Print/PDF; אין חיתוך, רווחים לא סבירים, דחיסה שרירותית או הגזמה בהקטנת פונטים.
- Safari/Firefox, מכשיר Android אמיתי, הדפסה פיזית וקריאת מסך נבדקים בהתאם לתחום השינוי.
- כל CI חיוני ירוק; deployment תלוי בהצלחת ה־CI; ענף main מוגן לפי המדיניות; אין פריסה בלי אישור הבעלים.

## 10. הפניות מרכזיות

- [Repository](https://github.com/yanivmizrachiy/targilim)
- [RULES.md](https://github.com/yanivmizrachiy/targilim/blob/main/RULES.md)
- [Source registry](https://github.com/yanivmizrachiy/targilim/blob/main/generator/engine/source-registry.js)
- [Module audit 12.11](https://github.com/yanivmizrachiy/targilim/blob/feat/workbook-vertical-slice/docs/audits/MODULE_AUDIT_20261112.md)
- [Curriculum matrix 12.11](https://github.com/yanivmizrachiy/targilim/blob/feat/workbook-vertical-slice/docs/planning/CURRICULUM_MATRIX_20261112.md)
- [PR #56 requirements](https://github.com/yanivmizrachiy/targilim/pull/56)
- [PR #57 workbook](https://github.com/yanivmizrachiy/targilim/pull/57)
- [PR #58 integrity fixes](https://github.com/yanivmizrachiy/targilim/pull/58)
- [PR #59–61 chain](https://github.com/yanivmizrachiy/targilim/pull/61)
- [GitHub Actions](https://github.com/yanivmizrachiy/targilim/actions)

**סיכום סטטוס:** הפרויקט `targilim` קיים ועשיר, אך אינו עומד עדיין בהוכחת איכות מתמטית ותפעולית מלאה. יש ליקויים מוכחים ב־main, ליקויים סטטיים חדשים ב־PR #57, וסכסוך סמכות בין ריפוזיטוריז. הדוח **אינו** אישור Production ואינו תחליף לבדיקות קצה עצמאיות.