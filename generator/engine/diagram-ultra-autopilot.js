(function(){
  const E = window.TargilimEngine = window.TargilimEngine || {};

  const U = {
    fill: '#f8fafc',
    stroke: '#1f2937',
    helper: '#64748b',
    given: '#1d4ed8',
    unknown: '#dc2626',
    label: '#020617'
  };

  function esc(v){
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }
  function n(v,f){ const x=Number(v); return Number.isFinite(x)?x:f; }
  function p(x,y){ return {x,y}; }
  function add(a,b){ return p(a.x+b.x,a.y+b.y); }
  function sub(a,b){ return p(a.x-b.x,a.y-b.y); }
  function mul(a,k){ return p(a.x*k,a.y*k); }
  function mid(a,b){ return p((a.x+b.x)/2,(a.y+b.y)/2); }
  function len(v){ return Math.hypot(v.x,v.y)||1; }
  function unit(v){ const d=len(v); return p(v.x/d,v.y/d); }
  function fmt(x){ return Number(x).toFixed(1); }
  function centroid(vs){ return p(vs.reduce((s,q)=>s+q.x,0)/vs.length, vs.reduce((s,q)=>s+q.y,0)/vs.length); }
  function hash(vals){ return Math.abs(vals.reduce((a,v)=>((a*31 + Math.round(n(v,0)*19))|0), 11)); }

  function fit(points,W,H,pad){
    const xs=points.map(q=>q.x), ys=points.map(q=>q.y);
    const minx=Math.min(...xs), maxx=Math.max(...xs), miny=Math.min(...ys), maxy=Math.max(...ys);
    const s=Math.min((W-2*pad)/(maxx-minx||1),(H-2*pad)/(maxy-miny||1));
    const ox=(W-(maxx-minx)*s)/2, oy=(H-(maxy-miny)*s)/2;
    return points.map(q=>p(ox+(q.x-minx)*s, oy+(q.y-miny)*s));
  }

  function dPointSeg(q,a,b){
    const ab=sub(b,a), aq=sub(q,a);
    const t=Math.max(0,Math.min(1,(aq.x*ab.x+aq.y*ab.y)/((ab.x*ab.x+ab.y*ab.y)||1)));
    return len(sub(q,add(a,mul(ab,t))));
  }
  function inside(q,W,H,pad){ return q.x>=pad && q.x<=W-pad && q.y>=pad && q.y<=H-pad; }
  function pairMin(points){
    let m=9999;
    for(let i=0;i<points.length;i++) for(let j=i+1;j<points.length;j++) m=Math.min(m,len(sub(points[i],points[j])));
    return m;
  }
  function normalAway(a,b,c){
    const m=mid(a,b), u=unit(sub(b,a));
    let v=p(-u.y,u.x);
    if(v.x*(c.x-m.x)+v.y*(c.y-m.y)>0) v=mul(v,-1);
    return v;
  }
  function score(V, labels, letters, W, H){
    const edges=[[V[0],V[1]],[V[1],V[2]],[V[2],V[0]]];
    let s=10000;
    for(const q of labels){
      if(!inside(q,W,H,28)) s-=900;
      for(const e of edges){ const d=dPointSeg(q,e[0],e[1]); if(d<16) s-=(16-d)*70; }
    }
    for(const q of letters){
      if(!inside(q,W,H,20)) s-=650;
      for(const e of edges){ const d=dPointSeg(q,e[0],e[1]); if(d<12) s-=(12-d)*40; }
    }
    const spread=pairMin(labels.concat(letters));
    if(spread<24) s-=(24-spread)*45;
    const xs=V.map(q=>q.x), ys=V.map(q=>q.y);
    if(Math.max(...xs)-Math.min(...xs)<130) s-=350;
    if(Math.max(...ys)-Math.min(...ys)<95) s-=350;
    return s;
  }
  function choose(cands,key){ cands.sort((a,b)=>b.score-a.score); return cands[key % Math.min(12,cands.length)]; }
  function svg(W,H,body,accessibleName){
    return `<svg class="engine-svg ultra-geo-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(accessibleName)}" shape-rendering="geometricPrecision" text-rendering="geometricPrecision"><defs><filter id="ultraGeoShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.2" stdDeviation="1.1" flood-color="#0f172a" flood-opacity="0.13"/></filter></defs><g vector-effect="non-scaling-stroke">${body}</g></svg>`;
  }
  function halo(x,y,text,color,size=14,weight=850){
    return `<text x="${fmt(x)}" y="${fmt(y)}" fill="${color}" font-size="${size}" font-weight="${weight}" text-anchor="middle" dominant-baseline="middle" style="paint-order:stroke;stroke:#fff;stroke-width:5px;stroke-linejoin:round">${esc(text)}</text>`;
  }
  function arc(v,o1,o2,r,color){
    const u1=unit(sub(o1,v)), u2=unit(sub(o2,v));
    const a=add(v,mul(u1,r)), b=add(v,mul(u2,r));
    const cross=u1.x*u2.y-u1.y*u2.x;
    return `<path d="M ${fmt(a.x)} ${fmt(a.y)} A ${r} ${r} 0 0 ${cross>0?1:0} ${fmt(b.x)} ${fmt(b.y)}" fill="none" stroke="${color}" stroke-width="2.15" stroke-linecap="round"/>`;
  }
  function rightMark(v,o1,o2){
    const u1=unit(sub(o1,v)), u2=unit(sub(o2,v)), d=19;
    const p1=add(v,mul(u1,d)), p2=add(p1,mul(u2,d)), p3=add(v,mul(u2,d));
    return `<polyline points="${fmt(p1.x)},${fmt(p1.y)} ${fmt(p2.x)},${fmt(p2.y)} ${fmt(p3.x)},${fmt(p3.y)}" fill="none" stroke="${U.stroke}" stroke-width="2" stroke-linejoin="round"/>`;
  }

  E.triangleAnglesSvg = function(values, unknown, geom){
    const W=410,H=300,PAD=72;
    function build(seed){
      let A=n(geom&&geom.A!=null?geom.A:values.A,60), B=n(geom&&geom.B!=null?geom.B:values.B,60), C=n(geom&&geom.C!=null?geom.C:values.C,60);
      const sum=A+B+C; if(sum>0 && Math.abs(sum-180)>0.001){ A=A*180/sum; B=B*180/sum; C=C*180/sum; }
      B=Math.max(20,Math.min(130,B)); C=Math.max(20,Math.min(130,C)); A=180-B-C;
      if(A<20){ const d=(20-A)/2; B-=d; C-=d; A=20; }
      const rB=B*Math.PI/180, rC=C*Math.PI/180;
      const ax=Math.tan(rC)/(Math.tan(rB)+Math.tan(rC)), ay=ax*Math.tan(rB);
      let m=[p(ax,-ay),p(0,0),p(1,0)];
      const stretch=[0.9,0.97,1.03,1.1,1.18][seed%5];
      const rot=[-16,-11,-7,-3,0,4,8,12,16][(seed*5)%9]*Math.PI/180;
      m=m.map(q=>p(q.x*stretch,q.y));
      if(seed%2===1) m=m.map(q=>p(1.18-q.x,q.y));
      if(seed%7===3) m=m.map(q=>p(q.x,-q.y));
      m=m.map(q=>p(q.x*Math.cos(rot)-q.y*Math.sin(rot), q.x*Math.sin(rot)+q.y*Math.cos(rot)));
      const V=fit(m,W,H,PAD), cen=centroid(V), names=['A','B','C'], disp=[values.A,values.B,values.C], deg=[A,B,C];
      const labelPts=[], letterPts=[], data=[];
      for(let i=0;i<3;i++){
        const v=V[i], o1=V[(i+1)%3], o2=V[(i+2)%3];
        const u1=unit(sub(o1,v)), u2=unit(sub(o2,v));
        let bis=unit(add(u1,u2)); if(!Number.isFinite(bis.x)||!Number.isFinite(bis.y)) bis=unit(p(-(o1.y-v.y),o1.x-v.x));
        const isU=unknown===names[i];
        const base=deg[i]<32?60:deg[i]<45?54:deg[i]<65?47:deg[i]<95?41:36;
        const lp=add(v,mul(bis,isU?base+5:base));
        const vp=add(v,mul(unit(sub(v,cen)),34));
        labelPts.push(lp); letterPts.push(vp); data.push({v,o1,o2,lp,vp,name:names[i],value:disp[i],unknown:isU});
      }
      return {V,data,score:score(V,labelPts,letterPts,W,H)};
    }
    const key=hash([values.A||0,values.B||0,values.C||0,geom&&geom.A||0,geom&&geom.B||0,geom&&geom.C||0]);
    const c=[]; for(let seed=0;seed<120;seed++) c.push(build(seed));
    const best=choose(c,key);
    let arcs='',labels='',letters='',dots='';
    best.data.forEach(d=>{
      const color=d.unknown?U.unknown:U.given;
      arcs+=arc(d.v,d.o1,d.o2,d.unknown?30:24,color);
      labels+=halo(d.lp.x,d.lp.y,d.value==null?'?':d.value+'°',color,d.unknown?16:14,d.unknown?900:850);
      letters+=halo(d.vp.x,d.vp.y,d.name,U.label,16,900);
      dots+=`<circle cx="${fmt(d.v.x)}" cy="${fmt(d.v.y)}" r="2.15" fill="${U.stroke}"/>`;
    });
    const poly=best.V.map(q=>`${fmt(q.x)},${fmt(q.y)}`).join(' ');
    return svg(W,H,`<polygon points="${poly}" fill="${U.fill}" stroke="${U.stroke}" stroke-width="2.9" stroke-linejoin="round" filter="url(#ultraGeoShadow)"/>${arcs}${dots}${labels}${letters}`, 'משולש עם זוויות מסומנות');
  };

  E.rightTriangleSvg = function(params, unknown){
    const W=410,H=300,PAD=72;
    function build(seed){
      const av=n(params.a,8), bv=n(params.b,12), h=Math.max(0.48,Math.min(1.25,av/Math.max(bv,1)));
      let m=[p(0,-h),p(0,0),p(1,0)];
      const stretch=[0.92,1,1.08,1.16][seed%4], rot=[-17,-11,-6,0,6,11,17][(seed*3)%7]*Math.PI/180;
      m=m.map(q=>p(q.x*stretch,q.y)); if(seed%2===1) m=m.map(q=>p(1-q.x,q.y)); if(seed%5===2) m=m.map(q=>p(q.x,-q.y));
      m=m.map(q=>p(q.x*Math.cos(rot)-q.y*Math.sin(rot),q.x*Math.sin(rot)+q.y*Math.cos(rot)));
      const V=fit(m,W,H,PAD), A=V[0],B=V[1],C=V[2],cen=centroid(V);
      const labels=[add(mid(A,B),mul(normalAway(A,B,cen),34)),add(mid(B,C),mul(normalAway(B,C,cen),34)),add(mid(A,C),mul(normalAway(A,C,cen),38))];
      const letters=[add(A,mul(unit(sub(A,cen)),34)),add(B,mul(unit(sub(B,cen)),34)),add(C,mul(unit(sub(C,cen)),34))];
      return {A,B,C,V,labels,letters,score:score(V,labels,letters,W,H)};
    }
    const key=hash([params.a||0,params.b||0,params.c||0]); const c=[]; for(let seed=0;seed<120;seed++) c.push(build(seed));
    const b=choose(c,key), A=b.A,B=b.B,C=b.C;
    const texts=[params.a==null?'?':params.a+' ס״מ', params.b==null?'?':params.b+' ס״מ', params.c==null?'?':params.c+' ס״מ'];
    const cols=[unknown==='a'?U.unknown:U.given, unknown==='b'?U.unknown:U.given, unknown==='c'?U.unknown:U.given];
    const poly=`${fmt(A.x)},${fmt(A.y)} ${fmt(B.x)},${fmt(B.y)} ${fmt(C.x)},${fmt(C.y)}`;
    return svg(W,H,`<polygon points="${poly}" fill="${U.fill}" stroke="${U.stroke}" stroke-width="2.9" stroke-linejoin="round" filter="url(#ultraGeoShadow)"/>${rightMark(B,A,C)}<circle cx="${fmt(A.x)}" cy="${fmt(A.y)}" r="2.15" fill="${U.stroke}"/><circle cx="${fmt(B.x)}" cy="${fmt(B.y)}" r="2.15" fill="${U.stroke}"/><circle cx="${fmt(C.x)}" cy="${fmt(C.y)}" r="2.15" fill="${U.stroke}"/>${halo(b.labels[0].x,b.labels[0].y,texts[0],cols[0],13,850)}${halo(b.labels[1].x,b.labels[1].y,texts[1],cols[1],13,850)}${halo(b.labels[2].x,b.labels[2].y,texts[2],cols[2],13,900)}${halo(b.letters[0].x,b.letters[0].y,'A',U.label,16,900)}${halo(b.letters[1].x,b.letters[1].y,'B',U.label,16,900)}${halo(b.letters[2].x,b.letters[2].y,'C',U.label,16,900)}`, 'משולש ישר־זווית עם צלעות מסומנות');
  };

  E.rectangleSvg = function(r, unknown){
    const W=410,H=280,l=n(r.l,12),w=n(r.w,6),ratio=Math.max(0.34,Math.min(0.78,w/Math.max(l,1)));
    const rw=260,rh=Math.round(rw*ratio*0.72),x=(W-rw)/2,y=(H-rh)/2;
    const cL=unknown==='l'?U.unknown:U.given, cW=unknown==='w'?U.unknown:U.given;
    return svg(W,H,`<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(rw)}" height="${fmt(rh)}" rx="8" fill="${U.fill}" stroke="${U.stroke}" stroke-width="2.9" filter="url(#ultraGeoShadow)"/><line x1="${fmt(x)}" y1="${fmt(y+rh+22)}" x2="${fmt(x+rw)}" y2="${fmt(y+rh+22)}" stroke="${U.helper}" stroke-width="1.5"/><line x1="${fmt(x-24)}" y1="${fmt(y)}" x2="${fmt(x-24)}" y2="${fmt(y+rh)}" stroke="${U.helper}" stroke-width="1.5"/>${halo(x+rw/2,y+rh+22,unknown==='l'?'?':l+' ס״מ',cL,13,850)}${halo(x-24,y+rh/2,unknown==='w'?'?':w+' ס״מ',cW,13,850)}`, 'מלבן עם אורך ורוחב מסומנים');
  };

  E.circleSvg = function(c, unknown){
    const W=390,H=280,cx=195,cy=132,R=82,mode=c.mode||(c.d!=null?'d':'r'), color=(unknown==='r'||unknown==='d')?U.unknown:U.given;
    const deg=[-42,-20,0,27,144,205][Math.abs((c.r||c.d||1))%6]*Math.PI/180;
    const ex=p(cx+R*Math.cos(deg),cy+R*Math.sin(deg)), ox=p(cx-R*Math.cos(deg),cy-R*Math.sin(deg));
    const base=mode==='d'?p(cx,cy-27):mid(p(cx,cy),ex), shift=p(-Math.sin(deg)*22,Math.cos(deg)*22);
    const value=mode==='d'?(c.d==null?'?':c.d+' ס״מ'):(c.r==null?'?':c.r+' ס״מ');
    return svg(W,H,`<circle cx="${cx}" cy="${cy}" r="${R}" fill="${U.fill}" stroke="${U.stroke}" stroke-width="2.9" filter="url(#ultraGeoShadow)"/><circle cx="${cx}" cy="${cy}" r="3.4" fill="${U.stroke}"/>${mode==='d'?`<line x1="${fmt(ox.x)}" y1="${fmt(ox.y)}" x2="${fmt(ex.x)}" y2="${fmt(ex.y)}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`:`<line x1="${cx}" y1="${cy}" x2="${fmt(ex.x)}" y2="${fmt(ex.y)}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`}<circle cx="${fmt(ex.x)}" cy="${fmt(ex.y)}" r="4" fill="${color}"/>${mode==='d'?`<circle cx="${fmt(ox.x)}" cy="${fmt(ox.y)}" r="4" fill="${color}"/>`:''}${halo(base.x+shift.x,base.y+shift.y,value,color,13,880)}`, 'מעגל עם רדיוס או קוטר מסומן');
  };
})();
