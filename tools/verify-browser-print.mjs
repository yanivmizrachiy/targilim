// Regression test: actual Chromium rendering, A4 PDF and RTL mobile layout.
// Unlike synthetic CSS-string checks, this exercises the shipped renderers and
// print styles in a real browser. No CDN/network or repository writes are needed.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { PDFDocument } from 'pdf-lib';
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { extname, sep } from 'node:path';

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
  // End-to-end smoke on the actual index.html with real (locally served)
  // KaTeX 0.16.9 CSS, JavaScript and math fonts. Other remote assets remain
  // blocked, so this verifies real equations without remote network calls.
  // The visible student generator, all engine scripts and print CSS are real.
  const webRoot = resolve('generator');
  const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' };
  const server = createServer((req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      const filePath = resolve(webRoot, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!filePath.startsWith(webRoot + sep)) { res.writeHead(403); res.end(); return; }
      if (!statSync(filePath).isFile()) { res.writeHead(404); res.end(); return; }
      const content = readFileSync(filePath);
      res.writeHead(200, { 'content-type': mime[extname(filePath)] || 'application/octet-stream' });
      res.end(content);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise((ok, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', ok); });
  try {
    const origin = 'http://127.0.0.1:' + server.address().port;
    const app = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      // Keep the test hermetic: serve the exact KaTeX CDN version requested by
      // index.html from installed npm files, including the font assets. Block
      // all other third-party requests; do not silently skip math rendering.
      await app.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
      const katexRoot = resolve('node_modules/katex/dist');
      await app.route('https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/**', route => {
        const url = route.request().url();
        const relativePath = decodeURIComponent(url.split('/0.16.9/')[1] || '');
        const filePath = resolve(katexRoot, relativePath);
        if (!filePath.startsWith(katexRoot + sep) || !existsSync(filePath)) {
          return route.abort('failed');
        }
        return route.fulfill({ path: filePath });
      });
      await app.goto(origin + '/index.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
      assert.equal(await app.evaluate(() => typeof window.renderMathInElement), 'function',
        'the actual KaTeX auto-render script must load');
      assert.equal(await app.evaluate(() => typeof window.katex?.render), 'function',
        'the actual KaTeX engine must load');
      await app.waitForFunction(
        () => document.querySelector('#st option[value="G7-03-ENGINE"]') &&
              typeof window.generate === 'function' &&
              typeof window.TargilimEngine?.getEngineExercise === 'function',
        null, { timeout: 15000 },
      );
      for (const selection of [
        { domain: 'geometry', topic: 'G7-03-ENGINE' },
        { domain: 'numeric', topic: 'N7-03-ENGINE' },
      ]) {
        await app.selectOption('#sg', '7');
        await app.selectOption('#sd', selection.domain);
        await app.selectOption('#st', selection.topic);
        await app.selectOption('#sn', '6');
        await app.selectOption('#sl', 'standard');
        await app.selectOption('#selQType', 'mcq');
        await app.click('.btn-gen');
        const count = await app.locator('#exset .ex-card').count();
        assert.equal(count, 6, 'real generate button must create six cards for ' + selection.topic);
        const studentChoices = await app.locator('#exset .ex-body .mcq-choice').count();
        assert.ok(studentChoices >= 6, 'real generator must create MCQ choices for ' + selection.topic);
        assert.equal(await app.locator('#exset .ex-body .mcq-correct').count(), 0,
          'real generated questions must never reveal the correct option');
        assert.equal(await app.locator('#answerKey .ak-item').count(), 6,
          'real generated worksheet must have six teacher solutions');
        const bounds = await app.evaluate(() => ({
          viewport: innerWidth, body: document.body.scrollWidth,
          document: document.documentElement.scrollWidth,
        }));
        assert.ok(bounds.body <= bounds.viewport && bounds.document <= bounds.viewport,
          'real app mobile horizontal overflow: ' + JSON.stringify(bounds));
        await app.emulateMedia({ media: 'print' });
        assert.equal(await app.locator('#answerKey').evaluate(el => getComputedStyle(el).display),
          'none', 'real generated student print hides teacher key');
        const katexFormulaCount = await app.locator('#exset .ex-body .katex').count();
        const katexErrorCount = await app.locator('#exset .ex-body .katex-error').count();
        assert.ok(katexFormulaCount > 0,
          'real generated ' + selection.topic + ' exercise must typeset mathematical formulas with KaTeX');
        assert.equal(katexErrorCount, 0,
          'real generated math must not show KaTeX error messages in student print');
        const diagramCount = await app.locator('#exset .ex-body svg').count();
        if (selection.domain === 'geometry') {
          assert.ok(diagramCount > 0, 'real geometry exercises must include a drawing');
        }
        await app.evaluate(() => document.fonts.ready);
        const pdf = await app.pdf({ format: 'A4', printBackground: true });
        assert.ok(pdf.subarray(0, 5).toString() === '%PDF-' && pdf.length > 2000,
          'real generated six-question A4 print is a PDF');
        const parsed = await PDFDocument.load(pdf);
        assert.ok(parsed.getPageCount() >= 1 && parsed.getPageCount() <= 12,
          'A4 pages must be parseable without uncontrolled pagination');
        const pdfSize = parsed.getPage(0).getSize();
        assert.ok(Math.abs(pdfSize.width - 595.28) < 1 && Math.abs(pdfSize.height - 841.89) < 1,
          'PDF page must physically be A4');
        console.log('FULL_GENERATOR_BROWSER_PASS topic=' + selection.topic +
          ' cards=6 choices=' + studentChoices + ' teacher_keys=6 mobile_overflow=0' +
          ' real_katex=' + katexFormulaCount + ' katex_errors=' + katexErrorCount +
          ' svg=' + diagramCount + ' a4_pages=' + parsed.getPageCount() +
          ' a4_pdf_bytes=' + pdf.length);
        await app.emulateMedia({ media: 'screen' });
      }
    } finally {
      await app.close();
    }
  } finally {
    await new Promise(ok => server.close(ok));
  }
  success = true;
} finally {
  await browser.close();
}
if (success) console.log('REAL_BROWSER_PRINT_GATE_PASS');
