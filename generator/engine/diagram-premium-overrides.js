(function(){
  const E = window.TargilimEngine = window.TargilimEngine || {};
  const P = {
    fill: '#f8fafc',
    fill2: '#ffffff',
    stroke: '#334155',
    helper: '#94a3b8',
    given: '#1d4ed8',
    unknown: '#dc2626',
    label: '#0f172a',
    soft: '#e2e8f0'
  };

  function pick(xs){
    return E.pick ? E.pick(xs) : xs[Math.floor(Math.random() * xs.length)];
  }

  function finite(x, fallback){
    return Number.isFinite(Number(x)) ? Number(x) : fallback;
  }

  function esc(v){
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  function pt(x,y){ return {x:x,y:y}; }
  function add(a,b){ return pt(a.x+b.x,a.y+b.y); }
  function sub(a,b){ return pt(a.x-b.x,a.y-b.y); }
  function mul(a,k){ return pt(a.x*k,a.y*k); }
  function mid(a,b){ return pt((a.x+b.x)/2,(a.y+b.y)/2); }
  function len(v){ return Math.sqrt(v.x*v.x + v.y*v.y) || 1; }
  function unit(v){ const d=len(v); return pt(v.x/d,v.y/d); }
  function centroid(vs){ return pt(vs.reduce((s,p)=>s+p.x,0)/vs.length, vs.reduce((s,p)=>s+p.y,0)/vs.length); }
  function fmt(n){ return Number(n).toFixed(1); }

  function awayNormal(a,b,c){
    const m = mid(a,b);
    const u = unit(sub(b,a));
    let n = pt(-u.y,u.x);
    const toC = sub(c,m);
    if(n.x*toC.x + n.y*toC.y > 0) n = mul(n,-1);
    return n;
  }

  function labelBox(x,y,text,color,opts){
    opts = opts || {};
    const s = String(text);
    const w = Math.max(opts.w || 0, 18 + s.length * 7.2);
    const h = opts.h || 23;
    const bg = opts.bg || 'rgba(255,255,255,0.92)';
    const weight = opts.weight || 800;
    const size = opts.size || 13;
    const rot = opts.rotate ? ` transform="rotate(${opts.rotate} ${fmt(x)} ${fmt(y)})"` : '';
    return `<g${rot}>
      <rect x="${fmt(x-w/2)}" y="${fmt(y-h/2)}" width="${fmt(w)}" height="${fmt(h)}" rx="8" fill="${bg}" stroke="#e2e8f0" stroke-width="0.8"/>
      <text x="${fmt(x)}" y="${fmt(y+1)}" fill="${color}" font-size="${size}" font-weight="${weight}" text-anchor="middle" dominant-baseline="middle">${esc(text)}</text>
    </g>`;
  }

  function plainText(x,y,text,color,size,weight){
    return `<text x="${fmt(x)}" y="${fmt(y)}" fill="${color}" font-size="${size||13}" font-weight="${weight||700}" text-anchor="middle" dominant-baseline="middle">${esc(text)}</text>`;
  }

  function segmentLabel(a,b,c,text,color,shift,rotate){
    const m = mid(a,b);
    const n = awayNormal(a,b,c);
    const p = add(m, mul(n, shift || 24));
    let deg = Math.atan2(b.y-a.y,b.x-a.x) * 180 / Math.PI;
    if(deg > 90) deg -= 180;
    if(deg < -90) deg += 180;
    return labelBox(p.x,p.y,text,color,{rotate: rotate ? Math.round(deg) : 0});
  }

  function fitPoints(points,W,H,pad){
    const xs = points.map(p=>p.x), ys = points.map(p=>p.y);
    const minx = Math.min.apply(null,xs), maxx = Math.max.apply(null,xs);
    const miny = Math.min.apply(null,ys), maxy = Math.max.apply(null,ys);
    const scale = Math.min((W - 2*pad) / (maxx-minx || 1), (H - 2*pad) / (maxy-miny || 1));
    const ox = (W - (maxx-minx)*scale) / 2;
    const oy = (H - (maxy-miny)*scale) / 2;
    return points.map(p => pt(ox + (p.x-minx)*scale, oy + (p.y-miny)*scale));
  }

  function distPointToSegment(p, a, b){
    const ab = sub(b,a);
    const ap = sub(p,a);
    const t = Math.max(0, Math.min(1, (ap.x*ab.x + ap.y*ab.y) / ((ab.x*ab.x + ab.y*ab.y) || 1)));
    const q = add(a, mul(ab,t));
    return len(sub(p,q));
  }

  function insideBox(p,W,H,pad){
    return p.x >= pad && p.x <= W-pad && p.y >= pad && p.y <= H-pad;
  }

  function minPairDistance(points){
    let m = 9999;
    for(let i=0;i<points.length;i++){
      for(let j=i+1;j<points.length;j++){
        m = Math.min(m, len(sub(points[i],points[j])));
      }
    }
    return m;
  }

  function scoreTriangleLayout(V, labelPts, letterPts, W, H){
    const edges = [[V[0],V[1]],[V[1],V[2]],[V[2],V[0]]];
    let score = 1000;

    labelPts.forEach(p => {
      if(!insideBox(p,W,H,24)) score -= 160;
      edges.forEach(e => {
        const d = distPointToSegment(p,e[0],e[1]);
        if(d < 12) score -= (12-d) * 18;
      });
    });

    letterPts.forEach(p => {
      if(!insideBox(p,W,H,18)) score -= 140;
      edges.forEach(e => {
        const d = distPointToSegment(p,e[0],e[1]);
        if(d < 10) score -= (10-d) * 12;
      });
    });

    const spread = minPairDistance(labelPts.concat(letterPts));
    if(spread < 20) score -= (20-spread) * 8;

    const xs = V.map(p=>p.x), ys = V.map(p=>p.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    if(width < 105) score -= 80;
    if(height < 80) score -= 80;

    return score;
  }

  function plainHaloText(x,y,text,color,size,weight){
    return `<text x="${fmt(x)}" y="${fmt(y)}"
      fill="${color}"
      font-size="${size || 14}"
      font-weight="${weight || 800}"
      text-anchor="middle"
      dominant-baseline="middle"
      style="paint-order:stroke;stroke:#ffffff;stroke-width:4.8px;stroke-linejoin:round">${esc(text)}</text>`;
  }
  function svgFrame(W,H,body,accessibleName){
    return `<svg class="engine-svg premium-geo-svg"
      viewBox="0 0 ${W} ${H}"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="${esc(accessibleName)}"
      shape-rendering="geometricPrecision"
      text-rendering="geometricPrecision">
      <defs>
        <filter id="premiumGeoShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" flood-color="#0f172a" flood-opacity="0.12"/>
        </filter>
      </defs>
      <rect x="2" y="2" width="${W-4}" height="${H-4}" rx="18" fill="#ffffff" opacity="0.01"/>
      <g vector-effect="non-scaling-stroke">
        ${body}
      </g>
    </svg>`;
  };



  E.triangleAnglesSvg = function(p, unknown, geom){
    const W = 390, H = 280, PAD = 66;

    function buildCandidate(seed){
      let gA = finite(geom && geom.A != null ? geom.A : p.A, 60);
      let gB = finite(geom && geom.B != null ? geom.B : p.B, 60);
      let gC = finite(geom && geom.C != null ? geom.C : p.C, 60);

      const s = gA + gB + gC;
      if(s > 0 && Math.abs(s - 180) > 0.001){
        gA = gA * 180 / s;
        gB = gB * 180 / s;
        gC = gC * 180 / s;
      }

      gB = Math.max(20, Math.min(130, gB));
      gC = Math.max(20, Math.min(130, gC));
      gA = 180 - gB - gC;
      if(gA < 20){
        const d = (20-gA)/2;
        gB -= d;
        gC -= d;
        gA = 20;
      }

      const rB = gB * Math.PI / 180;
      const rC = gC * Math.PI / 180;
      const ax = Math.tan(rC) / (Math.tan(rB) + Math.tan(rC));
      const ay = ax * Math.tan(rB);

      let model = [pt(ax, -ay), pt(0,0), pt(1,0)];
      const stretches = [0.92, 0.98, 1.04, 1.11, 1.17];
      const rotations = [-14,-9,-5,0,5,9,14];
      const stretch = stretches[seed % stretches.length];
      const rot = rotations[(seed * 3) % rotations.length] * Math.PI / 180;

      model = model.map(q => pt(q.x * stretch, q.y));

      if(seed % 2 === 1) model = model.map(q => pt(1.16-q.x, q.y));
      if(seed % 5 === 2) model = model.map(q => pt(q.x, -q.y));

      model = model.map(q => pt(
        q.x * Math.cos(rot) - q.y * Math.sin(rot),
        q.x * Math.sin(rot) + q.y * Math.cos(rot)
      ));

      const V = fitPoints(model, W, H, PAD);
      const CEN = centroid(V);
      const names = ['A','B','C'];
      const display = [p.A,p.B,p.C];
      const degs = [gA,gB,gC];

      const labelPts = [];
      const letterPts = [];
      const data = [];

      for(let i=0;i<3;i++){
        const v = V[i];
        const o1 = V[(i+1)%3];
        const o2 = V[(i+2)%3];

        const u1 = unit(sub(o1,v));
        const u2 = unit(sub(o2,v));
        let bis = unit(add(u1,u2));
        if(!isFinite(bis.x) || !isFinite(bis.y)) {
          bis = unit(pt(-(o1.y-v.y), o1.x-v.x));
        }

        const isUnknown = unknown === names[i];
        const baseDist =
          degs[i] < 32 ? 57 :
          degs[i] < 45 ? 51 :
          degs[i] < 65 ? 44 :
          degs[i] < 95 ? 38 : 33;

        const lp = add(v, mul(bis, isUnknown ? baseDist + 4 : baseDist));
        const outward = unit(sub(v, CEN));
        const vp = add(v, mul(outward, 31));

        labelPts.push(lp);
        letterPts.push(vp);
        data.push({v,o1,o2,bis,lp,vp,name:names[i],deg:degs[i],value:display[i],unknown:isUnknown});
      }

      return {
        V,
        CEN,
        data,
        score: scoreTriangleLayout(V, labelPts, letterPts, W, H)
      };
    }

    let best = null;
    for(let seed=0; seed<72; seed++){
      const c = buildCandidate(seed);
      if(!best || c.score > best.score) best = c;
    }

    const V = best.V;
    let arcs = '';
    let labels = '';
    let letters = '';
    let dots = '';

    best.data.forEach(d => {
      const color = d.unknown ? P.unknown : P.given;
      const txt = d.value == null ? '?' : d.value + '°';

      arcs += angleArc(d.v, d.o1, d.o2, d.unknown ? 28 : 23, color);

      labels += plainHaloText(
        d.lp.x,
        d.lp.y,
        txt,
        color,
        d.unknown ? 16 : 14,
        d.unknown ? 900 : 800
      );

      letters += plainHaloText(
        d.vp.x,
        d.vp.y,
        d.name,
        P.label,
        16,
        850
      );

      dots += `<circle cx="${fmt(d.v.x)}" cy="${fmt(d.v.y)}" r="2.2" fill="${P.stroke}"/>`;
    });

    const poly = V.map(q => `${fmt(q.x)},${fmt(q.y)}`).join(' ');

    return svgFrame(W,H,`
      <polygon points="${poly}"
        fill="${P.fill}"
        stroke="${P.stroke}"
        stroke-width="2.8"
        stroke-linejoin="round"
        filter="url(#premiumGeoShadow)"/>
      ${arcs}
      ${dots}
      ${labels}
      ${letters}
    `, 'משולש עם זוויות מסומנות');
  };

  E.rightTriangleSvg = function(params, unknown){
    const W = 390, H = 280, PAD = 66;

    function buildCandidate(seed){
      const aVal = finite(params.a, 8);
      const bVal = finite(params.b, 12);
      const h = Math.max(0.48, Math.min(1.22, aVal / Math.max(bVal,1)));

      let model = [pt(0,-h), pt(0,0), pt(1,0)]; // A,B,C; B is the right angle

      if(seed % 2 === 1) model = model.map(q => pt(1-q.x,q.y));
      if(seed % 4 === 2) model = model.map(q => pt(q.x,-q.y));

      const rotations = [-15,-10,-6,0,6,10,15];
      const stretch = [0.92, 1.0, 1.08, 1.16][seed % 4];
      const rot = rotations[(seed * 2) % rotations.length] * Math.PI / 180;

      model = model.map(q => pt(q.x * stretch, q.y));
      model = model.map(q => pt(
        q.x * Math.cos(rot) - q.y * Math.sin(rot),
        q.x * Math.sin(rot) + q.y * Math.cos(rot)
      ));

      const V = fitPoints(model,W,H,PAD);
      const CEN = centroid(V);
      const A = V[0], B = V[1], C = V[2];

      const labelPts = [
        add(mid(A,B),mul(awayNormal(A,B,CEN),31)),
        add(mid(B,C),mul(awayNormal(B,C,CEN),31)),
        add(mid(A,C),mul(awayNormal(A,C,CEN),34))
      ];

      const letterPts = [
        add(A,mul(unit(sub(A,CEN)),31)),
        add(B,mul(unit(sub(B,CEN)),31)),
        add(C,mul(unit(sub(C,CEN)),31))
      ];

      return {
        A,B,C,CEN,V,labelPts,letterPts,
        score: scoreTriangleLayout(V,labelPts,letterPts,W,H)
      };
    }

    let best = null;
    for(let seed=0; seed<72; seed++){
      const c = buildCandidate(seed);
      if(!best || c.score > best.score) best = c;
    }

    const {A,B,C,CEN,labelPts,letterPts} = best;

    const la = params.a == null ? '?' : params.a + ' ס״מ';
    const lb = params.b == null ? '?' : params.b + ' ס״מ';
    const lc = params.c == null ? '?' : params.c + ' ס״מ';

    const ca = unknown === 'a' ? P.unknown : P.given;
    const cb = unknown === 'b' ? P.unknown : P.given;
    const cc = unknown === 'c' ? P.unknown : P.given;

    const poly = `${fmt(A.x)},${fmt(A.y)} ${fmt(B.x)},${fmt(B.y)} ${fmt(C.x)},${fmt(C.y)}`;

    return svgFrame(W,H,`
      <polygon points="${poly}"
        fill="${P.fill}"
        stroke="${P.stroke}"
        stroke-width="2.8"
        stroke-linejoin="round"
        filter="url(#premiumGeoShadow)"/>
      ${rightMarker(B,A,C,P.stroke)}
      <circle cx="${fmt(A.x)}" cy="${fmt(A.y)}" r="2.2" fill="${P.stroke}"/>
      <circle cx="${fmt(B.x)}" cy="${fmt(B.y)}" r="2.2" fill="${P.stroke}"/>
      <circle cx="${fmt(C.x)}" cy="${fmt(C.y)}" r="2.2" fill="${P.stroke}"/>
      ${plainHaloText(labelPts[0].x,labelPts[0].y,la,ca,13,820)}
      ${plainHaloText(labelPts[1].x,labelPts[1].y,lb,cb,13,820)}
      ${plainHaloText(labelPts[2].x,labelPts[2].y,lc,cc,13,850)}
      ${plainHaloText(letterPts[0].x,letterPts[0].y,'A',P.label,16,850)}
      ${plainHaloText(letterPts[1].x,letterPts[1].y,'B',P.label,16,850)}
      ${plainHaloText(letterPts[2].x,letterPts[2].y,'C',P.label,16,850)}
    `, 'משולש ישר־זווית. צלע א: ' + la + ', צלע ב: ' + lb + ', היתר: ' + lc);
  };



  E.rectangleSvg = function(p, unknown){
    const W = 390, H = 260;
    const l = finite(p.l, 12);
    const w = finite(p.w, 6);
    const ratio = Math.max(0.34, Math.min(0.78, w / Math.max(l,1)));

    const rw = 238;
    const rh = Math.round(rw * ratio * 0.72);
    const x = Math.round((W-rw)/2);
    const y = Math.round((H-rh)/2);

    const A=pt(x,y), B=pt(x+rw,y), C=pt(x+rw,y+rh), D=pt(x,y+rh);
    const cL = unknown === 'l' ? P.unknown : P.given;
    const cW = unknown === 'w' ? P.unknown : P.given;
    const lText = unknown === 'l' ? '?' : l + ' ס״מ';
    const wText = unknown === 'w' ? '?' : w + ' ס״מ';

    return svgFrame(W,H,`
      <rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(rw)}" height="${fmt(rh)}" rx="8"
        fill="${P.fill}" stroke="${P.stroke}" stroke-width="2.8" filter="url(#premiumGeoShadow)"/>
      <line x1="${fmt(A.x)}" y1="${fmt(D.y+20)}" x2="${fmt(B.x)}" y2="${fmt(C.y+20)}" stroke="${P.helper}" stroke-width="1.5"/>
      <line x1="${fmt(A.x)}" y1="${fmt(D.y+13)}" x2="${fmt(A.x)}" y2="${fmt(D.y+27)}" stroke="${P.helper}" stroke-width="1.5"/>
      <line x1="${fmt(B.x)}" y1="${fmt(C.y+13)}" x2="${fmt(B.x)}" y2="${fmt(C.y+27)}" stroke="${P.helper}" stroke-width="1.5"/>
      <line x1="${fmt(D.x-22)}" y1="${fmt(A.y)}" x2="${fmt(D.x-22)}" y2="${fmt(D.y)}" stroke="${P.helper}" stroke-width="1.5"/>
      <line x1="${fmt(D.x-29)}" y1="${fmt(A.y)}" x2="${fmt(D.x-15)}" y2="${fmt(A.y)}" stroke="${P.helper}" stroke-width="1.5"/>
      <line x1="${fmt(D.x-29)}" y1="${fmt(D.y)}" x2="${fmt(D.x-15)}" y2="${fmt(D.y)}" stroke="${P.helper}" stroke-width="1.5"/>
      ${plainHaloText((A.x+B.x)/2, C.y+20, lText, cL, 13, 830)}
      ${plainHaloText(D.x-22, (A.y+D.y)/2, wText, cW, 13, 830)}
    `, 'מלבן. אורך: ' + lText + ', רוחב: ' + wText);
  };



  E.circleSvg = function(p, unknown){
    const W = 370, H = 260, cx = 185, cy = 124, R = 76;
    const mode = p.mode || (p.d != null ? 'd' : 'r');
    const color = (unknown === 'r' || unknown === 'd') ? P.unknown : P.given;

    const degs = [-38, -18, 0, 28, 142, 205];
    const deg = degs[Math.abs((p.r || p.d || 1)) % degs.length] * Math.PI / 180;

    const ex = pt(cx + R*Math.cos(deg), cy + R*Math.sin(deg));
    const ox = pt(cx - R*Math.cos(deg), cy - R*Math.sin(deg));

    const labelBase = mode === 'd' ? pt(cx, cy - 24) : mid(pt(cx,cy), ex);
    const labelShift = pt(-Math.sin(deg)*20, Math.cos(deg)*20);

    const value = mode === 'd'
      ? (p.d == null ? '?' : p.d + ' ס״מ')
      : (p.r == null ? '?' : p.r + ' ס״מ');

    return svgFrame(W,H,`
      <circle cx="${cx}" cy="${cy}" r="${R}"
        fill="${P.fill}"
        stroke="${P.stroke}"
        stroke-width="2.8"
        filter="url(#premiumGeoShadow)"/>
      <circle cx="${cx}" cy="${cy}" r="3.4" fill="${P.stroke}"/>
      ${mode === 'd'
        ? `<line x1="${fmt(ox.x)}" y1="${fmt(ox.y)}" x2="${fmt(ex.x)}" y2="${fmt(ex.y)}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`
        : `<line x1="${cx}" y1="${cy}" x2="${fmt(ex.x)}" y2="${fmt(ex.y)}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`
      }
      <circle cx="${fmt(ex.x)}" cy="${fmt(ex.y)}" r="4" fill="${color}"/>
      ${mode === 'd' ? `<circle cx="${fmt(ox.x)}" cy="${fmt(ox.y)}" r="4" fill="${color}"/>` : ''}
      ${plainHaloText(labelBase.x + labelShift.x, labelBase.y + labelShift.y, value, color, 13, 850)}
    `, 'מעגל. ' + (mode === 'd' ? 'קוטר: ' : 'רדיוס: ') + value);
  };

})();
