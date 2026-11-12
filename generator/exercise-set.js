// generator/exercise-set.js
// Document layer. Turns the teacher's choices into ONE numbered document model
// and renders it: student pages plus a separate answer key. The digital book,
// print and the PDF download (workbook/book.js) all paginate this same
// rendered document, so text, formulas, drawings and page breaks match.
//
//   readOptions()        form → options (grade, topics, count, level,
//                        progression, docType, qtype, mcqMode, seed)
//   composeDocument()    options → document (seeded; verified families first,
//                        legacy engines through a seeded Math.random)
//   renderExerciseSet()  document → HTML (+ book pagination in a browser)
//
// No math logic lives here: verified families (workbook/families/*) and the
// engines produce the exercises.

const DOC_TYPES={
  worksheet:{title:'דף תרגילים',item:'תרגיל',points:false},
  quiz:{title:'בוחן',item:'שאלה',points:true},
  exam:{title:'מבחן',item:'שאלה',points:true}
};
const LEVEL_LABELS={basic:'רמה 1',standard:'רמה 2',challenge:'רמה 3'};
const LEVEL_ORDER=['basic','standard','challenge'];

// ── 1. Teacher options ─────────────────────────────────────────────────────
function fieldValue(id,fallback){const el=document.getElementById(id);return(el&&el.value)||fallback}
function selectedTopics(){
  const list=(window.__docTopics||[]).map(function(t){return t.id});
  if(list.length)return list;
  const st=document.getElementById('st');
  return st&&st.value?[st.value]:[];
}
function topicLabel(id){
  const added=(window.__docTopics||[]).find(function(t){return t.id===id});
  if(added)return added.label;
  const sel=document.getElementById('st');
  const opt=sel&&sel.options&&sel.options[sel.selectedIndex];
  return cleanTopicLabel(opt?opt.textContent:'');
}
function readOptions(){
  let level=fieldValue('sl','')||fieldValue('selDiff','standard');
  let progression=fieldValue('sprog','uniform');
  if(level==='ladder'){level='challenge';progression='graduated'} // older links
  const seedField=document.getElementById('sseed');
  const W=window.TargilimWorkbook;
  const typed=seedField&&String(seedField.value||'').trim().toUpperCase();
  const seed=W&&W.rng.isSeedCode(typed)?typed:(W?W.rng.newSeedCode():String(Date.now()));
  return {
    grade:+fieldValue('sg','7'),
    topics:selectedTopics(),
    count:Math.max(1,Math.min(10,+fieldValue('sn','5'))),
    level:LEVEL_ORDER.indexOf(level)>=0?level:'standard',
    progression:progression==='graduated'?'graduated':'uniform',
    docType:DOC_TYPES[fieldValue('sdoc','worksheet')]?fieldValue('sdoc','worksheet'):'worksheet',
    qtype:fieldValue('selQType','mixed'),
    mcqMode:fieldValue('selMcqMode','single'),
    seed:seed
  };
}

// ── 2. Plans: question types and levels ───────────────────────────────────
function buildTypePlan(qtype,count,rng){
  if(qtype!=='mixed')return Array(count).fill(qtype);
  const TYPES=['open','mcq','tf','mistake'],plan=[];
  for(let i=0;i<count;i++)plan.push(TYPES[i%TYPES.length]);
  return rng?rng.shuffle(plan):plan;
}
// Uniform: every item at the selected level. Graduated: an intentional climb
// to the selected target (target רמה 1 has nothing to climb to → uniform).
function levelPlan(level,progression,count){
  const target=LEVEL_ORDER.indexOf(level)+1;
  if(progression!=='graduated'||target<2||count<2)return Array(count).fill(level);
  const out=[];
  if(count>=target){for(let i=0;i<count;i++)out.push(LEVEL_ORDER[Math.floor(i*target/count)])}
  else{for(let i=0;i<count;i++)out.push(LEVEL_ORDER[target-count+i])}
  return out;
}
function explainOptions(o){
  const notes=[];
  if(o.progression==='graduated'&&o.level==='basic')notes.push('סדר קושי מדורג מתאים לרמה 2 ולרמה 3; ברמה 1 כל השאלות באותה רמה.');
  if(o.count<o.topics.length)notes.push('מספר התרגילים קטן ממספר הנושאים — ייכללו רק '+o.count+' הנושאים הראשונים.');
  return notes;
}

