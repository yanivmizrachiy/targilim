// tools/verify-student-answer-boundary.mjs
// Regression gate for the student HTML, worksheet key, single-card UI and print.
// Read-only. Internal engine metadata may identify answers; student-facing
// question DOM, student PNG captures and default prints must not.
import fs from 'node:fs';
import vm from 'node:vm';

let failures = 0;
function check(name, ok, extra = '') {
  console.log((ok ? 'PASS' : 'FAIL') + ' - ' + name + (!ok && extra ? ' :: ' + extra : ''));
  if (!ok) failures++;
}
const read = path => fs.readFileSync(path, 'utf8');

const output = { innerHTML: '' };
const topics = () => ({ geometry: [], algebra: [], numeric: [], uncertainty: [] });
const sandbox = {
  console, Math, Date, setTimeout, clearTimeout, generators: {}, TOPICS: { 7: topics(), 8: topics() },
  document: {
    querySelector: () => ({}),
    createElement: () => ({ rel: '', href: '' }),
    getElementById: name => name === 'out' ? output : { value: '', style: {}, addEventListener() {} },
    head: { appendChild() {} }, body: { appendChild() {} }
  },
  setMainTitle() {}, renderMathInElement() {}, addEventListener() {}, onGrade() {}, onDomain() {}
};
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const file of [
  'generator/engine/question-types.js',
  'generator/engine/pattern-engine.js',
  'generator/exercise-set.js'
]) vm.runInContext(read(file), sandbox, { filename: file });

const E = sandbox.TargilimEngine;
check('single student sanitizer is registered', typeof E.studentQuestionHTML === 'function');
const mcq = E.questionTypes.mcq({
  question: 'בחרו את התשובות הנכונות', answer: 'מפתח תשובות נפרד',
  choices: [
    { label: 'א', text: '$2$', correct: true },
    { label: 'ב', text: '$3$', correct: false },
    { label: 'ג', text: '$4$', correct: true }
  ]
});
check('test fixture has two internal keys', (mcq.questionHTML.match(/mcq-correct/g) || []).length === 2);
sandbox.exerciseFixture = { questionHTML: mcq.questionHTML, answerHTML: mcq.answerHTML, qtype: 'mcq' };
const prepared = vm.runInContext('prepareStudentQuestion(exerciseFixture, window.TargilimEngine)', sandbox);
check('multi-correct teacher labels preserved separately', prepared.correctLabels?.join(',') === 'א,ג',
  JSON.stringify(prepared.correctLabels));
check('student HTML has no correct-answer marker', !/mcq-correct/.test(prepared.questionHTML));
check('student HTML still has all three options', (prepared.questionHTML.match(/class="mcq-choice"/g) || []).length === 3);
check('student HTML still contains the math choices',
  ['א.', 'ב.', 'ג.'].every(label => prepared.questionHTML.includes(label)));

vm.runInContext(`renderExerciseSet({
  topicLabel:'בדיקת תשובות',gradeLabel:'כיתה ז׳',domainLabel:'מספרי',cls:'num',diffLabel:'רמה 2'
}, [exerciseFixture])`, sandbox);
const worksheet = output.innerHTML;
const student = worksheet.split('<div class="answer-key"')[0];
check('rendered worksheet student section has no answer marker', !/mcq-correct/.test(student));
check('separate worksheet teacher key lists both correct options',
  worksheet.includes('התשובות הנכונות: א, ג'));
check('worksheet still has one answer key section', (worksheet.match(/class="answer-key"/g) || []).length === 1);

E.renderEngineCard('N7-03-ENGINE', 'בדיקה', mcq);
const single = output.innerHTML.split('<button class="btn-ans"')[0];
check('single-card student question has no answer marker', !/mcq-correct/.test(single));
check('single-card choice labels preserved', ['א.', 'ב.', 'ג.'].every(x => single.includes(x)));

const css = read('generator/style.css');
const print = css.slice(css.indexOf('@media print'));
check('default print hides inline solution panels',
  /\.answer\s*\{\s*display:\s*none\s*!important;\s*\}/.test(print));
check('teacher key remains opt-in and separate when printing',
  /\.answer-key:not\(\.open\)\s*\{\s*display:\s*none/.test(print) &&
  /\.answer-key.open\s*\{[\s\S]*?break-before:\s*page/.test(print));
console.log(failures ? 'STUDENT_ANSWER_BOUNDARY_FAIL (' + failures + ')' : 'STUDENT_ANSWER_BOUNDARY_PASS');
process.exit(failures ? 1 : 0);
