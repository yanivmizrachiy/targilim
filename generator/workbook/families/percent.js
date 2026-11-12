// generator/workbook/families/percent.js
// Verified N8-04-ENGINE (אחוזים — מצבים סטטיים). Implements the three
// registered families — percent_of_amount (N8-04-of), percent_find_whole
// (N8-04-whole), percent_find_percent (N8-04-pct). Parameters are built from
// the answer backwards so every quantity is a whole number of the right kind
// (no "12.4 students"), and the checker recomputes part = whole · p / 100 with
// integer arithmetic (p is stored in tenths).
//
// Levels: basic – 10/20/25/50 %, one step; standard – any whole percent with
// whole results; challenge – percents such as 12.5 % / 37.5 %, or a second step
// (the part that remains).
(function (root) {
  'use strict';
  const W = root.TargilimWorkbook = root.TargilimWorkbook || {};
  const I = W.items;

  const P = {
    basic: [10, 20, 25, 50],
    standard: [5, 15, 30, 40, 60, 75, 35, 80, 45],
    challenge: [12.5, 37.5, 62.5, 87.5, 2.5, 7.5, 17.5, 22.5]
  };
  const pct = p => '$' + I.num(p) + '\\%$';
  const T = I.tex;

  // Each context: givens sentence, question, and a statement for true/false.
  const CONTEXTS = [
    {
      noun: 'תלמידים', countable: true, max: 480,
      given: { of: (w, p) => 'בשכבה ' + T(w) + ' תלמידים. ' + pct(p) + ' מהם השתתפו בטיול השנתי.',
        whole: (a, p) => T(a) + ' תלמידים, שהם ' + pct(p) + ' מתלמידי השכבה, השתתפו בטיול השנתי.',
        pct: (a, w) => 'בשכבה ' + T(w) + ' תלמידים, ו־' + T(a) + ' מהם השתתפו בטיול השנתי.' },
      ask: { of: 'כמה תלמידים השתתפו בטיול?', rest: 'כמה תלמידים לא השתתפו בטיול?', whole: 'כמה תלמידים יש בשכבה?', pct: 'איזה אחוז מתלמידי השכבה השתתפו בטיול?' },
      claim: { of: v => 'בטיול השתתפו ' + T(v) + ' תלמידים.', rest: v => T(v) + ' תלמידים לא השתתפו בטיול.', whole: v => 'בשכבה ' + T(v) + ' תלמידים.', pct: v => pct(v) + ' מתלמידי השכבה השתתפו בטיול.' }
    },
    {
      noun: 'עמודים', countable: true, max: 640,
      given: { of: (w, p) => 'בספר ' + T(w) + ' עמודים. נועה קראה ' + pct(p) + ' מהספר.',
        whole: (a, p) => 'נועה קראה ' + T(a) + ' עמודים, שהם ' + pct(p) + ' מהספר.',
        pct: (a, w) => 'בספר ' + T(w) + ' עמודים, ונועה קראה ' + T(a) + ' עמודים.' },
      ask: { of: 'כמה עמודים קראה נועה?', rest: 'כמה עמודים נשארו לנועה לקרוא?', whole: 'כמה עמודים יש בספר?', pct: 'איזה אחוז מהספר קראה נועה?' },
      claim: { of: v => 'נועה קראה ' + T(v) + ' עמודים.', rest: v => 'לנועה נשארו ' + T(v) + ' עמודים לקרוא.', whole: v => 'בספר ' + T(v) + ' עמודים.', pct: v => 'נועה קראה ' + pct(v) + ' מהספר.' }
    },
    {
      noun: '₪', countable: false, max: 2000,
      given: { of: (w, p) => 'לדני היו ' + T(w) + ' ₪. הוא הוציא ' + pct(p) + ' מהסכום על ספרים.',
        whole: (a, p) => 'דני הוציא ' + T(a) + ' ₪ על ספרים, שהם ' + pct(p) + ' מהסכום שהיה לו.',
        pct: (a, w) => 'לדני היו ' + T(w) + ' ₪, והוא הוציא ' + T(a) + ' ₪ על ספרים.' },
      ask: { of: 'כמה שקלים הוציא דני על ספרים?', rest: 'כמה שקלים נשארו לדני?', whole: 'כמה שקלים היו לדני?', pct: 'איזה אחוז מהסכום הוציא דני על ספרים?' },
      claim: { of: v => 'דני הוציא על ספרים ' + T(v) + ' ₪.', rest: v => 'לדני נשארו ' + T(v) + ' ₪.', whole: v => 'לדני היו ' + T(v) + ' ₪.', pct: v => 'דני הוציא על ספרים ' + pct(v) + ' מהסכום.' }
    },
    {
      noun: 'ליטר', countable: false, max: 2000,
      given: { of: (w, p) => 'במיכל ' + T(w) + ' ליטר מים. השקו את הגינה ב־' + pct(p) + ' מהמים.',
        whole: (a, p) => 'השקו את הגינה ב־' + T(a) + ' ליטר מים, שהם ' + pct(p) + ' מהמים שהיו במיכל.',
        pct: (a, w) => 'במיכל היו ' + T(w) + ' ליטר מים, והשקו את הגינה ב־' + T(a) + ' ליטר.' },
      ask: { of: 'בכמה ליטר מים השקו את הגינה?', rest: 'כמה ליטר מים נשארו במיכל?', whole: 'כמה ליטר מים היו במיכל?', pct: 'איזה אחוז מהמים שימשו להשקיה?' },
      claim: { of: v => 'השקו את הגינה ב־' + T(v) + ' ליטר.', rest: v => 'במיכל נשארו ' + T(v) + ' ליטר מים.', whole: v => 'במיכל היו ' + T(v) + ' ליטר מים.', pct: v => pct(v) + ' מהמים שימשו להשקיה.' }
    }
  ];

  const tenths = p => Math.round(p * 10);
  const gcd = (x, y) => (y ? gcd(y, x % y) : x);
  // whole · p / 100 is a whole number exactly when whole is a multiple of this step.
  const wholeStep = p => 1000 / gcd(1000, tenths(p));

  function numbers(rng, level, ctx) {
    const p = rng.pick(P[level]);
    const step = wholeStep(p), min = level === 'basic' ? 20 : 40, options = [];
    for (let w = step; w <= ctx.max; w += step) if (w >= min) options.push(w);
    const whole = rng.pick(options.length ? options : [step]);
    return { p: p, whole: whole, part: whole * tenths(p) / 1000 };
  }

  const targetOf = (kind, n) => ({ of: n.part, rest: n.whole - n.part, whole: n.whole, pct: n.p })[kind];
  // misconception values, first = the error shown in "find the mistake"
  const wrongOf = (kind, n) => ({
    of: [n.whole / n.p, n.p, n.whole - n.part, n.whole * n.p / 10],
    rest: [n.part, n.whole - n.p, n.whole / n.p],
    whole: [n.part * n.p / 100, n.part + n.p, n.part * n.p / 10],
    pct: [n.whole / n.part * 100, n.part, n.part / n.whole]
  })[kind];

  function make(rng, level, qtype, family) {
    const ctx = rng.pick(CONTEXTS);
    const kind = family === 'percent_find_whole' ? 'whole' : family === 'percent_find_percent' ? 'pct'
      : level === 'challenge' && rng.chance(0.5) ? 'rest' : 'of';
    let n = numbers(rng, level, ctx);
    for (let k = 0; k < 30 && qtype === 'mistake' && I.same(wrongOf(kind, n)[0], targetOf(kind, n)); k++) n = numbers(rng, level, ctx);
    const value = targetOf(kind, n), wrong = wrongOf(kind, n);
    const plausible = v => (kind === 'pct' || !ctx.countable ? Math.abs(v * 10 - Math.round(v * 10)) < 1e-9 : Number.isInteger(v));
    const show = v => kind === 'pct' ? pct(v) : T(v) + ' ' + ctx.noun;
    const given = (kind === 'whole' ? ctx.given.whole(n.part, n.p) : kind === 'pct' ? ctx.given.pct(n.part, n.whole) : ctx.given.of(n.whole, n.p));
    const pp = I.num(n.p);
    const steps = kind === 'of' || kind === 'rest'
      ? 'מחשבים ' + pct(n.p) + ' מתוך ' + T(n.whole) + ':\n$$' + n.whole + '\\cdot\\frac{' + pp + '}{100}=' + I.num(n.part) + '$$' +
        (kind === 'rest' ? '\nהחלק שנשאר:\n$$' + n.whole + '-' + I.num(n.part) + '=' + I.num(value) + '$$' : '') + '\nהתשובה: ' + show(value) + '.'
      : kind === 'whole'
        ? T(n.part) + ' הם ' + pct(n.p) + ' מהשלם, ולכן השלם הוא:\n$$' + I.num(n.part) + '\\cdot\\frac{100}{' + pp + '}=' + n.whole + '$$\nהתשובה: ' + show(n.whole) + '.'
        : 'מחלקים את החלק בשלם וכופלים ב־$100$:\n$$\\frac{' + I.num(n.part) + '}{' + n.whole + '}\\cdot100=' + pp + '$$\nהתשובה: ' + pct(n.p) + '.';
    const item = {
      topicId: 'N8-04-ENGINE', familyId: kind === 'whole' ? 'N8-04-whole' : kind === 'pct' ? 'N8-04-pct' : 'N8-04-of',
      family: family, level: level, qtype: qtype, figure: null,
      data: { kind: kind, p: n.p, whole: n.whole, part: n.part },
      answer: { value: value }, solution: steps, workLines: level === 'challenge' ? 3 : 2
    };
    if (qtype === 'mcq') {
      item.stem = given + '\n' + ctx.ask[kind];
      item.choices = I.numericChoices(rng, value, wrong, show, plausible);
    } else if (qtype === 'tf') {
      const truth = rng.chance(0.5);
      const claim = truth ? value : (wrong.find(v => v > 0 && plausible(v) && !I.same(v, value)) || value + (kind === 'pct' ? 5 : 10));
      item.lead = given;
      item.stem = ctx.claim[kind](claim);
      item.answer = { value: truth, claim: claim, target: value };
      item.solution = (truth ? 'הטענה נכונה.\n' : 'הטענה שגויה.\n') + steps;
    } else if (qtype === 'mistake') {
      const bad = wrong[0];
      item.lead = given + '\n' + ctx.ask[kind];
      item.stem = 'פתרון של תלמיד:\n' + (kind === 'of' ? '$$' + n.whole + ':' + pp + '=' + I.num(bad) + '$$'
        : kind === 'rest' ? '$$' + n.whole + '\\cdot\\frac{' + pp + '}{100}=' + I.num(bad) + '$$'
          : kind === 'whole' ? '$$' + I.num(n.part) + '\\cdot\\frac{' + pp + '}{100}=' + I.num(bad) + '$$'
            : '$$\\frac{' + n.whole + '}{' + I.num(n.part) + '}\\cdot100=' + I.num(bad) + '$$') + '\nהתשובה: ' + show(bad) + '.';
      item.answer = { value: value, wrong: bad };
      item.solution = 'הטעות: ' + {
        of: 'התלמיד חילק באחוז, במקום לחשב ' + pct(n.p) + ' מהשלם.',
        rest: 'התלמיד חישב את החלק שהשתמשו בו, ולא את החלק שנשאר.',
        whole: 'התלמיד חישב ' + pct(n.p) + ' מתוך החלק, במקום למצוא את השלם שהחלק הוא ' + pct(n.p) + ' ממנו.',
        pct: 'התלמיד חילק את השלם בחלק, במקום לחלק את החלק בשלם.'
      }[kind] + '\n' + steps;
      item.workLines = 3;
    } else {
      item.stem = given + '\n' + ctx.ask[kind];
    }
    return item;
  }

  function verify(item, opts) {
    const p = I.check(item, opts);
    const d = item.data;
    if (!Number.isInteger(d.whole) || d.whole <= 0) p.push('whole not a positive integer');
    if (d.whole * tenths(d.p) !== d.part * 1000) p.push('part ≠ whole · p / 100');
    if (!Number.isInteger(d.part)) p.push('part is not whole');
    if (P[item.level].indexOf(d.p) < 0) p.push('percent outside level band');
    const target = targetOf(d.kind, d);
    if (item.qtype === 'tf' ? item.answer.value !== I.same(item.answer.claim, target) : !I.same(item.answer.value, target)) p.push('answer mismatch');
    const text = (item.lead || '') + '\n' + item.stem;
    const givens = d.kind === 'whole' ? [d.part, d.p] : d.kind === 'pct' ? [d.part, d.whole] : [d.whole, d.p];
    givens.forEach(g => { if (text.indexOf('$' + I.num(g)) < 0) p.push('given ' + g + ' missing'); });
    if ((item.qtype === 'open' || item.qtype === 'mcq') && text.indexOf('$' + I.num(target) + '$') >= 0 && givens.every(g => !I.same(g, target))) p.push('stem reveals the answer');
    if (item.qtype === 'tf' && !(item.answer.claim > 0)) p.push('tf claim invalid');
    if (item.qtype === 'mistake' && I.same(item.answer.wrong, target)) p.push('mistake shows the right answer');
    if (item.qtype === 'mcq') {
      const right = item.choices.filter(c => c.correct);
      if (right.length !== 1 || !I.same(right[0].value, target)) p.push('mcq correct choice is not the answer');
    }
    return p;
  }

  const FAMILIES = ['percent_of_amount', 'percent_find_whole', 'percent_find_percent'];
  W.registerTopic({
    topicId: 'N8-04-ENGINE',
    label: 'אחוזים — מצבים סטטיים',
    families: FAMILIES,
    qtypes: ['open', 'mcq', 'tf', 'mistake'],
    generate: function (rng, level, qtype, opts) { return make(rng, level, qtype, (opts && opts.family) || rng.pick(FAMILIES)); },
    verify: verify,
    // what changes between levels: benchmark → whole → decimal percents (+ a second step)
    levelSignature: item => item.data.kind + '/' + (P.basic.indexOf(item.data.p) >= 0 ? 'benchmark%' : Number.isInteger(item.data.p) ? 'whole%' : 'decimal%')
  });
})(typeof window !== 'undefined' ? window : globalThis);
