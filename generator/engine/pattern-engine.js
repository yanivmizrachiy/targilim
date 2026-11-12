(function(){
  const E = window.TargilimEngine = window.TargilimEngine || {};
  const ENGINE_TOPIC_IDS = [
    'G7-01-ENGINE','G7-02-ENGINE','G7-03-ENGINE','G7-04-ENGINE',
    'N7-03-ENGINE','N7-04-ENGINE','N7-05-ENGINE','N7-06-ENGINE','N7-07-ENGINE',
    'A7-01-ENGINE','A7-02-ENGINE','A7-03-ENGINE',
    'U7-01-ENGINE','U7-02-ENGINE',
    'G8-01-ENGINE','G8-04-ENGINE',
    'N8-01-ENGINE','N8-02-ENGINE','N8-03-ENGINE','N8-04-ENGINE','N8-05-ENGINE',
    'A8-02-ENGINE','A8-03-ENGINE',
    'U8-01-ENGINE','U8-02-ENGINE'
  ];

  if(!document.querySelector('link[href^="engine/engine.css"]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='engine/engine.css?v=20260616a';
    document.head.appendChild(link);
  }

  function ensureN804Loaded(cb){
    if(typeof E.generateN804Engine === 'function') { cb(); return; }
    if(document.querySelector('script[src="engine/pilot-n8-04.js"]')){
      setTimeout(()=>ensureN804Loaded(cb),100);
      return;
    }
    const s=document.createElement('script');
    s.src='engine/pilot-n8-04.js';
    s.onload=cb;
    s.onerror=function(){ console.error('Failed to load engine/pilot-n8-04.js'); };
    document.body.appendChild(s);
  }

  E.renderEngineCard = function(id,title,result){
    const cid='q'+Date.now(), aid='a'+Date.now();
    const grade=id.charAt(1);
    const dom=id.charAt(0);
    const gradeTag=grade==='8'?'כיתה ח׳':'כיתה ז׳';
    const domainTag=dom==='N'?'מספרי':dom==='A'?'אלגברי':dom==='U'?'אי-ודאות':'גאומטריה';
    const cls=dom==='N'?'num':dom==='A'?'alg':dom==='U'?'unc':'geo';
    if(typeof setMainTitle==='function') setMainTitle(cls,title);
    document.getElementById('out').innerHTML = `<div class="qcard engine-card" id="${cid}">
      <div class="qmeta"><span class="tag ${cls}">${gradeTag}</span><span class="tag ${cls}">${domainTag}</span></div>
      ${result.questionHTML}
      <button class="btn-ans" onclick="document.getElementById('${aid}').classList.toggle('open')">הצג פתרון</button>
      <div class="answer" id="${aid}">${result.answerHTML}</div>
      <div class="expbar" data-html2canvas-ignore="true"><button class="btn-exp" onclick="copyImg('${cid}',this)">העתק כתמונה</button><button class="btn-exp" onclick="dlPNG('${cid}',this)">PNG</button><button class="btn-exp" onclick="window.print()">הדפס</button><span class="expstat" id="st-${cid}"></span></div>
    </div>`;
    renderMathInElement(document.getElementById('out'),{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false});
    if(typeof applyVisualMode==='function') applyVisualMode();
  };

  // Structured access to the 25 existing engine generators (no math logic duplicated).
  // Used by the exercise-set runtime layer; renderEngineCard above stays for single-card mode.
  const ENGINE_FN = {
    'G7-01-ENGINE':['generateG701Engine','מלבן ותיבה'],
    'G7-02-ENGINE':['generateG702Engine','שטחי מצולעים'],
    'G7-03-ENGINE':['generateG703Engine','משפט פיתגורס'],
    'G7-04-ENGINE':['generateG704Engine','זווית חסרה'],
    'N7-03-ENGINE':['generateN703Engine','מספרים שליליים'],
    'N7-04-ENGINE':['generateN704Engine','חיבור וחיסור מכוונים'],
    'N7-05-ENGINE':['generateN705Engine','כפל וחילוק מכוונים'],
    'N7-06-ENGINE':['generateN706Engine','חזקות'],
    'N7-07-ENGINE':['generateN707Engine','שורש ריבועי'],
    'A7-01-ENGINE':['generateA701Engine','ביטויים אלגבריים'],
    'A7-02-ENGINE':['generateA702Engine','הצבה בביטוי'],
    'A7-03-ENGINE':['generateA703Engine','משוואות מדרגה ראשונה'],
    'U7-01-ENGINE':['generateU701Engine','טבלת תדירות'],
    'U7-02-ENGINE':['generateU702Engine','הסתברות בסיסית'],
    'G8-01-ENGINE':['generateG801Engine','עיגול'],
    'G8-04-ENGINE':['generateG804Engine','דמיון משולשים'],
    'N8-01-ENGINE':['generateN801Engine','יחס'],
    'N8-02-ENGINE':['generateN802Engine','פרופורציה'],
    'N8-03-ENGINE':['generateN803Engine','קנה מידה'],
    'N8-04-ENGINE':['generateN804Engine','אחוזים סטטיים'],
    'N8-05-ENGINE':['generateN805Engine','אחוזים דינמיים'],
    'A8-02-ENGINE':['generateA802Engine','שיפוע ומשוואת ישר'],
    'A8-03-ENGINE':['generateA803Engine','מערכת משוואות'],
    'U8-01-ENGINE':['generateU801Engine','ממוצע, חציון, טווח'],
    'U8-02-ENGINE':['generateU802Engine','הסתברות מטבלה']
  };

  E.ENGINE_TOPIC_IDS = ENGINE_TOPIC_IDS.slice();
  E.isEngineTopic = function(id){ return ENGINE_TOPIC_IDS.indexOf(id) >= 0; };

  E.getEngineExercise = function(id, diff, qtype){
    const meta = ENGINE_FN[id];
    if(!meta || typeof E[meta[0]] !== 'function') return null;
    const result = E[meta[0]](diff || 'standard', qtype || 'open');
    if(!result || !result.questionHTML || !result.answerHTML) return null;
    const grade = id.charAt(1), dom = id.charAt(0);
    let correctLabel = null;
    if(qtype === 'mcq'){
      const m = result.questionHTML.match(/mcq-choice mcq-correct"><span class="mcq-label">([^<]+)\./);
      if(m) correctLabel = m[1];
    }
    return {
      id: id,
      title: meta[1],
      qtype: qtype || 'open',
      gradeTag: grade === '8' ? 'כיתה ח׳' : 'כיתה ז׳',
      domainTag: dom === 'N' ? 'מספרי' : dom === 'A' ? 'אלגברי' : dom === 'U' ? 'אי-ודאות' : 'גאומטריה',
      cls: dom === 'N' ? 'num' : dom === 'A' ? 'alg' : dom === 'U' ? 'unc' : 'geo',
      questionHTML: result.questionHTML,
      answerHTML: result.answerHTML,
      correctLabel: correctLabel,
      questionFamily: result.questionFamily || null
    };
  };

  E.updatePanel = function(){
    const st = document.getElementById('st');
    const panel = document.getElementById('enginePanel');
    if(panel && st) panel.style.display = E.isEngineTopic(st.value) ? 'block' : 'none'; // full registry (all 50), not the first 25
  };

  if(typeof TOPICS !== 'undefined' && TOPICS[7] && TOPICS[7].geometry && !TOPICS[7].geometry.some(t=>t[0]==='G7-03-ENGINE')){
    TOPICS[7].geometry.push(['G7-03-ENGINE','פיתגורס — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[8] && TOPICS[8].numeric && !TOPICS[8].numeric.some(t=>t[0]==='N8-01-ENGINE')){
    TOPICS[8].numeric.push(['N8-01-ENGINE','יחס — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[8] && TOPICS[8].numeric && !TOPICS[8].numeric.some(t=>t[0]==='N8-02-ENGINE')){
    TOPICS[8].numeric.push(['N8-02-ENGINE','פרופורציה — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[8] && TOPICS[8].numeric && !TOPICS[8].numeric.some(t=>t[0]==='N8-04-ENGINE')){
    TOPICS[8].numeric.push(['N8-04-ENGINE','אחוזים סטטיים — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[8] && TOPICS[8].numeric && !TOPICS[8].numeric.some(t=>t[0]==='N8-03-ENGINE')){
    TOPICS[8].numeric.push(['N8-03-ENGINE','קנה מידה — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[8] && TOPICS[8].numeric && !TOPICS[8].numeric.some(t=>t[0]==='N8-05-ENGINE')){
    TOPICS[8].numeric.push(['N8-05-ENGINE','אחוזים דינמיים — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[7] && TOPICS[7].geometry && !TOPICS[7].geometry.some(t=>t[0]==='G7-01-ENGINE')){
    TOPICS[7].geometry.push(['G7-01-ENGINE','מלבן ותיבה — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[7] && TOPICS[7].geometry && !TOPICS[7].geometry.some(t=>t[0]==='G7-02-ENGINE')){
    TOPICS[7].geometry.push(['G7-02-ENGINE','שטחי מצולעים — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[7] && TOPICS[7].geometry && !TOPICS[7].geometry.some(t=>t[0]==='G7-04-ENGINE')){
    TOPICS[7].geometry.push(['G7-04-ENGINE','זווית חסרה — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[8] && TOPICS[8].geometry && !TOPICS[8].geometry.some(t=>t[0]==='G8-01-ENGINE')){
    TOPICS[8].geometry.push(['G8-01-ENGINE','עיגול — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[8] && TOPICS[8].geometry && !TOPICS[8].geometry.some(t=>t[0]==='G8-04-ENGINE')){
    TOPICS[8].geometry.push(['G8-04-ENGINE','דמיון משולשים — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[7] && TOPICS[7].numeric && !TOPICS[7].numeric.some(t=>t[0]==='N7-03-ENGINE')){
    TOPICS[7].numeric.push(['N7-03-ENGINE','מספרים שליליים — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[7] && TOPICS[7].numeric && !TOPICS[7].numeric.some(t=>t[0]==='N7-04-ENGINE')){
    TOPICS[7].numeric.push(['N7-04-ENGINE','חיבור וחיסור מכוונים — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[7] && TOPICS[7].numeric && !TOPICS[7].numeric.some(t=>t[0]==='N7-05-ENGINE')){
    TOPICS[7].numeric.push(['N7-05-ENGINE','כפל וחילוק מכוונים — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[7] && TOPICS[7].numeric && !TOPICS[7].numeric.some(t=>t[0]==='N7-06-ENGINE')){
    TOPICS[7].numeric.push(['N7-06-ENGINE','חזקות — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[7] && TOPICS[7].numeric && !TOPICS[7].numeric.some(t=>t[0]==='N7-07-ENGINE')){
    TOPICS[7].numeric.push(['N7-07-ENGINE','שורש ריבועי — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[7] && TOPICS[7].algebra && !TOPICS[7].algebra.some(t=>t[0]==='A7-01-ENGINE')){
    TOPICS[7].algebra.push(['A7-01-ENGINE','ביטויים אלגבריים — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[7] && TOPICS[7].algebra && !TOPICS[7].algebra.some(t=>t[0]==='A7-02-ENGINE')){
    TOPICS[7].algebra.push(['A7-02-ENGINE','הצבה בביטוי — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[7] && TOPICS[7].algebra && !TOPICS[7].algebra.some(t=>t[0]==='A7-03-ENGINE')){
    TOPICS[7].algebra.push(['A7-03-ENGINE','משוואות מדרגה ראשונה — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[7] && TOPICS[7].uncertainty && !TOPICS[7].uncertainty.some(t=>t[0]==='U7-01-ENGINE')){
    TOPICS[7].uncertainty.push(['U7-01-ENGINE','טבלת תדירות — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[7] && TOPICS[7].uncertainty && !TOPICS[7].uncertainty.some(t=>t[0]==='U7-02-ENGINE')){
    TOPICS[7].uncertainty.push(['U7-02-ENGINE','הסתברות בסיסית — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[8] && TOPICS[8].algebra && !TOPICS[8].algebra.some(t=>t[0]==='A8-02-ENGINE')){
    TOPICS[8].algebra.push(['A8-02-ENGINE','שיפוע ומשוואת ישר — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[8] && TOPICS[8].algebra && !TOPICS[8].algebra.some(t=>t[0]==='A8-03-ENGINE')){
    TOPICS[8].algebra.push(['A8-03-ENGINE','מערכת משוואות — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[8] && TOPICS[8].uncertainty && !TOPICS[8].uncertainty.some(t=>t[0]==='U8-01-ENGINE')){
    TOPICS[8].uncertainty.push(['U8-01-ENGINE','ממוצע, חציון, טווח — גרסה חכמה ✦',1]);
  }
  if(typeof TOPICS !== 'undefined' && TOPICS[8] && TOPICS[8].uncertainty && !TOPICS[8].uncertainty.some(t=>t[0]==='U8-02-ENGINE')){
    TOPICS[8].uncertainty.push(['U8-02-ENGINE','הסתברות מטבלה — גרסה חכמה ✦',1]);
  }

  generators['G7-03-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    const result = E.generateG703Engine(diff, qtype);
    E.renderEngineCard('G7-03-ENGINE','פיתגורס — גרסה חכמה',result);
  };

  generators['N8-01-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    const result = E.generateN801Engine(diff, qtype);
    E.renderEngineCard('N8-01-ENGINE','יחס — גרסה חכמה',result);
  };

  generators['N8-02-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    const result = E.generateN802Engine(diff, qtype);
    E.renderEngineCard('N8-02-ENGINE','פרופורציה — גרסה חכמה',result);
  };

  generators['N8-04-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    ensureN804Loaded(function(){
      const result = E.generateN804Engine(diff, qtype);
      E.renderEngineCard('N8-04-ENGINE','אחוזים סטטיים — גרסה חכמה',result);
    });
  };

  generators['N8-03-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    const result = E.generateN803Engine(diff, qtype);
    E.renderEngineCard('N8-03-ENGINE','קנה מידה — גרסה חכמה',result);
  };

  generators['N8-05-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    const result = E.generateN805Engine(diff, qtype);
    E.renderEngineCard('N8-05-ENGINE','אחוזים דינמיים — גרסה חכמה',result);
  };

  generators['G7-01-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    E.renderEngineCard('G7-01-ENGINE','מלבן ותיבה — גרסה חכמה', E.generateG701Engine(diff, qtype));
  };

  generators['G7-02-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    E.renderEngineCard('G7-02-ENGINE','שטחי מצולעים — גרסה חכמה', E.generateG702Engine(diff, qtype));
  };

  generators['G7-04-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    E.renderEngineCard('G7-04-ENGINE','זווית חסרה — גרסה חכמה', E.generateG704Engine(diff, qtype));
  };

  generators['G8-01-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    E.renderEngineCard('G8-01-ENGINE','עיגול — גרסה חכמה', E.generateG801Engine(diff, qtype));
  };

  generators['G8-04-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    E.renderEngineCard('G8-04-ENGINE','דמיון משולשים — גרסה חכמה', E.generateG804Engine(diff, qtype));
  };

  generators['N7-03-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    E.renderEngineCard('N7-03-ENGINE','מספרים שליליים — גרסה חכמה', E.generateN703Engine(diff, qtype));
  };

  generators['N7-04-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    E.renderEngineCard('N7-04-ENGINE','חיבור וחיסור מכוונים — גרסה חכמה', E.generateN704Engine(diff, qtype));
  };

  generators['N7-05-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    E.renderEngineCard('N7-05-ENGINE','כפל וחילוק מכוונים — גרסה חכמה', E.generateN705Engine(diff, qtype));
  };

  generators['N7-06-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    E.renderEngineCard('N7-06-ENGINE','חזקות — גרסה חכמה', E.generateN706Engine(diff, qtype));
  };

  generators['N7-07-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    E.renderEngineCard('N7-07-ENGINE','שורש ריבועי — גרסה חכמה', E.generateN707Engine(diff, qtype));
  };

  generators['A7-01-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    E.renderEngineCard('A7-01-ENGINE','ביטויים אלגבריים — גרסה חכמה', E.generateA701Engine(diff, qtype));
  };

  generators['A7-02-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    E.renderEngineCard('A7-02-ENGINE','הצבה בביטוי — גרסה חכמה', E.generateA702Engine(diff, qtype));
  };

  generators['A7-03-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    E.renderEngineCard('A7-03-ENGINE','משוואות — גרסה חכמה', E.generateA703Engine(diff, qtype));
  };

  generators['U7-01-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    E.renderEngineCard('U7-01-ENGINE','טבלת תדירות — גרסה חכמה', E.generateU701Engine(diff, qtype));
  };

  generators['U7-02-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    E.renderEngineCard('U7-02-ENGINE','הסתברות בסיסית — גרסה חכמה', E.generateU702Engine(diff, qtype));
  };

  generators['A8-02-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    E.renderEngineCard('A8-02-ENGINE','שיפוע ומשוואת ישר — גרסה חכמה', E.generateA802Engine(diff, qtype));
  };

  generators['A8-03-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    E.renderEngineCard('A8-03-ENGINE','מערכת משוואות — גרסה חכמה', E.generateA803Engine(diff, qtype));
  };

  generators['U8-01-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    E.renderEngineCard('U8-01-ENGINE','ממוצע חציון טווח — גרסה חכמה', E.generateU801Engine(diff, qtype));
  };

  generators['U8-02-ENGINE'] = function(){
    const diff = document.getElementById('selDiff')?.value || document.getElementById('sl')?.value || 'standard';
    const qtype = document.getElementById('selQType')?.value || 'open';
    E.renderEngineCard('U8-02-ENGINE','הסתברות מטבלה — גרסה חכמה', E.generateU802Engine(diff, qtype));
  };

  const oldOnDomain = window.onDomain;
  window.onDomain = function(){ oldOnDomain(); E.updatePanel(); };
  const oldOnGrade = window.onGrade;
  window.onGrade = function(){ oldOnGrade(); E.updatePanel(); };
  window.addEventListener('DOMContentLoaded', function(){
    const st = document.getElementById('st');
    if(st) st.addEventListener('change', E.updatePanel);
    E.updatePanel();
  });
})();