// ── 3. Producing exercises ────────────────────────────────────────────────
// Legacy engines mark the correct MCQ choice inside the question HTML; move
// that fact to the answer key and leave the student HTML answer-free.
function isolateAnswers(ex){
  const labels=[];
  ex.questionHTML=String(ex.questionHTML||'').replace(/<div class="([^"]*\bmcq-choice\b[^"]*)">\s*<span class="mcq-label">([^<]+?)\.?<\/span>/g,function(m,cls,label){
    if(/\bmcq-correct\b/.test(cls))labels.push(label);
    return '<div class="mcq-choice"><span class="mcq-label">'+label+'.</span>';
  }).replace(/\s*\bmcq-correct\b/g,'');
  ex.correctLabels=labels.length?labels:(ex.correctLabel?[ex.correctLabel]:[]);
  return ex;
}

function makeExercise(id,diff,qtype,isEngine,E,mcqMode){
  if(isEngine){
    let ex=null;
    try{ex=E.getEngineExercise(id,diff,qtype,{mcqMode:mcqMode})}catch(e){console.error('engine exercise failed',id,qtype,e)}
    if(ex&&!ex.qtype)ex.qtype=qtype;
    if(!ex&&qtype!=='open'){
      try{ex=E.getEngineExercise(id,diff,'open',{mcqMode:mcqMode})}catch(e){ex=null}
      if(ex&&!ex.qtype)ex.qtype='open';
    }
    if(ex&&!ex.meta&&typeof E.buildMeta==='function'){try{ex.meta=E.buildMeta(id,ex.qtype||qtype,diff,ex.questionFamily);}catch(e){}}
    return ex;
  }
  if(typeof generators==='undefined'||!generators[id])return null;
  window.__captureCard=[];let buf;
  try{generators[id]()}catch(e){console.error('legacy exercise failed',id,e);window.__captureCard=null;return null}
  finally{buf=window.__captureCard;window.__captureCard=null}
  if(!buf||!buf.length)return null;
  const c=buf[0];
  return {id:c.id,title:c.title,qtype:'open',cls:c.cls,
    questionHTML:(c.svg?'<div class="diagram">'+c.svg+'</div>':'')+'<div class="qtext">'+c.q+'</div>',
    answerHTML:c.a,correctLabel:null,meta:null};
}

// One exercise for a slot. Verified families are generated and independently
// checked; other topics come from their engine on a seeded Math.random.
function produceExercise(topicId,level,qtype,o,rng,E){
  const W=window.TargilimWorkbook;
  const family=W&&W.families&&W.families[topicId];
  if(family){
    for(let attempt=0;attempt<4;attempt++){
      const item=family.generate(rng,level,qtype,{mcqMode:o.mcqMode});
      if(!family.verify(item,{mcqMode:o.mcqMode}).length){
        return {qtype:item.qtype,level:level,verified:true,familyId:item.familyId,
          questionHTML:W.items.questionHTML(item),answerHTML:W.items.answerHTML(item),
          correctLabels:W.items.correctLabels(item),workLines:item.workLines};
      }
    }
    return null;
  }
  const isEngine=typeof E.isEngineTopic==='function'&&E.isEngineTopic(topicId)&&typeof E.getEngineExercise==='function';
  const run=function(){return makeExercise(topicId,level,isEngine?qtype:'open',isEngine,E,o.mcqMode)};
  const ex=W?W.rng.withMathRandom(rng,run):run();
  if(!ex)return null;
  isolateAnswers(ex);
  ex.level=level;ex.verified=false;
  return ex;
}

// Whole-number points that sum to 100, weighted by level (largest remainder).
function assignPoints(items){
  const w=items.map(function(ex){return {basic:2,standard:3,challenge:4}[ex.level]||3});
  const total=w.reduce(function(s,x){return s+x},0);
  const raw=w.map(function(x){return 100*x/total});
  const pts=raw.map(Math.floor);
  let left=100-pts.reduce(function(s,x){return s+x},0);
  raw.map(function(x,i){return {i:i,f:x-Math.floor(x)}}).sort(function(a,b){return b.f-a.f||b.i-a.i})
    .forEach(function(r){if(left>0){pts[r.i]++;left--}});
  items.forEach(function(ex,i){ex.points=pts[i]});
}

