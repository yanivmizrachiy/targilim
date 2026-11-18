// Fail-closed regression gate for student-facing multiple-choice markup and print.
// Depends only on built-in Node.js modules, runs in verify:deep.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { loadEngines } from './engine-load.mjs';

const read = path => readFileSync(path, 'utf8');
const sandbox = { window: { TargilimEngine: {} } };
vm.createContext(sandbox);
vm.runInContext(read('generator/engine/question-types.js'), sandbox, { filename: 'question-types.js' });
const E = sandbox.window.TargilimEngine;

assert.equal(typeof E.studentQuestionHTML, 'function', 'single presentation sanitizer exists');
assert.equal(typeof E.questionTypes.mcq, 'function', 'real MCQ engine formatter exists');

function verifyOne(correctIndices) {
  const choices = ['11', '12', '13', '14'].map((text, i) => ({
    label: ['א','ב','ג','ד'][i],
    text,
    correct: correctIndices.includes(i)
  }));
  const generated = E.questionTypes.mcq({
    question: 'מהו הפתרון?',
    answer: 'הפתרון נמצא במפתח למורה',
    choices
  });
  const originalKey = generated.questionHTML.match(/mcq-choice mcq-correct/g) || [];
  assert.equal(originalKey.length, correctIndices.length, 'teacher-side answer markers retained for existing verifiers');
  const visible = E.studentQuestionHTML(generated.questionHTML);
  assert.equal((visible.match(/class="mcq-choice"/g) || []).length, choices.length, 'student gets every choice');
  assert.doesNotMatch(visible, /mcq-correct/, 'correct answer is not signaled in student markup');
  assert.equal(E.studentQuestionHTML(visible), visible, 'sanitizing twice is stable');
  assert.equal(generated.answerHTML, 'הפתרון נמצא במפתח למורה', 'teacher answer remains intact');
}
verifyOne([1]);
verifyOne([1, 3]);

const single = read('generator/engine/pattern-engine.js');
assert.match(single, /\$\{E\.studentQuestionHTML\(result\.questionHTML\)\}/,
  'single-question DOM passes through student sanitizer');

const sheet = read('generator/exercise-set.js');
assert.match(sheet, /const questionHTML=sharpenMathRects\(ex\.questionHTML\)/,
  'worksheet preserves rectangle sanitizer');
assert.ok(sheet.includes(`+'<div class="ex-body">'+E.studentQuestionHTML(questionHTML)+'</div>'`),
  'worksheet DOM strips answer markers after rectangle sanitizer');
