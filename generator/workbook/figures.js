// generator/workbook/figures.js
// Vector figures for verified exercise families. Coordinates are millimetres
// (1 SVG unit = 1 mm) and the root carries its physical size, so labels print
// at a fixed ~11 pt on A4 instead of shrinking with the drawing. Every label
// is measured into the viewBox (nothing clipped), the unknown is always "?",
// and colours live in fill/stroke attributes so the black-and-white view
// (core.js applyVisualMode) can convert them.
(function (root) {
  'use strict';
  const W = root.TargilimWorkbook = root.TargilimWorkbook || {};

  const C = { ink: '#1e293b', fill: '#eef2f7', given: '#1d4ed8', unknown: '#c2410c', muted: '#64748b', vertex: '#334155' };
  const SIZE = { label: 3.7, unknown: 4.5, vertex: 3.4, note: 3.0 };
  const STROKE = 0.5;

  const r2 = v => Math.round(v * 100) / 100;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // Width estimate for a label (mm). Digits/Hebrew average ~0.56 em.
  const textWidth = (text, size) => String(text).length * size * 0.56;

  function textBox(text, x, y, size) {
    const w = textWidth(text, size) / 2, h = size * 0.62;
    return { x0: x - w, x1: x + w, y0: y - h, y1: y + h };
  }

  // A label centred on (x, y). kind: given | unknown | vertex | note.
  function label(text, x, y, kind) {
    const size = SIZE[kind] || SIZE.label;
    const fill = kind === 'unknown' ? C.unknown : kind === 'given' ? C.given : kind === 'note' ? C.muted : C.vertex;
    const weight = kind === 'unknown' ? 600 : 500;
    return {
      svg: '<text x="' + r2(x) + '" y="' + r2(y) + '" font-size="' + size + '" font-weight="' + weight + '" fill="' + fill +
        // white halo as inline style: the black-and-white view converts stroke attributes only
        '" text-anchor="middle" dominant-baseline="central" style="stroke:#ffffff;stroke-width:1.1px;paint-order:stroke"' +
        ' data-label-kind="' + kind + '">' + esc(text) + '</text>',
      box: textBox(text, x, y, size),
      text: String(text), kind: kind
    };
  }

  // Place a side label outside the segment p→q, away from the shape centre.
  function sideLabel(text, p, q, centre, kind) {
    const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    let nx = -(q[1] - p[1]), ny = q[0] - p[0];
    const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
    if ((mx - centre[0]) * nx + (my - centre[1]) * ny < 0) { nx = -nx; ny = -ny; }
    const size = SIZE[kind] || SIZE.label;
    const reach = Math.abs(nx) * textWidth(text, size) / 2 + Math.abs(ny) * size * 0.62;
    return label(text, mx + nx * (2.2 + reach), my + ny * (2.2 + reach), kind);
  }

  function vertexLabel(text, p, centre) {
    let dx = p[0] - centre[0], dy = p[1] - centre[1];
    const len = Math.hypot(dx, dy) || 1;
    return label(text, p[0] + dx / len * 4, p[1] + dy / len * 4, 'vertex');
  }

  // Wrap shapes + labels; the viewBox is the union of all boxes plus padding.
  function frame(shapes, labels, extent, title) {
    const boxes = labels.map(l => l.box).concat([extent]);
    const x0 = Math.min.apply(null, boxes.map(b => b.x0)) - 1.5;
    const y0 = Math.min.apply(null, boxes.map(b => b.y0)) - 1.5;
    const x1 = Math.max.apply(null, boxes.map(b => b.x1)) + 1.5;
    const y1 = Math.max.apply(null, boxes.map(b => b.y1)) + 1.5;
    const w = r2(x1 - x0), h = r2(y1 - y0);
    return '<svg xmlns="http://www.w3.org/2000/svg" class="wb-fig" viewBox="' + r2(x0) + ' ' + r2(y0) + ' ' + w + ' ' + h +
      '" width="' + w + 'mm" height="' + h + 'mm" role="img" aria-label="' + esc(title) + '" direction="rtl"' +
      ' font-family="Assistant, Arial, sans-serif">' + shapes.join('') + labels.map(l => l.svg).join('') + '</svg>';
  }

  const pts = list => list.map(p => r2(p[0]) + ',' + r2(p[1])).join(' ');
  const polygon = (list, fill) => '<polygon points="' + pts(list) + '" fill="' + (fill || C.fill) + '" stroke="' + C.ink +
    '" stroke-width="' + STROKE + '" stroke-linejoin="round"/>';
  const line = (p, q, dash) => '<line x1="' + r2(p[0]) + '" y1="' + r2(p[1]) + '" x2="' + r2(q[0]) + '" y2="' + r2(q[1]) +
    '" stroke="' + C.ink + '" stroke-width="' + STROKE + '"' + (dash ? ' stroke-dasharray="1.6 1.2"' : '') + '/>';
  const extentOf = list => ({
    x0: Math.min.apply(null, list.map(p => p[0])), x1: Math.max.apply(null, list.map(p => p[0])),
    y0: Math.min.apply(null, list.map(p => p[1])), y1: Math.max.apply(null, list.map(p => p[1]))
  });
  const centreOf = list => [list.reduce((s, p) => s + p[0], 0) / list.length, list.reduce((s, p) => s + p[1], 0) / list.length];

  // Right triangle drawn to scale. legs a (vertical) and b (horizontal), right
  // angle at the vertex names[2]. text: {a, b, c} label strings ("?" = unknown).
  function rightTriangle(spec) {
    const s = Math.min(52 / spec.b, 36 / spec.a);
    const R = [0, 0], B = [-spec.b * s, 0], A = [0, -spec.a * s];
    const names = spec.names || ['A', 'B', 'C'];
    const centre = centreOf([A, B, R]);
    const kind = t => t === '?' ? 'unknown' : 'given';
    const m = 3.2;
    const shapes = [
      polygon([A, B, R]),
      '<polyline points="' + pts([[-m, 0], [-m, -m], [0, -m]]) + '" fill="none" stroke="' + C.ink + '" stroke-width="0.35"/>'
    ];
    const labels = [
      sideLabel(spec.text.a, A, R, centre, kind(spec.text.a)),
      sideLabel(spec.text.b, B, R, centre, kind(spec.text.b)),
      sideLabel(spec.text.c, A, B, centre, kind(spec.text.c)),
      vertexLabel(names[0], A, centre), vertexLabel(names[1], B, centre), vertexLabel(names[2], R, centre)
    ];
    return frame(shapes, labels, extentOf([A, B, R]), spec.title || 'משולש ישר-זווית');
  }

  // Rectangle (to scale) with one diagonal. text: {w, h, d}.
  function rectangleDiagonal(spec) {
    const s = Math.min(54 / spec.w, 32 / spec.h);
    const w = spec.w * s, h = spec.h * s;
    const P = [[0, 0], [-w, 0], [-w, -h], [0, -h]];
    const names = spec.names || ['A', 'B', 'C', 'D'];
    const centre = centreOf(P);
    const kind = t => t === '?' ? 'unknown' : 'given';
    const shapes = [polygon(P), line(P[1], P[3])];
    const mid = [(P[1][0] + P[3][0]) / 2, (P[1][1] + P[3][1]) / 2];
    let nx = -(P[3][1] - P[1][1]), ny = P[3][0] - P[1][0];
    const len = Math.hypot(nx, ny); nx /= len; ny /= len;
    if (ny > 0) { nx = -nx; ny = -ny; }
    const dSize = SIZE[kind(spec.text.d)] || SIZE.label;
    const off = 1.6 + Math.abs(nx) * textWidth(spec.text.d, dSize) / 2 + Math.abs(ny) * dSize * 0.62;
    const labels = [
      sideLabel(spec.text.w, P[0], P[1], centre, kind(spec.text.w)),
      sideLabel(spec.text.h, P[0], P[3], centre, kind(spec.text.h)),
      label(spec.text.d, mid[0] + nx * off, mid[1] + ny * off, kind(spec.text.d))
    ].concat(P.map((p, i) => vertexLabel(names[i], p, centre)));
    return frame(shapes, labels, extentOf(P), spec.title || 'מלבן ואלכסון');
  }

  // A triangle sketch that is NOT to scale, for "is it a right triangle?"
  // tasks: a fixed shape whose largest angle is about 81°, so the drawing never
  // answers the question. text: [bottom, left, right] side labels (bottom is
  // the longest); names: [right end, left end, apex].
  function triangleSketch(spec) {
    const A = [0, 0], B = [-50, 0], T = [-31, -28];
    const centre = centreOf([A, B, T]);
    const names = spec.names || ['A', 'B', 'C'];
    const labels = [
      sideLabel(spec.text[0], A, B, centre, 'given'),
      sideLabel(spec.text[1], B, T, centre, 'given'),
      sideLabel(spec.text[2], A, T, centre, 'given'),
      vertexLabel(names[0], A, centre), vertexLabel(names[1], B, centre), vertexLabel(names[2], T, centre)
    ];
    const ext = extentOf([A, B, T]);
    labels.push(label(spec.note || 'השרטוט אינו בקנה מידה', (A[0] + B[0]) / 2, Math.max(ext.y1, labels[0].box.y1) + 3.4, 'note'));
    return frame([polygon([A, B, T])], labels, ext, spec.title || 'משולש');
  }

  // Introspection used by verifiers: labels and viewBox of a figure string.
  function inspect(svg) {
    const vb = /viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/.exec(svg);
    const labels = [];
    const re = /<text x="([-\d.]+)" y="([-\d.]+)" font-size="([\d.]+)"[^>]*data-label-kind="(\w+)">([^<]*)<\/text>/g;
    let m;
    while ((m = re.exec(svg))) labels.push({ x: +m[1], y: +m[2], size: +m[3], kind: m[4], text: m[5] });
    return { viewBox: vb ? vb.slice(1).map(Number) : null, labels: labels };
  }

  W.figures = { rightTriangle: rightTriangle, rectangleDiagonal: rectangleDiagonal, triangleSketch: triangleSketch, inspect: inspect, textWidth: textWidth, colors: C };
})(typeof window !== 'undefined' ? window : globalThis);
