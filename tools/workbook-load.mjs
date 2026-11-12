// tools/workbook-load.mjs
// Boots the REAL main page in a Node VM: every local <script> of
// generator/index.html in page order, then the legacy topic files that
// phase2-loader.js adds at runtime. Gives verifiers the same topic list,
// engines, verified families and document layer that a teacher gets.
import fs from 'node:fs';
import vm from 'node:vm';

export function loadPage() {
  const noop = () => {};
  const els = {};
  const el = id => ({
    id, value: '', innerHTML: '', textContent: '', style: {}, dataset: {}, className: '', options: [], children: [], selectedIndex: 0,
    appendChild(c) { this.children.push(c); if (c && c.tagName === 'option') this.options.push(c); },
    addEventListener: noop, setAttribute: noop, getAttribute: () => null, remove: noop, querySelector: () => null, querySelectorAll: () => [],
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false }
  });
  const document = {
    getElementById: id => els[id] || (els[id] = el(id)),
    createElement: tag => Object.assign(el(''), { tagName: String(tag).toLowerCase() }),
    querySelector: () => null, querySelectorAll: () => [], addEventListener: noop,
    head: { appendChild: noop }, body: { appendChild: noop, classList: { add: noop, remove: noop } }
  };
  const sandbox = { console, Math, Date, document, setTimeout: f => f && f(), clearTimeout: noop, renderMathInElement: noop, html2canvas: null, navigator: {}, URLSearchParams };
  sandbox.window = sandbox;
  sandbox.addEventListener = noop;
  vm.createContext(sandbox);
  const index = fs.readFileSync('generator/index.html', 'utf8');
  const scripts = [...index.matchAll(/<script\s+src="([^"]+)"/g)].map(m => m[1].replace(/\?.*$/, '')).filter(s => !/^https?:/.test(s));
  const phase2 = (/var files=\[([^\]]+)\]/.exec(fs.readFileSync('generator/phase2-loader.js', 'utf8')) || [, ''])[1]
    .split(',').map(s => s.trim().replace(/'/g, '')).filter(Boolean);
  for (const s of scripts.filter(s => s !== 'phase2-loader.js').concat(phase2)) {
    vm.runInContext(fs.readFileSync('generator/' + s, 'utf8'), sandbox, { filename: s });
  }
  const run = code => vm.runInContext(code, sandbox);
  // every topic the dropdown offers, per grade/domain (same filter as core.js)
  const topics = [];
  for (const g of [7, 8]) for (const d of ['numeric', 'algebra', 'geometry', 'uncertainty']) {
    els.sg = Object.assign(el('sg'), { value: String(g) });
    els.sd = Object.assign(el('sd'), { value: d });
    els.st = el('st');
    run('onDomain()');
    els.st.options.forEach(o => topics.push({ grade: g, domain: d, id: o.value, label: o.textContent }));
  }
  return { sandbox, els, run, W: sandbox.TargilimWorkbook, E: sandbox.TargilimEngine, topics };
}
