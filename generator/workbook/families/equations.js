// Verified solution exercises from the A7-03 pedagogy registry.
(function (root) {
  'use strict';
  const W = root.TargilimWorkbook;
  const I = W.items;
  const topicId = 'A7-03-ENGINE';
  const familyIds = {
    one_step: 'A7-03-one',
    two_step: 'A7-03-two',
    parentheses_equation: 'A7-03-parens'
  };
  const defaultFamily = { basic: 'one_step', standard: 'two_step', challenge: 'parentheses_equation' };
  const signed = value => value < 0 ? String(value) : '+' + value;
  const term = coefficient => coefficient === 1 ? 'x' : coefficient + 'x';
  const formula = text => '$' + text + '$';

  function equation(family, data) {
    const { a, b, c } = data;
    const left = family === 'parentheses_equation' ? a + '(x' + signed(b) + ')' : term(a) + signed(b);
    return left + '=' + c;
  }

  function generate(rng, level, qtype, options) {
    const family = options?.family || defaultFamily[level];
    const x = level === 'challenge' ? -rng.int(1, 12) : rng.int(1, 15);
    const a = family === 'one_step' ? 1 : rng.int(2, level === 'challenge' ? 9 : 6);
    const b = rng.int(1, 12) * (level === 'basic' ? 1 : rng.pick([-1, 1]));
    const distributed = family === 'parentheses_equation' ? a * b : b;
    const c = a * x + distributed;
    const data = { a, b, c };
    const shown = formula(equation(family, data));
    const wrong = x + rng.pick([-2, -1, 1, 2]);
    const steps = [];
    if (family === 'parentheses_equation') steps.push('פותחים סוגריים: ' + formula(term(a) + signed(distributed) + '=' + c) + '.');
    steps.push('מבודדים את האיבר עם המשתנה: ' + formula(term(a) + '=' + (c - distributed)) + '.');
    if (a !== 1) steps.push('מחלקים את שני האגפים ב־' + I.tex(a) + ': ' + formula('x=' + x) + '.');
    const substituted = family === 'parentheses_equation'
      ? a + '(' + x + signed(b) + ')'
      : (a === 1 ? String(x) : a + '\\cdot(' + x + ')') + signed(b);
    steps.push('בדיקה בהצבה: ' + formula(substituted + '=' + c) + '.');
    const item = {
      topicId, family, familyId: familyIds[family], level, qtype, data,
      stem: 'פתרו את המשוואה ' + shown + '.',
      answer: { value: x }, solution: steps.join('\n'), workLines: family === 'one_step' ? 2 : 3
    };
    if (qtype === 'mcq') {
      item.choices = I.choices(rng, [x, x - 1, x + 1, x + 2].map(value => ({
        html: formula('x=' + value), value, correct: value === x
      })));
    } else if (qtype === 'tf') {
      const claim = rng.chance(0.5) ? x : wrong;
      item.lead = 'נתונה המשוואה ' + shown + '.';
      item.stem = 'פתרון המשוואה הוא ' + formula('x=' + claim) + '.';
      item.answer = { value: claim === x, claim };
    } else if (qtype === 'mistake') {
      item.lead = 'נתונה המשוואה ' + shown + '.';
      const badConstant = c + distributed;
      item.stem = 'תלמיד כתב ' + formula(term(a) + '=' + badConstant) + '.';
      item.answer.wrongConstant = badConstant;
      item.solution = 'כדי לבטל את האיבר החופשי, מחסרים אותו משני האגפים.\n' + item.solution;
    }
    return item;
  }

  function verify(item, options) {
    const problems = I.check(item, options);
    const { a, b, c } = item.data;
    const withParentheses = item.family === 'parentheses_equation';
    const evaluates = candidate => Number.isInteger(candidate) &&
      (withParentheses ? a * (candidate + b) : a * candidate + b) === c;
    if (![a, b, c].every(Number.isInteger) || a <= 0 || b === 0 ||
        (item.family === 'one_step' ? a !== 1 : a <= 1) || item.familyId !== familyIds[item.family]) {
      problems.push('invalid equation or family');
    }
    if (!(item.lead || item.stem).includes(formula(equation(item.family, item.data)))) problems.push('equation missing from student prompt');
    if (item.qtype === 'tf' ? item.answer.value !== evaluates(item.answer.claim) : !evaluates(item.answer.value)) {
      problems.push('answer does not match substitution');
    }
    if (item.qtype === 'tf' && !item.stem.includes(formula('x=' + item.answer.claim))) {
      problems.push('true/false claim differs from the checked value');
    }
    if (item.qtype === 'mcq' && !item.choices.every(choice =>
      choice.correct === evaluates(choice.value) && choice.html === formula('x=' + choice.value))) {
      problems.push('choice does not match substitution');
    }
    if (item.qtype === 'mistake' && (!Number.isInteger(item.answer.wrongConstant) ||
        item.answer.wrongConstant === a * item.answer.value ||
        !item.stem.includes(formula(term(a) + '=' + item.answer.wrongConstant)))) {
      problems.push('student step must change the solution');
    }
    return problems;
  }

  W.registerTopic({
    topicId, families: Object.keys(familyIds), qtypes: I.QTYPES,
    selectFamily(rng, level, qtype) {
      const legacy = root.TargilimEngine.selectA703Family(level, qtype, rng.pick);
      const family = legacy === 'parens' ? 'parentheses_equation' : legacy;
      return familyIds[family] ? family : null;
    },
    generate, verify,
    levelSignature: item => item.family + '/' + (item.level === 'challenge' ? 'negative-root' : 'positive-root')
  });
})(typeof window !== 'undefined' ? window : globalThis);
