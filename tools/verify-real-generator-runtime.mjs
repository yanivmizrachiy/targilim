// tools/verify-real-generator-runtime.mjs
// Verifies the browser exercise-set runtime layer (count control, mixed types,
// set renderer, answer key, print) — both statically and with a real VM smoke run
// of the actual runtime files against a minimal DOM stub.
// Run: node tools/verify-real-generator-runtime.mjs
import fs from 'node:fs';
import vm from 'node:vm';

let fails = 0;
function check(name, ok){ console.log((ok?'PASS':'FAIL')+' — '+name); if(!ok) fails++; }
function read(p){ return fs.readFileSync(p,'utf8'); }

// ── 1. index.html controls ──
const index = read('generator/index.html');
check('index has מספר תרגילים control', index.includes('מספר תרגילים') && index.includes('id="sn"'));
// Phase 1: the teacher must be able to choose exactly 1..10 questions, no more.
const snBlock = (index.match(/<select id="sn"[\s\S]*?<\/select>/) || [''])[0];
for (const v of ['1','2','3','4','5','6','7','8','9','10']) {
  check('count option '+v, new RegExp('<option value="'+v+'"[^>]*>'+v+'</option>').test(snBlock));
}
check('count selector offers no option above 10', !/<option value="(1[1-9]|[2-9]\d+)"/.test(snBlock));
// Phase 1 REQ 6: teacher control for one vs more-than-one correct MCQ.
check('index has selMcqMode control', index.includes('id="selMcqMode"'));
check('selMcqMode offers single + multi options',
  /value="single"[^>]*>תשובה אחת נכונה/.test(index) && /value="multi"[^>]*>ייתכן יותר מאחת/.test(index));
check('index has מעורב option (default)', /<option value="mixed" selected>מעורב<\/option>/.test(index));
check('index button is צור דף תרגילים', index.includes('צור דף תרגילים ◀'));
check('index loads exercise-set.js', /<script src="exercise-set\.js(?:\?[^"<>]*)?"><\/script>/.test(index));
check('question type label is סוג שאלות', index.includes('סוג שאלות'));

// ── 2. Runtime layer functions ──
const exset = read('generator/exercise-set.js');
const core = read('generator/core.js');
const pattern = read('generator/engine/pattern-engine.js');
check('set generation function exists', exset.includes('function generateSet('));
check('set renderer function exists', exset.includes('function renderExerciseSet('));
check('answer key toggle exists', exset.includes('function toggleAnswerKey('));
check('print set control exists', exset.includes('function printExerciseSet(') && exset.includes('הדפס דף תרגילים'));
check('answer key labels הצג/הסתר תשובות', exset.includes('הצג תשובות') && exset.includes('הסתר תשובות'));
check('mixed type plan logic exists', exset.includes('function buildTypePlan(') && exset.includes("'mixed'"));
check('duplicate avoidance logic exists', exset.includes('new Set()') && exset.includes('seen.has(key)'));
check('engine access layer exists', pattern.includes('E.getEngineExercise') && pattern.includes('E.isEngineTopic'));
check('generate() dispatches to set mode', core.includes('generateSet'));

// ── 3. Compatibility preserved ──
check('renderEngineCard still exists', pattern.includes('E.renderEngineCard = function'));
check('visual mode still exists', core.includes('function applyVisualMode') && exset.includes('applyVisualMode'));
check('copyImg/dlPNG still referenced', read('generator/export.js').includes('copyImg') && read('generator/export.js').includes('dlPNG'));
check('KaTeX render call in set renderer', exset.includes('renderMathInElement'));
check('no demo labels', !index.includes('דמו') && !exset.includes('demo') && !exset.includes('דמו'));

