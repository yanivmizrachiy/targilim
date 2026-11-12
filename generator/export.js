// generator/export.js
// Unified, premium image export for an exercise card.
//
// captureExerciseCardAsPng(cardElement, options) is the single code path that
// turns a whole exercise card — question text + KaTeX + diagram/SVG + the
// student answer box — into a crisp PNG on a clean white background. It honours
// the current color / black-and-white view mode, excludes teacher controls and
// worksheet chips (data-html2canvas-ignore), waits for web fonts + a paint so
// Hebrew and formulas are fully laid out, and renders at device resolution so
// the image is sharp when pasted into Canva / Word / Docs.
//
// The per-question buttons, the legacy single-card view and (indirectly) the
// teacher tools all produce identically clean output through this function.

// Capture a card element to a PNG Blob. options: { bw:boolean }
async function captureExerciseCardAsPng(cardElement, options) {
  options = options || {};
  const W = window.TargilimWorkbook;
  if (!cardElement || (typeof html2canvas !== 'function' && !(W && W.capture))) throw new Error('capture-unavailable');
  const bw = (typeof options.bw === 'boolean')
    ? options.bw
    : (typeof visualMode === 'function' && visualMode() === 'bw');
  // Book sheets may be zoomed to fit a phone; capture them at 100% (wb-capture).
  document.body.classList.add('wb-capture');
  try {
  // Wait for web fonts + two animation frames so Hebrew + KaTeX are fully laid
  // out before the snapshot (otherwise glyphs can clip or shift in the image).
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
  await new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); });
  // Primary path: snapDOM lets the browser itself lay out the text and SVG
  // (closest to the on-screen sheet); html2canvas stays as the fallback.
  // The whole card, without the controls.
  var canvas = W && W.capture
    ? await W.capture.toCanvas(cardElement, { scale: Math.max(3, (window.devicePixelRatio || 1) * 2), exclude: ['[data-html2canvas-ignore]'], excludeMode: 'remove' })
    : null;
  if (!canvas) canvas = await html2canvas(cardElement, {
    backgroundColor: '#ffffff',
    // Maximum-quality capture: render at 2· the device pixel ratio with a hard
    // floor of 3 (→ 3 on standard screens, 4 on Retina) so the PNG is razor-sharp
    // when pasted into Word / Canva / Docs. PNG output is lossless.
    scale: Math.max(3, (window.devicePixelRatio || 1) * 2),
    useCORS: true,
    imageTimeout: 0,
    logging: false,
    onclone: function (doc, el) {
      // present the card as a flat white tile: no shadow/clip so nothing is cut
      el.style.margin = '0';
      el.style.boxShadow = 'none';
      el.style.borderRadius = '0';
      el.style.overflow = 'visible';
    }
  });
  } finally { document.body.classList.remove('wb-capture'); }
  // Black-and-white export: desaturate the rendered pixels (luma) so the result
  // is reliably grayscale regardless of html2canvas filter support.
  if (bw) {
    try {
      const ctx = canvas.getContext('2d');
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = img.data;
      for (let p = 0; p < d.length; p += 4) {
        const y = (0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]) | 0;
        d[p] = d[p + 1] = d[p + 2] = y;
      }
      ctx.putImageData(img, 0, 0);
    } catch (e) { /* tainted canvas — fall back to color */ }
  }
  return await new Promise(function (resolve) { canvas.toBlob(resolve, 'image/png'); });
}

// Friendly, descriptive PNG filename: targil-matematika-<n>.png
function exerciseImageFilename(n) { return 'targil-matematika-' + (n || 1) + '.png'; }

// Trigger a browser download of a Blob.
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

// Copy a card image to the clipboard, falling back to a PNG download where the
// browser blocks image clipboard. n is the 1-based exercise number (filename).
// Returns 'copied' or 'downloaded'.
async function copyExerciseImage(cardElement, n) {
  const blob = await captureExerciseCardAsPng(cardElement);
  if (!blob) throw new Error('no-blob');
  if (navigator.clipboard && typeof navigator.clipboard.write === 'function' && typeof window.ClipboardItem === 'function') {
    try {
      await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
      return 'copied';
    } catch (e) {
      downloadBlob(blob, exerciseImageFilename(n));
      return 'downloaded';
    }
  }
  downloadBlob(blob, exerciseImageFilename(n));
  return 'downloaded';
}

// Download a card image as PNG.
async function downloadExerciseImage(cardElement, n) {
  const blob = await captureExerciseCardAsPng(cardElement);
  if (!blob) throw new Error('no-blob');
  downloadBlob(blob, exerciseImageFilename(n));
  return 'downloaded';
}

// ── legacy single-card view (renderCard) entry points — now routed through the
// unified pipeline so the one-question view exports at the same premium quality.
async function dlPNG(id, btn) {
  const st = document.getElementById('st-' + id), card = document.getElementById(id);
  try { if (st) st.textContent = 'מכין...'; await downloadExerciseImage(card, 1); if (st) st.textContent = 'הורד'; }
  catch (e) { if (st) st.textContent = 'שגיאה'; }
}
async function copyImg(id, btn) {
  const st = document.getElementById('st-' + id), card = document.getElementById(id);
  try { if (st) st.textContent = 'מעתיק...'; const res = await copyExerciseImage(card, 1); if (st) st.textContent = res === 'copied' ? 'הועתק' : 'מוריד PNG'; }
  catch (e) { if (st) st.textContent = 'שגיאה'; }
}
