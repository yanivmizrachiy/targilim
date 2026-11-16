import fs from 'node:fs';

const src = fs.readFileSync('generator/exercise-set.js', 'utf8');
const checks = [
  ['no TYPE_LABELS in exercise-set renderer', !src.includes('TYPE_LABELS')],
  ['no qtype badge expression', !src.includes('ex.qtype]')],
  ['sharp rectangle sanitizer exists', src.includes('function sharpenMathRects')],
  ['question html sanitized before render', src.includes('const questionHTML=sharpenMathRects(ex.questionHTML);')],
  ['exercise body uses both drawing and student marker sanitizers', src.includes("+'<div class=\"ex-body\">'+E.studentQuestionHTML(questionHTML)+'</div>'")],
  ['engine exercises keep requested qtype for worksheet layout', src.includes('if(ex&&!ex.qtype)ex.qtype=qtype;')],
  ['answer box line count is proportional', src.includes('function answerBoxLineCount') && src.includes('data-answer-lines')],
  ['open answer boxes are not fixed to five lines', /LINES\s*=\s*\{\s*open\s*:\s*[23]\s*,\s*mistake\s*:\s*4\s*\}/.test(src)]
];

let fails = 0;
for (const [name, ok] of checks) {
  console.log((ok ? 'PASS' : 'FAIL') + ' - ' + name);
  if (!ok) fails++;
}

console.log(fails ? 'WORKSHEET_POLISH_FAIL' : 'WORKSHEET_POLISH_PASS');
process.exit(fails ? 1 : 0);
