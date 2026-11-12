// generator/engine/source-fit-graphs.js
// Adds source-backed applied graph and bar-chart engines.
(function(){
  const E = window.TargilimEngine = window.TargilimEngine || {};
  const IDS = ['A8-01-ENGINE','U7-04-ENGINE'];
  const L = ['א','ב','ג','ד'];
  function pick(a){ return E.pick ? E.pick(a) : a[Math.floor(Math.random()*a.length)]; }
  function shuf(a){ return E.shuffle ? E.shuffle(a) : a.slice().sort(()=>Math.random()-0.5); }
  function tex(s){ return E.fmt && E.fmt.inline ? E.fmt.inline(s) : '$'+s+'$'; }
  function degC(v){ return tex(v + '^\\circ\\mathrm{C}'); }
  function choices(a){ return shuf(a).map((x,i)=>({label:L[i], text:x.text, correct:!!x.correct})); }
  function topic(g,d,id,label){ if(typeof TOPICS==='undefined'||!TOPICS[g]||!TOPICS[g][d]) return; if(!TOPICS[g][d].some(t=>t[0]===id)) TOPICS[g][d].push([id,label,1]); }

  function graphSvg(points,title,xLabel,yLabel,maxX,maxY){
    const T=E.themes&&E.themes.geometry?E.themes.geometry:{fill:'#eff6ff',stroke:'#2563eb',helper:'#93c5fd',given:'#1d4ed8',unknown:'#dc2626',label:'#334155'};
    const W=292,H=230,l=46,b=48,t=38,r=20;
    const xs=points.map(p=>p.x), ys=points.map(p=>p.y);
    let xMin=Math.min(0,...xs), xMax=Math.max(0,...xs, maxX||0);
    let yMin=Math.min(0,...ys), yMax=Math.max(0,...ys, maxY||0);
    if(xMin===xMax){ xMin-=1; xMax+=1; }
    if(yMin===yMax){ yMin-=1; yMax+=1; }
    function X(x){return l+(x-xMin)*(W-l-r)/(xMax-xMin);}
    function Y(y){return H-b-(y-yMin)*(H-b-t)/(yMax-yMin);}
    function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
    function fmt(v){return Math.abs(v-Math.round(v))<0.001 ? String(Math.round(v)) : String(Math.round(v*10)/10);}
    const axisY=clamp(X(0),l,W-r), axisX=clamp(Y(0),t,H-b);
    let grid='';
    for(let i=0;i<=4;i++){
      const xv=xMin+(xMax-xMin)*i/4, x=X(xv);
      const yv=yMin+(yMax-yMin)*i/4, y=Y(yv);
      grid+=`<line x1="${x}" y1="${t}" x2="${x}" y2="${H-b}" stroke="${T.helper}" opacity=".28"/>`;
      grid+=`<line x1="${l}" y1="${y}" x2="${W-r}" y2="${y}" stroke="${T.helper}" opacity=".35"/>`;
      grid+=`<text x="${x}" y="${H-24}" font-size="9.5" text-anchor="middle" fill="${T.label}">${fmt(xv)}</text>`;
      grid+=`<text x="${l-8}" y="${y+3}" font-size="9.5" text-anchor="end" fill="${T.label}">${fmt(yv)}</text>`;
    }
    const poly=points.map(p=>`${X(p.x)},${Y(p.y)}`).join(' ');
    const dots=points.map(p=>`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="4.5" fill="${T.stroke}" stroke="#fff" stroke-width="1.2"/>`).join('');
    return `<svg class="engine-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`+
      `<rect x="12" y="10" width="268" height="204" rx="8" fill="${T.fill}" stroke="${T.stroke}" stroke-width="1.8"/>`+
      `<text x="146" y="28" font-size="12" font-weight="800" text-anchor="middle" fill="${T.label}">${title}</text>`+
      grid+
      `<line x1="${l}" y1="${axisX}" x2="${W-r}" y2="${axisX}" stroke="${T.stroke}" stroke-width="2.2"/>`+
      `<line x1="${axisY}" y1="${t}" x2="${axisY}" y2="${H-b}" stroke="${T.stroke}" stroke-width="2.2"/>`+
      `<polyline points="${poly}" fill="none" stroke="${T.unknown}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${dots}`+
      `<text x="146" y="${H-7}" font-size="11" font-weight="800" text-anchor="middle" fill="${T.label}">${xLabel}</text>`+
      `<text x="22" y="28" font-size="11" font-weight="800" fill="${T.label}">${yLabel}</text></svg>`;
  }

  function barSvg(data,title){
    const T=E.themes&&E.themes.geometry?E.themes.geometry:{fill:'#eff6ff',stroke:'#2563eb',helper:'#93c5fd',given:'#1d4ed8',unknown:'#dc2626',label:'#334155'};
    const W=292,H=210,l=38,b=44,t=36,r=20,max=Math.max(...data.map(d=>d.v));
    const gap=11,bw=(W-l-r-gap*(data.length-1))/data.length;
    let grid='';
    for(let i=0;i<=4;i++){
      const y=H-b-i*(H-b-t)/4, v=Math.round(max*i/4);
      grid+=`<line x1="${l}" y1="${y}" x2="${W-r}" y2="${y}" stroke="${T.helper}" opacity=".28"/>`;
      grid+=`<text x="${l-7}" y="${y+3}" font-size="9.5" text-anchor="end" fill="${T.label}">${v}</text>`;
    }
    const bars=data.map((d,i)=>{ const h=Math.round((H-b-t)*d.v/max), x=l+i*(bw+gap), y=H-b-h; return `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="6" fill="${T.helper}" stroke="${T.stroke}"/><text x="${x+bw/2}" y="${y-6}" font-size="11" font-weight="800" text-anchor="middle" fill="${T.given}">${d.v}</text><text x="${x+bw/2}" y="${H-22}" font-size="11" font-weight="800" text-anchor="middle" fill="${T.label}">${d.k}</text>`; }).join('');
    return `<svg class="engine-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="10" width="268" height="186" rx="8" fill="${T.fill}" stroke="${T.stroke}" stroke-width="1.8"/><text x="146" y="31" fill="${T.label}" font-size="12" font-weight="800" text-anchor="middle">${title}</text>${grid}<line x1="${l}" y1="${H-b}" x2="${W-r}" y2="${H-b}" stroke="${T.stroke}" stroke-width="2"/><line x1="${l}" y1="${H-b}" x2="${l}" y2="${t}" stroke="${T.stroke}" stroke-width="2"/>${bars}<text x="146" y="205" font-size="10.5" font-weight="800" text-anchor="middle" fill="${T.label}">תרשים עמודות</text></svg>`;
  }

  function tableHtml(headers, rows){ return E.freqTableHtml ? E.freqTableHtml(headers, rows) : '<table><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table>'; }
  function combinedTableGraphSvg(rows,title){
    const pts=rows.map(r=>({x:r.x,y:r.y}));
    return graphSvg(pts,title,'x','y',Math.max(...pts.map(p=>p.x)),Math.max(...pts.map(p=>p.y)));
  }

  function pictogramSvg(data,title,key){
    const T=E.themes&&E.themes.geometry?E.themes.geometry:{fill:'#eff6ff',stroke:'#2563eb',helper:'#93c5fd',given:'#1d4ed8',unknown:'#dc2626',label:'#334155'};
    const W=292,H=218,rowH=34,startY=54,iconR=5.5;
    function icon(x,y,c){return `<circle cx="${x}" cy="${y}" r="${iconR}" fill="${c}" stroke="#fff" stroke-width="1"/><path d="M${x-4},${y+7} L${x+4},${y+7} L${x+2},${y+18} L${x-2},${y+18} Z" fill="${c}" stroke="#fff" stroke-width=".8"/>`;}
    const rows=data.map((d,i)=>{
      const y=startY+i*rowH, icons=Math.round(d.v/key);
      let body=`<text x="256" y="${y+5}" font-size="11" font-weight="800" text-anchor="end" fill="${T.label}">${d.k}</text>`;
      for(let j=0;j<icons;j++) body+=icon(48+j*18,y,T.given);
      return body+`<text x="30" y="${y+5}" font-size="10" font-weight="800" text-anchor="middle" fill="${T.label}">${d.v}</text>`;
    }).join('');
    return `<svg class="engine-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="10" width="268" height="196" rx="8" fill="${T.fill}" stroke="${T.stroke}" stroke-width="1.8"/><text x="146" y="30" fill="${T.label}" font-size="12" font-weight="800" text-anchor="middle">${title}</text>${rows}<text x="146" y="198" font-size="10.5" font-weight="800" text-anchor="middle" fill="${T.label}">מקרא: כל סמל = ${key}</text></svg>`;
  }

  // mapping diagram (קלט→פלט). violating=true draws one input with TWO arrows
  // (not a function); otherwise a clean one-to-one mapping (a function).
  function mappingSvg(violating){
    const T={fill:'#eff6ff',stroke:'#334155',given:'#1d4ed8',bad:'#dc2626',label:'#334155'};
    const lx=70, rx=210, ys=[55,100,145];
    function dot(x,y,c){return `<circle cx="${x}" cy="${y}" r="7" fill="${c}" stroke="${T.stroke}" stroke-width="1.2"/>`;}
    function arr(x1,y1,x2,y2,c){return `<line x1="${x1+9}" y1="${y1}" x2="${x2-9}" y2="${y2}" stroke="${c}" stroke-width="2.4" marker-end="url(#mh)"/>`;}
    let body=`<defs><marker id="mh" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="${violating?T.bad:T.given}"/></marker></defs>`;
    body+=`<ellipse cx="${lx}" cy="100" rx="40" ry="78" fill="#fff" stroke="${T.stroke}" stroke-width="1.6"/><ellipse cx="${rx}" cy="100" rx="40" ry="78" fill="#fff" stroke="${T.stroke}" stroke-width="1.6"/>`;
    body+=`<text x="${lx}" y="32" font-size="11.5" font-weight="800" text-anchor="middle" fill="${T.label}">קלט</text><text x="${rx}" y="32" font-size="11.5" font-weight="800" text-anchor="middle" fill="${T.label}">פלט</text>`;
    for(const y of ys){ body+=dot(lx,y,'#dbeafe'); body+=dot(rx,y,'#dbeafe'); }
    if(violating){ body+=arr(lx,ys[0],rx,ys[0],T.bad)+arr(lx,ys[0],rx,ys[1],T.bad)+arr(lx,ys[1],rx,ys[2],T.given)+arr(lx,ys[2],rx,ys[2],T.given);
      body+=`<text x="140" y="190" font-size="10.5" font-weight="800" text-anchor="middle" fill="${T.bad}">קלט אחד → שני פלטים (אינה פונקציה)</text>`; }
    else { body+=arr(lx,ys[0],rx,ys[0],T.given)+arr(lx,ys[1],rx,ys[1],T.given)+arr(lx,ys[2],rx,ys[2],T.given);
      body+=`<text x="140" y="190" font-size="10.5" font-weight="800" text-anchor="middle" fill="${T.given}">לכל קלט פלט אחד (פונקציה)</text>`; }
    return `<svg class="engine-svg" viewBox="0 0 280 205" xmlns="http://www.w3.org/2000/svg" style="paint-order:stroke">${body}</svg>`;
  }

  function genA801(diff,qtype){
    qtype=qtype==='mixed'?pick(['open','mcq','tf','mistake']):(qtype||'open');
    const family=diff==='basic'?pick(['fuel','table','function']):diff==='challenge'?pick(['heating','table','fuel','complete_table_graph']):pick(['fuel','heating','function','table','complete_table_graph']);
    const tfTrue=qtype==='tf'&&Math.random()<0.5;
    let q='',a='',svg='',cs=null,isTrue=true;
    if(family==='fuel'){
      const p=7, limit=63, x=9; svg=graphSvg([0,2,4,6,8,10].map(n=>({x:n,y:n*p})),'עלות דלק לפי ליטרים','ליטרים','₪',10,80);
      q=`מחיר ליטר דלק הוא ${p} ₪. לפי הגרף, עבור אילו כמויות העלות גדולה מ-${limit} ₪?`;
      a=`העלות היא ${tex('7x')}. פותרים ${tex('7x>63')} ולכן ${tex('x>9')}. כלומר יותר מ-9 ליטרים.`;
      cs=choices([{text:'יותר מ-9 ליטרים',correct:true},{text:'פחות מ-9 ליטרים',correct:false},{text:'בדיוק 7 ליטרים',correct:false},{text:'אי אפשר לדעת',correct:false}]);
      if(qtype==='tf'){ isTrue=tfTrue; q=tfTrue?'ב-10 ליטרים העלות גדולה מ-63 ₪.':'ב-10 ליטרים העלות עדיין קטנה מ-63 ₪.'; a=tfTrue?'נכון. 10 ליטרים עולים 70 ₪, וזה גדול מ-63 ₪.':'שגוי. 10 ליטרים עולים 70 ₪, וזה גדול מ-63 ₪.'; }
      if(qtype==='mistake'){q='תלמיד כתב: "אם 63 גדול מ-7, אז כל כמות מתאימה".'; a='הטעות: צריך לחשב עלות כוללת לפי מספר הליטרים, כלומר להכפיל 7 במספר הליטרים.';}
    } else if(family==='heating'){
      const start=8, rate=10, t=5; svg=graphSvg([0,1,2,3,4,5,6].map(n=>({x:n,y:start+rate*n})),'התחממות נוזל','דקות','°C',6,70);
      q=`נוזל התחיל בטמפרטורה ${degC(start)} ומתחמם בקצב אחיד של ${degC(rate)} לדקה. מה תהיה הטמפרטורה אחרי ${t} דקות?`;
      a=`הביטוי הוא ${tex(start+'+'+rate+'t')}. עבור ${tex('t='+t)} נקבל ${tex(start+'+'+rate+'\\cdot '+t+'='+(start+rate*t))}.`;
      cs=choices([{text:degC(start+rate*t),correct:true},{text:degC(rate*t),correct:false},{text:degC(start+t),correct:false},{text:degC(start+rate+t),correct:false}]);
      if(qtype==='tf'){ isTrue=tfTrue; q=tfTrue?`אחרי ${t} דקות הטמפרטורה היא ${degC(start+rate*t)}.`:`אחרי ${t} דקות הטמפרטורה היא ${degC(rate*t)}.`; a=tfTrue?`נכון. מתחילים מ-${degC(start)} ומוסיפים ${tex(rate+'\\cdot '+t)}: ${tex(start+'+'+(rate*t)+'='+(start+rate*t))}, כלומר ${degC(start+rate*t)}.`:`שגוי. שכחו להוסיף את הטמפרטורה ההתחלתית ${degC(start)}.`; }
      if(qtype==='mistake'){q=`תלמיד חישב ${tex(rate+'\\cdot '+t+'='+(rate*t))} והתעלם מהטמפרטורה ההתחלתית.`; a=`הטעות: הגרף לא מתחיל מאפס אלא מ-${degC(start)}. לכן מוסיפים את הערך ההתחלתי.`;}
    } else if(family==='table'){
      const rows=[-2,-1,0,1,2].map(x=>({x:x,y:3*x+4})); svg=graphSvg(rows,'ישר לפי טבלת ערכים','x','y',2,12);
      q='בטבלת ערכים של פונקציה קווית מתקבל הכלל '+tex('y=3x+4')+'. מהו הערך של y כאשר '+tex('x=2')+'?';
      a='מציבים '+tex('x=2')+': '+tex('y=3\\cdot2+4=10')+'.';
      cs=choices([{text:tex('10'),correct:true},{text:tex('6'),correct:false},{text:tex('9'),correct:false},{text:tex('12'),correct:false}]);
      if(qtype==='tf'){ isTrue=tfTrue; q='כאשר '+tex('x=2')+', הערך הוא '+tex(tfTrue?'y=10':'y=6')+'.'; a=(tfTrue?'נכון. ':'שגוי. ')+'מציבים בכלל המלא: '+tex('3\\cdot2+4=10')+'.'; }
      if(qtype==='mistake'){q='תלמיד הציב רק '+tex('3\\cdot2')+' וקיבל 6.'; a='הטעות: הוא שכח את האיבר החופשי +4.';}
    } else if(family==='complete_table_graph'){
      const m=2,b=10, xs=[-2,-1,0,1,2], rows=xs.map(x=>({x:x,y:m*x+b}));
      const partial=tableHtml(['x','−2','−1','0','1','2'], [['y',rows[0].y,'?',rows[2].y,'?','?']]);
      svg=combinedTableGraphSvg(rows,'השלמת טבלה וגרף');
      q=`לפניכם כלל של פונקציה קווית: ${tex('y=2x+10')}.\nא. השלימו את הטבלה.\nב. סמנו את הנקודות על הגרף.\nג. מהו השיפוע?`;
      a=`${partial}\nמציבים בכל פעם את ערך ${tex('x')} בכלל: ${tex('y=2x+10')}.\nהטבלה המלאה: ${tableHtml(['x','−2','−1','0','1','2'], [['y',6,8,10,12,14]])}\nהשיפוע הוא $2$, כי בכל עלייה של 1 ב-${tex('x')} הערך של ${tex('y')} גדל ב-2.`;
      cs=choices([{text:'הערכים החסרים הם 8, 12, 14 והשיפוע 2',correct:true},{text:'הערכים החסרים הם 6, 10, 12 והשיפוע 10',correct:false},{text:'הערכים החסרים הם 9, 11, 13 והשיפוע 1',correct:false},{text:'אי אפשר להשלים בלי גרף מוכן',correct:false}]);
      // multiple choice: one question (sub-items א/ב/ג would collide with the option letters)
      if(qtype==='mcq') q=`לפניכם כלל של פונקציה קווית: ${tex('y=2x+10')}, וטבלת ערכים חלקית.\nמהם הערכים החסרים בטבלה, ומהו השיפוע?`;
      if(qtype==='tf'){
        isTrue=tfTrue;
        q=tfTrue?'בטבלה של '+tex('y=2x+10')+', כאשר '+tex('x=-1')+' מתקבל '+tex('y=8')+' והשיפוע הוא 2.':'בטבלה של '+tex('y=2x+10')+', כאשר '+tex('x=-1')+' מתקבל '+tex('y=9')+' והשיפוע הוא 10.';
        a=(tfTrue?'נכון. ':'שגוי. ')+`מציבים: ${tex('2\\cdot(-1)+10=8')}. השיפוע הוא המקדם של ${tex('x')}, כלומר 2.`;
      }
      if(qtype==='mistake'){
        q=`תלמיד השלים את הטבלה של ${tex('y=2x+10')} כך: עבור ${tex('x=-1')} כתב ${tex('y=9')}, כי "מוסיפים 10 ואז מחסרים 1".`;
        a=`הטעות: קודם מכפילים את ${tex('x')} ב-2 ורק אחר כך מוסיפים 10. לכן ${tex('2\\cdot(-1)+10=8')}.`;
      }
    } else {
      // function-identification (source 02): always shows a mapping diagram
      let violating=true;
      q='האם ההתאמה "לכל תלמיד — שני הציונים האחרונים שלו במתמטיקה" היא פונקציה? נמקו.';
      a='לא. בפונקציה לכל קלט מתאים פלט אחד בלבד. כאן לכל תלמיד מתאימים שני ציונים, ולכן זו אינה פונקציה לפי ההגדרה.';
      cs=choices([{text:'לא, כי לכל תלמיד יש שני פלטים',correct:true},{text:'כן, כי לכל תלמיד יש שם אחד',correct:false},{text:'כן, כי יש ציונים',correct:false},{text:'אי אפשר לדעת',correct:false}]);
      if(qtype==='tf'){ isTrue=tfTrue; violating=!tfTrue; q=tfTrue?'ההתאמה "לכל תלמיד — תאריך הלידה שלו" היא פונקציה.':'ההתאמה "לכל תלמיד — שני הציונים האחרונים" היא פונקציה.'; a=tfTrue?'נכון. לכל תלמיד יש תאריך לידה אחד בלבד, ולכן זו פונקציה.':'שגוי. שני פלטים לאותו קלט מפרים את הגדרת הפונקציה.'; }
      if(qtype==='mistake'){q='תלמיד כתב: "זו פונקציה כי לכל תלמיד יש ציונים".'; a='הטעות: השאלה אינה אם יש ערכים, אלא האם לכל קלט יש ערך יחיד.';}
      svg=mappingSvg(violating);
    }
    if(qtype==='mcq') return E.questionTypes.mcq({question:q,answer:a,svg:svg,choices:cs});
    if(qtype==='tf') return E.questionTypes.tf({question:q,answer:a,svg:svg,isTrue:isTrue});
    if(qtype==='mistake') return E.questionTypes.mistake({question:q,answer:a,svg:svg});
    return E.questionTypes.open({question:q,answer:a,svg:svg});
  }

  const U704_SETS=[
    {title:'מספר תלמידים בחוגים',unit:'תלמידים',cats:['א׳','ב׳','ג׳','ד׳']},
    {title:'ספרים שהושאלו בשבוע',unit:'ספרים',cats:['ב׳','ג׳','ד׳','ה׳']},
    {title:'מספר מבקרים לפי יום',unit:'מבקרים',cats:['א׳','ב׳','ג׳','ד׳']}
  ];
  const PICTO_SETS=[
    {title:'סקר הגעה לבית הספר',unit:'תלמידים',key:2,data:[{k:'ברגל',v:8},{k:'אוטובוס',v:12},{k:'רכב',v:6},{k:'אופניים',v:4}]},
    {title:'ספרים שנקראו בחודש',unit:'ספרים',key:5,data:[{k:'כיתה ז׳1',v:20},{k:'כיתה ז׳2',v:15},{k:'כיתה ז׳3',v:25},{k:'כיתה ז׳4',v:10}]}
  ];
  function genU704(diff,qtype){
    qtype=qtype==='mixed'?pick(['open','mcq','tf','mistake']):(qtype||'open');
    const set=pick(U704_SETS);
    const family=diff==='basic'?pick(['read','pictogram_read']):diff==='challenge'?pick(['bar_to_table','total','pictogram_read']):pick(['read','bar_to_table','total','pictogram_read']);
    const ncats=diff==='challenge'?set.cats.length:diff==='basic'?3:Math.min(4,set.cats.length);
    const seen={}, vals=[];
    while(vals.length<ncats){ const v=4+Math.floor(Math.random()*12); if(!seen[v]){ seen[v]=1; vals.push(v); } }
    const data=set.cats.slice(0,ncats).map((k,i)=>({k:k,v:vals[i]}));
    const total=data.reduce((s,d)=>s+d.v,0), max=data.reduce((a,b)=>a.v>b.v?a:b), min=data.reduce((a,b)=>a.v<b.v?a:b);
    let svg=barSvg(data,set.title);
    const tfTrue=qtype==='tf'&&Math.random()<0.5;
    const table = tableHtml(['קטגוריה','תדירות'], data.map(d=>[d.k,d.v]));
    let q=`קראו את תרשים העמודות (${set.title}): איזו קטגוריה היא הגבוהה ביותר וכמה ${set.unit} יש בסך הכול?`;
    let a=`העמודה הגבוהה היא ${max.k} עם ${max.v} ${set.unit}. הסך הכול הוא ${data.map(d=>d.v).join('+')}=${total}.`;
    let cs=choices([{text:`${max.k}, סך הכול ${total}`,correct:true},{text:`${min.k}, סך הכול ${max.v}`,correct:false},{text:`${max.k}, סך הכול ${max.v}`,correct:false},{text:'אי אפשר לדעת מהתרשים',correct:false}]);
    let isTrue=false;
    if(family==='pictogram_read'){
      const p=pick(PICTO_SETS), focus=pick(p.data), ptotal=p.data.reduce((s,d)=>s+d.v,0), pmax=p.data.reduce((a,b)=>a.v>b.v?a:b);
      svg=pictogramSvg(p.data,p.title,p.key);
      q=`לפניכם פיקטוגרמה (${p.title}). לפי המקרא, כמה ${p.unit} יש בקטגוריה ${focus.k}, ומה הסך הכול?`;
      a=`כל סמל מייצג ${p.key}. ב-${focus.k} יש ${focus.v/p.key} סמלים, לכן ${focus.v} ${p.unit}. הסך הכול: ${p.data.map(d=>d.v).join('+')}=${ptotal}.`;
      cs=choices([{text:`${focus.v} ב-${focus.k}, סך הכול ${ptotal}`,correct:true},{text:`${focus.v/p.key} ב-${focus.k}, סך הכול ${ptotal/p.key}`,correct:false},{text:`${focus.v+p.key} ב-${focus.k}, סך הכול ${ptotal}`,correct:false},{text:`${pmax.v} ב-${focus.k}, סך הכול ${pmax.v}`,correct:false}]);
      if(qtype==='tf'){
        isTrue=tfTrue;
        q=`בפיקטוגרמה, כל סמל שווה ${p.key}. בקטגוריה ${focus.k} יש ${tfTrue?focus.v:focus.v/p.key} ${p.unit}.`;
        a=(tfTrue?'נכון. ':'שגוי. ')+`צריך להכפיל את מספר הסמלים במקרא: ${focus.v/p.key} סמלים · ${p.key} = ${focus.v}.`;
      }
      if(qtype==='mistake'){
        q=`תלמיד קרא את הפיקטוגרמה ואמר: "ב-${focus.k} יש ${focus.v/p.key}, כי ספרתי ${focus.v/p.key} סמלים".`;
        a=`הטעות: בפיקטוגרמה לא מסתפקים בספירת הסמלים; מכפילים לפי המקרא. כאן כל סמל = ${p.key}, לכן ${focus.v/p.key}·${p.key}=${focus.v}.`;
      }
    } else if(family==='bar_to_table'){
      q=`לפניכם דיאגרמת עמודות (${set.title}). תארו את הנתונים באמצעות טבלת שכיחויות.`;
      a=`טבלת השכיחויות המתאימה היא:\n${table}\nכל עמודה בתרשים הופכת לשורה בטבלה: קטגוריה ותדירות.`;
      cs=choices([{text:`${data[0].k} — ${data[0].v}`,correct:true},{text:`${data[0].k} — ${data[1].v}`,correct:false},{text:`${max.k} — ${total}`,correct:false},{text:`סך הכול — ${max.v}`,correct:false}]);
      if(qtype==='tf'){
        isTrue=tfTrue;
        q=`בדיאגרמה, השורה "${data[0].k} — ${tfTrue?data[0].v:data[1].v}" מתאימה לטבלת השכיחויות.`;
        a=(tfTrue?'נכון. ':'שגוי. ')+`קוראים את גובה העמודה של ${data[0].k}: ${data[0].v}.`;
      }
      if(qtype==='mistake'){
        q=`תלמיד בנה טבלה וכתב בשורת "${max.k}" את הסך הכול ${total}, כי זו העמודה הגבוהה ביותר.`;
        a=`הטעות: בשורת קטגוריה כותבים את גובה העמודה שלה, לא את הסך הכול. עבור ${max.k} התדירות היא ${max.v}.`;
      }
    } else if(family==='total'){
      q=`לפי תרשים העמודות (${set.title}), כמה ${set.unit} יש בסך הכול?`;
      a=`מחברים את כל העמודות: ${data.map(d=>d.v).join('+')}=${total}.`;
      cs=choices([{text:`${total}`,correct:true},{text:`${max.v}`,correct:false},{text:`${min.v}`,correct:false},{text:`${data.length}`,correct:false}]);
      if(qtype==='tf'){
        isTrue=tfTrue;
        q=`הסך הכול בתרשים הוא ${tfTrue?total:max.v}.`;
        a=(tfTrue?'נכון. ':'שגוי. ')+`סך הכול הוא סכום כל העמודות, לא העמודה הגבוהה בלבד: ${total}.`;
      }
      if(qtype==='mistake'){
        q=`תלמיד כתב: "הסך הכול הוא ${max.v} כי זו העמודה הגבוהה ביותר".`;
        a=`הטעות: ${max.v} הוא ערך של קטגוריה אחת. סך הכול מחשבים בחיבור כל העמודות: ${data.map(d=>d.v).join('+')}=${total}.`;
      }
    } else if(qtype==='tf'){
      isTrue=tfTrue;
      q=tfTrue?`לפי התרשים, הקטגוריה ${max.k} היא בעלת הערך הגבוה ביותר.`:`לפי התרשים, הקטגוריה ${min.k} היא בעלת הערך הגבוה ביותר.`;
      a=tfTrue?`נכון. ${max.k} היא העמודה הגבוהה ביותר עם ${max.v} ${set.unit}.`:`שגוי. ${max.k} היא הגבוהה ביותר (${max.v}), בעוד ${min.k} היא הנמוכה ביותר (${min.v}).`;
    }
    if(qtype==='mistake' && family==='read'){q=`תלמיד קרא את העמודה של ${max.k} אבל ענה לפי העמודה השכנה.`; a=`הטעות: קוראים את גובה העמודה של הקטגוריה המבוקשת מול הסרגל. ${max.k} היא הגבוהה ביותר עם ${max.v} ${set.unit}.`;}
    if(qtype==='mcq') return E.questionTypes.mcq({question:q,answer:a,svg:svg,choices:cs});
    if(qtype==='tf') return E.questionTypes.tf({question:q,answer:a,svg:svg,isTrue:isTrue});
    if(qtype==='mistake') return E.questionTypes.mistake({question:q,answer:a,svg:svg});
    return E.questionTypes.open({question:q,answer:a,svg:svg});
  }

  const MAP={
    'A8-01-ENGINE':{fn:genA801,title:'גרפים יישומיים ופונקציות',gradeTag:'כיתה ח׳',domainTag:'אלגברי',cls:'alg'},
    'U7-04-ENGINE':{fn:genU704,title:'קריאה מתרשים עמודות',gradeTag:'כיתה ז׳',domainTag:'אי-ודאות',cls:'unc'}
  };
  function asExercise(id,diff,qtype){ const m=MAP[id]; if(!m) return null; const r=m.fn(diff||'standard',qtype||'open'); return {id:id,title:m.title,qtype:qtype||'open',gradeTag:m.gradeTag,domainTag:m.domainTag,cls:m.cls,questionHTML:r.questionHTML,answerHTML:r.answerHTML,correctLabel:null}; }

  topic(8,'algebra','A8-01-ENGINE','גרפים יישומיים ופונקציות ✦ מקור');
  topic(7,'uncertainty','U7-04-ENGINE','קריאה מתרשים עמודות ✦ מקור');
  if(Array.isArray(E.ENGINE_TOPIC_IDS)) IDS.forEach(id=>{ if(E.ENGINE_TOPIC_IDS.indexOf(id)<0) E.ENGINE_TOPIC_IDS.push(id); });
  const oldIs=E.isEngineTopic; E.isEngineTopic=function(id){ return IDS.indexOf(id)>=0 || (typeof oldIs==='function' && oldIs(id)); };
  const oldGet=E.getEngineExercise; E.getEngineExercise=function(id,diff,qtype,opts){ return asExercise(id,diff,qtype,opts) || (typeof oldGet==='function'?oldGet(id,diff,qtype,opts):null); };
  if(typeof generators!=='undefined'){
    generators['A8-01-ENGINE']=function(){ const d=document.getElementById('selDiff')?.value||'standard', q=document.getElementById('selQType')?.value||'open'; E.renderEngineCard('A8-01-ENGINE','גרפים יישומיים ופונקציות',genA801(d,q)); };
    generators['U7-04-ENGINE']=function(){ const d=document.getElementById('selDiff')?.value||'standard', q=document.getElementById('selQType')?.value||'open'; E.renderEngineCard('U7-04-ENGINE','קריאה מתרשים עמודות',genU704(d,q)); };
  }
  window.addEventListener('DOMContentLoaded',function(){ if(typeof onDomain==='function') onDomain(); });
})();
