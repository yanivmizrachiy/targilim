// generator/workbook/capture.js
// Turns a rendered element into a canvas for exercise images and the PDF.
// snapDOM draws through SVG foreignObject, so the browser itself lays out the
// Hebrew text, KaTeX and SVG labels. Against Chromium's own rendering of an A4
// sheet it differed by 0.7 (mean absolute pixel value) vs 5.5 for html2canvas
// 1.4.1, which re-draws text itself (shifted lines, lighter SVG labels).
// Libraries load on demand, pinned with Subresource Integrity.
(function (root) {
  'use strict';
  const W = root.TargilimWorkbook = root.TargilimWorkbook || {};

  const LIBS = {
    snapdom: {
      src: 'https://cdn.jsdelivr.net/npm/@zumer/snapdom@3.7.4/dist/snapdom.js',
      integrity: 'sha384-+KaawgSiG3tZjPxoLk0gdiSkuZP58gpQ61H53DIDozcbE/YHvAlkkNMztocmmSnf',
      ready: () => typeof root.snapdom === 'function'
    },
    jspdf: {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.2.1/jspdf.umd.min.js',
      integrity: 'sha384-qovJwSBbRDPP5cEjCp8S0UP66wrvnjaa60XMOGzTNanrThcrGfXfnZkvgY8N1KT3',
      ready: () => !!(root.jspdf && root.jspdf.jsPDF)
    }
  };
  const pending = {};

  function load(name) {
    const lib = LIBS[name];
    if (lib.ready()) return Promise.resolve(true);
    if (!pending[name]) {
      pending[name] = new Promise(resolve => {
        const s = document.createElement('script');
        s.src = lib.src; s.integrity = lib.integrity; s.crossOrigin = 'anonymous'; s.async = true;
        s.onload = () => resolve(lib.ready());
        s.onerror = () => { pending[name] = null; resolve(false); };
        document.head.appendChild(s);
      });
    }
    return pending[name];
  }

  // exclude: CSS selectors to leave out; mode 'hide' keeps their space (pages),
  // 'remove' reflows (single exercise images). Returns a canvas or null.
  async function toCanvas(el, opts) {
    opts = opts || {};
    if (!(await load('snapdom'))) return null;
    const shot = await root.snapdom(el, {
      scale: opts.scale || 2, dpr: 1, embedFonts: 'auto', backgroundColor: '#ffffff',
      exclude: opts.exclude || [], excludeMode: opts.excludeMode || 'hide'
    });
    return shot.toCanvas();
  }

  W.capture = { load: load, toCanvas: toCanvas, LIBS: LIBS };
})(typeof window !== 'undefined' ? window : globalThis);
