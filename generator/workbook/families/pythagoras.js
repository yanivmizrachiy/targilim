// generator/workbook/families/pythagoras.js
// Verified G7-03-ENGINE (משפט פיתגורס). Implements the three registered
// families — find_side (G7-03-side), check_right_triangle (G7-03-check),
// rectangle_diagonal (G7-03-rect) — with constructive parameters (Euclid's
// formula, so every right triangle is exact), drawings that show the givens
// and "?" only, and an independent checker that recomputes every answer.
//
// Levels (see docs/planning/WORKBOOK_IMPLEMENTATION_PLAN_20261112.md):
//   basic     – one direct step (hypotenuse / diagonal; sides in order).
//   standard  – reverse step (a missing leg or side), larger triples, sides
//               given out of order.
//   challenge – two steps (leg then perimeter / area) or identifying which
//               angle is right.
(function (root) {
  'use strict';
  const W = root.TargilimWorkbook = root.TargilimWorkbook || {};
  const I = W.items, F = W.figures;
  const CM = 'ס״מ';
  const MAX_C = { basic: 20, standard: 41, challenge: 65 };

  const gcd = (x, y) => (y ? gcd(y, x % y) : x);
  const sq = v => v * v;

  // All integer right triangles with hypotenuse ≤ maxC (legs a < b).
  function triples(maxC) {
    const out = [];
    for (let m = 2; m * m + 1 <= maxC; m++) {
      for (let n = 1; n < m; n++) {
        if ((m - n) % 2 === 0 || gcd(m, n) !== 1) continue;
        const a = m * m - n * n, b = 2 * m * n, c = m * m + n * n;
        for (let k = 1; k * c <= maxC; k++) out.push({ a: Math.min(a, b) * k, b: Math.max(a, b) * k, c: c * k });
      }
    }
    return out.sort((x, y) => x.c - y.c || x.a - y.a);
  }
  const POOL = {};
  Object.keys(MAX_C).forEach(k => { POOL[k] = triples(MAX_C[k]); });
  function pickTriple(rng, level) {
    const pool = level === 'basic' ? POOL.basic : level === 'standard' ? POOL.standard.filter(t => t.c > 5) : POOL.challenge.filter(t => t.c > 10);
    return rng.pick(pool);
  }

  const u = (v, unit) => I.qty(v, unit || CM);
  const lbl = (v, unit) => v === '?' ? '?' : I.num(v) + ' ' + (unit || CM);

  function base(level, qtype, familyId, family) {
    return { topicId: 'G7-03-ENGINE', familyId: familyId, family: family, level: level, qtype: qtype };
  }

  // ── find_side ────────────────────────────────────────────────────────────
  function findSide(rng, level, qtype, opts) {
    const t = pickTriple(rng, level);
    const swap = rng.chance(0.5);
    const AC = swap ? t.b : t.a, BC = swap ? t.a : t.b, AB = t.c;
    const kind = level === 'basic' ? 'hyp' : level === 'standard' ? (rng.chance(0.7) ? 'leg' : 'hyp') : 'leg-perimeter';
    const unknown = kind === 'hyp' ? 'AB' : 'AC';
    const value = { AB: AB, AC: AC, BC: BC }[unknown];
    const perimeter = AB + AC + BC;
    const intro = 'במשולש ישר-זווית $ABC$ הזווית $C$ ישרה.';
    const givens = kind === 'hyp'
      ? 'אורכי הניצבים הם $AC=' + AC + '$ ' + CM + ' ו־$BC=' + BC + '$ ' + CM + '.'
      : 'אורך היתר הוא $AB=' + AB + '$ ' + CM + ' ואורך הניצב $BC=' + BC + '$ ' + CM + '.';
    const ask = kind === 'hyp' ? 'חשבו את אורך היתר $AB$.' : kind === 'leg' ? 'חשבו את אורך הניצב החסר $AC$.'
      : 'א. חשבו את אורך הניצב החסר $AC$.\nב. חשבו את היקף המשולש.';
    const steps = kind === 'hyp'
      ? 'לפי משפט פיתגורס:\n$$AC^2+BC^2=AB^2$$\n$$' + AC + '^2+' + BC + '^2=AB^2$$\n$$' + sq(AC) + '+' + sq(BC) + '=AB^2$$\n$$AB=\\sqrt{' + sq(AB) + '}=' + AB + '$$\nאורך היתר $AB$ הוא ' + u(AB) + '.'
      : 'לפי משפט פיתגורס:\n$$AC^2+BC^2=AB^2$$\n$$AC^2=' + AB + '^2-' + BC + '^2=' + sq(AB) + '-' + sq(BC) + '=' + sq(AC) + '$$\n$$AC=\\sqrt{' + sq(AC) + '}=' + AC + '$$\nאורך הניצב $AC$ הוא ' + u(AC) + '.' +
        (kind === 'leg-perimeter' ? '\nהיקף המשולש:\n$$' + AB + '+' + AC + '+' + BC + '=' + perimeter + '$$\nהיקף המשולש הוא ' + u(perimeter) + '.' : '');
    const text = { a: lbl(unknown === 'AC' ? '?' : AC), b: lbl(BC), c: lbl(unknown === 'AB' ? '?' : AB) };
    const item = Object.assign(base(level, qtype, 'G7-03-side', 'find_side'), {
      figure: F.rightTriangle({ a: AC, b: BC, text: text, names: ['A', 'B', 'C'] }),
      data: { kind: kind, AC: AC, BC: BC, AB: AB, unknown: unknown, perimeter: perimeter },
      answer: { value: kind === 'leg-perimeter' ? perimeter : value, parts: kind === 'leg-perimeter' ? [AC, perimeter] : [value] },
      workLines: kind === 'leg-perimeter' ? 4 : 3
    });
    const target = kind === 'leg-perimeter' ? perimeter : value;
    const what = kind === 'hyp' ? 'אורך היתר $AB$' : kind === 'leg' ? 'אורך הניצב $AC$' : 'היקף המשולש';
    // misconception values: adding/subtracting lengths, forgetting the root
    const wrong = kind === 'hyp' ? [AC + BC, sq(AC) + sq(BC), Math.abs(BC - AC)]
      : kind === 'leg' ? [AB - BC, AB + BC, sq(AB) - sq(BC)]
        : [2 * AB, 2 * (AB + BC), AB + BC];
    if (qtype === 'mcq') {
      item.stem = intro + '\n' + givens + '\nמהו ' + what + '?';
      item.choices = I.numericChoices(rng, target, wrong, v => u(v));
      item.solution = steps;
    } else if (qtype === 'tf') {
      const truth = rng.chance(0.5), claim = truth ? target : wrong[0];
      item.lead = intro + '\n' + givens;
      item.stem = what + ' הוא ' + u(claim) + '.';
      item.answer = { value: truth, claim: claim, target: target };
      item.solution = (truth ? 'הטענה נכונה.\n' : 'הטענה שגויה: לא מחברים או מחסרים את אורכי הצלעות עצמם.\n') + steps;
      item.workLines = 2;
    } else if (qtype === 'mistake') {
      const bad = wrong[0];
      item.lead = intro + '\n' + givens + '\n' + ask;
      item.stem = kind === 'hyp'
        ? 'פתרון של תלמיד:\n$$AB=' + AC + '+' + BC + '=' + bad + '$$\nאורך היתר הוא ' + u(bad) + '.'
        : kind === 'leg' ? 'פתרון של תלמיד:\n$$AC=' + AB + '-' + BC + '=' + bad + '$$\nאורך הניצב החסר הוא ' + u(bad) + '.'
          : 'פתרון של תלמיד:\n$$AC=' + AB + '-' + BC + '=' + (AB - BC) + '$$\n$$' + AB + '+' + BC + '+' + (AB - BC) + '=' + bad + '$$\nהיקף המשולש הוא ' + u(bad) + '.';
      item.answer = { value: target, wrong: bad, parts: item.answer.parts };
      item.solution = 'הטעות: התלמיד חיסר או חיבר את אורכי הצלעות במקום להשתמש בריבועים שלהן לפי משפט פיתגורס.\n' + steps;
      item.workLines = 4;
    } else {
      item.stem = intro + '\n' + givens + '\n' + ask;
      item.solution = steps;
    }
    return item;
  }

  // ── check_right_triangle ────────────────────────────────────────────────
  const SIDE_NAMES = ['AB', 'BC', 'AC'];
  const OPPOSITE = { AB: 'C', BC: 'A', AC: 'B' };

  function checkTriangle(rng, level, qtype) {
    const t = pickTriple(rng, level);
    const right = rng.chance(0.5);
    // a non-right triangle: nudge the longest side by ±1 or ±2 (still a triangle)
    const delta = right ? 0 : rng.pick((level === 'basic' ? [1, 2, -1] : [1, -1, 2, -2]).filter(x => t.a + t.b > t.c + x));
    const sides = [t.a, t.b, t.c + delta].sort((x, y) => x - y);
    const longestName = level === 'basic' ? 'AB' : rng.pick(SIDE_NAMES);
    const others = rng.shuffle(SIDE_NAMES.filter(n => n !== longestName));
    const len = {}; len[longestName] = sides[2]; len[others[0]] = sides[0]; len[others[1]] = sides[1];
    const order = level === 'basic' ? [others[0], others[1], longestName] : rng.shuffle(SIDE_NAMES);
    const isRight = sq(sides[0]) + sq(sides[1]) === sq(sides[2]);
    const vertex = OPPOSITE[longestName];
    const listing = order.map(n => '$' + n + '=' + len[n] + '$ ' + CM).join(', ');
    const intro = 'אורכי הצלעות של משולש $ABC$ הם: ' + listing + '.';
    const test = 'בודקים את הצלע הארוכה ביותר, $' + longestName + '$:\n$$' + others[0] + '^2+' + others[1] + '^2=' + sq(len[others[0]]) + '+' + sq(len[others[1]]) + '=' + (sq(len[others[0]]) + sq(len[others[1]])) + '$$\n$$' + longestName + '^2=' + len[longestName] + '^2=' + sq(len[longestName]) + '$$\n';
    const verdict = isRight
      ? 'השוויון מתקיים, ולכן לפי המשפט ההפוך למשפט פיתגורס המשולש ישר-זווית, והזווית הישרה היא $\\sphericalangle ' + vertex + '$, מול הצלע $' + longestName + '$.'
      : 'השוויון אינו מתקיים, ולכן המשולש אינו ישר-זווית.';
    // drawing: the longest side at the bottom (opposite the sketch's largest
    // angle); the longer remaining side on the sketch's longer edge (right).
    const apex = OPPOSITE[longestName];
    const rightEnd = others[1].replace(apex, ''), leftEnd = longestName.replace(rightEnd, '');
    const sideText = n => len[n] + ' ' + CM;
    const item = Object.assign(base(level, qtype, 'G7-03-check', 'check_right_triangle'), {
      figure: F.triangleSketch({ text: [sideText(longestName), sideText(others[0]), sideText(others[1])], names: [rightEnd, leftEnd, apex] }),
      data: { sides: len, longest: longestName, isRight: isRight, vertex: isRight ? vertex : null },
      answer: { value: isRight, vertex: isRight ? vertex : null },
      solution: test + verdict,
      workLines: 3
    });
    if (qtype === 'mcq') {
      item.stem = intro + '\nמה ניתן לקבוע על המשולש?';
      const opts = ['A', 'B', 'C'].map(v => ({ html: 'המשולש ישר-זווית, והזווית הישרה היא $\\sphericalangle ' + v + '$.', correct: isRight && v === vertex }));
      opts.push({ html: 'המשולש אינו ישר-זווית.', correct: !isRight });
      item.choices = I.choices(rng, opts);
    } else if (qtype === 'tf') {
      item.lead = intro;
      item.stem = 'המשולש $ABC$ הוא משולש ישר-זווית.';
      item.workLines = 2;
    } else if (qtype === 'mistake' && isRight) {
      const wrongTop = longestName === 'AB' ? 'AC' : 'AB';
      const pair = SIDE_NAMES.filter(n => n !== wrongTop);
      const sum = sq(len[pair[0]]) + sq(len[pair[1]]);
      item.lead = intro + '\nהאם המשולש ישר-זווית?';
      item.stem = 'פתרון של תלמיד:\n$$' + pair[0] + '^2+' + pair[1] + '^2=' + sum + '$$\n$$' + wrongTop + '^2=' + sq(len[wrongTop]) + '$$\nמכיוון ש־$' + sum + '\\ne' + sq(len[wrongTop]) + '$, המשולש אינו ישר-זווית.';
      item.answer = { value: true, vertex: vertex, wrongSide: wrongTop };
      item.solution = 'הטעות: התלמיד בדק את הצלע $' + wrongTop + '$, אבל צריך לבדוק את הצלע הארוכה ביותר.\n' + test + verdict;
      item.workLines = 4;
    } else {
      if (qtype === 'mistake') item.qtype = 'open';
      item.stem = intro + '\n' + (level === 'challenge' ? 'האם המשולש ישר-זווית? אם כן, קבעו איזו מזוויות המשולש ישרה. נמקו.' : 'האם המשולש ישר-זווית? נמקו.');
    }
    return item;
  }

  // ── rectangle_diagonal ──────────────────────────────────────────────────
  const CONTEXTS = [
    { noun: 'תמונה מלבנית', w: 'רוחבה', h: 'גובהה', d: 'אורך האלכסון של התמונה', unit: CM },
    { noun: 'מגרש מלבני', w: 'אורכו', h: 'רוחבו', d: 'אורך השביל העובר לאורך אלכסון המגרש', unit: 'מ׳' },
    { noun: 'גינה מלבנית', w: 'אורכה', h: 'רוחבה', d: 'אורך האלכסון של הגינה', unit: 'מ׳' }
  ];

  function rectangle(rng, level, qtype) {
    const t = pickTriple(rng, level);
    const w = t.b, h = t.a, d = t.c;
    const kind = level === 'basic' ? 'diag' : level === 'standard' ? rng.pick(['diag', 'side', 'context']) : rng.pick(['area', 'perimeter']);
    const ctx = kind === 'context' ? rng.pick(CONTEXTS) : null;
    const unit = ctx ? ctx.unit : CM;
    const uu = v => u(v, unit);
    const area = w * h, perimeter = 2 * (w + h);
    const value = kind === 'diag' || kind === 'context' ? d : kind === 'side' ? h : kind === 'area' ? area : perimeter;
    const showH = kind === 'diag' || kind === 'context';
    const text = { w: lbl(w, unit), h: showH ? lbl(h, unit) : '?', d: showH ? '?' : lbl(d, unit) };
    const findH = 'לפי משפט פיתגורס במשולש $ABD$:\n$$AD^2=BD^2-AB^2=' + d + '^2-' + w + '^2=' + sq(d) + '-' + sq(w) + '=' + sq(h) + '$$\n$$AD=\\sqrt{' + sq(h) + '}=' + h + '$$\n';
    const steps = showH
      ? 'האלכסון $BD$ הוא היתר במשולש ישר-הזווית $ABD$:\n$$BD^2=AB^2+AD^2=' + w + '^2+' + h + '^2=' + sq(w) + '+' + sq(h) + '=' + sq(d) + '$$\n$$BD=\\sqrt{' + sq(d) + '}=' + d + '$$\nאורך האלכסון הוא ' + uu(d) + '.'
      : kind === 'side' ? findH + 'אורך הצלע $AD$ הוא ' + uu(h) + '.'
        : kind === 'area' ? findH + 'שטח המלבן:\n$$' + w + '\\cdot' + h + '=' + area + '$$\nשטח המלבן הוא $' + area + '$ סמ״ר.'
          : findH + 'היקף המלבן:\n$$2\\cdot(' + w + '+' + h + ')=' + perimeter + '$$\nהיקף המלבן הוא ' + uu(perimeter) + '.';
    const stem = ctx
      ? ctx.noun + ' ש' + ctx.w + ' ' + uu(w) + ' ו' + ctx.h + ' ' + uu(h) + '.\nמהו ' + ctx.d + '?'
      : showH ? 'במלבן $ABCD$ נתון: $AB=' + w + '$ ' + CM + ', $AD=' + h + '$ ' + CM + '.\nחשבו את אורך האלכסון $BD$.'
        : 'במלבן $ABCD$ אורך האלכסון הוא $BD=' + d + '$ ' + CM + ' ואורך הצלע הוא $AB=' + w + '$ ' + CM + '.\n' +
          (kind === 'side' ? 'חשבו את אורך הצלע $AD$.' : kind === 'area' ? 'חשבו את שטח המלבן.' : 'חשבו את היקף המלבן.');
    const item = Object.assign(base(level, qtype, 'G7-03-rect', 'rectangle_diagonal'), {
      figure: F.rectangleDiagonal({ w: w, h: h, text: text, names: ['A', 'B', 'C', 'D'] }),
      data: { kind: kind, w: w, h: h, d: d, unit: unit, area: area, perimeter: perimeter },
      answer: { value: value },
      solution: steps,
      workLines: level === 'challenge' ? 4 : 3
    });
    const valueUnit = kind === 'area' ? v => '$' + I.num(v) + '$ סמ״ר' : uu;
    const wrong = showH ? [w + h, sq(w) + sq(h), w + h - 2]
      : kind === 'side' ? [d - w, d + w, sq(d) - sq(w)]
        : kind === 'area' ? [w * (d - w), d * w, w * d / 2] : [2 * (w + d - w), 2 * (w + d), w + h];
    if (qtype === 'mcq') {
      item.stem = stem;
      item.choices = I.numericChoices(rng, value, wrong, valueUnit);
    } else if (qtype === 'tf') {
      const truth = rng.chance(0.5), claim = truth ? value : wrong[0];
      item.lead = stem.split('\n')[0];
      const subject = showH ? (ctx ? ctx.d : 'אורך האלכסון $BD$') : kind === 'side' ? 'אורך הצלע $AD$' : kind === 'area' ? 'שטח המלבן' : 'היקף המלבן';
      item.stem = subject + ' הוא ' + valueUnit(claim) + '.';
      item.answer = { value: truth, claim: claim, target: value };
      item.solution = (truth ? 'הטענה נכונה.\n' : 'הטענה שגויה.\n') + steps;
      item.workLines = 2;
    } else if (qtype === 'mistake') {
      const bad = wrong[0];
      item.lead = stem;
      item.stem = 'פתרון של תלמיד:\n' + (showH ? '$$BD=' + w + '+' + h + '=' + bad + '$$' : kind === 'side' ? '$$AD=' + d + '-' + w + '=' + bad + '$$'
        : kind === 'area' ? '$$AD=' + d + '-' + w + '=' + (d - w) + '$$\n$$' + w + '\\cdot' + (d - w) + '=' + bad + '$$' : '$$AD=' + d + '-' + w + '=' + (d - w) + '$$\n$$2\\cdot(' + w + '+' + (d - w) + ')=' + bad + '$$') +
        '\nהתשובה: ' + valueUnit(bad) + '.';
      item.answer = { value: value, wrong: bad };
      item.solution = 'הטעות: התלמיד חיבר או חיסר אורכים במקום להשתמש במשפט פיתגורס במשולש שהאלכסון הוא היתר בו.\n' + steps;
      item.workLines = 4;
    } else {
      item.stem = stem;
    }
    return item;
  }

  // ── independent checker ─────────────────────────────────────────────────
  function verify(item, opts) {
    const p = I.check(item, opts);
    const d = item.data || {};
    const stemAll = (item.lead || '') + '\n' + item.stem;
    const has = v => stemAll.indexOf('=' + v + '$') >= 0 || stemAll.indexOf('$' + v + '$') >= 0;
    const figLabels = F.inspect(item.figure || '').labels.filter(l => l.kind !== 'vertex' && l.kind !== 'note').map(l => l.text);
    if (item.family === 'find_side') {
      if (sq(d.AC) + sq(d.BC) !== sq(d.AB)) p.push('not a right triangle');
      const target = d.kind === 'leg-perimeter' ? d.AB + d.AC + d.BC : d[d.unknown];
      const expected = item.qtype === 'tf' ? (item.answer.claim === target) : target;
      if (item.answer.value !== expected) p.push('answer mismatch');
      const shown = ['AB', 'AC', 'BC'].filter(k => k !== d.unknown);
      shown.forEach(k => { if (!has(d[k])) p.push('given ' + k + ' missing from text'); });
      if (figLabels.indexOf('?') < 0) p.push('figure does not mark the unknown');
      if (figLabels.some(t => t === I.num(d[d.unknown]) + ' ' + CM)) p.push('figure reveals the unknown');
      if (item.qtype === 'open' && has(d[d.unknown]) && shown.every(k => d[k] !== d[d.unknown])) p.push('stem reveals the unknown');
      if (item.qtype === 'mistake' && item.answer.wrong === target) p.push('mistake shows the right answer');
    } else if (item.family === 'check_right_triangle') {
      const s = Object.keys(d.sides).map(k => d.sides[k]).sort((x, y) => x - y);
      if (!(s[0] + s[1] > s[2])) p.push('not a triangle');
      const right = sq(s[0]) + sq(s[1]) === sq(s[2]);
      if (right !== d.isRight) p.push('right-angle flag wrong');
      const expect = item.qtype === 'mcq' ? null : right;
      if (expect !== null && item.answer.value !== expect) p.push('answer mismatch');
      if (item.qtype === 'mcq') {
        const ok = item.choices.filter(c => c.correct);
        const want = right ? '\\sphericalangle ' + OPPOSITE[d.longest] + '$' : 'אינו ישר-זווית';
        if (ok.length !== 1 || ok[0].html.indexOf(want) < 0) p.push('mcq key wrong');
      }
      Object.keys(d.sides).forEach(k => { if (!has(d.sides[k])) p.push('side ' + k + ' missing from text'); });
      if (figLabels.length !== 3) p.push('sketch must label three sides');
      if (/<rect|<polyline/.test(item.figure)) p.push('sketch must not mark an angle');
    } else if (item.family === 'rectangle_diagonal') {
      if (sq(d.w) + sq(d.h) !== sq(d.d)) p.push('diagonal not consistent');
      const target = { diag: d.d, context: d.d, side: d.h, area: d.w * d.h, perimeter: 2 * (d.w + d.h) }[d.kind];
      const expected = item.qtype === 'tf' ? item.answer.claim === target : target;
      if (item.answer.value !== expected) p.push('answer mismatch');
      if (figLabels.indexOf('?') < 0) p.push('figure does not mark the unknown');
      if (item.qtype === 'mistake' && item.answer.wrong === target) p.push('mistake shows the right answer');
    } else p.push('unknown family');
    if (item.qtype === 'mcq' && item.choices && d && item.family !== 'check_right_triangle') {
      const right = item.choices.filter(c => c.correct);
      if (right.length !== 1 || right[0].value !== item.answer.value) p.push('mcq correct choice is not the answer');
    }
    return p;
  }

  const FAMILY = { find_side: findSide, check_right_triangle: checkTriangle, rectangle_diagonal: rectangle };
  const ORDER = ['find_side', 'find_side', 'check_right_triangle', 'rectangle_diagonal'];

  W.registerTopic({
    topicId: 'G7-03-ENGINE',
    label: 'משפט פיתגורס',
    families: Object.keys(FAMILY),
    qtypes: ['open', 'mcq', 'tf', 'mistake'],
    generate: function (rng, level, qtype, opts) { return FAMILY[(opts && opts.family) || rng.pick(ORDER)](rng, level, qtype, opts); },
    verify: verify,
    triples: triples
  });
})(typeof window !== 'undefined' ? window : globalThis);
