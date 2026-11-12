// generator/workbook/book.js
// The digital book: lays the rendered document (exercise-set.js) out on fixed
// A4 sheets, following the district Pythagoras reader's sheet anatomy (blue
// title over a double rule, circled page number, white paper, a dark divider
// between sheets on screen only). Every block is measured once at its printed
// width and packed onto sheets without splitting an exercise, so the screen
// sheets ARE the print pages (@page A4, margin 0) and the PDF pages (each sheet
// rasterised at ~240 dpi). One action bar and the chapter navigation sit
// outside the sheets and never print.
(function (root) {
  'use strict';
  const W = root.TargilimWorkbook = root.TargilimWorkbook || {};

  function node(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Animation frames do not run in background tabs; a timer guarantees progress.
  const frames = n => new Promise(r => {
    let done = false;
    const finish = () => { if (!done) { done = true; r(); } };
    const step = k => (k ? requestAnimationFrame(() => step(k - 1)) : finish());
    step(n);
    setTimeout(finish, 150);
  });
  async function settle() {
    if (document.fonts && document.fonts.ready) {
      // background tabs may defer font loading; never wait on it indefinitely
      try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]); } catch (e) { /* layout anyway */ }
    }
    await frames(2);
  }

  // An empty sheet: header (title + circled number), flow, footer.
  function sheet(kind, title, seed) {
    const page = node('section', 'wb-page' + (kind === 'key' ? ' wb-key-page' : ''));
    const inner = node('div', 'wb-page-inner');
    inner.appendChild(node('header', 'wb-sheet-head', '<h2 class="wb-sheet-title">' + esc(title) + '</h2><span class="wb-page-no"></span>'));
    const flow = node('div', 'wb-flow');
    inner.appendChild(flow);
    inner.appendChild(node('footer', 'wb-footer', '<span class="wb-footer-label"></span>' + (seed ? '<span>קוד דף: ' + esc(seed) + '</span>' : '')));
    page.appendChild(inner);
    return { page: page, flow: flow };
  }

  // Greedy packing of measured blocks (px). A chapter title stays with the
  // block after it; a block taller than a sheet is scaled down to fit.
  function pack(blocks, cap, gap) {
    const pages = [[]];
    let used = 0;
    blocks.forEach((b, i) => {
      const page = pages[pages.length - 1];
      const lead = page.length ? gap : 0;
      const withNext = b.keepWithNext && blocks[i + 1] ? gap + Math.min(blocks[i + 1].h, cap) : 0;
      if (page.length && used + lead + b.h + withNext > cap) { pages.push([]); used = 0; }
      const current = pages[pages.length - 1];
      used += (current.length ? gap : 0) + Math.min(b.h, cap);
      b.scale = b.h > cap ? cap / b.h : 1;
      current.push(b);
    });
    return pages;
  }

  // Measure a sheet's flow box and each block at the sheet's exact width.
  function measure(host, kind, title, seed, nodes) {
    const probe = sheet(kind, title, seed);
    probe.page.classList.add('wb-measure');
    host.appendChild(probe.page);
    const cap = probe.flow.getBoundingClientRect().height;
    const gap = parseFloat(getComputedStyle(probe.flow).rowGap) || 0;
    nodes.forEach(n => probe.flow.appendChild(n));
    const blocks = nodes.map(n => ({ node: n, h: n.getBoundingClientRect().height, keepWithNext: n.classList.contains('wb-chapter') }));
    probe.page.remove();
    return { cap: cap, gap: gap, blocks: blocks };
  }

  function build(kind, title, seed, packed, startIndex, total, out) {
    packed.forEach((blocks, i) => {
      if (out.childNodes.length) out.appendChild(node('div', 'wb-sep' + (kind === 'key' ? ' wb-key-sep' : '')));
      const s = sheet(kind, title, seed);
      const n = startIndex + i;
      s.page.dataset.page = String(n);
      s.page.querySelector('.wb-page-no').textContent = String(n);
      const label = (kind === 'key' ? 'מפתח תשובות · ' : '') + 'עמוד ' + n + ' מתוך ' + total;
      s.page.querySelector('.wb-footer-label').textContent = label;
      s.page.setAttribute('aria-label', label);
      blocks.forEach(b => {
        if (b.scale < 1) { b.node.style.zoom = b.scale.toFixed(3); b.node.dataset.scaled = 'true'; }
        s.flow.appendChild(b.node);
      });
      out.appendChild(s.page);
    });
  }

  function chapterNav(pagesEl) {
    const heads = [...pagesEl.querySelectorAll('.wb-chapter')];
    if (heads.length < 2) return null;
    const nav = node('nav', 'wb-chapters');
    nav.setAttribute('aria-label', 'פרקים');
    heads.forEach((h, i) => {
      const b = node('button', 'wb-chapter-link', esc(h.querySelector('.wb-chapter-title').textContent));
      b.type = 'button';
      b.style.setProperty('--chapter', 'var(--wb-ch' + (i % 7) + ')');
      b.addEventListener('click', () => h.closest('.wb-page').scrollIntoView({ block: 'start' }));
      nav.appendChild(b);
    });
    return nav;
  }

  function paginate(exset, doc) {
    const head = exset.querySelector('.exset-head');
    const key = exset.querySelector('#answerKey');
    const chips = head.querySelector(':scope > .qmeta');
    const actions = head.querySelector('.exset-actions');
    const notes = [...head.querySelectorAll('.exset-note')];
    const blocks = [...exset.children].filter(c => c !== head && c !== key);
    const keyBlocks = [...key.children].filter(c => !c.classList.contains('answer-key-title'));
    const title = ((head.querySelector('.exset-title') || {}).textContent || '').trim();
    const seed = exset.dataset.seed || '';

    const bar = node('div', 'wb-toolbar');
    bar.setAttribute('data-html2canvas-ignore', 'true');
    const info = node('div', 'wb-toolbar-info');
    if (chips) info.appendChild(chips);
    notes.forEach(n => info.appendChild(n));
    bar.appendChild(info);
    if (actions) bar.appendChild(actions);

    const student = measure(exset, 'student', title, seed, [head].concat(blocks));
    const keyTitle = 'מפתח תשובות — ' + (doc && doc.chapters && doc.chapters.length > 1 ? doc.type.title : title);
    const keyed = measure(exset, 'key', keyTitle, seed, keyBlocks);
    const studentPages = pack(student.blocks, student.cap, student.gap);
    const keyPages = keyBlocks.length ? pack(keyed.blocks, keyed.cap, keyed.gap) : [];

    const pagesEl = node('div', 'wb-pages');
    build('student', title, seed, studentPages, 1, studentPages.length, pagesEl);
    build('key', keyTitle, seed, keyPages, 1, keyPages.length, pagesEl);
    key.textContent = '';
    key.classList.add('wb-key-state');

    const nav = chapterNav(pagesEl);
    if (nav) bar.appendChild(nav);
    const viewport = node('div', 'wb-viewport');
    viewport.appendChild(pagesEl);
    exset.textContent = '';
    exset.appendChild(bar);
    exset.appendChild(key);
    exset.appendChild(viewport);
    exset.dataset.paged = String(studentPages.length);
    exset.dataset.keyPages = String(keyPages.length);
    if (doc) exset.dataset.chapters = String(doc.chapters.length);
    return { studentPages: studentPages.length, keyPages: keyPages.length };
  }

  // Scale whole sheets to the available width (phones) with a transform, so the
  // text keeps its 100% layout (= print); the viewport takes the scaled height.
  function fit(exset) {
    const viewport = exset && exset.querySelector('.wb-viewport');
    const pages = viewport && viewport.querySelector('.wb-pages');
    if (!pages) return;
    const z = Math.min(1, viewport.clientWidth / (pages.offsetWidth || 1));
    pages.style.setProperty('--wb-zoom', z > 0 ? z.toFixed(4) : '1');
    viewport.style.height = Math.ceil(pages.offsetHeight * z) + 'px';
  }

  function syncView(exset) {
    const sv = document.getElementById('sv');
    if (exset) exset.classList.toggle('wb-bw', !!sv && sv.value === 'bw');
  }

  async function mount(exset, doc) {
    if (!exset || exset.dataset.paged) return;
    exset.classList.add('wb-pending');
    syncView(exset);
    await settle();
    if (!exset.isConnected) return;
    paginate(exset, doc);
    fit(exset);
    exset.classList.remove('wb-pending');
  }

  if (typeof root.addEventListener === 'function' && typeof document !== 'undefined') {
    let timer = 0;
    root.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(() => document.querySelectorAll('.exset[data-paged]').forEach(fit), 120);
    });
    document.addEventListener('change', e => {
      if (e.target && e.target.id === 'sv') document.querySelectorAll('.exset').forEach(syncView);
    });
  }

  // Run fn with the sheets at 100% and the exercise numbers inside captures
  // (they are excluded from single-exercise images on purpose).
  async function asPrinted(exset, fn) {
    const numbers = [...exset.querySelectorAll('.wb-page .qmeta[data-html2canvas-ignore]')];
    document.body.classList.add('wb-capture');
    numbers.forEach(n => n.removeAttribute('data-html2canvas-ignore'));
    try { await settle(); return await fn(); }
    finally {
      numbers.forEach(n => n.setAttribute('data-html2canvas-ignore', 'true'));
      document.body.classList.remove('wb-capture');
    }
  }

  function fileName(exset) {
    const title = ((exset.querySelector('.wb-sheet-title') || {}).textContent || 'דף תרגילים').trim();
    return (title + ' ' + (exset.dataset.seed || '')).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() + '.pdf';
  }

  // One raster page per visible sheet (key sheets only when shown), ~240 dpi.
  async function downloadPdf(exset) {
    const C = W.capture;
    if (!C || !(await C.load('jspdf'))) throw new Error('pdf-library-unavailable');
    const name = fileName(exset);
    return asPrinted(exset, async () => {
      const pages = [...exset.querySelectorAll('.wb-page')].filter(p => p.getClientRects().length > 0);
      const pdf = new root.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
      for (let i = 0; i < pages.length; i++) {
        let canvas = await C.toCanvas(pages[i], { scale: 2.5, exclude: ['.ex-imgbar'], excludeMode: 'hide' });
        if (!canvas && typeof root.html2canvas === 'function') canvas = await root.html2canvas(pages[i], { scale: 2.5, backgroundColor: '#ffffff', useCORS: true, logging: false });
        if (!canvas) throw new Error('capture-unavailable');
        if (i) pdf.addPage('a4', 'portrait');
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      }
      pdf.setProperties({ title: name.replace(/\.pdf$/, ''), subject: 'מתמטיקה', creator: 'תרגילים' });
      if (typeof pdf.setLanguage === 'function') pdf.setLanguage('he');
      pdf.save(name);
      return pages.length;
    });
  }

  W.book = { mount: mount, paginate: paginate, pack: pack, fit: fit, downloadPdf: downloadPdf, asPrinted: asPrinted };
})(typeof window !== 'undefined' ? window : globalThis);
