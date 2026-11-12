// tools/verify-workbook.mjs  (verify:workbook)
// Gate for the document path: teacher options → seeded document → book /
// print / PDF. Runs the real page scripts (tools/workbook-load.mjs).
//   1. Verified families: seeded property runs through each family's
//      independent checker, replay identity, and real level differences.
//   2. Every topic in the dropdown composes a numbered document with no
//      answer marker on the student side and a key for every MCQ.
//   3. Replay: the same settings + code rebuild the same document in a fresh
//      page (documented exceptions only).
//   4. Teacher options: level plans, points, chapters, explanations.
//   5. Static contracts of the A4 book, print and PDF capture.
// Read-only: prints results, writes nothing.
import fs from 'node:fs';
import { loadPage } from './workbook-load.mjs';

let fails = 0;
const check = (name, ok, extra) => { console.log((ok ? 'PASS' : 'FAIL') + ' - ' + name + (extra && !ok ? ' :: ' + extra : '')); if (!ok) fails++; };
const RUNS = Number(process.env.WORKBOOK_RUNS || 300);
const LEVELS = ['basic', 'standard', 'challenge'];
const QTYPES = ['open', 'mcq', 'tf', 'mistake'];

const page = loadPage();
const { W, run } = page;

// ── 1. verified families ──
const verified = Object.keys(W.families || {});
check('verified families registered (G7-03, N8-04)', verified.includes('G7-03-ENGINE') && verified.includes('N8-04-ENGINE'), verified.join(','));
for (const id of verified) {
  const fam = W.families[id];
  let total = 0, bad = 0, replay = 0;
  const firstProblem = [];
  const kinds = { basic: new Set(), standard: new Set(), challenge: new Set() };
  for (const level of LEVELS) for (const qtype of QTYPES) for (let s = 0; s < RUNS; s++) {
    total++;
    const seed = id + '|' + level + '|' + qtype + '|' + s;
    const item = fam.generate(W.rng.createRng(seed), level, qtype, {});
    const problems = fam.verify(item, {}).concat(fam.verify(item, { mcqMode: 'multi' }));
    if (problems.length) { bad++; if (firstProblem.length < 3) firstProblem.push(seed + ': ' + problems.join('; ')); }
    if (JSON.stringify(fam.generate(W.rng.createRng(seed), level, qtype, {})) !== JSON.stringify(item)) replay++;
    kinds[level].add(fam.levelSignature ? fam.levelSignature(item) : item.family + ':' + (item.data && item.data.kind || '-'));
  }
  check(id + ': ' + total + ' seeded items pass the independent checker', bad === 0, bad + ' bad; ' + firstProblem.join(' | '));
  check(id + ': every item replays identically from its seed', replay === 0, replay + ' differ');
  const sig = l => [...kinds[l]].sort().join(',');
  check(id + ': the three levels produce different tasks (kind or number band)', sig('basic') !== sig('standard') && sig('standard') !== sig('challenge') && sig('basic') !== sig('challenge'), LEVELS.map(sig).join(' / '));
}
if (W.families['G7-03-ENGINE']) {
  const fam = W.families['G7-03-ENGINE'];
  const kindsAt = (level, family) => {
    const out = new Set();
    for (let s = 0; s < RUNS; s++) out.add(fam.generate(W.rng.createRng('k' + level + s), level, 'open', { family: family }).data.kind);
    return [...out].sort().join(',');
  };
  check('G7-03 find_side: רמה 1 = hypotenuse only', kindsAt('basic', 'find_side') === 'hyp', kindsAt('basic', 'find_side'));
  check('G7-03 find_side: רמה 3 = two steps (leg, then perimeter)', kindsAt('challenge', 'find_side') === 'leg-perimeter');
  check('G7-03 rectangle: רמה 3 = area/perimeter after a missing side', kindsAt('challenge', 'rectangle_diagonal') === 'area,perimeter');
  let unitOk = true, unknownOk = true;
  for (let s = 0; s < RUNS; s++) {
    const it = fam.generate(W.rng.createRng('fig' + s), 'standard', 'open', { family: 'find_side' });
    const labels = W.figures.inspect(it.figure).labels.filter(l => l.kind === 'given' || l.kind === 'unknown');
    if (!labels.filter(l => l.kind === 'given').every(l => / (ס״מ|מ׳)$/.test(l.text))) unitOk = false;
    if (labels.filter(l => l.kind === 'unknown').map(l => l.text).join() !== '?') unknownOk = false;
  }
  check('figures: givens carry full units, exactly one "?" for the unknown', unitOk && unknownOk);
}

