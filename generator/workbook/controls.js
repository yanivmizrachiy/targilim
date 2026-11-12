// generator/workbook/controls.js
// Teacher-control glue for the settings card: several topics per document
// (chapters), controls bound to what each topic really supports (with a short
// explanation when a combination is not available), and replay links — the
// settings and the document code live in the URL hash, so the same link
// rebuilds the same document.
(function (root) {
  'use strict';
  const W = root.TargilimWorkbook = root.TargilimWorkbook || {};
  if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
  const $ = id => document.getElementById(id);
  root.__docTopics = root.__docTopics || [];

  function engine() { return root.TargilimEngine || {}; }
  // What a topic can produce: verified family → all four types; engine topic →
  // its engine's types; older single-question topics → open questions only.
  function capability(id) {
    if (W.families && W.families[id]) return { kind: 'verified', qtypes: W.families[id].qtypes };
    const E = engine();
    if (typeof E.isEngineTopic === 'function' && E.isEngineTopic(id)) return { kind: 'engine', qtypes: ['open', 'mcq', 'tf', 'mistake'] };
    return { kind: 'legacy', qtypes: ['open'] };
  }
  W.capability = capability;

  function currentTopicOption() {
    const st = $('st');
    const opt = st && st.options[st.selectedIndex];
    return opt && opt.value ? { id: opt.value, label: opt.textContent.trim() } : null;
  }

  function renderChips() {
    const box = $('topicList');
    if (!box) return;
    const list = root.__docTopics;
    box.hidden = !list.length;
    box.innerHTML = list.length
      ? '<span class="topic-list-label">נושאים במסמך:</span>' + list.map((t, i) =>
        '<span class="topic-chip">' + t.label + '<button type="button" class="topic-chip-x" data-i="' + i + '" aria-label="הסר את ' + t.label + '">×</button></span>').join('')
      : '';
    note();
  }

  // The list, once started, decides the document's topics (one chapter each).
  function addTopic() {
    const t = currentTopicOption();
    if (!t || root.__docTopics.some(x => x.id === t.id)) return;
    root.__docTopics.push({ id: t.id, label: typeof root.cleanTopicLabel === 'function' ? root.cleanTopicLabel(t.label) : t.label });
    renderChips();
  }

  function note() {
    const out = $('settingsNote');
    if (!out) return;
    const notes = [];
    const level = $('sl') && $('sl').value;
    const prog = $('sprog');
    if (prog) {
      const graduatedOption = prog.querySelector('option[value="graduated"]');
      const allow = level !== 'basic';
      if (graduatedOption) graduatedOption.disabled = !allow;
      if (!allow && prog.value === 'graduated') prog.value = 'uniform';
      if (!allow) notes.push('סדר קושי מדורג זמין ברמה 2 וברמה 3.');
    }
    const ids = root.__docTopics.length ? root.__docTopics.map(t => t.id) : (currentTopicOption() ? [currentTopicOption().id] : []);
    const qtype = $('selQType') ? $('selQType').value : 'mixed';
    const openOnly = ids.filter(id => capability(id).kind === 'legacy');
    if (openOnly.length && qtype !== 'open') {
      notes.push(ids.length > 1 ? 'בחלק מהנושאים שנבחרו יופקו שאלות פתוחות בלבד.' : 'בנושא זה זמינות שאלות פתוחות בלבד.');
    }
    const n = $('sn') ? +$('sn').value : 1;
    if (ids.length > n) notes.push('מספר התרגילים קטן ממספר הנושאים — ייכללו רק ' + n + ' הנושאים הראשונים.');
    out.textContent = notes.join(' ');
    out.hidden = !notes.length;
  }

  // ── replay links ──
  function writeHash(o) {
    if (!o || !root.history || typeof root.history.replaceState !== 'function') return;
    const p = new URLSearchParams({ g: o.grade, t: o.topics.join(','), n: o.count, l: o.level, p: o.progression, d: o.docType, q: o.qtype, m: o.mcqMode, s: o.seed });
    root.history.replaceState(null, '', '#' + p.toString());
  }

  function waitFor(test, ms) {
    return new Promise(resolve => {
      const t0 = Date.now();
      (function poll() { if (test() || Date.now() - t0 > ms) resolve(test()); else setTimeout(poll, 60); })();
    });
  }

  async function restoreFromHash() {
    const h = String(root.location && root.location.hash || '').replace(/^#/, '');
    if (!h) return;
    const p = new URLSearchParams(h);
    const topics = (p.get('t') || '').split(',').filter(Boolean);
    if (!topics.length || !W.rng.isSeedCode(p.get('s'))) return;
    // core.js declares TOPICS/generators with const: global bindings, not window properties
    const gens = () => (typeof generators !== 'undefined' ? generators : {});
    const topicsTable = () => (typeof TOPICS !== 'undefined' ? TOPICS : {});
    const known = id => capability(id).kind !== 'legacy' || !!gens()[id];
    await waitFor(() => topics.every(known), 4000);
    const set = (id, v) => { const el = $(id); if (el && v != null && [...(el.options || [])].some(o => o.value === v)) el.value = v; };
    set('sg', p.get('g'));
    if (typeof root.onGrade === 'function') root.onGrade();
    const labelOf = id => {
      for (const d of ['geometry', 'algebra', 'numeric', 'uncertainty']) {
        const grade = topicsTable()[+p.get('g')];
        const list = (grade && grade[d]) || [];
        const hit = list.find(t => t[0] === id);
        if (hit) return { label: typeof root.cleanTopicLabel === 'function' ? root.cleanTopicLabel(hit[1]) : hit[1], domain: d };
      }
      return null;
    };
    const first = labelOf(topics[0]);
    if (first) { set('sd', first.domain); if (typeof root.onDomain === 'function') root.onDomain(); set('st', topics[0]); }
    root.__docTopics = topics.length > 1 ? topics.map(id => ({ id: id, label: (labelOf(id) || { label: id }).label })) : [];
    set('sn', p.get('n')); set('sl', p.get('l')); set('sprog', p.get('p')); set('sdoc', p.get('d'));
    set('selQType', p.get('q')); set('selMcqMode', p.get('m'));
    if ($('sseed')) $('sseed').value = p.get('s');
    renderChips();
    if (typeof root.generate === 'function') root.generate();
  }

  function onGenerated() {
    const ctx = root.__exsetCtx;
    if (ctx && ctx.options) {
      writeHash(ctx.options);
      if ($('sseed')) $('sseed').placeholder = ctx.options.seed;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const add = $('btnAddTopic');
    if (add) add.addEventListener('click', addTopic);
    const box = $('topicList');
    if (box) box.addEventListener('click', e => {
      const x = e.target.closest('.topic-chip-x');
      if (!x) return;
      root.__docTopics.splice(+x.dataset.i, 1);
      renderChips();
    });
    ['sl', 'sprog', 'selQType', 'sn', 'st', 'sd'].forEach(id => { const el = $(id); if (el) el.addEventListener('change', note); });
    const sg = $('sg');
    if (sg) sg.addEventListener('change', () => { root.__docTopics = []; renderChips(); });
    const out = $('out');
    if (out && typeof MutationObserver === 'function') {
      new MutationObserver(() => { if (out.querySelector('#exset')) onGenerated(); }).observe(out, { childList: true });
    }
    note();
  });
  if (typeof root.addEventListener === 'function') root.addEventListener('load', () => { restoreFromHash(); });

  W.controls = { capability: capability, note: note, renderChips: renderChips };
})(typeof window !== 'undefined' ? window : globalThis);
