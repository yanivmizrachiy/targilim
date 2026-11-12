// generator/workbook/items.js
// The exercise contract shared by verified families, and the one place that
// turns an item into student HTML and answer-key HTML.
//
// item = { topicId, family, familyId, level: basic|standard|challenge,
//          qtype: open|mcq|tf|mistake, lead?, stem, figure?, choices?,
//          answer: {value, html}, solution, data, workLines }
//
// Student HTML never carries the answer: correctness lives only in
// choices[].correct, answer and solution, which render into the answer key.
(function (root) {
  'use strict';
  const W = root.TargilimWorkbook = root.TargilimWorkbook || {};
  const LABELS = ['א', 'ב', 'ג', 'ד'];
  const QTYPES = ['open', 'mcq', 'tf', 'mistake'];
  const LEVELS = ['basic', 'standard', 'challenge'];

  const round2 = v => Math.round(v * 100) / 100;
  const num = v => String(round2(v));
  const tex = v => '$' + num(v) + '$';
  const qty = (v, unit) => tex(v) + (unit ? ' ' + unit : '');
  const same = (x, y) => Math.abs(x - y) < 1e-9;

  // MCQ over numbers: the correct value plus distinct positive distractors,
  // topped up with near values when the misconception list runs short.
  // accept(v) can reject implausible values (e.g. 2.08 pages).
  function numericChoices(rng, correct, distractors, render, accept) {
    const picked = [];
    const ok = accept || (() => true);
    const fresh = v => Number.isFinite(v) && v > 0 && ok(v) && !same(v, correct) && picked.every(p => !same(p, v));
    distractors.forEach(v => { if (picked.length < 3 && fresh(round2(v))) picked.push(round2(v)); });
    const step = Number.isInteger(correct) ? 1 : 0.5;
    for (let k = 1; picked.length < 3; k++) {
      [correct + k * step, correct - k * step].forEach(v => { if (picked.length < 3 && fresh(round2(v))) picked.push(round2(v)); });
    }
    return labelChoices(rng.shuffle([correct].concat(picked)).map(v => ({ html: render(v), correct: same(v, correct), value: v })));
  }

  // MCQ over prepared options: [{html, correct}], shuffled and lettered.
  function choices(rng, options) { return labelChoices(rng.shuffle(options)); }
  function labelChoices(list) { return list.map((c, i) => Object.assign({}, c, { label: LABELS[i] })); }

  function questionHTML(item) {
    const fig = item.figure ? '<div class="diagram">' + item.figure + '</div>' : '';
    const lead = item.lead ? '<div class="qtext">' + item.lead + '</div>' : '';
    if (item.qtype === 'mcq') {
      return fig + '<div class="qtext">' + item.stem + '</div><div class="mcq-choices">' +
        item.choices.map(c => '<div class="mcq-choice"><span class="mcq-label">' + c.label + '.</span> ' + c.html + '</div>').join('') +
        '</div>';
    }
    if (item.qtype === 'tf') return fig + lead + '<div class="qtext tf-statement"><span class="tf-label">נכון / שגוי:</span> ' + item.stem + '</div>';
    if (item.qtype === 'mistake') return fig + lead + '<div class="mistake-prompt">מצאו את הטעות בפתרון הבא:</div><div class="qtext mistake-box">' + item.stem + '</div>';
    return fig + '<div class="qtext">' + item.stem + '</div>';
  }

  function answerHTML(item) {
    const verdict = item.qtype === 'tf' ? '<div class="tf-verdict">' + (item.answer.value ? '✓ נכון' : '✗ שגוי') + '</div>\n' : '';
    return verdict + item.solution;
  }

  function correctLabels(item) {
    return item.qtype === 'mcq' ? item.choices.filter(c => c.correct).map(c => c.label) : [];
  }

  // Structural contract every verified item must meet (families add the math).
  function check(item, opts) {
    const p = [];
    const html = questionHTML(item);
    if (!item || typeof item !== 'object') return ['item missing'];
    if (QTYPES.indexOf(item.qtype) < 0) p.push('bad qtype ' + item.qtype);
    if (LEVELS.indexOf(item.level) < 0) p.push('bad level ' + item.level);
    if (!item.topicId || !item.family || !item.familyId) p.push('missing provenance');
    if (!/[֐-׿]/.test(item.stem || '')) p.push('stem lacks Hebrew text');
    if (!item.solution || !/[֐-׿]/.test(item.solution)) p.push('solution missing');
    if (!item.answer || item.answer.value === undefined) p.push('answer missing');
    if (/undefined|NaN|Infinity|\[object/.test(html + answerHTML(item))) p.push('leaked undefined/NaN');
    if (/mcq-correct|tf-verdict|✓|✗/.test(html)) p.push('student HTML reveals the answer');
    if (item.qtype === 'mcq') {
      const c = item.choices || [];
      const right = c.filter(x => x.correct).length;
      if (c.length !== 4) p.push('mcq needs 4 choices');
      if (new Set(c.map(x => x.html)).size !== c.length) p.push('duplicate mcq choices');
      if (right < 1 || (!(opts && opts.mcqMode === 'multi') && right !== 1)) p.push('mcq correct count ' + right);
    }
    if (item.figure) {
      const f = W.figures.inspect(item.figure);
      if (!f.viewBox) p.push('figure without viewBox');
      else f.labels.forEach(l => {
        const half = W.figures.textWidth(l.text, l.size) / 2, h = l.size * 0.62;
        const vb = f.viewBox;
        if (l.x - half < vb[0] || l.x + half > vb[0] + vb[2] || l.y - h < vb[1] || l.y + h > vb[1] + vb[3]) p.push('label outside viewBox: ' + l.text);
      });
    }
    return p;
  }

  W.items = {
    LEVELS: LEVELS, QTYPES: QTYPES, num: num, tex: tex, qty: qty, same: same,
    numericChoices: numericChoices, choices: choices, questionHTML: questionHTML, answerHTML: answerHTML,
    correctLabels: correctLabels, check: check
  };

  // Verified topic registry: topicId → { label, families, generate, verify }.
  W.families = W.families || {};
  W.registerTopic = function (impl) { W.families[impl.topicId] = impl; return impl; };
})(typeof window !== 'undefined' ? window : globalThis);