function composeDocument(o){
  const W=window.TargilimWorkbook;
  const E=window.TargilimEngine||{};
  const root=W?W.rng.createRng(o.seed+'|'+[o.grade,o.topics.join('+'),o.count,o.level,o.progression,o.docType,o.qtype,o.mcqMode].join('|')):null;
  const topics=o.topics.slice(0,o.count);
  const per=topics.map(function(t,i){return Math.floor(o.count/topics.length)+(i<o.count%topics.length?1:0)});
  const seen=new Set();
  const chapters=[];
  let n=0;
  topics.forEach(function(topicId,ci){
    const levels=levelPlan(o.level,o.progression,per[ci]);
    const types=buildTypePlan(o.qtype,per[ci],root&&root.fork('types/'+ci));
    const items=[];
    for(let j=0;j<per[ci];j++){
      let ex=null,last=null;
      for(let tries=0;tries<8;tries++){
        const rng=root?root.fork('item/'+ci+'/'+j+'/'+tries):null;
        const cand=produceExercise(topicId,levels[j],types[j],o,rng,E);
        if(!cand)break;
        last=cand;
        const key=cand.questionHTML.replace(/\s+/g,' ').trim();
        if(!seen.has(key)){seen.add(key);ex=cand;break}
      }
      if(!ex)ex=last; // uniqueness exhausted — keep the best effort, never crash
      if(ex){ex.n=++n;ex.chapter=ci;items.push(ex)}
    }
    chapters.push({n:ci+1,title:topicLabel(topicId),items:items});
  });
  const exercises=[].concat.apply([],chapters.map(function(c){return c.items}));
  const type=DOC_TYPES[o.docType];
  if(type.points)assignPoints(exercises);
  const firstTitle=chapters.length?chapters[0].title:'';
  return {
    options:o,seed:o.seed,type:type,chapters:chapters,exercises:exercises,notes:explainOptions(o),
    title:type.title+' — '+(chapters.length>1?chapters.map(function(c){return c.title}).join(' · '):firstTitle),
    verifiedCount:exercises.filter(function(ex){return ex.verified}).length
  };
}

// ── 4. Rendering ──────────────────────────────────────────────────────────
function generateSet(){
  const o=readOptions();
  if(!o.topics.length){document.getElementById('out').innerHTML='<div class="qcard wip">בחרו נושא ונסו שוב.</div>';return}
  const doc=composeDocument(o);
  if(!doc.exercises.length){
    document.getElementById('out').innerHTML='<div class="qcard wip">לא ניתן היה להפיק תרגילים בנושא זה כעת. בחרו נושא אחר ונסו שוב.</div>';
    return;
  }
  const mcqInstr=o.mcqMode==='multi'
    ? '<div class="mcq-instruction">ייתכן שיותר מתשובה אחת נכונה — סמנו את כל התשובות הנכונות:</div>'
    : '<div class="mcq-instruction">סמנו את התשובה הנכונה (אחת בלבד):</div>';
  doc.exercises.forEach(function(ex){
    ex.questionHTML=sizeLegacyFigures(ex.questionHTML);
    ex.answerHTML=sizeLegacyFigures(ex.answerHTML);
    ex.layout=figureLayout(ex.questionHTML);
    if(/class="mcq-choices"/.test(ex.questionHTML)&&!/mcq-instruction/.test(ex.questionHTML))
      ex.questionHTML=ex.questionHTML.replace('<div class="mcq-choices">',mcqInstr+'<div class="mcq-choices'+(longChoices(ex.questionHTML)?' mcq-long':'')+'">');
  });
  const domainKey=typeof domain==='function'?domain():'numeric';
  const meta={
    topicLabel:doc.title.replace(/^[^—]*—\s*/,''),
    title:doc.title,
    gradeLabel:o.grade===8?'כיתה ח׳':'כיתה ז׳',
    domainLabel:doc.chapters.length>1?doc.chapters.length+' נושאים':({geometry:'גאומטריה',algebra:'אלגברה',numeric:'תחום מספרי',uncertainty:'אי־ודאות'}[domainKey]||''),
    cls:{geometry:'geo',algebra:'alg',numeric:'num',uncertainty:'unc'}[domainKey]||'num',
    diffLabel:LEVEL_LABELS[o.level]+(o.progression==='graduated'&&o.level!=='basic'?' · מדורג':''),
    doc:doc
  };
  window.__exsetCtx={options:o,seed:o.seed,doc:doc,exercises:doc.exercises};
  renderExerciseSet(meta,doc.exercises);
}