assert.match(sheet, /ex\.questionHTML\.match\(\/mcq-choice mcq-correct/,
  'answer-key computation still uses original internal metadata');

const css = read('generator/style.css');
const print = css.slice(css.indexOf('/* ── Print ── */'));
assert.match(print, /\.answer:not\(\.open\)\s*\{\s*display:\s*none\s*!important;/,
  'unopened solution must be hidden on printed single card');
assert.match(print, /\.answer\.open\s*\{\s*display:\s*block\s*!important;/,
  'explicitly opened solution may be printed');
assert.doesNotMatch(print, /(?:^|\n)\s*\.answer\s*\{\s*display:\s*block\s*!important;/,
  'print stylesheet must never reveal all answers by default');
console.log('STUDENT_ANSWER_VISIBILITY_PASS — single MCQ, multi MCQ, worksheet, print');


// Independent QA sweep against the actual generator registry, not synthetic MCQs.
// Keep the teacher/internal answer key intact, while checking every student copy.
const actual = loadEngines();
const ids = [...actual.pilotIds, ...actual.sourceFitIds];
assert.equal(ids.length, 50, 'all 50 curriculum engines are in the QA inventory');
let checked = 0;
let originallyMarked = 0;
let alteredNonMarkerText = 0;
const examples = [];
for (const id of ids) {
  for (const diff of ['basic', 'standard', 'challenge']) {
    for (let i = 0; i < 20; i++) {
      const item = actual.callEngine(id, diff, 'mcq');
      if (!item || !/class="mcq-choices"/.test(item.questionHTML ?? '')) continue;
      checked++;
      const original = item.questionHTML;
      const clean = actual.E.studentQuestionHTML(original);
      const choiceCount = (original.match(/class="mcq-choice(?: mcq-correct)?\s*"/g) || []).length;
      const cleanCount = (clean.match(/class="mcq-choice"/g) || []).length;
      assert.equal(cleanCount, choiceCount, id + ': MCQ choices lost in student view');
      assert.doesNotMatch(clean, /mcq-correct/, id + ': correctness leaked in student view');
      assert.equal(actual.E.studentQuestionHTML(clean), clean, id + ': not idempotent');
      const restored = clean.replace(/class="mcq-choice"/g, 'class="mcq-choice"');
      if (!restored.includes('mcq-choice')) alteredNonMarkerText++;
      const n = (original.match(/mcq-choice mcq-correct/g) || []).length;
      if (n > 0) {
        originallyMarked += n;
        if (examples.length < 3) examples.push(id + '/' + diff + ': ' + n + ' teacher markers removed in view');
      }
      assert.ok(item.answerHTML, id + ': teacher answer disappeared');
    }
  }
}
assert.ok(checked >= 900, 'actual MCQ QA coverage too low: only ' + checked + ' samples');
assert.ok(originallyMarked >= checked, 'at least one teacher correctness marker expected per sampled MCQ');
assert.equal(alteredNonMarkerText, 0, 'sanitizer unexpectedly removed options');

// Rendered worksheet regression transferred from superseded PR #64:
// assert actual student/teacher section separation, not just engine metadata.
function checkRenderedWorksheetKey(correctIndices, expectedKey) {
  const out = { innerHTML: '' };
  const uiContext = {
    console, Math, Date, generators: {},
    TOPICS: {
      7: { numeric: [], algebra: [], geometry: [], uncertainty: [] },
      8: { numeric: [], algebra: [], geometry: [], uncertainty: [] }
    },
    document: {
      querySelector: () => ({}),
      getElementById: id => id === 'out' ? out :
        { value: '', style: {}, addEventListener() {} },
      createElement: () => ({ rel: '', href: '' }),
      head: { appendChild() {} }, body: { appendChild() {} }
    },
    setMainTitle() {}, renderMathInElement() {},
    addEventListener() {}, onDomain() {}, onGrade() {}
  };
  uiContext.window = uiContext;
  vm.createContext(uiContext);
  for (const name of [
    'generator/engine/question-types.js',
    'generator/engine/pattern-engine.js',
    'generator/exercise-set.js'
  ]) {
    vm.runInContext(read(name), uiContext, { filename: name });
  }
  const choices = ['2', '3', '4'].map((text, i) => ({
    label: ['א', 'ב', 'ג'][i], text, correct: correctIndices.includes(i)
  }));
  const question = uiContext.TargilimEngine.questionTypes.mcq({
    question: 'בחרו תשובות נכונות', answer: 'פתרון למורה בלבד',
    choices
  });
  const fixture = { ...question, qtype: 'mcq' };
  uiContext.fixture = fixture;
  vm.runInContext(
    "renderExerciseSet({topicLabel:'בדיקת מפתח',cls:'num',gradeLabel:'ז',domainLabel:'מספרי',diffLabel:'רמה 2'},[fixture])",
    uiContext
  );
  const full = out.innerHTML;
  const sections = full.split('<div class="answer-key" id="answerKey">');
  assert.equal(sections.length, 2, 'exactly one separate teacher answer-key section');
  const student = sections[0];
  const teacher = sections[1];
  assert.doesNotMatch(student, /mcq-correct/, 'student DOM must not mark correct options');
  assert.equal((student.match(/class="mcq-choice"/g) || []).length, choices.length,
    'every student choice survives rendering');
  assert.match(teacher, /class="ak-body">פתרון למורה בלבד/,
    'teacher explanation remains in the separate answer key');
  assert.ok(teacher.includes(expectedKey),
    'teacher key must contain all correct letters: ' + expectedKey);
  assert.doesNotMatch(student, /פתרון למורה בלבד/,
    'teacher explanation is not duplicated in worksheet student card');
  uiContext.TargilimEngine.renderEngineCard('N7-03-ENGINE', 'בדיקת כרטיס', question);
  const cardQuestion = out.innerHTML.split('<button class="btn-ans"')[0];
  assert.doesNotMatch(cardQuestion, /mcq-correct/,
    'single-question student DOM also removes answer hints');
}
checkRenderedWorksheetKey([0], 'התשובה הנכונה: א');
checkRenderedWorksheetKey([0, 2], 'התשובות הנכונות: א, ג');
console.log('RENDERED_STUDENT_TEACHER_KEY_PASS — single/multi correct and one key section');

console.log('STUDENT_ANSWER_SWEEP_PASS — ' + checked + ' actual MCQs, '
  + originallyMarked + ' internal correct markers protected, 50 engines, 3 difficulties');
