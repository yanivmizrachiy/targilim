// generator/engine/pilot-u7-01.js
// U7-01 Frequency Table — Smart Engine
// Source: source-learning/2026-06-09/06_uncertainty_domain_curriculum_examples.learning.md
(function(){
  const E = window.TargilimEngine = window.TargilimEngine || {};

  const TABLES = [
    {vals:[60,70,80,90,100], counts:[4,5,6,3,2], total:20, label:'ציון'},
    {vals:[55,65,75,85,95],  counts:[3,4,8,3,2], total:20, label:'ציון'},
    {vals:[1,2,3,4,5],       counts:[2,5,6,4,3], total:20, label:'מספר אחים'},
    {vals:[0,1,2,3],         counts:[6,8,4,2],   total:20, label:'מספר חוגים'}
  ];

  function pickFamily(diff){
    if(diff === 'basic') return E.pick(['read_freq','most_frequent','rel_freq']);
    if(diff === 'challenge') return E.pick(['raw_to_table','missing_freq','total_check','rel_freq']);
    return E.pick(['read_freq','most_frequent','total_check','missing_freq','rel_freq','raw_to_table']);
  }
  function gcd(a,b){ return b ? gcd(b,a%b) : a; }

  function setup(family){
    const t = E.pick(TABLES);
    const idx = Math.floor(Math.random()*t.vals.length);
    return {t:t, idx:idx};
  }

  function tableSvg(t, hideIdx){
    const rows = t.vals.map((v,i)=>[v, hideIdx==='all' || hideIdx===i ? '?' : t.counts[i]]);
    return E.freqTableHtml([t.label,'תדירות'], rows);
  }

  function rawList(t){
    const xs = [];
    t.vals.forEach((v,i)=>{ for(let k=0;k<t.counts[i];k++) xs.push(v); });
    return E.shuffle(xs);
  }

  function choices(family,s){
    const t=s.t, idx=s.idx;
    if(family==='raw_to_table'){
      const c=t.counts[idx];
      const counts = [c, c-1, c+1, c+2];
      return E.shuffle(counts).map((count,i)=>({
        label:['א','ב','ג','ד'][i], text:'$'+count+'$', correct:count===c
      }));
    }
    if(family==='rel_freq'){
      const c=t.counts[idx], p=Math.round(c*100/t.total);
      const opts=[
        {text:'$'+p+'\\%$', correct:true},
        {text:'$'+c+'$', correct:false},
        {text:'$'+(100-p)+'\\%$', correct:false},
        {text:'$'+(p+5)+'\\%$', correct:false}
      ];
      return E.shuffle(opts).map((o,i)=>({label:['א','ב','ג','ד'][i], text:o.text, correct:o.correct}));
    }
    let correct, wrongs;
    if(family==='read_freq'){ correct=t.counts[idx]; wrongs=[t.vals[idx], t.counts[idx]+1, t.total]; }
    else if(family==='most_frequent'){
      const maxC=Math.max.apply(null,t.counts);
      correct=t.vals[t.counts.indexOf(maxC)];
      wrongs=t.vals.filter(v=>v!==correct).slice(0,3);
    }
    else if(family==='total_check'){ correct=t.total; wrongs=[t.total-1, t.total+2, t.vals.reduce((a,b)=>a+b,0)]; }
    else {
      correct=t.counts[idx];
      const others=t.total - correct;
      wrongs=[others, correct+2, t.total];
    }
    const values=[correct].concat(wrongs).filter((v,i,a)=>a.indexOf(v)===i).slice(0,4);
    while(values.length<4){ let f=correct+values.length; while(values.indexOf(f)>=0) f++; values.push(f); }
    return E.shuffle(values).map((v,i)=>({label:['א','ב','ג','ד'][i], text:'$'+v+'$', correct:v===correct}));
  }

  function question(family,s,qtype,tfTrue){
    const t=s.t, idx=s.idx;
    if(family==='raw_to_table'){
      const list = rawList(t).join(', ');
      if(qtype==='tf') return `ברשימת הנתונים $${list}$, התדירות של ${t.label} $${t.vals[idx]}$ היא $${tfTrue?t.counts[idx]:t.counts[idx]+1}$.`;
      if(qtype==='mistake') return `לפניכם נתונים: $${list}$. תלמיד טען: "בטבלת שכיחויות כותבים כל ערך פעם אחת, לכן התדירות של כל ערך היא 1".`;
      if(qtype==='mcq') return `לפניכם נתונים: $${list}$. מה השכיחות של הערך $${t.vals[idx]}$ בטבלת השכיחויות?`;
      return `לפניכם נתונים:\n$${list}$\nא. ארגנו את הנתונים בטבלת שכיחויות.\nב. חשבו תדירות יחסית של ${t.label} $${t.vals[idx]}$.`;
    }
    if(family==='rel_freq'){
      const c=t.counts[idx];
      if(qtype==='tf') return tfTrue
        ? `התדירות היחסית של ${t.label} $${t.vals[idx]}$ היא $${Math.round(c*100/t.total)}\\%$.`
        : `התדירות היחסית של ${t.label} $${t.vals[idx]}$ היא $${c}$, כי זו התדירות הרשומה בטבלה.`;
      if(qtype==='mistake') return `תלמיד טען: "התדירות היחסית של ${t.label} $${t.vals[idx]}$ היא $${c}$ — פשוט קוראים מהטבלה".`;
      if(qtype==='mcq') return `מה התדירות היחסית של ${t.label} $${t.vals[idx]}$?`;
      return `מה התדירות היחסית של ${t.label} $${t.vals[idx]}$?\nהביעו אותה כשבר, כמספר עשרוני וכאחוז.`;
    }
    if(family==='read_freq'){
      if(qtype==='tf') return `לפי הטבלה, התדירות של ${t.label} $${t.vals[idx]}$ היא $${tfTrue?t.counts[idx]:t.counts[idx]+1}$.`;
      if(qtype==='mistake'){
        const value = t.vals[idx], count = t.counts[idx];
        const claim = value === count ? t.counts[(idx+1)%t.counts.length] : value;
        return `תלמיד קרא מהטבלה: "השכיחות של הערך $${value}$ היא $${claim}$".`;
      }
      return `לפניכם טבלת תדירות.\nמה התדירות של ${t.label} $${t.vals[idx]}$?`;
    }
    if(family==='most_frequent'){
      const maxC=Math.max.apply(null,t.counts);
      const minC=Math.min.apply(null,t.counts);
      if(qtype==='tf') return `ה${t.label} השכיח ביותר בטבלה הוא $${t.vals[t.counts.indexOf(tfTrue?maxC:minC)]}$.`;
      if(qtype==='mistake') return `תלמיד טען: "השכיח ביותר הוא $${Math.max.apply(null,t.vals)}$ — הערך הגדול ביותר בטבלה".`;
      return `לפי הטבלה — מהו ה${t.label} השכיח ביותר?`;
    }
    if(family==='total_check'){
      if(qtype==='tf') return `סך כל הנבדקים בטבלה הוא $${tfTrue?t.total:t.total+2}$.`;
      if(qtype==='mistake') return `תלמיד חישב סך נבדקים: "$${t.vals.join('+')}=${t.vals.reduce((a,b)=>a+b,0)}$" — חיבר את הערכים.`;
      return `כמה נבדקים יש בסך הכל לפי הטבלה?`;
    }
    // missing_freq
    if(qtype==='tf') return `בטבלה חסרה תדירות אחת. אם סך הנבדקים $${t.total}$, התדירות החסרה היא $${tfTrue?t.counts[idx]:t.counts[idx]+1}$.`;
    if(qtype==='mistake') return `סך הנבדקים $${t.total}$ ותדירות אחת חסרה. תלמיד כתב: "החסרה היא $${t.total}$ פחות הערך $${t.vals[idx]}$".`;
    return `סך כל הנבדקים הוא $${t.total}$, ובטבלה חסרה תדירות אחת (מסומנת ?).\nמה התדירות החסרה?`;
  }

  function answer(family,s,qtype,tfTrue){
    const t=s.t, idx=s.idx;
    const wrong = qtype==='mistake' || (qtype==='tf' && !tfTrue);
    if(family==='raw_to_table'){
      const c=t.counts[idx], g=gcd(c,t.total), fn=c/g, fd=t.total/g;
      if(qtype==='mcq') return `הערך $${t.vals[idx]}$ מופיע ברשימה $${c}$ פעמים, ולכן זו השכיחות שלו.`;
      const table = E.freqTableHtml([t.label,'תדירות'], t.vals.map((v,i)=>[v,t.counts[i]]));
      const rel = `\\frac{${c}}{${t.total}}` + (g>1 ? `=\\frac{${fn}}{${fd}}` : '') + `=${Math.round(c*100/t.total)}\\%`;
      const prefix = wrong ? 'שגוי — בטבלת שכיחויות לא מסתפקים בהופעה אחת של כל ערך; סופרים כמה פעמים כל ערך הופיע ברשימה.\n' : '';
      return `${prefix}${table}\nלתדירות היחסית של ${t.label} $${t.vals[idx]}$:\n$$${rel}$$`;
    }
    if(family==='rel_freq'){
      const c=t.counts[idx], g=gcd(c,t.total), fn=c/g, fd=t.total/g;
      const dec=c/t.total, p=Math.round(c*100/t.total);
      const prefix = wrong ? `שגוי — $${c}$ היא התדירות המוחלטת (הספירה). תדירות יחסית היא החלק מתוך הסך הכול: תדירות ÷ סך הנבדקים.\n` : 'תדירות יחסית = תדירות ÷ סך הנבדקים:\n';
      const steps = g>1 ? `\\frac{${c}}{${t.total}}=\\frac{${fn}}{${fd}}=${dec}=${p}\\%` : `\\frac{${c}}{${t.total}}=${dec}=${p}\\%`;
      return `${prefix}$$${steps}$$`;
    }
    if(family==='read_freq'){
      const prefix = wrong ? 'שגוי — קוראים את השכיחות בעמודה המתאימה, באותה שורה שבה מופיע הערך.\n' : '';
      return `${prefix}בשורת ${t.label} $${t.vals[idx]}$ — התדירות היא $${t.counts[idx]}$.`;
    }
    if(family==='most_frequent'){
      const maxC=Math.max.apply(null,t.counts);
      const v=t.vals[t.counts.indexOf(maxC)];
      const prefix = wrong ? 'שגוי — שכיח נקבע לפי התדירות הגבוהה ביותר, לא לפי הערך הגדול ביותר.\n' : '';
      return `${prefix}התדירות הגבוהה ביותר היא $${maxC}$, השייכת ל${t.label} $${v}$.\nה${t.label} השכיח: $${v}$.`;
    }
    if(family==='total_check'){
      const prefix = wrong ? 'שגוי — סך הנבדקים הוא סכום התדירויות, לא סכום הערכים.\n' : '';
      return `${prefix}$$${t.counts.join('+')}=${t.total}$$\nסך הנבדקים: $${t.total}$.`;
    }
    const others = t.counts.filter((c,i)=>i!==idx);
    const prefix = wrong ? 'שגוי — מחסרים מסך הנבדקים את סכום התדירויות הידועות.\n' : '';
    return `${prefix}סכום התדירויות הידועות: $${others.join('+')}=${t.total - t.counts[idx]}$.\n$$${t.total}-${t.total - t.counts[idx]}=${t.counts[idx]}$$\nהתדירות החסרה: $${t.counts[idx]}$.`;
  }

  E.generateU701Engine = function(difficulty, questionType){
    difficulty = difficulty || 'standard'; questionType = questionType || 'open';
    const family = pickFamily(difficulty);
    const s = setup(family);
    const svg = tableSvg(s.t, family==='raw_to_table' ? 'all' : (family==='missing_freq' ? s.idx : -1));
    const tfTrue = questionType==='tf' && Math.random()<0.5;
    const q = question(family,s,questionType,tfTrue), a = answer(family,s,questionType,tfTrue);
    if(questionType==='mcq') return E.questionTypes.mcq({question:q,answer:a,svg:svg,choices:choices(family,s)});
    if(questionType==='tf') return E.questionTypes.tf({question:q,answer:a,svg:svg,isTrue:tfTrue});
    if(questionType==='mistake') return E.questionTypes.mistake({question:q,answer:a,svg:svg});
    return E.questionTypes.open({question:q,answer:a,svg:svg});
  };
})();
