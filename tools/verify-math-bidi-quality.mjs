// tools/verify-math-bidi-quality.mjs
// Guards Hebrew wording, math/BiDi quality, and high-risk SVG labels across the
// real 50-engine stack. This catches visible "demo" output: raw math inside RTL
// prose, undefined/NaN leakage, broken Hebrew quantity phrasing, and fragile
// ratio labels in drawings.
// Run: node tools/verify-math-bidi-quality.mjs [drawsPerCombo]
import fs from 'node:fs';
import { loadEngines } from './engine-load.mjs';

const N = Number(process.argv[2] || 30);
let fails = 0;
function check(name, ok, info) {
  console.log((ok ? 'PASS' : 'FAIL') + ' — ' + name + (ok ? '' : ' :: ' + (info || '')));
  if (!ok) fails++;
}

// Static CSS isolation rules.
const css = fs.readFileSync('generator/style.css', 'utf8');
check('KaTeX forced LTR', /\.katex[^{]*\{[^}]*direction:\s*ltr/.test(css));
check('KaTeX bidi isolated', /\.katex[^{]*\{[^}]*unicode-bidi:\s*isolate/.test(css));
check('SVG text plaintext bidi', /svg text\s*\{[^}]*unicode-bidi:\s*plaintext/.test(css));

// Runtime scan of all engines.
const { E, pilotIds, sourceFitIds, callEngine } = loadEngines();
check('central fmt helpers exist', !!(E.fmt && E.fmt.angle && E.fmt.deg && E.fmt.signed && E.fmt.point));
check('fmt.angle is professional KaTeX', E.fmt && E.fmt.angle('B', 80) === '$\\sphericalangle B=80^\\circ$');

const n801 = fs.readFileSync('generator/engine/pilot-n8-01.js', 'utf8');
check('N8-01 no longer phrases distances as count nouns',
  !/ידוע\s+שיש\s+\$\$\{x\.known\}\$\s+\$\{knownLabel\}/.test(n801) &&
  !/כמה\s+יש\s+\$\{missingLabel\}/.test(n801));

const a701 = fs.readFileSync('generator/engine/pilot-a7-01.js', 'utf8');
check('A7-01 tower wording does not expose orphan additive step',
  !/כל כוס נוספת\s*:?\s*\$\+\$\{x\.step\}/.test(a701) &&
  !/כל כוס נוספת\s+\$\+\$\{x\.step\}/.test(a701) &&
  !/מגדל מכוס אחת/.test(a701));

// A7-03: the student step must actually change the solution. Force each
// existing one- and two-step case so both signs and zero are always covered.
function linearStepSolution(expression) {
  const match = expression?.match(/^(\d*)x([+-]\d+)?=(-?\d+)([+-]\d+)?$/);
  if (!match) return NaN;
  const [, coefficient, leftConstant, rightConstant, rightOffset] = match;
  return (Number(rightConstant) + Number(rightOffset || 0) - Number(leftConstant || 0)) / Number(coefficient || 1);
}

const originalPick = E.pick;
const equivalentMistakeSteps = [];
try {
  for (const family of ['one_step', 'two_step']) {
    for (let index = 0; index < 5; index++) {
      E.pick = list => typeof list[0] === 'string' ? family : list[index];
      const item = E.generateA703Engine(family === 'one_step' ? 'basic' : 'standard', 'mistake');
      const [original, proposed] = [...item.questionHTML.matchAll(/\$([^$]+)\$/g)]
        .map(match => linearStepSolution(match[1]));
      if (!Number.isFinite(original) || !Number.isFinite(proposed) || original === proposed) {
        equivalentMistakeSteps.push(family + '#' + index);
      }
    }
  }
} finally {
  E.pick = originalPick;
}
check('A7-03: each one- and two-step mistake changes the solution', !equivalentMistakeSteps.length, equivalentMistakeSteps.join(', '));

try {
  E.pick = list => typeof list[0] === 'string' ? 'given_solution' : list[0];
  const item = E.generateA703Engine('standard', 'open');
  const formulas = [...item.questionHTML.matchAll(/\$([^$]+)\$/g)].map(match => match[1]);
  check('A7-03: open equation identification gives the proposed value and four different equations',
    formulas.length === 5 && new Set(formulas.slice(1)).size === 4 &&
    formulas.slice(1).filter(equation => item.answerHTML.includes('$$' + equation + '$$')).length === 1);
} finally {
  E.pick = originalPick;
}

function prose(html) {
  return String(html)
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<table[\s\S]*?<\/table>/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$]*\$/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function svgs(html) {
  const out = [];
  const re = /<svg[\s\S]*?<\/svg>/gi;
  let m;
  while ((m = re.exec(html))) out.push(m[0]);
  return out;
}
function textNodes(svg) {
  const out = [];
  const re = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  let m;
  while ((m = re.exec(svg))) out.push({ tag: m[1], text: m[2].replace(/<[^>]+>/g, '') });
  return out;
}

const RAW_DEGREE = /\d+\s*°/;
const RAW_EQ = /[A-Za-z]\s*=\s*-?\d/;
const RAW_NEG_AFTER_HEB = /[֐-׿]\s+-\d/;
const BADTOK = /undefined|NaN/;
const DEMO_TOK = /דמו|demo|placeholder/i;
const BAD_HEBREW = [
  ['distance-as-count', /(?:ידוע\s+ש)?יש\s+(?:\$[^$]+\$|\d+)?\s*(?:דרך|מסלול)\b/],
  ['missing-distance-as-count', /כמה\s+יש\s+(?:דרך|מסלול)\b/],
  ['cup-tower-weak-opening', /מגדל מכוס אחת/],
  ['lamed-instead-of-between', /היחס\s+בין\s+[^.\n]+?\s+ל(?:דרך|מסלול|כמות|קבוצה|חוג|דף|משימה)\b/],
  ['therefore-question-fragment', /לכן\s+(?:מהו|כמה)\b/]
];

const ratioSample = E.ratioBarSvg({
  left: 'מסלול א', right: 'מסלול ב', r1: 5, r2: 2,
  knownSide: 'left', known: 45, missing: 18, measure: 'אורך', unit: 'ק״מ'
}, 'missing');
check('ratio bar writes ratio in RTL-safe Hebrew words',
  ratioSample.includes('יחס 5 ל־2') && !/5\s*:\s*2|2\s*:\s*5/.test(ratioSample));
check('ratio bar shows distance units and route labels',
  ratioSample.includes('45 ק״מ') && ratioSample.includes('אורך מסלול א') && ratioSample.includes('אורך מסלול ב'));
check('ratio bar text nodes carry explicit RTL bidi isolation',
  (ratioSample.match(/direction="rtl"/g) || []).length >= 5 &&
  (ratioSample.match(/unicode-bidi="plaintext"/g) || []).length >= 5);

function findTowerSample(qtype) {
  for (const d of ['standard', 'challenge']) {
    for (let i = 0; i < 320; i++) {
      const r = callEngine('A7-01-ENGINE', d, qtype);
      const all = ((r && r.questionHTML) || '') + ((r && r.answerHTML) || '');
      if ((r && r.meta && r.meta.questionFamily === 'tower_general_term') || /מגדל כוסות/.test(all)) {
        return { d, r, all };
      }
    }
  }
  return null;
}
const towerSamples = ['open', 'mcq', 'tf', 'mistake'].map(t => [t, findTowerSample(t)]);
check('A7-01 tower family is discoverable in every question type',
  towerSamples.every(([, s]) => !!s),
  towerSamples.filter(([, s]) => !s).map(([t]) => t).join(', '));
check('A7-01 tower uses exact family provenance',
  towerSamples.every(([, s]) => s && s.r && s.r.meta && s.r.meta.questionFamily === 'tower_general_term' && s.r.meta.familyProvenance === 'exact'));
check('A7-01 tower always renders a cup-tower diagram',
  towerSamples.every(([, s]) => s && /<svg[\s\S]*cup-tower-svg/.test(s.r.questionHTML || '')));
check('A7-01 tower output has professional Hebrew step wording',
  towerSamples.every(([, s]) => s && !/\$\+\d+/.test(s.all) && !/מגדל מכוס אחת/.test(s.all) && /גובה של כוס אחת|גובה הכוס הראשונה/.test(s.all)));

const ids = pilotIds.concat(sourceFitIds).sort();
let scanned = 0;
const offenders = [];
const hebrewOffenders = [];
const svgOffenders = [];
const demoOffenders = [];

for (const id of ids) {
  for (const d of ['basic', 'standard', 'challenge']) {
    for (const t of ['open', 'mcq', 'tf', 'mistake']) {
      for (let i = 0; i < N; i++) {
        scanned++;
        const r = callEngine(id, d, t);
        if (!r) { offenders.push([id, t, 'no-result', '']); break; }
        const all = (r.questionHTML || '') + (r.answerHTML || '');
        const p = prose(all);
        if (RAW_DEGREE.test(p)) { offenders.push([id, t, 'raw-degree', p.match(RAW_DEGREE)[0]]); break; }
        if (RAW_EQ.test(p)) { offenders.push([id, t, 'raw-equation', p.match(RAW_EQ)[0]]); break; }
        if (RAW_NEG_AFTER_HEB.test(p)) { offenders.push([id, t, 'raw-negative', p.match(RAW_NEG_AFTER_HEB)[0]]); break; }
        if (BADTOK.test(all)) { offenders.push([id, t, 'undefined/NaN', '']); break; }
        if (DEMO_TOK.test(p)) { demoOffenders.push([id, t, 'demo-token', p.match(DEMO_TOK)[0]]); break; }
        for (const [kind, re] of BAD_HEBREW) {
          const m = p.match(re);
          if (m) { hebrewOffenders.push([id, t, kind, m[0].slice(0, 80)]); break; }
        }
        for (const svg of svgs(all)) {
          for (const node of textNodes(svg)) {
            if (/[֐-׿]/.test(node.text) && /\d+\s*:\s*\d+/.test(node.text)) {
              svgOffenders.push([id, t, 'rtl-colon-ratio-in-svg', node.text]);
              break;
            }
            if (/^\d+\s+\d+$/.test(node.text.trim())) {
              svgOffenders.push([id, t, 'numeric-internal-value-leak-in-svg', node.text]);
              break;
            }
          }
          if (svgOffenders.length) break;
        }
        if (hebrewOffenders.length || svgOffenders.length) break;
      }
    }
  }
}

for (const o of offenders.slice(0, 12)) console.log('  OFFENDER', o.join(' | '));
for (const o of hebrewOffenders.slice(0, 12)) console.log('  HEBREW_OFFENDER', o.join(' | '));
for (const o of svgOffenders.slice(0, 12)) console.log('  SVG_BIDI_OFFENDER', o.join(' | '));
for (const o of demoOffenders.slice(0, 12)) console.log('  DEMO_OFFENDER', o.join(' | '));

check('no raw math in Hebrew prose (' + scanned + ' generations scanned)', offenders.length === 0, offenders.length + ' offenders');
check('no demo/placeholder wording in generated student output', demoOffenders.length === 0, demoOffenders.length + ' offenders');
check('no broken Hebrew quantity phrasing in generated output', hebrewOffenders.length === 0, hebrewOffenders.length + ' offenders');
check('no RTL-fragile colon ratios inside Hebrew SVG labels', svgOffenders.length === 0, svgOffenders.length + ' offenders');

console.log(fails ? 'MATH_BIDI_QUALITY_FAIL (' + fails + ')' : 'MATH_BIDI_QUALITY_PASS');
process.exit(fails ? 1 : 0);