// ── 2. every dropdown topic composes a clean document ──
const base = { count: 6, level: 'standard', progression: 'uniform', docType: 'worksheet', qtype: 'mixed', mcqMode: 'single', seed: 'K7M2QF' };
const compose = o => run('composeDocument(' + JSON.stringify(o) + ')');
check('dropdown topics found (incl. runtime legacy topics)', page.topics.length >= 50, String(page.topics.length));
const problems = [];
const docs = {};
for (const t of page.topics) {
  page.els.st = Object.assign(page.els.st || {}, { value: t.id, options: [{ textContent: t.label }], selectedIndex: 0 });
  const doc = compose(Object.assign({}, base, { grade: t.grade, topics: [t.id] }));
  docs[t.id] = doc.exercises.map(ex => ex.questionHTML + '||' + ex.answerHTML).join('##');
  const ex = doc.exercises;
  if (ex.length !== 6) problems.push(t.id + ': ' + ex.length + ' exercises');
  ex.forEach((e, i) => {
    if (e.n !== i + 1) problems.push(t.id + ': numbering');
    if (/undefined|NaN|\[object/.test(e.questionHTML + e.answerHTML)) problems.push(t.id + ': undefined/NaN');
    if (/mcq-correct|tf-verdict/.test(e.questionHTML)) problems.push(t.id + ': answer marker on the student side');
    if (/class="mcq-choices"/.test(e.questionHTML) && !(e.correctLabels && e.correctLabels.length)) problems.push(t.id + ': MCQ without key');
    if (W.families[t.id] && !e.verified) problems.push(t.id + ': verified topic produced an unverified item');
  });
}
check('every topic: 6 numbered exercises, no answer on the student side, MCQ keys present', problems.length === 0, problems.slice(0, 8).join(' | '));

// ── 3. replay in a fresh page ──
// Engines that keep a module-level counter rotate their cases per call, so a
// replay is identical only from a fresh page load — which is what a shared
// link does. Same-session replay differences are tolerated for these only.
const fresh = loadPage();
const differ = [];
for (const t of page.topics) {
  fresh.els.st = Object.assign(fresh.els.st || {}, { value: t.id, options: [{ textContent: t.label }], selectedIndex: 0 });
  const doc = fresh.run('composeDocument(' + JSON.stringify(Object.assign({}, base, { grade: t.grade, topics: [t.id] })) + ')');
  if (doc.exercises.map(ex => ex.questionHTML + '||' + ex.answerHTML).join('##') !== docs[t.id]) differ.push(t.id);
}
check('replay: same settings + code rebuild the same document in a fresh page (' + page.topics.length + ' topics)', differ.length === 0, differ.join(', '));

// ── 4. teacher options ──
const plan = (l, p, n) => run('levelPlan(' + JSON.stringify(l) + ',' + JSON.stringify(p) + ',' + n + ')');
let planOk = true;
for (let n = 1; n <= 10; n++) for (const l of LEVELS) {
  const u = plan(l, 'uniform', n), g = plan(l, 'graduated', n);
  if (!u.every(x => x === l)) planOk = false;
  const idx = g.map(x => LEVELS.indexOf(x));
  if (idx.some((x, i) => i && x < idx[i - 1])) planOk = false;                 // never steps down
  if (g[g.length - 1] !== l) planOk = false;                                   // ends at the target
  if (l !== 'basic' && n >= LEVELS.indexOf(l) + 1 && g[0] !== 'basic') planOk = false; // starts easy when there is room
}
check('level plans: uniform = target; graduated climbs to the target without stepping down', planOk);
let pointsOk = true;
for (const docType of ['quiz', 'exam']) for (let n = 1; n <= 10; n++) for (const prog of ['uniform', 'graduated']) {
  page.els.st = Object.assign(page.els.st, { value: 'G7-03-ENGINE', options: [{ textContent: 'פיתגורס' }] });
  const d = compose(Object.assign({}, base, { grade: 7, topics: ['G7-03-ENGINE'], count: n, docType: docType, level: 'challenge', progression: prog }));
  const pts = d.exercises.map(e => e.points);
  if (pts.reduce((s, x) => s + x, 0) !== 100 || pts.some(x => !Number.isInteger(x) || x < 1)) pointsOk = false;
  if (prog === 'graduated' && pts.some((x, i) => i && x + 1 < pts[i - 1])) pointsOk = false;
}
check('quiz/exam: whole points summing to 100, harder items not worth less', pointsOk);
const multi = compose(Object.assign({}, base, { grade: 7, topics: ['G7-03-ENGINE', 'G7-04-ENGINE', 'A7-03-ENGINE'], count: 7, docType: 'exam' }));
check('multi-topic exam: chapters in order with 3/2/2 questions, continuous numbering',
  multi.chapters.length === 3 && multi.chapters.map(c => c.items.length).join() === '3,2,2' && multi.exercises.map(e => e.n).join() === '1,2,3,4,5,6,7');
const short = compose(Object.assign({}, base, { grade: 7, topics: ['G7-03-ENGINE', 'G7-04-ENGINE', 'A7-03-ENGINE'], count: 2 }));
check('fewer questions than topics is explained, not hidden', short.chapters.length === 2 && short.notes.length === 1);
const flat = compose(Object.assign({}, base, { grade: 7, topics: ['G7-03-ENGINE'], level: 'basic', progression: 'graduated' }));
check('graduated at רמה 1 is explained and stays uniform', flat.notes.length === 1 && flat.exercises.every(e => e.level === 'basic'));

// ── 5. static contracts ──
const read = p => fs.readFileSync(p, 'utf8');
const css = read('generator/workbook/workbook.css');
const index = read('generator/index.html');
const cap = read('generator/workbook/capture.js');
check('A4 sheets: @page A4 with zero margin, 210×297 mm sheets', /@page\s*\{\s*size:\s*A4;\s*margin:\s*0;\s*\}/.test(css) && /\.wb-page\s*\{[^}]*width:\s*210mm;[^}]*height:\s*297mm;/.test(css));
const print = css.slice(css.indexOf('@media print'));
check('print: only the sheets (toolbar and dividers hidden), one sheet per page', /\.wb-toolbar,\s*\.wb-sep/.test(print) && /display:\s*none\s*!important/.test(print) && /\.wb-sep \+ \.wb-page\s*\{\s*break-before:\s*page;/.test(print));
check('print keeps the image-button space (screen pagination = print pagination)', /\.wb-flow \.ex-imgbar\s*\{\s*display:\s*flex\s*!important;\s*visibility:\s*hidden\s*!important;/.test(print));
check('answer key sheets hidden unless shown', /\.exset:not\(\.show-key\) \.wb-key-page/.test(css));
check('PDF/image capture libraries pinned with SRI', /@zumer\/snapdom@3\.7\.4\/dist\/snapdom\.js/.test(cap) && /jspdf\/4\.2\.1\/jspdf\.umd\.min\.js/.test(cap) && (cap.match(/integrity: 'sha384-[A-Za-z0-9+/=]{64}'/g) || []).length === 2);
const order = ['workbook/rng.js', 'workbook/figures.js', 'workbook/items.js', 'workbook/capture.js', 'workbook/families/pythagoras.js', 'workbook/families/percent.js', 'exercise-set.js', 'workbook/book.js', 'workbook/controls.js'];
const pos = order.map(s => index.indexOf('src="' + s));
check('index loads the workbook core before exercise-set.js, the book after it', pos.every(p => p > 0) && pos.every((p, i) => !i || p > pos[i - 1]), pos.join(','));
check('index links workbook.css after the older stylesheets', index.indexOf('workbook/workbook.css') > index.indexOf('mobile-polish.css'));
check('teacher controls present: document type, level order, topics, replay code',
  ['id="sdoc"', 'id="sprog"', 'id="btnAddTopic"', 'id="topicList"', 'id="sseed"', 'id="settingsNote"'].every(s => index.includes(s)));
check('workbook typography: no heavy weights, no letter-spacing', !/font-weight\s*:\s*(?:700|800|900)\b|font:\s*(?:700|800|900)\s/.test(css) && !/letter-spacing\s*:\s*(?!0\s*[;}])/.test(css));

console.log(fails ? 'WORKBOOK_FAIL (' + fails + ')' : 'WORKBOOK_PASS');
process.exit(fails ? 1 : 0);
