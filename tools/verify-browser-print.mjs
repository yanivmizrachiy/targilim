// Regression test: actual Chromium rendering, A4 PDF and RTL mobile layout.
// Unlike synthetic CSS-string checks, this exercises the shipped renderers and
// print styles in a real browser. No CDN/network or repository writes are needed.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const candidates = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const executablePath = candidates.find(existsSync);
assert.ok(executablePath, 'Chromium/Chrome is required for verify:browser-print; no skipped tests');
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});
const fixture = {
  question: 'בחרו את כל התשובות הנכונות',
  answer: 'פתרון למורה בלבד',
  choices: [
    { label: 'א', text: '2', correct: true },
    { label: 'ב', text: '3', correct: false },
    { label: 'ג', text: '4', correct: true },
  ],
};
let success = false;
try {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    try {
      await page.setContent('<!doctype html><html dir="rtl" lang="he"><head><meta charset="UTF-8"></head><body><main id="out"></main></body></html>');
      await page.addStyleTag({ path: resolve('generator/style.css') });
      await page.addStyleTag({ path: resolve('generator/engine/engine.css') });
      await page.evaluate(() => {
        window.generators = {};
        window.TOPICS = {
          7: { numeric: [], geometry: [], algebra: [], uncertainty: [] },
          8: { numeric: [], geometry: [], algebra: [], uncertainty: [] },
        };
        window.onGrade = () => {};
        window.onDomain = () => {};
        window.renderMathInElement = () => {}; // CDN KaTeX excluded from isolated test
        window.setMainTitle = () => {};
      });
      for (const source of [
        'generator/engine/question-types.js',
        'generator/engine/pattern-engine.js',
        'generator/exercise-set.js',
      ]) await page.addScriptTag({ path: resolve(source) });
      const readiness = await page.evaluate(() =>
        ['mcq', 'renderEngineCard'].map(k =>
          typeof window.TargilimEngine?.[k === 'mcq' ? 'questionTypes' : k] === 'object' ||
          typeof window.TargilimEngine?.[k === 'mcq' ? 'questionTypes' : k] === 'function'));
      assert.deepEqual(readiness, [true, true], 'real formatter and renderer must load');

      await page.evaluate(input => {
        const exercise = window.TargilimEngine.questionTypes.mcq(input);
        window.qaExercise = exercise;
        window.renderExerciseSet({
          topicLabel: 'בדיקת הדפסה', cls: 'num',
          gradeLabel: 'כיתה ז', domainLabel: 'מספרי', diffLabel: 'רמה 2',
        }, [{ ...exercise, qtype: 'mcq' }]);
      }, fixture);
      const student = page.locator('#exset .ex-body');
      const key = page.locator('#answerKey');
      assert.equal(await student.locator('.mcq-choice').count(), 3, 'all choices retained');
      assert.equal(await student.locator('.mcq-correct').count(), 0, 'no correct-answer hint');
      assert.equal(await page.locator('#answerKey .ak-correct').innerText(),
        'התשובות הנכונות: א, ג', 'teacher retains both correct choices');
      assert.equal(await key.count(), 1, 'one teacher key, not repeated for each question');
      assert.ok(!(await student.innerText()).includes('פתרון למורה בלבד'));

      const box = await page.evaluate(() => ({
        viewport: window.innerWidth,
        body: document.body.scrollWidth,
        document: document.documentElement.scrollWidth,
      }));
      assert.ok(box.body <= box.viewport && box.document <= box.viewport,
        'unwanted horizontal overflow at viewport ' + width + ': ' + JSON.stringify(box));

      await page.emulateMedia({ media: 'print' });
      assert.equal(await key.evaluate(el => getComputedStyle(el).display), 'none',
        'teacher key hidden in default student print');
      const studentPdf = await page.pdf({ format: 'A4', printBackground: true });
      assert.ok(studentPdf.subarray(0, 5).toString() === '%PDF-' && studentPdf.length > 1024,
        'student print must create a valid nonempty A4 PDF');
      await key.evaluate(el => el.classList.add('open'));
      assert.notEqual(await key.evaluate(el => getComputedStyle(el).display), 'none',
        'explicitly opened teacher key can print');
      const teacherPdf = await page.pdf({ format: 'A4', printBackground: true });
      assert.ok(teacherPdf.subarray(0, 5).toString() === '%PDF-' && teacherPdf.length > 1024,
        'teacher print must create a valid nonempty A4 PDF');

      await page.evaluate(() => {
        window.TargilimEngine.renderEngineCard('N7-03-ENGINE', 'בדיקת כרטיס', window.qaExercise);
      });
      assert.equal(await page.locator('#out .engine-card .mcq-correct').count(), 0,
        'single-card student choice must have no correct-answer marker');
      const solution = page.locator('#out .engine-card .answer');
      assert.equal(await solution.evaluate(el => getComputedStyle(el).display), 'none',
        'single-card solution hidden from default print');
      await solution.evaluate(el => el.classList.add('open'));
      assert.notEqual(await solution.evaluate(el => getComputedStyle(el).display), 'none',
        'explicit teacher opening may print the solution');
      const cardPdf = await page.pdf({ format: 'A4', printBackground: true });
      assert.ok(cardPdf.subarray(0, 5).toString() === '%PDF-' && cardPdf.length > 1024);
      console.log('BROWSER_PRINT_PASS viewport=' + width +
        ' choices=3 correct_markers=0 key=א,ג pdf_bytes=' +
        [studentPdf.length, teacherPdf.length, cardPdf.length].join('/') +
        ' overflow=0');
    } finally {
      await page.close();
    }
  }
  success = true;
} finally {
  await browser.close();
}
if (success) console.log('REAL_BROWSER_PRINT_GATE_PASS');