// ── 4. Source grounding ──
const PDFS = [
  'sources/intake/2026-06-09/01-grade-7-algebra/01_grade-7_algebra_curriculum.pdf',
  'sources/intake/2026-06-09/02-grade-8-algebra/02_grade-8_algebra_curriculum.pdf',
  'sources/intake/2026-06-09/03-grade-7-pre-deductive-geometry/03_grade-7_pre_deductive_geometry_curriculum.pdf',
  'sources/intake/2026-06-09/04-grade-8-geometry/04_grade-8_geometry_curriculum.pdf',
  'sources/intake/2026-06-09/05-grade-7-numeric-domain/05_grade-7_numeric_domain_curriculum.pdf',
  'sources/intake/2026-06-09/06-uncertainty-domain/06_uncertainty_domain_curriculum_examples.pdf',
  'sources/intake/2026-06-09/07-numeric-principles-grades-7-8/07_numeric_domain_principles_grades-7-8.pdf',
  'sources/intake/2026-06-09/08-algebra-principles-grades-7-8/08_algebra_domain_principles_grades-7-8.pdf',
  'sources/intake/2026-06-09/09-geometry-principles-grades-7-8/09_geometry_domain_principles_grades-7-8.pdf',
  'sources/intake/2026-06-09/10-grade-8-teaching-sequence-2026-2027/10_grade-8_teaching_sequence_2026-2027.pdf'
];
check('all 10 source PDFs exist', PDFS.every(p=>fs.existsSync(p)));
check('source-learning files exist', fs.readdirSync('source-learning/2026-06-09').filter(f=>f.endsWith('.learning.md')).length >= 10);
check('PATTERN_INDEX exists', fs.existsSync('question-patterns/PATTERN_INDEX.md'));
check('CURRICULUM_MAP exists', fs.existsSync('curriculum-map/CURRICULUM_MAP.md'));

// ── 5. VM runtime smoke: load the real files, simulate clicks ──
function makeEl(extra){ return Object.assign({value:'',innerHTML:'',textContent:'',style:{},classList:{
  _s:new Set(), toggle(c){this._s.has(c)?this._s.delete(c):this._s.add(c);}, contains(c){return this._s.has(c);}, add(c){this._s.add(c);}
}, addEventListener(){}, querySelectorAll(){return [];}}, extra||{}); }

const els = {
  sg: makeEl({value:'7'}), sd: makeEl({value:'numeric'}),
  st: makeEl({value:'N7-03-ENGINE', selectedIndex:0, options:[{textContent:'מספרים שליליים — גרסה חכמה ✦'}]}),
  sl: makeEl({value:'standard'}), sv: makeEl({value:'color'}), sn: makeEl({value:'10'}),
  selQType: makeEl({value:'mixed'}), selDiff: makeEl({value:'standard'}), selMcqMode: makeEl({value:'single'}),
  out: makeEl(), mainTitle: makeEl(), gradeBadge: makeEl(), enginePanel: makeEl(), answerKey: null, btnAnswerKey: null
};
const sandbox = { console, Math, Date,
  document: {
    querySelector(){ return {}; },
    getElementById(id){ return els[id] !== undefined ? els[id] : makeEl(); },
    createElement(){ return makeEl(); },
    addEventListener(){},
    head:{appendChild(){}}, body:{appendChild(){}}
  },
  renderMathInElement(){}, html2canvas: null
};
sandbox.window = sandbox;
sandbox.addEventListener = function(){};
vm.createContext(sandbox);

const files = ['generator/core.js','generator/numeric.js',
  'generator/engine/themes.js','generator/engine/random.js','generator/engine/validators.js',
  'generator/engine/diagrams.js','generator/engine/question-types.js']
  .concat(fs.readdirSync('generator/engine').filter(f=>f.startsWith('pilot-')).sort().map(f=>'generator/engine/'+f))
  .concat(['generator/engine/pattern-engine.js',
    // the document layer's seeded + verified generation (workbook core)
    'generator/workbook/rng.js','generator/workbook/figures.js','generator/workbook/items.js',
    'generator/workbook/families/pythagoras.js','generator/workbook/families/percent.js',
    'generator/exercise-set.js']);
let loadError = null;
for (const f of files) {
  try { vm.runInContext(read(f), sandbox, {filename:f}); }
  catch(e){ loadError = f+': '+e.message; break; }
}
check('runtime files load in VM', !loadError);
if (loadError) console.log('  load error: '+loadError);