function plainText(html){
  return String(html||'')
    .replace(/<svg[\s\S]*?<\/svg>/g,' ')
    .replace(/<table[\s\S]*?<\/table>/g,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function answerBoxLineCount(ex){
  const qtype=ex&&ex.qtype;
  const LINES={open:3,mistake:4};
  let n=LINES[qtype];
  if(!n) return 0;
  if(ex.workLines) return Math.max(2,Math.min(4,ex.workLines));
  const question=plainText(ex.questionHTML);
  const answer=plainText(ex.answerHTML);
  const asksLong=/(הסבירו|נמקו|הוכיחו|תארו|השוו|החליטו|מסקנה|מדוע|כיצד|תקנו|בחרו.*נימוק)/.test(question);
  const shortAnswer=answer.length>0&&answer.length<90;
  if(qtype==='open'&&shortAnswer&&question.length<260&&!asksLong) n=2;
  if(qtype==='open'&&(asksLong||answer.length>180||question.length>520)) n=4;
  return Math.max(2,Math.min(4,n));
}

// A clean, untitled writing area — but ONLY for free-write question types.
// Short calculation tasks get a compact space, explanation/error-analysis tasks
// get more room. Mark-the-answer types (mcq, tf) get NO box. The box is part
// of the captured card and carries a stable verifier hook.
function workAreaHTML(ex){
  const n=answerBoxLineCount(ex);
  if(!n) return ''; // mcq, tf — no writing box; the answer is the marked choice
  let wl='';for(let i=0;i<n;i++)wl+='<div class="wl"></div>';
  return '<div class="answer-box" data-student-answer-box="true">'
    +'<div class="answer-box-body" data-answer-lines="'+n+'">'+wl+'</div></div>';
}

function sharpenMathRects(html){
  return String(html||'').replace(/<rect\b[^>]*>/g,function(tag){
    return tag.replace(/\s+r[xy]=(?:"[^"]*"|'[^']*'|[^\s/>]+)/g,'');
  });
}

// Engine drawings are drawn in px-like units; give each a physical size so
// its labels print at a readable ~9–11 pt (1 unit ≈ 0.28 mm, width 50–120 mm).
function sizeLegacyFigures(html){
  return String(html||'').replace(/<svg\b([^>]*)>/g,function(tag,attrs){
    if(/\bwb-fig\b/.test(attrs))return tag;
    const vb=/viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/.exec(attrs);
    if(!vb)return tag;
    const w=+vb[1],h=+vb[2];
    if(!(w>=120&&h>0))return tag; // icons and tiny marks keep their size
    let mmW=Math.max(50,Math.min(120,w*0.28)),mmH=mmW*h/w;
    if(mmH>95){mmH=95;mmW=mmH*w/h}
    const clean=attrs.replace(/\s(?:width|height)="[^"]*"/g,'');
    return '<svg'+clean+' width="'+mmW.toFixed(1)+'mm" height="'+mmH.toFixed(1)+'mm">';
  });
}

// One narrow drawing (≤ 78 mm) sits beside the text, as in a printed textbook;
// wide charts and tables stay above it at full width.
function figureLayout(html){
  const sizes=String(html||'').match(/<svg\b[^>]*\swidth="([\d.]+)mm"/g)||[];
  if(sizes.length!==1||/<table\b/.test(html))return '';
  return +/width="([\d.]+)mm"/.exec(sizes[0])[1]<=78?'fig-side':'';
}
// Long options (sentences) get one column so they never wrap awkwardly.
function longChoices(html){
  return (String(html).match(/<div class="mcq-choice">[\s\S]*?<\/div>/g)||[])
    .some(function(c){return plainText(c).replace(/\$/g,'').length>30});
}

function pointsLabel(ex){return ex.points?'<span class="ex-points">('+ex.points+' נק׳)</span>':''}

function headExtras(doc){
  const t=doc.options.docType;
  if(t==='worksheet')return '';
  const lines=t==='exam'
    ?['ענו על כל השאלות.','בשאלות הפתוחות הראו את דרך הפתרון.','סך הנקודות במבחן: 100.']
    :['ענו על כל השאלות. בשאלות הפתוחות הראו את דרך הפתרון.','סך הנקודות בבוחן: 100.'];
  return '<div class="exset-score">ציון: ________</div><ul class="exset-instructions">'+lines.map(function(l){return '<li>'+l+'</li>'}).join('')+'</ul>';
}

function renderExerciseSet(meta,exercises){
  if(typeof setMainTitle==='function')setMainTitle(meta.cls,meta.topicLabel);
  const doc=meta.doc||{options:{docType:'worksheet'},type:DOC_TYPES.worksheet,chapters:[],seed:'',notes:[]};
  const itemWord=doc.type.item;
  const multi=doc.chapters.length>1;
  let lastChapter=-1;
  const cards=exercises.map(function(ex,i){
    const questionHTML=sharpenMathRects(ex.questionHTML);
    let chapterHead='';
    if(multi&&ex.chapter!==lastChapter){
      lastChapter=ex.chapter;
      const ch=doc.chapters[ex.chapter];
      chapterHead='<div class="wb-chapter" data-chapter="'+ch.n+'"><span class="wb-chapter-n">פרק '+ch.n+'</span><span class="wb-chapter-title">'+ch.title+'</span></div>';
    }
    return chapterHead+'<div class="qcard engine-card ex-card'+(ex.layout?' '+ex.layout:'')+'" id="exCard'+i+'" data-idx="'+i+'">'
      +'<div class="qmeta" data-html2canvas-ignore="true"><span class="ex-num">'+itemWord+' '+(i+1)+'</span>'+pointsLabel(ex)+'</div>'
      +'<div class="ex-body">'+questionHTML+'</div>'
      +workAreaHTML(ex)
      +'<div class="ex-imgbar" data-html2canvas-ignore="true">'
        +'<button class="btn-img btn-img-primary btn-img-copy" onclick="exImageCopy('+i+',this)">העתק כתמונה</button>'
        +'<button class="btn-img btn-img-download" onclick="exImageDownload('+i+',this)">הורד כתמונה</button>'
      +'</div>'
      +'</div>';
  }).join('');
  const keyItems=exercises.map(function(ex,i){
    const all=ex.correctLabels||[];
    const correct=all.length?'<div class="ak-correct">'+(all.length>1?'התשובות הנכונות: ':'התשובה הנכונה: ')+all.join(', ')+'</div>':'';
    const level=LEVEL_LABELS[ex.level]?' · '+LEVEL_LABELS[ex.level]:'';
    return '<div class="ak-item"><div class="ak-num">'+itemWord+' '+(i+1)+level+(ex.points?' · '+ex.points+' נק׳':'')+'</div>'+correct+'<div class="ak-body">'+ex.answerHTML+'</div></div>';
  }).join('');
  const countLabel=exercises.length===1?itemWord+' אחד':exercises.length+(itemWord==='שאלה'?' שאלות':' תרגילים');
  const notes=(doc.notes||[]).map(function(t){return '<div class="exset-note">'+t+'</div>'}).join('');
  const html='<div class="exset" id="exset" data-doc-type="'+doc.options.docType+'" data-seed="'+doc.seed+'">'
    +'<div class="exset-head">'
    +'<div class="exset-title">'+cleanTopicLabel(meta.title||('דף תרגילים — '+meta.topicLabel))+'</div>'
    +'<div class="exset-nameline">שם: ______________________&nbsp;&nbsp;&nbsp; כיתה: ________&nbsp;&nbsp;&nbsp; תאריך: ______________</div>'
    +headExtras(doc)
    +'<div class="qmeta" data-html2canvas-ignore="true"><span class="tag '+meta.cls+'">'+meta.gradeLabel+'</span><span class="tag '+meta.cls+'">'+meta.domainLabel+'</span><span class="tag '+meta.cls+'">'+meta.diffLabel+'</span><span class="tag '+meta.cls+'">'+countLabel+'</span>'+(doc.seed?'<span class="tag seed-tag" title="אותן הגדרות עם אותו קוד יפיקו את אותו המסמך">קוד: '+doc.seed+'</span>':'')+'</div>'
    +notes
    +'<div class="exset-actions" data-html2canvas-ignore="true">'
    +'<button class="btn-key" id="btnAnswerKey" onclick="toggleAnswerKey()">הצג תשובות</button>'
    +'<button class="btn-printset" onclick="printExerciseSet()">הדפס דף תרגילים</button>'
    +'<button class="btn-printset btn-pdf" id="btnPdf" onclick="downloadExerciseSetPdf(this)">הורד PDF</button>'
    +'</div></div>'
    +cards
    +'<div class="answer-key" id="answerKey"><div class="answer-key-title">מפתח תשובות</div>'+keyItems+'</div>'
    +'</div>';
  const out=document.getElementById('out');
  out.innerHTML=html;
  renderMathInElement(out,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false});
  if(typeof applyVisualMode==='function')applyVisualMode();
  const W=window.TargilimWorkbook;
  if(W&&W.book&&typeof out.querySelector==='function')W.book.mount(out.querySelector('#exset'),doc);
}

// Per-question image actions snapshot the whole card (text + diagram + answer
// box) through the unified pipeline in export.js; the buttons carry
// data-html2canvas-ignore so they never appear in the captured image.
// Reset any button left in the "copied" (green) state when the teacher takes
// another action, so exactly one button is green at a time.
function clearImgCopied(){
  document.querySelectorAll('.ex-imgbar .btn-img.is-copied').forEach(function(b){
    b.classList.remove('is-copied');
    if(b.dataset.label) b.textContent=b.dataset.label;
  });
}
function exImageAction(i,btn,fn,labelCopied,labelDone){
  const card=document.getElementById('exCard'+i);if(!card||!btn)return;
  clearImgCopied();
  const prev=btn.dataset.label||btn.textContent;btn.dataset.label=prev;
  btn.disabled=true;btn.textContent='מכין…';
  fn(card,i+1).then(function(res){
    btn.disabled=false;
    if(res==='copied'){btn.textContent=labelCopied;btn.classList.add('is-copied')}
    else{btn.textContent=labelDone;setTimeout(function(){btn.textContent=btn.dataset.label;},1800)}
  }).catch(function(){
    btn.disabled=false;btn.textContent='שגיאה';setTimeout(function(){btn.textContent=btn.dataset.label;},1800);
  });
}
function exImageCopy(i,btn){exImageAction(i,btn,copyExerciseImage,'הועתק ✓','הורד PNG ✓');}
function exImageDownload(i,btn){exImageAction(i,btn,downloadExerciseImage,'הורד ✓','הורד ✓');}

function toggleAnswerKey(){
  const key=document.getElementById('answerKey'),btn=document.getElementById('btnAnswerKey');
  if(!key)return;
  key.classList.toggle('open');
  const open=key.classList.contains('open');
  const set=document.getElementById('exset');
  if(set&&set.classList)set.classList.toggle('show-key',open);
  const W=window.TargilimWorkbook;
  if(W&&W.book&&set&&set.dataset&&set.dataset.paged)W.book.fit(set);
  if(btn)btn.textContent=open?'הסתר תשובות':'הצג תשובות';
}

function printExerciseSet(){window.print()}

function downloadExerciseSetPdf(btn){
  const W=window.TargilimWorkbook,set=document.getElementById('exset');
  if(!W||!W.book||!set)return;
  const label=btn?btn.textContent:'';
  if(btn){btn.disabled=true;btn.textContent='מכין PDF…'}
  W.book.downloadPdf(set).then(function(){if(btn){btn.disabled=false;btn.textContent=label}})
    .catch(function(e){console.error('pdf failed',e);if(btn){btn.disabled=false;btn.textContent='שגיאה ביצירת PDF';setTimeout(function(){btn.textContent=label},2400)}});
}
