// generator/engine/source-fit-dedicated-2.js
// Dedicated source-backed engines for the LAST 9 fallback topics, with
// textbook-quality SVG: G8-09 similarity/shadows, G8-07 congruence markings,
// G8-05 central angle/sector, G7-06 composite area, G7-05 transformations,
// N7-10/N7-11 directed add/sub, N7-12/N7-13 directed mul/div.
// open/mcq/tf/mistake · basic/standard/challenge, balanced TF, smart MCQ,
// mistake-with-correction, full pedagogy meta. Loaded after source-fit-dedicated.
(function () {
  const E = window.TargilimEngine = window.TargilimEngine || {};
  const L = ['א', 'ב', 'ג', 'ד'];
  const T = (E.themes && E.themes.geometry) || { fill: '#f1f5f9', stroke: '#334155', helper: '#94a3b8', given: '#1d4ed8', unknown: '#dc2626', label: '#0f172a' };
  function pick(a) { return E.pick ? E.pick(a) : a[Math.floor(Math.random() * a.length)]; }
  function shuf(a) { return E.shuffle ? E.shuffle(a) : a.slice().sort(() => Math.random() - 0.5); }
  function rnd(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
  function qt(qtype) { return qtype === 'mixed' ? pick(['open', 'mcq', 'tf', 'mistake']) : (qtype || 'open'); }
  function ch(items) { const seen = {}, u = []; for (const x of items) { if (!seen[x.text]) { seen[x.text] = 1; u.push(x); } } const c = u.filter(x => x.correct), w = u.filter(x => !x.correct); return shuf((c.length ? [c[0]] : []).concat(w).slice(0, 4)).map((x, i) => ({ label: L[i], text: x.text, correct: !!x.correct })); }
  function topicReg(g, d, id, label) { if (typeof TOPICS === 'undefined' || !TOPICS[g] || !TOPICS[g][d]) return; if (!TOPICS[g][d].some(t => t[0] === id)) TOPICS[g][d].push([id, label, 1]); }
  function svgWrap(w, h, body) { return `<svg class="engine-svg" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="paint-order:stroke">${body}</svg>`; }
  function wrap(n) { return n < 0 ? '(' + n + ')' : '' + n; }

  // ── visuals ──
  function sectorSvg(angle) {
    const cx = 110, cy = 100, R = 70, a = -90, b = -90 + angle;
    const x1 = cx + R * Math.cos(a * Math.PI / 180), y1 = cy + R * Math.sin(a * Math.PI / 180);
    const x2 = cx + R * Math.cos(b * Math.PI / 180), y2 = cy + R * Math.sin(b * Math.PI / 180);
    const large = angle > 180 ? 1 : 0, mid = (a + angle / 2) * Math.PI / 180;
    return svgWrap(240, 200,
      `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${T.fill}" stroke="${T.stroke}" stroke-width="1.6"/>` +
      `<path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${T.given}" fill-opacity="0.28" stroke="${T.given}" stroke-width="2"/>` +
      `<line x1="${cx}" y1="${cy}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${T.stroke}" stroke-width="2"/>` +
      `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${T.stroke}" stroke-width="2"/>` +
      `<circle cx="${cx}" cy="${cy}" r="3" fill="${T.stroke}"/>` +
      `<text x="${(cx + 26 * Math.cos(mid)).toFixed(1)}" y="${(cy + 26 * Math.sin(mid)).toFixed(1)}" fill="${T.unknown}" font-size="13" font-weight="800" text-anchor="middle" dominant-baseline="middle">${angle}°</text>` +
      `<text x="120" y="190" fill="${T.label}" font-size="10.5" font-weight="700" text-anchor="middle">גזרה וזווית מרכזית</text>`);
  }
  function poleShadowSvg(h1, s1, h2, s2, unknownTall) {
    // two right triangles (pole + shadow) sharing the sun angle
    const baseY = 150, x0 = 40, sc = 6;
    function tri(x, h, s, lbl, lblH) {
      const px = x, py = baseY, tx = x + s * sc, ty = baseY, topy = baseY - h * sc;
      return `<polygon points="${px},${py} ${tx},${ty} ${px},${topy}" fill="${T.fill}" stroke="${T.stroke}" stroke-width="2" stroke-linejoin="round"/>` +
        `<line x1="${px}" y1="${topy}" x2="${tx}" y2="${ty}" stroke="${T.helper}" stroke-width="1.5" stroke-dasharray="4 3"/>` +
        `<text x="${px - 8}" y="${(py + topy) / 2}" fill="${lblH ? T.unknown : T.given}" font-size="12" font-weight="800" text-anchor="end">${lbl}</text>` +
        `<text x="${(px + tx) / 2}" y="${py + 15}" fill="${T.given}" font-size="11" font-weight="700" text-anchor="middle">${s}</text>`;
    }
    return svgWrap(290, 180,
      `<line x1="20" y1="${baseY}" x2="270" y2="${baseY}" stroke="${T.stroke}" stroke-width="1.5"/>` +
      tri(x0, h1, s1, unknownTall ? '?' : h1, unknownTall) +
      tri(x0 + 150, h2, s2, h2, false) +
      `<text x="145" y="172" fill="${T.label}" font-size="10.5" font-weight="700" text-anchor="middle">דמיון וצללים</text>`);
  }
  // Two corresponding triangles carrying exactly the equalities of one theorem:
  // צ.צ.צ → three side pairs (1/2/3 ticks); צ.ז.צ → two sides (1/2 ticks) and
  // the angle between them (arc); ז.צ.ז → two angles (1/2 arcs) and the side
  // between them (tick). `at` rotates which vertex/side carries the marks.
  function congruenceSvg(thm, at) {
    const V = [[60, 30], [20, 120], [110, 120]];          // vertices of the base triangle
    const SIDES = [[0, 1], [1, 2], [2, 0]];                // side k joins V[k] → V[k+1]
    const ink = T.unknown, k = (at || 0) % 3;
    function ticks(ox, s, n) {
      const p = V[SIDES[s][0]], q = V[SIDES[s][1]];
      const mx = ox + (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]), ux = (q[0] - p[0]) / len, uy = (q[1] - p[1]) / len;
      let out = '';
      for (let i = 0; i < n; i++) {
        const o = (i - (n - 1) / 2) * 5, cx = mx + ux * o, cy = my + uy * o;
        out += `<line x1="${(cx - uy * 6).toFixed(1)}" y1="${(cy + ux * 6).toFixed(1)}" x2="${(cx + uy * 6).toFixed(1)}" y2="${(cy - ux * 6).toFixed(1)}" stroke="${ink}" stroke-width="2"/>`;
      }
      return out;
    }
    function arcs(ox, v, n) {
      const p = V[v], a = V[(v + 1) % 3], b = V[(v + 2) % 3];
      let out = '';
      for (let i = 0; i < n; i++) {
        const r = 13 + i * 5;
        const u1 = [a[0] - p[0], a[1] - p[1]], u2 = [b[0] - p[0], b[1] - p[1]];
        const l1 = Math.hypot(u1[0], u1[1]), l2 = Math.hypot(u2[0], u2[1]);
        const x1 = ox + p[0] + u1[0] / l1 * r, y1 = p[1] + u1[1] / l1 * r, x2 = ox + p[0] + u2[0] / l2 * r, y2 = p[1] + u2[1] / l2 * r;
        let d = Math.atan2(u2[1], u2[0]) - Math.atan2(u1[1], u1[0]);
        while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
        out += `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 ${d > 0 ? 1 : 0} ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${ink}" stroke-width="1.8" data-mark="angle"/>`;
      }
      return out;
    }
    function marks(ox) {
      if (thm === 'צ.צ.צ') return ticks(ox, k, 1) + ticks(ox, (k + 1) % 3, 2) + ticks(ox, (k + 2) % 3, 3);
      if (thm === 'צ.ז.צ') return ticks(ox, k, 1) + ticks(ox, (k + 2) % 3, 2) + arcs(ox, k, 1);       // sides k and k−1 meet at vertex k
      return arcs(ox, SIDES[k][0], 1) + arcs(ox, SIDES[k][1], 2) + ticks(ox, k, 1);                    // ז.צ.ז: angles at both ends of side k
    }
    function tri(ox) {
      return `<polygon points="${V.map(p => (ox + p[0]) + ',' + p[1]).join(' ')}" fill="${T.fill}" stroke="${T.stroke}" stroke-width="2" stroke-linejoin="round"/>` +
        (thm ? marks(ox) : '');
    }
    return svgWrap(290, 160, tri(10) + tri(150) +
      `<text x="80" y="145" fill="${T.label}" font-size="10" font-weight="700" text-anchor="middle">משולש 1</text>` +
      `<text x="220" y="145" fill="${T.label}" font-size="10" font-weight="700" text-anchor="middle">משולש 2</text>`);
  }
  function compositeSvg(a, b, c, d) {
    // L-shape: big rect a·b minus small rect c·d (top-right), decomposition line
    const sc = 9, ox = 40, oy = 24, W = a * sc, H = b * sc, cw = c * sc, chh = d * sc;
    return svgWrap(Math.max(240, ox + W + 66), oy + H + 38,
      `<path d="M ${ox} ${oy} h ${W - cw} v ${chh} h ${cw} v ${H - chh} h ${-W} Z" fill="${T.fill}" stroke="${T.stroke}" stroke-width="2" stroke-linejoin="round"/>` +
      `<line x1="${ox + W - cw}" y1="${oy}" x2="${ox + W - cw}" y2="${oy + chh}" stroke="${T.helper}" stroke-width="1.5" stroke-dasharray="5 4"/>` +
      `<line x1="${ox + W - cw}" y1="${oy + chh}" x2="${ox + W}" y2="${oy + chh}" stroke="${T.helper}" stroke-width="1.5" stroke-dasharray="5 4"/>` +
      `<text x="${ox + W / 2}" y="${oy + H + 18}" fill="${T.given}" font-size="11" font-weight="700" text-anchor="middle">${a} ס״מ</text>` +
      `<text x="${ox - 10}" y="${oy + H / 2}" fill="${T.given}" font-size="11" font-weight="700" text-anchor="end" dominant-baseline="middle">${b} ס״מ</text>` +
      `<text x="${ox + W - cw / 2}" y="${oy - 6}" fill="${T.given}" font-size="10" font-weight="700" text-anchor="middle">${c} ס״מ</text>` +
      `<text x="${ox + W + 7}" y="${oy + chh / 2}" fill="${T.given}" font-size="10" font-weight="700" dominant-baseline="middle">${d} ס״מ</text>`);
  }
  function transformSvg(kind, dx) {
    const g = 20, ox = 24, oy = 18, n = 9;
    let grid = '';
    for (let i = 0; i <= n; i++) { grid += `<line x1="${ox + i * g}" y1="${oy}" x2="${ox + i * g}" y2="${oy + n * g}" stroke="#e2e8f0" stroke-width="1"/><line x1="${ox}" y1="${oy + i * g}" x2="${ox + n * g}" y2="${oy + i * g}" stroke="#e2e8f0" stroke-width="1"/>`; }
    function shape(x, y, col, lbl) { return `<polygon points="${ox + x * g},${oy + y * g} ${ox + (x + 2) * g},${oy + y * g} ${ox + x * g},${oy + (y + 2) * g}" fill="${col}" fill-opacity="0.4" stroke="${col}" stroke-width="2"/><text x="${ox + (x + 0.4) * g}" y="${oy + (y + 1) * g}" fill="${col}" font-size="11" font-weight="800">${lbl}</text>`; }
    function rotShape(x, y, col, lbl) { return `<polygon points="${ox + (x + 2) * g},${oy + (y + 2) * g} ${ox + x * g},${oy + (y + 2) * g} ${ox + (x + 2) * g},${oy + y * g}" fill="${col}" fill-opacity="0.4" stroke="${col}" stroke-width="2"/><text x="${ox + (x + 1) * g}" y="${oy + (y + 1.7) * g}" fill="${col}" font-size="11" font-weight="800">${lbl}</text>`; }
    let after, kname;
    if (kind === 'reflect') { after = shape(n - 2 - 1, 1, T.unknown, "'A"); kname = 'שיקוף'; }
    else if (kind === 'rotate') { after = rotShape(4, 4, T.unknown, "'A"); kname = 'סיבוב'; }
    else { after = shape(1 + dx, 1, T.unknown, "'A"); kname = 'הזזה'; }
    return svgWrap(ox + n * g + 20, oy + n * g + 28, grid + shape(1, 1, T.given, 'A') + after +
      `<text x="${ox + n * g / 2}" y="${oy + n * g + 18}" fill="${T.label}" font-size="10.5" font-weight="700" text-anchor="middle">${kname} ברשת</text>`);
  }

  function render(qtype, q, a, svg, cs, isTrue, family) {
    let r;
    if (qtype === 'mcq') r = E.questionTypes.mcq({ question: q, answer: a, svg: svg, choices: cs });
    else if (qtype === 'tf') r = E.questionTypes.tf({ question: q, answer: a, svg: svg, isTrue: isTrue });
    else if (qtype === 'mistake') r = E.questionTypes.mistake({ question: q, answer: a, svg: svg });
    else r = E.questionTypes.open({ question: q, answer: a, svg: svg });
    if (r && family) r.questionFamily = family; // per-generation provenance
    return r;
  }

  // ── G8-05 central angle & sector ──
  function genG805(diff, qtype) {
    qtype = qt(qtype);
    const pct = pick([10, 20, 25, 30, 40, 50]), ang = Math.round(pct * 3.6);
    const fam = diff === 'basic' ? 'angle_from_part' : diff === 'challenge' ? pick(['part_from_angle', 'compare']) : pick(['angle_from_part', 'part_from_angle']);
    const tfTrue = qtype === 'tf' && Math.random() < 0.5;
    const svg = sectorSvg(ang);
    let q, a, cs, isTrue = tfTrue;
    if (fam === 'part_from_angle') {
      a = `החלק מהעיגול = הזווית המרכזית חלקי 360°: ${ang}/360=${pct}%.`;
      q = `הזווית המרכזית של גזרה היא ${ang}°. איזה חלק מהעיגול היא מהווה?`;
      if (qtype === 'tf') { q = `גזרה בעלת זווית מרכזית ${ang}° מהווה ${tfTrue ? pct : pct + 10}% מהעיגול.`; a = (tfTrue ? 'נכון. ' : 'שגוי. ') + a; }
      else if (qtype === 'mcq') { cs = ch([{ text: pct + '%', correct: true }, { text: ang + '%', correct: false }, { text: (pct + 10) + '%', correct: false }, { text: (100 - pct) + '%', correct: false }]); }
      else if (qtype === 'mistake') { q = `תלמיד אמר שגזרה של ${ang}° היא ${ang}% מהעיגול.`; a = `הטעות: החלק = זווית/360°, לא הזווית כאחוז. ${ang}/360=${pct}%.`; }
    } else if (fam === 'compare') {
      const ang2 = Math.round(pick([10, 20, 30].filter(p => p !== pct)) * 3.6);
      a = `הגזרה הגדולה יותר היא בעלת הזווית המרכזית הגדולה יותר: ${Math.max(ang, ang2)}°.`;
      q = `שתי גזרות בעיגול, זוויות מרכזיות ${ang}° ו-${ang2}°. איזו גזרה גדולה יותר?`;
      if (qtype === 'tf') { q = `הגזרה בעלת הזווית ${Math.min(ang, ang2)}° גדולה יותר.`; a = (tfTrue ? '' : '') + `הגזרה הגדולה היא בעלת הזווית ${Math.max(ang, ang2)}°.`; isTrue = false; if (tfTrue) { q = `הגזרה בעלת הזווית ${Math.max(ang, ang2)}° גדולה יותר.`; a = 'נכון. ' + a; isTrue = true; } else a = 'שגוי. ' + a; }
      else if (qtype === 'mcq') { cs = ch([{ text: 'הגזרה של ' + Math.max(ang, ang2) + '°', correct: true }, { text: 'הגזרה של ' + Math.min(ang, ang2) + '°', correct: false }, { text: 'שוות', correct: false }, { text: 'אי אפשר לדעת', correct: false }]); }
      else if (qtype === 'mistake') { q = `תלמיד קבע שהגזרה של ${Math.min(ang, ang2)}° גדולה יותר כי המספר נראה לו "עגול".`; a = `הטעות: גודל גזרה לפי הזווית המרכזית. ${Math.max(ang, ang2)}° > ${Math.min(ang, ang2)}°.`; }
    } else {
      a = `הזווית המרכזית = החלק מהעיגול · 360°: ${pct}%·360°=${ang}°.`;
      q = `גזרה מהווה ${pct}% מהעיגול. מהי הזווית המרכזית שלה?`;
      if (qtype === 'tf') { q = `גזרה המהווה ${pct}% מהעיגול היא בעלת זווית מרכזית ${tfTrue ? ang : pct}°.`; a = (tfTrue ? 'נכון. ' : 'שגוי — אחוז אינו מעלות. ') + a; }
      else if (qtype === 'mcq') { cs = ch([{ text: ang + '°', correct: true }, { text: pct + '°', correct: false }, { text: (pct * 100) + '°', correct: false }, { text: (360 - ang) + '°', correct: false }]); }
      else if (qtype === 'mistake') { q = `תלמיד חישב זווית מרכזית של גזרת ${pct}%: "${pct}°".`; a = `הטעות: הזווית = אחוז·360°, לא האחוז עצמו. ${pct}%·360°=${ang}°.`; }
    }
    return render(qtype, q, a, svg, cs, isTrue, fam);
  }

  // ── G8-07 triangle congruence markings ──
  function genG807(diff, qtype) {
    qtype = qt(qtype);
    const thm = pick([['צ.צ.צ', 'שלוש צלעות מתאימות שוות'], ['צ.ז.צ', 'שתי צלעות והזווית שביניהן שוות'], ['ז.צ.ז', 'שתי זוויות והצלע שביניהן שוות']]);
    const tfTrue = qtype === 'tf' && Math.random() < 0.5;
    const fam = diff === 'basic' ? 'name_theorem' : diff === 'challenge' ? pick(['missing_datum', 'why']) : pick(['name_theorem', 'why']);
    // the drawing shows exactly the equalities of the theorem in the answer
    const svg = congruenceSvg(thm[0], Math.floor(Math.random() * 3));
    let q, a, cs, isTrue = tfTrue;
    if (fam === 'missing_datum') {
      a = `כדי לטעון חפיפה לפי ${thm[0]} צריך ${thm[1]} — ולוודא שהסימונים תואמים בשני המשולשים.`;
      q = `שני משולשים מסומנים. אילו נתונים דרושים כדי לטעון חפיפה לפי ${thm[0]}?`;
      if (qtype === 'tf') { q = `לפי ${thm[0]} די בכך ש${tfTrue ? thm[1] : 'זווית אחת בלבד שווה'}.`; a = (tfTrue ? 'נכון. ' : 'שגוי. ') + a; }
      else if (qtype === 'mcq') { cs = ch([{ text: thm[1], correct: true }, { text: 'זווית אחת שווה', correct: false }, { text: 'צלע אחת שווה', correct: false }, { text: 'שטח שווה', correct: false }]); }
      else if (qtype === 'mistake') { q = `תלמיד טען חפיפה לפי ${thm[0]} מסימון של זווית אחת בלבד.`; a = `הטעות: ${thm[0]} דורש ${thm[1]}. סימון חלקי אינו מספיק.`; }
    } else if (fam === 'why') {
      a = `הסימונים מראים ${thm[1]}, ולכן המשולשים חופפים לפי ${thm[0]}.`;
      q = `לפי הסימונים בשרטוט — מדוע המשולשים חופפים?`;
      if (qtype === 'tf') { q = `המשולשים חופפים לפי ${tfTrue ? thm[0] : 'שטח שווה'}.`; a = (tfTrue ? 'נכון. ' : 'שגוי — שטח שווה אינו משפט חפיפה. ') + a; }
      else if (qtype === 'mcq') { cs = ch([{ text: 'לפי ' + thm[0], correct: true }, { text: 'לפי שטח שווה', correct: false }, { text: 'לפי היקף שווה', correct: false }, { text: 'אי אפשר לקבוע', correct: false }]); }
      else if (qtype === 'mistake') { q = `תלמיד נימק חפיפה ב"שני המשולשים נראים אותו דבר".`; a = `הטעות: חפיפה נטענת לפי משפט (${thm[0]}) ולפי סימונים, לא לפי מראה. ` + a; }
    } else {
      a = `הסימונים בשרטוט מתאימים למשפט ${thm[0]} (${thm[1]}).`;
      q = `לפי הסימונים בשרטוט — לפי איזה משפט חפיפה אפשר לטעון שהמשולשים חופפים?`;
      if (qtype === 'tf') { q = `הסימונים מתאימים למשפט ${tfTrue ? thm[0] : 'זווית-זווית-זווית'}.`; a = (tfTrue ? 'נכון. ' : 'שגוי — זווית-זווית-זווית אינו משפט חפיפה. ') + a; }
      else if (qtype === 'mcq') { cs = ch([{ text: thm[0], correct: true }, { text: 'ז.ז.ז', correct: false }, { text: 'צ.צ.ז (אינו תמיד)', correct: false }, { text: 'אין מספיק נתונים', correct: false }]); }
      else if (qtype === 'mistake') { q = `תלמיד בחר במשפט "ז.ז.ז" כדי להוכיח חפיפה.`; a = `הטעות: ז.ז.ז מבטיח דמיון, לא חפיפה. כאן מתאים ${thm[0]}.`; }
    }
    return render(qtype, q, a, svg, cs, isTrue, fam);
  }

  // ── G8-09 similarity & shadows ──
  function genG809(diff, qtype) {
    qtype = qt(qtype);
    const k = pick([2, 3, 4]), s1 = pick([2, 3, 4]), h2 = pick([4, 6, 8]);
    const s2 = s1 * k, h1 = h2 / k; // pole1 unknown? we set pole2 known, pole1 unknown via ratio
    // Use: known pole h2 with shadow s2; unknown pole with shadow s1; same ratio
    const ans = Math.round(h2 * s1 / s2 * 10) / 10;
    const tfTrue = qtype === 'tf' && Math.random() < 0.5;
    const svg = poleShadowSvg(ans, s1, h2, s2, true);
    const fam = diff === 'basic' ? 'find_height' : diff === 'challenge' ? pick(['find_ratio', 'why']) : pick(['find_height', 'find_ratio']);
    let q, a, cs, isTrue = tfTrue;
    if (fam === 'find_ratio') {
      a = `יחס הדמיון בין המשולשים שווה ליחס הצללים: ${s2}/${s1}=${Math.round(s2 / s1 * 10) / 10}.`;
      q = `עמוד מטיל צל ${s2} מ׳, ומוט צל ${s1} מ׳, באותה שעה. מהו יחס הדמיון בין המשולשים?`;
      if (qtype === 'tf') { q = `יחס הדמיון בין המשולשים הוא ${tfTrue ? Math.round(s2 / s1 * 10) / 10 : s2 - s1}.`; a = (tfTrue ? 'נכון. ' : 'שגוי — יחס הוא מנה ולא הפרש. ') + a; }
      else if (qtype === 'mcq') { cs = ch([{ text: '' + (Math.round(s2 / s1 * 10) / 10), correct: true }, { text: '' + (s2 - s1), correct: false }, { text: '' + (s1 / s2), correct: false }, { text: '' + (s2 + s1), correct: false }]); }
      else if (qtype === 'mistake') { q = `תלמיד חישב יחס דמיון כ-${s2}−${s1}=${s2 - s1}.`; a = `הטעות: יחס דמיון הוא מנה (${s2}/${s1}), לא הפרש.`; }
    } else if (fam === 'why') {
      a = `העצמים אנכיים וקרני השמש מקבילות, לכן נוצרים שני משולשים ישרי-זווית דומים — והצלעות המתאימות ביחס קבוע.`;
      q = `מדוע אפשר להשתמש בדמיון משולשים כדי למצוא גובה עצם לפי צילו?`;
      if (qtype === 'tf') { q = `בעצמים אנכיים באותה שעה, המשולשים של העצם וצילו ${tfTrue ? 'דומים' : 'חופפים'}.`; a = (tfTrue ? 'נכון. ' : 'שגוי — הם דומים, לא בהכרח חופפים. ') + a; }
      else if (qtype === 'mcq') { cs = ch([{ text: 'כי המשולשים דומים (זוויות שוות)', correct: true }, { text: 'כי הם חופפים', correct: false }, { text: 'כי הצללים שווים', correct: false }, { text: 'כי העצמים שווים', correct: false }]); }
      else if (qtype === 'mistake') { q = `תלמיד טען שהמשולשים חופפים ולכן הגבהים שווים.`; a = `הטעות: המשולשים דומים (לא חופפים); הצלעות ביחס קבוע, לא שוות. ` + a; }
    } else {
      a = `לפי דמיון, גובה/צל קבוע: ${h2}/${s2}=h/${s1}, ולכן h=${h2}·${s1}/${s2}=${ans} מ׳.`;
      q = `עמוד בגובה ${h2} מ׳ מטיל צל ${s2} מ׳. באותה שעה מוט מטיל צל ${s1} מ׳. מה גובה המוט?`;
      if (qtype === 'tf') { q = `גובה המוט הוא ${tfTrue ? ans : s1} מ׳.`; a = (tfTrue ? 'נכון. ' : 'שגוי — זה אורך הצל, לא הגובה. ') + a; }
      else if (qtype === 'mcq') { cs = ch([{ text: ans + ' מ׳', correct: true }, { text: s1 + ' מ׳', correct: false }, { text: (h2) + ' מ׳', correct: false }, { text: (Math.round(h2 * s2 / s1 * 10) / 10) + ' מ׳', correct: false }]); }
      else if (qtype === 'mistake') { q = `תלמיד קבע שגובה המוט שווה לאורך צילו, ${s1} מ׳.`; a = `הטעות: משתמשים בדמיון — ${h2}/${s2}=h/${s1}, לכן h=${ans} מ׳.`; }
    }
    return render(qtype, q, a, svg, cs, isTrue, fam);
  }

  // ── G7-06 composite area ──
  function genG706(diff, qtype) {
    qtype = qt(qtype);
    const a = pick([8, 9, 10, 12]), b = pick([6, 7, 8]), c = pick([3, 4]), d = pick([2, 3]);
    const area = a * b - c * d;
    const tfTrue = qtype === 'tf' && Math.random() < 0.5;
    const svg = compositeSvg(a, b, c, d);
    const fam = diff === 'basic' ? 'subtract' : diff === 'challenge' ? pick(['decompose', 'perimeter']) : pick(['subtract', 'decompose', 'perimeter']);
    const perim = 2 * (a + b);
    let q, ans, cs, isTrue = tfTrue;
    if (fam === 'perimeter') {
      ans = `חיתוך מלבן מפינה אינו משנה את ההיקף: שני הקטעים שהוסרו מוחלפים בשני קטעים פנימיים באותו אורך. לכן ההיקף = 2·(${a}+${b})=${perim} ס״מ.`;
      q = `מהו היקף צורת ה-L שבשרטוט? (הממדים בס״מ)`;
      if (qtype === 'tf') { q = `היקף הצורה הוא ${tfTrue ? perim : perim - 2 * c} ס״מ.`; ans = (tfTrue ? 'נכון. ' : 'שגוי — חיתוך פינה אינו מקטין את ההיקף. ') + ans; }
      else if (qtype === 'mcq') { cs = ch([{ text: perim + ' ס״מ', correct: true }, { text: (perim - 2 * c) + ' ס״מ', correct: false }, { text: area + ' ס״מ', correct: false }, { text: (2 * (a - c + b - d)) + ' ס״מ', correct: false }]); }
      else if (qtype === 'mistake') { q = `תלמיד חישב היקף = 2·(${a}+${b})−2·${c}−2·${d}=${perim - 2 * c - 2 * d} ס״מ, בטענה שהחיתוך מקצר את ההיקף.`; ans = `הטעות: הקטעים שהוסרו מוחלפים בקטעים פנימיים שווי אורך, ולכן ההיקף נשמר: ${perim} ס״מ.`; }
    } else if (fam === 'decompose') {
      const big = (a - c) * b, small = c * (b - d);
      ans = `מפרקים לשני מלבנים: ${a - c}·${b}=${big} ו-${c}·${b - d}=${small}. סך השטח: ${big}+${small}=${big + small} סמ״ר.`;
      q = `חשבו את שטח הצורה (צורת L) בעזרת פירוק לשני מלבנים. הממדים בשרטוט (ס״מ).`;
      if (qtype === 'tf') { q = `שטח הצורה הוא ${tfTrue ? area : a * b} סמ״ר.`; ans = (tfTrue ? 'נכון. ' : 'שגוי — זה שטח המלבן המלא, לפני החיסור. ') + `שטח צורת ה-L: ${area} סמ״ר.`; }
      else if (qtype === 'mcq') { cs = ch([{ text: area + ' סמ״ר', correct: true }, { text: (a * b) + ' סמ״ר', correct: false }, { text: (a * b - c) + ' סמ״ר', correct: false }, { text: (c * d) + ' סמ״ר', correct: false }]); }
      else if (qtype === 'mistake') { q = `תלמיד חישב את השטח כ-${a}·${b}=${a * b} סמ״ר.`; ans = `הטעות: זה המלבן השלם. צריך לחסר את המלבן החסר ${c}·${d}=${c * d}: ${a * b}−${c * d}=${area} סמ״ר.`; }
    } else {
      ans = `מלבן שלם ${a}·${b}=${a * b}, פחות החלק החסר ${c}·${d}=${c * d}. שטח: ${a * b}−${c * d}=${area} סמ״ר.`;
      q = `חשבו את שטח הצורה (צורת L) שבשרטוט. הממדים בס״מ.`;
      if (qtype === 'tf') { q = `שטח הצורה הוא ${tfTrue ? area : a * b} סמ״ר.`; ans = (tfTrue ? 'נכון. ' : 'שגוי — זה המלבן המלא לפני החיסור. ') + ans; }
      else if (qtype === 'mcq') { cs = ch([{ text: area + ' סמ״ר', correct: true }, { text: (a * b) + ' סמ״ר', correct: false }, { text: (a * b - c - d) + ' סמ״ר', correct: false }, { text: (a + b) + ' סמ״ר', correct: false }]); }
      else if (qtype === 'mistake') { q = `תלמיד חישב ${a}·${b}=${a * b} ושכח את הפינה החסרה.`; ans = `הטעות: יש לחסר את המלבן החסר ${c}·${d}=${c * d}. השטח: ${area} סמ״ר.`; }
    }
    return render(qtype, q, ans, svg, cs, isTrue, fam);
  }

  // ── G7-05 transformations ──
  function genG705(diff, qtype) {
    qtype = qt(qtype);
    const kind = diff === 'basic' ? pick(['translate', 'reflect']) : pick(['translate', 'reflect', 'rotate']);
    const dx = pick([3, 4, 5]);
    const tfTrue = qtype === 'tf' && Math.random() < 0.5;
    const svg = transformSvg(kind, dx);
    const kindName = kind === 'reflect' ? 'שיקוף' : kind === 'rotate' ? 'סיבוב' : 'הזזה';
    let q, a, cs, isTrue = tfTrue;
    a = `${kindName} שומרת על גודל הצורה וצורתה (איזומטריה): המרחקים נשמרים, רק המיקום/הכיוון משתנה.`;
    q = `בשרטוט בוצעה טרנספורמציה על המשולש A. איזו טרנספורמציה זו, ומה נשמר?`;
    if (qtype === 'tf') { q = `${kindName} משנה את גודל הצורה.`; a = 'שגוי. ' + a; isTrue = false; if (tfTrue) { q = `${kindName} שומרת על גודל הצורה.`; a = 'נכון. ' + a; isTrue = true; } }
    else if (qtype === 'mcq') { q = `איזו טרנספורמציה בוצעה ומה נשמר?`; cs = ch([{ text: kindName + ' — הגודל נשמר', correct: true }, { text: kindName + ' — הגודל גדל', correct: false }, { text: 'הקטנה — הגודל קטן', correct: false }, { text: 'אין שינוי כלל', correct: false }]); }
    else if (qtype === 'mistake') { q = `תלמיד טען שאחרי ${kindName} הצורה גדלה.`; a = `הטעות: ${kindName} היא איזומטריה — ` + a; }
    return render(qtype, q, a, svg, cs, isTrue, kind);
  }

  // ── N7-10 directed add/sub mistake analysis (families: add / subtract / three_terms) ──
  function genN710(diff, qtype) {
    qtype = qt(qtype);
    const nz = () => { let v = rnd(-12, 12); while (v === 0) v = rnd(-12, 12); return v; };
    const fam = diff === 'basic' ? 'add' : diff === 'challenge' ? pick(['subtract', 'three_terms']) : pick(['add', 'subtract', 'three_terms']);
    const tfTrue = qtype === 'tf' && Math.random() < 0.5;
    let x = nz(), y = nz(), expr, res, a, pts;
    if (fam === 'three_terms') {
      // keep magnitudes small so x+y−z stays inside the ±24 number line
      const sm = () => { let v = rnd(-7, 7); while (v === 0) v = rnd(-7, 7); return v; };
      x = sm(); y = sm(); const z = sm(); res = x + y - z; expr = `${wrap(x)} + ${wrap(y)} − ${wrap(z)}`;
      a = `פותרים משמאל לימין: ${wrap(x)}+${wrap(y)}=${wrap(x + y)}, ואז ${wrap(x + y)}−${wrap(z)}=${res}. בכל שלב הסימן נקבע לפי הכלל.`;
      pts = [x, res];
    } else if (fam === 'subtract') {
      res = x - y; expr = `${wrap(x)} − ${wrap(y)}`;
      a = `חיסור מכוון = חיבור הנגדי: ${expr}=${wrap(x)}+${wrap(-y)}=${res}.`;
      pts = [x, res];
    } else {
      res = x + y; expr = `${wrap(x)} + ${wrap(y)}`;
      a = `מחברים מספרים מכוונים: ${expr}=${res}. הסימן נקבע לפי המספר הרחוק יותר מאפס.`;
      pts = [x, res];
    }
    const wrong = (-res === res) ? res + 1 : -res;
    const svg = E.numberLineSvg ? E.numberLineSvg({ points: pts, min: -24, max: 24, step: 8 }) : '';
    let q, cs, isTrue = tfTrue;
    q = `נתחו את התרגיל ${expr} ומצאו את התוצאה הנכונה.`;
    if (qtype === 'tf') { q = `${expr} = ${tfTrue ? res : wrong}.`; a = (tfTrue ? 'נכון. ' : 'שגוי. ') + a; }
    else if (qtype === 'mcq') { cs = ch([{ text: '' + res, correct: true }, { text: '' + wrong, correct: false }, { text: '' + (res + 2), correct: false }, { text: '' + (res - 3), correct: false }]); }
    else if (qtype === 'mistake') { q = `תלמיד כתב: "${expr}=${wrong}".`; a = `הטעות: טעות בכלל הסימנים. הדרך הנכונה: ` + a; }
    return render(qtype, q, a, svg, cs, isTrue, fam);
  }

  // ── N7-11 directed add/sub in context (families: find_result / find_change / find_start) ──
  function genN711(diff, qtype) {
    qtype = qt(qtype);
    const ctx = pick([
      { w: 'הטמפרטורה', u: '°', start: rnd(-8, 5), ch1: -rnd(2, 9) },
      { w: 'מפלס המים', u: ' מ׳', start: rnd(-6, 4), ch1: rnd(2, 8) },
      { w: 'יתרת החשבון', u: ' ש״ח', start: rnd(-10, 8), ch1: -rnd(4, 10) }
    ]);
    const res = ctx.start + ctx.ch1;
    const fam = diff === 'basic' ? 'find_result' : diff === 'challenge' ? pick(['find_change', 'find_start']) : pick(['find_result', 'find_change', 'find_start']);
    const tfTrue = qtype === 'tf' && Math.random() < 0.5;
    const svg = E.numberLineSvg ? E.numberLineSvg({ points: [ctx.start, res], min: -24, max: 24, step: 8 }) : '';
    const chWord = ctx.ch1 < 0 ? `ירדה ב-${Math.abs(ctx.ch1)}` : `עלתה ב-${ctx.ch1}`;
    let q, a, cs, isTrue = tfTrue, target, wrong;
    if (fam === 'find_change') {
      target = ctx.ch1;
      a = `השינוי = מצב סופי פחות מצב התחלתי: ${res}−(${ctx.start})=${wrap(ctx.ch1)}${ctx.u} (${ctx.ch1 < 0 ? 'ירידה' : 'עלייה'}).`;
      q = `${ctx.w} הייתה ${ctx.start}${ctx.u} ואחר כך ${res}${ctx.u}. מה היה השינוי?`;
      wrong = ctx.start - res;
      if (qtype === 'tf') { q = `השינוי היה ${wrap(tfTrue ? ctx.ch1 : wrong)}${ctx.u}.`; a = (tfTrue ? 'נכון. ' : 'שגוי — חיסרתם בכיוון ההפוך. ') + a; }
      else if (qtype === 'mcq') { cs = ch([{ text: wrap(ctx.ch1) + ctx.u, correct: true }, { text: wrap(wrong) + ctx.u, correct: false }, { text: wrap(res + ctx.start) + ctx.u, correct: false }, { text: wrap(Math.abs(ctx.ch1)) + ctx.u, correct: false }]); }
      else if (qtype === 'mistake') { q = `תלמיד חישב שינוי = ${ctx.start}−${res}=${wrap(wrong)}${ctx.u}.`; a = `הטעות: שינוי = סופי−התחלתי, לא להפך. ` + a; }
    } else if (fam === 'find_start') {
      target = ctx.start;
      a = `המצב ההתחלתי = מצב סופי פחות השינוי: ${res}−(${wrap(ctx.ch1)})=${ctx.start}${ctx.u}.`;
      q = `${ctx.w} ${chWord}${ctx.u} והגיעה ל-${res}${ctx.u}. מה הייתה ${ctx.w} בהתחלה?`;
      wrong = res + ctx.ch1;
      if (qtype === 'tf') { q = `בהתחלה ${ctx.w} הייתה ${tfTrue ? ctx.start : wrong}${ctx.u}.`; a = (tfTrue ? 'נכון. ' : 'שגוי — יש להפעיל את הפעולה ההפוכה. ') + a; }
      else if (qtype === 'mcq') { cs = ch([{ text: ctx.start + ctx.u, correct: true }, { text: wrong + ctx.u, correct: false }, { text: res + ctx.u, correct: false }, { text: wrap(-ctx.start) + ctx.u, correct: false }]); }
      else if (qtype === 'mistake') { q = `תלמיד חישב התחלה = ${res}+(${wrap(ctx.ch1)})=${wrong}${ctx.u}.`; a = `הטעות: כדי למצוא את ההתחלה מחסרים את השינוי. ` + a; }
    } else {
      target = res;
      a = `מצב התחלתי ${ctx.start}${ctx.u}, השינוי ${wrap(ctx.ch1)}: ${ctx.start}${ctx.ch1 < 0 ? '−' + Math.abs(ctx.ch1) : '+' + ctx.ch1}=${res}${ctx.u}.`;
      q = `${ctx.w} הייתה ${ctx.start}${ctx.u} ואז ${chWord}${ctx.u}. מה ${ctx.w} עכשיו?`;
      wrong = ctx.start - ctx.ch1;
      if (qtype === 'tf') { q = `אחרי השינוי ${ctx.w} היא ${tfTrue ? res : res + 3}${ctx.u}.`; a = (tfTrue ? 'נכון. ' : 'שגוי. ') + a; }
      else if (qtype === 'mcq') { cs = ch([{ text: res + ctx.u, correct: true }, { text: (res + 3) + ctx.u, correct: false }, { text: wrong + ctx.u, correct: false }, { text: ctx.start + ctx.u, correct: false }]); }
      else if (qtype === 'mistake') { q = `תלמיד התעלם מהכיוון וכתב ${ctx.w} = ${wrong}${ctx.u}.`; a = `הטעות: כיוון השינוי קובע את הסימן. ` + a; }
    }
    return render(qtype, q, a, svg, cs, isTrue, fam);
  }

  // ── N7-12 directed mul/div mistake analysis (families: multiply / divide / three_factors) ──
  function genN712(diff, qtype) {
    qtype = qt(qtype);
    const sgn = () => (Math.random() < 0.5 ? -1 : 1);
    const ensureDirected = nums => nums.some(v => v < 0) ? nums : nums.map((v, i) => i === 0 ? -v : v);
    const fam = diff === 'basic' ? 'multiply' : diff === 'challenge' ? pick(['divide', 'three_factors']) : pick(['multiply', 'divide', 'three_factors']);
    const tfTrue = qtype === 'tf' && Math.random() < 0.5;
    let expr, res, a;
    if (fam === 'divide') {
      let b1 = rnd(2, 6) * sgn(), k = rnd(2, 6) * sgn();
      [b1, k] = ensureDirected([b1, k]);
      const a1 = b1 * k; res = a1 / b1;
      const same = (a1 < 0) === (b1 < 0);
      expr = `${wrap(a1)} ÷ ${wrap(b1)}`;
      a = `${same ? 'סימנים זהים → מנה חיובית' : 'סימנים שונים → מנה שלילית'}: ${expr}=${res}.`;
    } else if (fam === 'three_factors') {
      const factors = ensureDirected([rnd(2, 5) * sgn(), rnd(2, 5) * sgn(), rnd(2, 5) * sgn()]);
      const a1 = factors[0], b1 = factors[1], c1 = factors[2]; res = a1 * b1 * c1;
      const negs = [a1, b1, c1].filter(v => v < 0).length;
      expr = `${wrap(a1)} · ${wrap(b1)} · ${wrap(c1)}`;
      a = `סופרים את הגורמים השליליים: ${negs} (${negs % 2 === 0 ? 'זוגי → תוצאה חיובית' : 'אי-זוגי → תוצאה שלילית'}). ${expr}=${res}.`;
    } else {
      let a1 = rnd(2, 9) * sgn(), b1 = rnd(2, 9) * sgn(); if (a1 > 0 && b1 > 0) a1 = -a1; res = a1 * b1;
      const same = (a1 < 0) === (b1 < 0);
      expr = `${wrap(a1)} · ${wrap(b1)}`;
      a = `${same ? 'סימנים זהים → תוצאה חיובית' : 'סימנים שונים → תוצאה שלילית'}: ${expr}=${res}.`;
    }
    let q, cs, isTrue = tfTrue;
    q = `נתחו את התרגיל ${expr} וקבעו את התוצאה הנכונה.`;
    if (qtype === 'tf') { q = `${expr} = ${tfTrue ? res : -res}.`; a = (tfTrue ? 'נכון. ' : 'שגוי בסימן. ') + a; }
    else if (qtype === 'mcq') { cs = ch([{ text: '' + res, correct: true }, { text: '' + (-res), correct: false }, { text: '' + (res + 1), correct: false }, { text: '' + (Math.abs(res) + 2), correct: false }]); }
    else if (qtype === 'mistake') { q = `תלמיד כתב "${expr}=${-res}".`; a = `הטעות: טעות בכלל הסימנים. ` + a; }
    return render(qtype, q, a, '', cs, isTrue, fam);
  }

  // ── N7-13 sign rules (families: product_sign / quotient_sign / three_factor_sign) ──
  function genN713(diff, qtype) {
    qtype = qt(qtype);
    const fam = diff === 'basic' ? 'product_sign' : diff === 'challenge' ? pick(['quotient_sign', 'three_factor_sign']) : pick(['product_sign', 'quotient_sign', 'three_factor_sign']);
    const sgnName = s => s < 0 ? 'שלילי' : 'חיובי';
    const tfTrue = qtype === 'tf' && Math.random() < 0.5;
    let q, a, correct, opp, isTrue = tfTrue, cs;
    if (fam === 'three_factor_sign') {
      const s1 = pick([1, -1]), s2 = pick([1, -1]), s3 = pick([1, -1]);
      const negs = [s1, s2, s3].filter(v => v < 0).length, prod = s1 * s2 * s3;
      correct = sgnName(prod); opp = sgnName(-prod);
      a = `סופרים גורמים שליליים: ${negs}. מספר ${negs % 2 === 0 ? 'זוגי → תוצאה חיובית' : 'אי-זוגי → תוצאה שלילית'}.`;
      q = `מהו סימן המכפלה של מספר ${sgnName(s1)}, מספר ${sgnName(s2)} ומספר ${sgnName(s3)}?`;
    } else if (fam === 'quotient_sign') {
      const s1 = pick([1, -1]), s2 = pick([1, -1]), same = s1 === s2;
      correct = sgnName(s1 * s2); opp = sgnName(-s1 * s2);
      a = `כלל הסימנים בחילוק: ${same ? 'סימנים זהים → מנה חיובית' : 'סימנים שונים → מנה שלילית'}.`;
      q = `מהו סימן המנה של מספר ${sgnName(s1)} חלקי מספר ${sgnName(s2)}?`;
    } else {
      const s1 = pick([1, -1]), s2 = pick([1, -1]), same = s1 === s2;
      correct = sgnName(s1 * s2); opp = sgnName(-s1 * s2);
      a = `כלל הסימנים בכפל: ${same ? 'סימנים זהים → תוצאה חיובית' : 'סימנים שונים → תוצאה שלילית'}.`;
      q = `מהו סימן המכפלה של מספר ${sgnName(s1)} ומספר ${sgnName(s2)}?`;
    }
    if (qtype === 'tf') { q = q.replace('מהו סימן', 'הסימן').replace('?', '') + ` הוא ${tfTrue ? correct : opp}.`; a = (tfTrue ? 'נכון. ' : 'שגוי. ') + a; }
    else if (qtype === 'mcq') { cs = ch([{ text: correct, correct: true }, { text: opp, correct: false }, { text: 'אפס', correct: false }, { text: 'תלוי בגודל', correct: false }]); }
    else if (qtype === 'mistake') { q = q.replace('?', '') + ` תלמיד ענה "${opp}".`; a = `הטעות: ` + a; }
    return render(qtype, q, a, '', cs, isTrue, fam);
  }

  const MAP = {
    'G8-05-ENGINE': { fn: genG805, title: 'זווית מרכזית וגזרה', g: 8, d: 'geometry', cls: 'geo' },
    'G8-07-ENGINE': { fn: genG807, title: 'חפיפת משולשים לפי סימונים', g: 8, d: 'geometry', cls: 'geo' },
    'G8-09-ENGINE': { fn: genG809, title: 'דמיון וצללים', g: 8, d: 'geometry', cls: 'geo' },
    'G7-06-ENGINE': { fn: genG706, title: 'שטח צורה מורכבת', g: 7, d: 'geometry', cls: 'geo' },
    'G7-05-ENGINE': { fn: genG705, title: 'הזזות ושיקופים', g: 7, d: 'geometry', cls: 'geo' },
    'N7-10-ENGINE': { fn: genN710, title: 'טעויות בחיבור וחיסור מכוונים', g: 7, d: 'numeric', cls: 'num' },
    'N7-11-ENGINE': { fn: genN711, title: 'חיבור וחיסור מכוונים בהקשר', g: 7, d: 'numeric', cls: 'num' },
    'N7-12-ENGINE': { fn: genN712, title: 'טעויות בכפל וחילוק מכוונים', g: 7, d: 'numeric', cls: 'num' },
    'N7-13-ENGINE': { fn: genN713, title: 'כללי סימנים בכפל וחילוק', g: 7, d: 'numeric', cls: 'num' }
  };
  const IDS = Object.keys(MAP);
  const FILE = { geometry: '04_grade-8_geometry_curriculum.pdf', numeric: '05_grade-7_numeric_domain_curriculum.pdf' };
  const GFILE = { 'G7-06-ENGINE': '03_grade-7_pre_deductive_geometry_curriculum.pdf', 'G7-05-ENGINE': '03_grade-7_pre_deductive_geometry_curriculum.pdf' };
  const SKILL = { 'G8-05-ENGINE': 'central_angle_and_sector', 'G8-07-ENGINE': 'triangle_congruence_markings', 'G8-09-ENGINE': 'similarity_and_shadows', 'G7-06-ENGINE': 'composite_area', 'G7-05-ENGINE': 'transformations', 'N7-10-ENGINE': 'directed_add_sub_mistake_analysis', 'N7-11-ENGINE': 'directed_add_sub_context', 'N7-12-ENGINE': 'directed_mul_div_mistake_analysis', 'N7-13-ENGINE': 'directed_mul_div_sign_rules' };
  if (typeof E.defineSource === 'function') {
    IDS.forEach(id => { const m = MAP[id], base = id.replace(/-ENGINE$/, ''); E.defineSource(id, { sourceFile: GFILE[id] || FILE[m.d], sourceId: base, patternId: base + '-' + SKILL[id], grade: m.g, domain: m.d, skill: SKILL[id], curriculumArea: m.d + ' / grade ' + m.g, cognitiveDemand: 'standard' }); });
  }
  function asExercise(id, diff, qtype) { const m = MAP[id]; if (!m) return null; const r = m.fn(diff || 'standard', qtype || 'open'); const cl = r.questionHTML && r.questionHTML.match(/mcq-choice mcq-correct"><span class="mcq-label">([^<]+)\./); return { id: id, title: m.title, qtype: qtype || 'open', gradeTag: m.g === 8 ? 'כיתה ח׳' : 'כיתה ז׳', domainTag: m.cls === 'geo' ? 'גאומטריה' : 'מספרי', cls: m.cls, questionHTML: r.questionHTML, answerHTML: r.answerHTML, correctLabel: cl ? cl[1] : null, questionFamily: r.questionFamily || null }; }
  IDS.forEach(id => { const m = MAP[id]; topicReg(m.g, m.d, id, m.title + ' ✦ מנוע מקור'); });
  if (Array.isArray(E.ENGINE_TOPIC_IDS)) IDS.forEach(id => { if (E.ENGINE_TOPIC_IDS.indexOf(id) < 0) E.ENGINE_TOPIC_IDS.push(id); });
  const oldIs = E.isEngineTopic; E.isEngineTopic = function (id) { return IDS.indexOf(id) >= 0 || (typeof oldIs === 'function' && oldIs(id)); };
  const oldGet = E.getEngineExercise; E.getEngineExercise = function (id, diff, qtype, opts) { return asExercise(id, diff, qtype, opts) || (typeof oldGet === 'function' ? oldGet(id, diff, qtype, opts) : null); };
  if (typeof generators !== 'undefined') {
    IDS.forEach(id => { const m = MAP[id]; generators[id] = function () { const d = (document.getElementById('selDiff') && document.getElementById('selDiff').value) || 'standard', q = (document.getElementById('selQType') && document.getElementById('selQType').value) || 'open'; E.renderEngineCard(id, m.title, m.fn(d, q)); }; });
  }
  if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('DOMContentLoaded', function () { if (typeof onDomain === 'function') onDomain(); });
})();