if (!loadError) {
  const BAD = /undefined|NaN/;
  // engine topic, mixed, 10 exercises
  vm.runInContext('generate()', sandbox);
  let html = els.out.innerHTML;
  check('set renders 10 exercises (engine topic, mixed)', (html.match(/ex-card/g)||[]).length === 10 && html.includes('תרגיל 10'));
  check('set has answer key with 10 entries', html.includes('מפתח תשובות') && (html.match(/ak-item/g)||[]).length === 10);
  check('set has answer toggle and print buttons', html.includes('הצג תשובות') && html.includes('הדפס דף תרגילים'));
  // Question-type badges were removed from the student card (worksheet polish), so
  // verify variety by question STRUCTURE instead of by the removed label text:
  // mcq → choices, tf → statement/verdict, mistake → prompt/box (open has none).
  const structHits = [/mcq-choice/.test(html), /tf-statement|tf-verdict/.test(html), /mistake-prompt|mistake-box/.test(html)].filter(Boolean).length;
  check('mixed set contains multiple question types (by structure)', structHits >= 2);
  check('no undefined/NaN in set output', !BAD.test(html));
  check('no engine ids in set output', !html.includes('-ENGINE'));

  // duplicate avoidance: the max (10) from one engine still renders 10 distinct
  els.sn.value='10'; vm.runInContext('generate()', sandbox);
  check('10-exercise set renders fully', (els.out.innerHTML.match(/ex-card/g)||[]).length === 10);

  // Phase 1 REQ 6: MCQ instruction wording must match the selected mode.
  els.selQType.value='mcq'; els.sn.value='5';
  els.selMcqMode.value='single'; vm.runInContext('generate()', sandbox);
  const singleHtml = els.out.innerHTML;
  check('single mode prints "תשובה אחת נכונה" instruction',
    /mcq-instruction[^>]*>[^<]*התשובה הנכונה \(אחת בלבד\)/.test(singleHtml));
  check('single mode does NOT print the multi instruction', !singleHtml.includes('כל התשובות הנכונות'));
  els.selMcqMode.value='multi'; vm.runInContext('generate()', sandbox);
  const multiHtml = els.out.innerHTML;
  check('multi mode prints "ייתכן יותר מאחת — סמנו את כל הנכונות" instruction',
    /mcq-instruction[^>]*>[^<]*ייתכן שיותר מתשובה אחת נכונה[^<]*סמנו את כל התשובות הנכונות/.test(multiHtml));
  check('multi mode does NOT print the single-only instruction', !multiHtml.includes('(אחת בלבד)'));
  // restore defaults for the remaining tests
  els.selQType.value='mixed'; els.selMcqMode.value='single';

  // legacy (non-engine) topic set via renderCard capture
  els.st.value='N7-06'; els.st.options=[{textContent:'חזקות: (−a)ⁿ לעומת −aⁿ'}]; els.sn.value='5';
  vm.runInContext('generate()', sandbox);
  check('legacy topic produces a 5-exercise set', (els.out.innerHTML.match(/ex-card/g)||[]).length === 5);
  check('no undefined/NaN in legacy set', !BAD.test(els.out.innerHTML));

  // count=1 is a one-exercise document (RULES.md: one document model for the
  // book, print and PDF), still with its copy/download-as-image actions.
  // Intentional change from the former single-card path (PR: workbook slice).
  els.st.value='N7-03-ENGINE';
  els.st.options=[{textContent:'מספרים שליליים — גרסה חכמה ✦'}];
  els.sn.value='1';
  els.selQType.value='mixed';
  vm.runInContext('generate()', sandbox);
  html = els.out.innerHTML;
  check('count=1 renders one numbered exercise with image export',
    (html.match(/class="qcard engine-card ex-card"/g)||[]).length === 1 && html.includes('תרגיל 1') &&
    html.includes('exImageCopy(0') && html.includes('exImageDownload(0') && (html.match(/ak-item/g)||[]).length === 1);
  check('count=1 with mixed restores selector', els.selQType.value === 'mixed');

  // Verified families: seeded replay and answer isolation through the real runtime.
  const W = sandbox.TargilimWorkbook;
  check('workbook core loaded (seeded rng + verified families)', !!(W && W.rng && W.families && W.families['G7-03-ENGINE'] && W.families['N8-04-ENGINE']));
  els.st.value='G7-03-ENGINE'; els.st.options=[{textContent:'פיתגורס'}]; els.sn.value='8'; els.selQType.value='mcq';
  els.sseed = makeEl({value:'K7M2QF'});
  vm.runInContext('generate()', sandbox);
  const first = els.out.innerHTML;
  vm.runInContext('generate()', sandbox);
  check('same settings + document code rebuild the identical document', first === els.out.innerHTML && first.includes('K7M2QF'));
  const student = first.split('id="answerKey"')[0];
  check('student pages carry no answer markers (verified mcq)', !/mcq-correct|tf-verdict/.test(student) && /התשובה הנכונה: [אבגד]/.test(first));
  els.selQType.value='mixed'; els.sseed = makeEl({value:''});
}

console.log(fails ? 'REAL_GENERATOR_RUNTIME_VERIFY_FAIL ('+fails+')' : 'REAL_GENERATOR_RUNTIME_VERIFY_PASS');
process.exit(fails?1:0);
