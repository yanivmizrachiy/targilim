// tools/verify-engine-integrity.mjs  (verify:engine-integrity)
// Content integrity of every engine's output, on a seeded Math.random so a
// failure is reproducible:
//   - multiple choice: unique option texts, exactly one correct option (single
//     mode), at least two options, no א/ב sub-items next to choice letters;
//   - G8-07: the drawing marks exactly the equalities of the theorem in the
//     answer (צ.צ.צ: 0 angle arcs; צ.ז.צ: 1 per triangle; ז.צ.ז: 3 per triangle).
// Read-only: prints results, writes nothing.
import { loadEngines } from './engine-load.mjs';

let fails = 0;
const check = (name, ok, extra) => { console.log((ok ? 'PASS' : 'FAIL') + ' - ' + name + (extra && !ok ? ' :: ' + extra : '')); if (!ok) fails++; };

// mulberry32: deterministic stand-in for Math.random during the sweep
function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const original = Math.random;
const DRAWS = Number(process.env.INTEGRITY_DRAWS || 40);

const { E, pilotIds, sourceFitIds, callEngine } = loadEngines();
const ids = pilotIds.concat(sourceFitIds);
check('engines loaded (50)', ids.length === 50, String(ids.length));

const CHOICE = /<div class="mcq-choice( mcq-correct)?\s*"><span class="mcq-label">([^<]+?)\.?<\/span>\s*([\s\S]*?)<\/div>/g;
const dupes = [], keys = [], few = [], subItems = [];
let mcqCount = 0;
for (const id of ids) {
  for (const diff of ['basic', 'standard', 'challenge']) {
    for (let i = 0; i < DRAWS; i++) {
      Math.random = seeded(ids.indexOf(id) * 100000 + i * 7 + diff.length);
      let r;
      try { r = callEngine(id, diff, 'mcq'); } finally { Math.random = original; }
      if (!r || !/class="mcq-choices"/.test(r.questionHTML)) continue;
      mcqCount++;
      const opts = [...r.questionHTML.matchAll(CHOICE)].map(m => ({ correct: !!m[1], text: m[3].replace(/\s+/g, ' ').trim() }));
      const texts = opts.map(o => o.text);
      if (new Set(texts).size !== texts.length) dupes.push(id + '/' + diff + ': ' + texts.join(' | '));
      if (opts.filter(o => o.correct).length !== 1) keys.push(id + '/' + diff + ': ' + opts.filter(o => o.correct).length + ' correct');
      if (opts.length < 2) few.push(id + '/' + diff);
      const stem = (r.questionHTML.split('<div class="mcq-choices">')[0] || '').replace(/<[^>]+>/g, '\n');
      if (/(^|\n)\s*א\.\s/.test(stem) && /(^|\n)\s*ב\.\s/.test(stem)) subItems.push(id + '/' + diff);
    }
  }
}
check('multiple choice sampled across all engines (' + mcqCount + ' items)', mcqCount > 1000, String(mcqCount));
check('no multiple-choice item repeats an option', dupes.length === 0, dupes.slice(0, 4).join(' || '));
check('every multiple-choice item has exactly one correct option (single mode)', keys.length === 0, keys.slice(0, 4).join(' || '));
check('every multiple-choice item offers at least two options', few.length === 0, few.slice(0, 4).join(', '));
check('no א/ב sub-items in a multiple-choice question (they collide with the option letters)', subItems.length === 0, subItems.slice(0, 4).join(', '));

// G8-07: drawing ↔ answer consistency
const ARCS = { 'צ.צ.צ': 0, 'צ.ז.צ': 2, 'ז.צ.ז': 6 };
const mismatch = [];
let g807 = 0;
for (const diff of ['basic', 'standard', 'challenge']) {
  for (const qt of ['open', 'mcq', 'tf', 'mistake']) {
    for (let i = 0; i < DRAWS; i++) {
      Math.random = seeded(9000 + i * 13 + qt.length * 3 + diff.length);
      let r;
      try { r = callEngine('G8-07-ENGINE', diff, qt); } finally { Math.random = original; }
      if (!r) continue;
      g807++;
      const thm = Object.keys(ARCS).find(t => r.answerHTML.includes(t));
      const arcs = (r.questionHTML.match(/data-mark="angle"/g) || []).length;
      if (!thm || arcs !== ARCS[thm]) mismatch.push(diff + '/' + qt + ': answer ' + thm + ', arcs ' + arcs);
    }
  }
}
check('G8-07: the drawing marks exactly the theorem in the answer (' + g807 + ' items)', g807 > 0 && mismatch.length === 0, mismatch.slice(0, 4).join(' || '));

console.log(fails ? 'ENGINE_INTEGRITY_FAIL (' + fails + ')' : 'ENGINE_INTEGRITY_PASS');
process.exit(fails ? 1 : 0);
