// generator/engine/source-fit-extensions.js
// Source-fit extensions added after the 2026-06-09 intake audit.
// Adds missing source-backed visual families without renaming or deleting existing engines.
(function(){
  const E = window.TargilimEngine = window.TargilimEngine || {};
  const NEW_ENGINE_IDS = ['N7-01-ENGINE','U7-03-ENGINE'];
  const LABELS = ['א','ב','ג','ד'];

  function rnd(lo,hi){ return lo + Math.floor(Math.random()*(hi-lo+1)); }
  function pick(arr){ return E.pick ? E.pick(arr) : arr[Math.floor(Math.random()*arr.length)]; }
  function shuffle(arr){ return E.shuffle ? E.shuffle(arr) : arr.slice().sort(()=>Math.random()-0.5); }
  function inline(tex){ return E.fmt && E.fmt.inline ? E.fmt.inline(tex) : '$'+tex+'$'; }
  function pointText(p){ return inline('('+p.x+','+p.y+')'); }

  function addTopic(grade, domain, id, label){
    if(typeof TOPICS === 'undefined' || !TOPICS[grade] || !TOPICS[grade][domain]) return;
    if(!TOPICS[grade][domain].some(t => t[0] === id)) TOPICS[grade][domain].push([id,label,1]);
  }

  function choiceList(items){
    return shuffle(items).map((item,i)=>({ label:LABELS[i], text:item.text, correct:!!item.correct }));
  }

  function coordinateSystemSvg(o){
    const T = E.themes && E.themes.geometry ? E.themes.geometry : {fill:'#eff6ff',stroke:'#2563eb',helper:'#93c5fd',given:'#1d4ed8',unknown:'#dc2626',label:'#334155'};
    const W=286,H=246,m=34,max=10,step=18;
    function X(x){ return m + x*step; }
    function Y(y){ return H-m - y*step; }
    const points = o.points || [];
    const connect = o.connect || [];
    const grid=[];
    for(let i=0;i<=max;i++){
      grid.push(`<line x1="${X(i)}" y1="${Y(0)}" x2="${X(i)}" y2="${Y(max)}" stroke="${T.helper}" stroke-width="0.7" opacity="0.45"/>`);
      grid.push(`<line x1="${X(0)}" y1="${Y(i)}" x2="${X(max)}" y2="${Y(i)}" stroke="${T.helper}" stroke-width="0.7" opacity="0.45"/>`);
    }
    const nums=[];
    for(let i=0;i<=max;i+=2){
      nums.push(`<text x="${X(i)}" y="${Y(0)+18}" font-size="10" text-anchor="middle" fill="${T.label}">${i}</text>`);
      nums.push(`<text x="${X(0)-12}" y="${Y(i)+4}" font-size="10" text-anchor="middle" fill="${T.label}">${i}</text>`);
    }
    const lines = connect.length ? connect.map(pair => {
      const a=points.find(p=>p.label===pair[0]), b=points.find(p=>p.label===pair[1]);
      return a&&b ? `<line x1="${X(a.x)}" y1="${Y(a.y)}" x2="${X(b.x)}" y2="${Y(b.y)}" stroke="${T.stroke}" stroke-width="2.2"/>` : '';
    }).join('') : '';
    const dots = points.map(p => `<g><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="5.5" fill="${p.unknown?T.unknown:T.stroke}"/><text x="${X(p.x)+10}" y="${Y(p.y)-8}" font-size="12" font-weight="800" fill="${p.unknown?T.unknown:T.given}">${p.label}</text></g>`).join('');
    return `<svg class="engine-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-label="מערכת צירים">
      <rect x="12" y="10" width="262" height="222" rx="14" fill="${T.fill}" stroke="${T.stroke}" stroke-width="1.8"/>
      ${grid.join('')}
      <line x1="${X(0)}" y1="${Y(0)}" x2="${X(max)+12}" y2="${Y(0)}" stroke="${T.stroke}" stroke-width="2.4"/>
      <line x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(max)-12}" stroke="${T.stroke}" stroke-width="2.4"/>
      <text x="${X(max)+21}" y="${Y(0)+4}" font-size="12" font-weight="800" fill="${T.label}">x</text>
      <text x="${X(0)-4}" y="${Y(max)-18}" font-size="12" font-weight="800" fill="${T.label}">y</text>
      ${nums.join('')}${lines}${dots}
      <text x="143" y="238" font-size="10.5" font-weight="800" fill="${T.label}" text-anchor="middle">רביע ראשון</text>
    </svg>`;
  }

  function compareGroupsSvg(c){
    const T = E.themes && E.themes.geometry ? E.themes.geometry : {fill:'#eff6ff',stroke:'#2563eb',helper:'#93c5fd',given:'#1d4ed8',unknown:'#dc2626',label:'#334155'};
    const W=286,H=170,x0=58,y0=118,maxW=166;
    function row(y,label,total,part){
      const tw = Math.round(maxW * total / Math.max(c.n1,c.n2));
      const pw = Math.round(tw * part / total);
      return `<text x="238" y="${y+17}" font-size="12" font-weight="800" fill="${T.label}" text-anchor="end">${label}</text>
        <rect x="${x0}" y="${y}" width="${tw}" height="24" rx="8" fill="#fff" stroke="${T.stroke}" stroke-width="1.5"/>
        <rect x="${x0}" y="${y}" width="${pw}" height="24" rx="8" fill="${T.helper}" stroke="${T.stroke}" stroke-width="1.1"/>
        <text x="${x0+tw+9}" y="${y+17}" font-size="12" font-weight="800" fill="${T.given}">${part}/${total}</text>`;
    }
    return `<svg class="engine-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-label="השוואת קבוצות לפי תדירות יחסית">
      <rect x="16" y="14" width="254" height="132" rx="14" fill="${T.fill}" stroke="${T.stroke}" stroke-width="1.8"/>
      <text x="143" y="36" font-size="13" font-weight="800" fill="${T.label}" text-anchor="middle">השוואה לפי שיעור, לא רק לפי מספר</text>
      ${row(55,'כיתה א׳',c.n1,c.k1)}
      ${row(93,'כיתה ב׳',c.n2,c.k2)}
      <text x="143" y="160" font-size="10.5" font-weight="800" fill="${T.label}" text-anchor="middle">מלכודת תדירות יחסית</text>
    </svg>`;
  }

  function coordinateCase(diff){
    const family = diff === 'challenge' ? pick(['area','missing','segment']) : diff === 'basic' ? pick(['plot','segment']) : pick(['plot','segment','area','missing']);
    if(family === 'plot'){
      const cx=rnd(4,6), cy=rnd(4,6), dx=rnd(2,3), dy=rnd(2,3);
      return {family, shape:'מעוין', points:[{label:'A',x:cx,y:cy-dy},{label:'B',x:cx-dx,y:cy},{label:'C',x:cx,y:cy+dy},{label:'D',x:cx+dx,y:cy}], connect:[['A','B'],['B','C'],['C','D'],['D','A']]};
    }
    if(family === 'segment'){
      const y=rnd(2,8), x1=rnd(1,4), len=rnd(3,6), x2=x1+len;
      return {family, points:[{label:'A',x:x1,y},{label:'B',x:x2,y}], len};
    }
    if(family === 'area'){
      const x1=rnd(1,3), y1=rnd(1,3), w=rnd(3,6), h=rnd(2,5), x2=x1+w, y2=y1+h;
      return {family, points:[{label:'P',x:x1,y:y1},{label:'Q',x:x2,y:y1},{label:'R',x:x2,y:y2},{label:'S',x:x1,y:y2}], connect:[['P','Q'],['Q','R'],['R','S'],['S','P']], area:w*h, w, h};
    }
    const x1=rnd(1,3), y1=rnd(2,4), w=rnd(3,6), h=rnd(2,5), x2=x1+w, y2=y1+h;
    return {family, points:[{label:'A',x:x1,y:y1},{label:'B',x:x2,y:y1},{label:'C',x:x2,y:y2}], missing:{label:'D',x:x1,y:y2}};
  }

  function buildN701(diff, qtype){
    qtype = qtype === 'mixed' ? pick(['open','mcq','tf','mistake']) : (qtype || 'open');
    const c = coordinateCase(diff || 'standard');
    const tfTrue = qtype === 'tf' && Math.random() < 0.5;
    let svg = coordinateSystemSvg({points:c.family==='missing'?c.points:c.points, connect:c.connect||[]});
    let q='', a='', choices=null, isTrue=true;
    if(c.family === 'plot'){
      const list = c.points.map(p=>p.label+pointText(p)).join(', ');
      q = `שרטטו במערכת הצירים את הנקודות ${list}, וחברו לפי הסדר. איזו צורה התקבלה?`;
      a = `הנקודות יוצרות ${c.shape}. האלכסונים מאונכים ונפגשים במרכז, ולכן מתקבלת צורת מעוין.`;
      choices = choiceList([{text:'מעוין',correct:true},{text:'מלבן',correct:false},{text:'משולש',correct:false},{text:'טרפז',correct:false}]);
      if(qtype==='tf'){ isTrue=tfTrue; q = tfTrue ? `הנקודות ${list} יוצרות מעוין.` : `הנקודות ${list} יוצרות מלבן.`; a = tfTrue ? `נכון. האלכסונים מאונכים ונפגשים במרכז וכל הצלעות שוות — הצורה היא מעוין.` : `שגוי. לפי מיקום הנקודות האלכסונים מאונכים ושווים סביב המרכז — הצורה היא מעוין, לא מלבן רגיל.`; }
      if(qtype==='mistake'){ q = `תלמיד חיבר את הנקודות לפי סדר אקראי וטען שכל חיבור של אותן נקודות יוצר אותה צורה.`; a = `הטעות: סדר החיבור קובע את הצלעות. לפי המקור צריך לשרטט, לחבר לפי הסדר, ואז לזהות את הצורה.`; }
    } else if(c.family === 'segment'){
      q = `במערכת הצירים נתונות הנקודות ${pointText(c.points[0])} ו-${pointText(c.points[1])}. חשבו את אורך הקטע AB.`;
      a = `הקטע מקביל לציר x, לכן האורך הוא הפרש שיעורי ה-x:
$$|${c.points[1].x}-${c.points[0].x}|=${c.len}$$`;
      choices = choiceList([{text:inline(String(c.len)),correct:true},{text:inline(String(Math.abs(c.points[0].y-c.points[1].y))),correct:false},{text:inline(String(c.len+1)),correct:false},{text:inline(String(c.points[1].x+c.points[0].x)),correct:false}]);
      if(qtype==='tf'){ isTrue=tfTrue; const shown=tfTrue?c.len:c.len+1; q = `אורך הקטע AB הוא ${inline(String(shown))}.`; a = (tfTrue?`נכון. `:`שגוי. `)+`מכיוון שה-y זהה, מודדים רק את הפרש ה-x: ${inline('|'+c.points[1].x+'-'+c.points[0].x+'|='+c.len)}.`; }
      if(qtype==='mistake'){ q = `תלמיד כתב: "האורך הוא ${c.points[0].y}, כי זה הגובה של הנקודות".`; a = `הטעות: כששתי נקודות על אותו קו אופקי, האורך תלוי בהפרש שיעורי ה-x, לא בערך ה-y.`; }
    } else if(c.family === 'area'){
      q = `במערכת הצירים מסומן מלבן PQRS. חשבו את שטחו.`;
      a = `רוחב המלבן הוא ${inline(String(c.w))}, והגובה הוא ${inline(String(c.h))}. לכן:
$$S=${c.w}\cdot ${c.h}=${c.area}$$`;
      choices = choiceList([{text:inline(c.area+' יח״ר'),correct:true},{text:inline((2*(c.w+c.h))+' יח״ר'),correct:false},{text:inline((c.w+c.h)+' יח״ר'),correct:false},{text:inline((c.area+2)+' יח״ר'),correct:false}]);
      if(qtype==='tf'){ isTrue=tfTrue; const shown=tfTrue?c.area:2*(c.w+c.h); q = `שטח המלבן הוא ${inline(String(shown))} יחידות ריבועיות.`; a = tfTrue ? `נכון. שטח הוא רוחב כפול גובה: ${inline(c.w+'\\cdot '+c.h+'='+c.area)}.` : `שגוי. זהו היקף, לא שטח. שטח הוא רוחב כפול גובה: ${inline(c.w+'\\cdot '+c.h+'='+c.area)}.`; }
      if(qtype==='mistake'){ q = `תלמיד חישב ${inline('2('+c.w+'+'+c.h+')')} וקבע שזה שטח המלבן.`; a = `הטעות: ${inline('2(a+b)')} מחשב היקף. שטח מלבן במערכת הצירים הוא ${inline('a\\cdot b')}.`; }
    } else {
      const all = c.points.concat([Object.assign({unknown:true},c.missing)]);
      svg = coordinateSystemSvg({points:all, connect:[['A','B'],['B','C'],['C','D'],['D','A']]});
      q = `שלוש נקודות של מלבן הן ${pointText(c.points[0])}, ${pointText(c.points[1])}, ${pointText(c.points[2])}. מהי הנקודה D שמשלימה את המלבן?`;
      a = `במלבן המקביל לצירים, ל-D יש אותו x כמו A ואותו y כמו C. לכן:
$$D=(${c.missing.x},${c.missing.y})$$`;
      // distractors include the x/y-swapped point (the classic coordinate
      // misconception), guarded so it never collides with the correct answer.
      const swap = c.missing.x !== c.missing.y ? {x:c.missing.y,y:c.missing.x} : {x:c.points[0].x,y:c.points[0].y};
      // misconception points first, then near points; never two equal options
      const wrongPts = [swap, {x:c.points[2].x,y:c.points[0].y}, {x:c.points[1].x,y:c.points[2].y},
        {x:c.missing.x+1,y:c.missing.y}, {x:c.missing.x,y:c.missing.y+1}, {x:c.missing.x+1,y:c.missing.y+1}]
        .filter((p,i,all)=>!(p.x===c.missing.x&&p.y===c.missing.y) && all.findIndex(o=>o.x===p.x&&o.y===p.y)===i).slice(0,3);
      choices = choiceList([{text:pointText(c.missing),correct:true}].concat(wrongPts.map(p=>({text:pointText(p),correct:false}))));
      if(qtype==='tf'){ isTrue=tfTrue; q = tfTrue ? `הנקודה ${pointText(c.missing)} משלימה את המלבן.` : `הנקודה ${pointText({x:c.points[2].x,y:c.points[0].y})} משלימה את המלבן.`; a = tfTrue ? `נכון. הנקודה החסרה לוקחת x מ-A ו-y מ-C: ${pointText(c.missing)}.` : `שגוי. זו כבר נקודה B. הנקודה החסרה צריכה לקחת x מ-A ו-y מ-C: ${pointText(c.missing)}.`; }
      if(qtype==='mistake'){ q = `תלמיד השלים את הנקודה הרביעית כ-${pointText({x:c.points[1].x,y:c.points[2].y})}, כי "לוקחים את x ו-y מהנקודה האחרונה".`; a = `הטעות: צריך לשמור צלעות מקבילות לצירים. הנקודה החסרה היא ${pointText(c.missing)}.`; }
    }
    if(qtype==='mcq') return E.questionTypes.mcq({question:q,answer:a,svg,choices});
    if(qtype==='tf') return E.questionTypes.tf({question:q,answer:a,svg,isTrue});
    if(qtype==='mistake') return E.questionTypes.mistake({question:q,answer:a,svg});
    return E.questionTypes.open({question:q,answer:a,svg});
  }

  function compareCase(diff){
    const easy=[
      {n1:30,k1:12,n2:20,k2:10},
      {n1:40,k1:18,n2:25,k2:13},
      {n1:20,k1:8,n2:10,k2:5}
    ];
    const hard=[
      {n1:36,k1:15,n2:24,k2:12},
      {n1:28,k1:11,n2:18,k2:9},
      {n1:45,k1:18,n2:30,k2:14},
      {n1:50,k1:22,n2:35,k2:17}
    ];
    if(diff==='basic') return pick(easy);
    if(diff==='challenge') return pick(hard);
    return pick(easy.concat(hard));
  }

  function buildU703(diff, qtype){
    qtype = qtype === 'mixed' ? pick(['open','mcq','tf','mistake']) : (qtype || 'open');
    const c = compareCase(diff || 'standard');
    const tfTrue = qtype === 'tf' && Math.random() < 0.5;
    const r1 = c.k1/c.n1, r2 = c.k2/c.n2;
    const pct1 = Math.round(r1*1000)/10, pct2 = Math.round(r2*1000)/10;
    const svg = compareGroupsSvg(c);
    let q = `בכיתה א׳ יש ${c.n1} תלמידים, ומתוכם ${c.k1} מתעמלים. בכיתה ב׳ יש ${c.n2} תלמידים, ומתוכם ${c.k2} מתעמלים. איזו כיתה ספורטיבית יותר? הסבירו.`;
    let a = `אין להשוות רק את מספר המתעמלים. משווים שיעור מתוך כל כיתה:
$$\\frac{${c.k1}}{${c.n1}}=${pct1}\\%$$
$$\\frac{${c.k2}}{${c.n2}}=${pct2}\\%$$
לכן כיתה ב׳ ספורטיבית יותר, אף שבכיתה א׳ יש יותר מתעמלים במספר מוחלט.`;
    const choices = choiceList([{text:'כיתה א׳, כי יש בה יותר מתעמלים',correct:false},{text:'כיתה ב׳, כי השיעור היחסי גבוה יותר',correct:true},{text:'שתיהן שוות',correct:false},{text:'אי אפשר לדעת בלי לדעת שמות תלמידים',correct:false}]);
    let isTrue=false;
    if(qtype==='tf'){
      isTrue=tfTrue;
      q = tfTrue
        ? `כיתה ב׳ ספורטיבית יותר באופן יחסי, אף שבכיתה א׳ יש יותר מתעמלים במספר.`
        : `כיתה א׳ ספורטיבית יותר, כי ${c.k1} מתעמלים גדול מ-${c.k2} מתעמלים.`;
      a = tfTrue
        ? `נכון. משווים שיעור: ${inline('\\frac{'+c.k2+'}{'+c.n2+'}')}=${pct2}% גדול מ-${inline('\\frac{'+c.k1+'}{'+c.n1+'}')}=${pct1}%.`
        : `שגוי. זה בדיוק המלכוד מהמקור: משווים ${inline('k/n')} ולא רק ${inline('k')}. בכיתה ב׳ השיעור היחסי גבוה יותר (${pct2}% לעומת ${pct1}%).`;
    }
    if(qtype==='mistake'){
      q = `תלמיד כתב: "כיתה א׳ ספורטיבית יותר כי ${c.k1}>${c.k2}".`;
      a = `הטעות: הוא השווה ספירות מוחלטות. צריך להשוות תדירות יחסית: ${inline('\\frac{'+c.k1+'}{'+c.n1+'}')} מול ${inline('\\frac{'+c.k2+'}{'+c.n2+'}')}.`;
    }
    if(qtype==='mcq') return E.questionTypes.mcq({question:q,answer:a,svg,choices});
    if(qtype==='tf') return E.questionTypes.tf({question:q,answer:a,svg,isTrue});
    if(qtype==='mistake') return E.questionTypes.mistake({question:q,answer:a,svg});
    return E.questionTypes.open({question:q,answer:a,svg});
  }

  const BUILDERS = {
    'N7-01-ENGINE': {fn:buildN701,title:'מערכת צירים — רביע ראשון', gradeTag:'כיתה ז׳', domainTag:'מספרי', cls:'num'},
    'U7-03-ENGINE': {fn:buildU703,title:'השוואת קבוצות — תדירות יחסית', gradeTag:'כיתה ז׳', domainTag:'אי-ודאות', cls:'unc'}
  };

  function getNewExercise(id, diff, qtype){
    const meta = BUILDERS[id];
    if(!meta) return null;
    const result = meta.fn(diff || 'standard', qtype || 'open');
    const correctMatch = result.questionHTML && result.questionHTML.match(/mcq-choice mcq-correct"><span class="mcq-label">([^<]+)\./);
    return {id, title:meta.title, qtype:qtype||'open', gradeTag:meta.gradeTag, domainTag:meta.domainTag, cls:meta.cls, questionHTML:result.questionHTML, answerHTML:result.answerHTML, correctLabel:correctMatch?correctMatch[1]:null};
  }

  addTopic(7,'numeric','N7-01-ENGINE','מערכת צירים — רביע ראשון ✦ מקור');
  addTopic(7,'uncertainty','U7-03-ENGINE','השוואת קבוצות — תדירות יחסית ✦ מקור');

  if(Array.isArray(E.ENGINE_TOPIC_IDS)) NEW_ENGINE_IDS.forEach(id => { if(E.ENGINE_TOPIC_IDS.indexOf(id) < 0) E.ENGINE_TOPIC_IDS.push(id); });

  const oldIsEngineTopic = E.isEngineTopic;
  E.isEngineTopic = function(id){ return NEW_ENGINE_IDS.indexOf(id) >= 0 || (typeof oldIsEngineTopic === 'function' && oldIsEngineTopic(id)); };

  const oldGetEngineExercise = E.getEngineExercise;
  E.getEngineExercise = function(id, diff, qtype, opts){
    const newer = getNewExercise(id, diff, qtype, opts);
    if(newer) return newer;
    return typeof oldGetEngineExercise === 'function' ? oldGetEngineExercise(id, diff, qtype, opts) : null;
  };

  if(typeof generators !== 'undefined'){
    generators['N7-01-ENGINE'] = function(){
      const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
      const qtype = document.getElementById('selQType')?.value || 'open';
      E.renderEngineCard('N7-01-ENGINE','מערכת צירים — רביע ראשון', buildN701(diff,qtype));
    };
    generators['U7-03-ENGINE'] = function(){
      const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
      const qtype = document.getElementById('selQType')?.value || 'open';
      E.renderEngineCard('U7-03-ENGINE','השוואת קבוצות — תדירות יחסית', buildU703(diff,qtype));
    };
  }

  window.addEventListener('DOMContentLoaded', function(){ if(typeof onDomain === 'function') onDomain(); });
})();
