// Fail-closed regression gate for student-facing multiple-choice markup and print.
// Depends only on built-in Node.js modules, runs in verify:deep.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

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
assert.match(sheet, /const questionHTML=E\.studentQuestionHTML\(sharpenMathRects\(ex\.questionHTML\)\)/,
  'worksheet card DOM passes through student sanitizer');
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
