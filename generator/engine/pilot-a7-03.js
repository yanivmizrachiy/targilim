// generator/engine/pilot-a7-03.js
// A7-03 First-Degree Equations — Smart Engine
// Source: source-learning/2026-06-09/01_grade-7_algebra_curriculum.learning.md, 08
(function(){
  const E = window.TargilimEngine = window.TargilimEngine || {};
  function tex(s){ return E.fmt && E.fmt.inline ? E.fmt.inline(s) : '$'+s+'$'; }

  const ONE_STEP = [
    {a:1,b:7,c:12,x:5},{a:1,b:-4,c:9,x:13},{a:5,b:0,c:35,x:7},{a:6,b:0,c:42,x:7},{a:1,b:9,c:15,x:6}
  ];
  const TWO_STEP = [
    {a:3,b:5,c:20,x:5},{a:4,b:-3,c:17,x:5},{a:2,b:7,c:19,x:6},{a:5,b:4,c:39,x:7},{a:7,b:-6,c:29,x:5}
  ];
  const PARENS = [
    {k:3,b:2,c:21,x:5},{k:2,b:5,c:18,x:4},{k:4,b:1,c:28,x:6},{k:5,b:3,c:40,x:5}
  ];
  const VERIFY = [
    {a:3,b:5,c:20,x:5,ok:true},{a:2,b:7,c:19,x:5,ok:false},{a:4,b:-3,c:17,x:5,ok:true},{a:5,b:4,c:39,x:8,ok:false}
  ];
  const WORD_EQ = [
    {item:'כדור',pl:'כדורים',n1:15,d:6,n2:18,x:30},{item:'מחברת',pl:'מחברות',n1:8,d:5,n2:10,x:20},
    {item:'ספר',pl:'ספרים',n1:12,d:4,n2:16,x:12},{item:'עט',pl:'עטים',n1:10,d:9,n2:13,x:30}
  ];
  const WORD_BUILD = [
    {item:'כדור', pl:'כדורים', inc:6, newQty:15, oldQty:18, x:30, eq:'15(x+6)=18x', wrong:['15x+6=18x','15(x-6)=18x','18(x+6)=15x']},
    {item:'מחברת', pl:'מחברות', inc:4, newQty:12, oldQty:16, x:12, eq:'12(x+4)=16x', wrong:['12x+4=16x','12(x-4)=16x','16(x+4)=12x']},
    {item:'כרטיס', pl:'כרטיסים', inc:5, newQty:8, oldQty:10, x:20, eq:'8(x+5)=10x', wrong:['8x+5=10x','8(x-5)=10x','10(x+5)=8x']}
  ];
  const GIVEN_SOLUTION = [
    {x:10, eqs:['40x=5x+100','2x-2=x+8','3x+12=100','4x-4=30x+1'], correct:'2x-2=x+8'},
    {x:1, eqs:['5x+2=7','3x-4=10','2x+8=4x','6x=24'], correct:'5x+2=7'},
    {x:5, eqs:['4x+3=23','2x+7=25','3x-2=10','6x=24'], correct:'4x+3=23'}
  ];
  const MISSING_BOX = [
    {x:1, a:2, c:7, box:5, eq:'2x+□=7'},
    {x:3, a:4, c:20, box:8, eq:'4x+□=20'},
    {x:2, a:5, c:17, box:7, eq:'5x+□=17'}
  ];

  function mkEq(sol){ const m=E.randInt?E.randInt(2,6):2+Math.floor(Math.random()*5); const n=1+Math.floor(Math.random()*(m-1)); const a=1+Math.floor(Math.random()*9); return {m:m,n:n,a:a,b:a+sol*(m-n),sol:sol}; }
  function eqLine(o){ const nx=o.n===1?'x':o.n+'x'; return `${o.m}x${o.a>=0?'+'+o.a:''+o.a}=${nx}${o.b>=0?'+'+o.b:''+o.b}`; }
  function caseIdentify(){
    const s=E.pick([6,8,10,12]);
    const opts=[mkEq(s)], usedSol=new Set([s]), usedStr=new Set([eqLine(opts[0])]);
    let guard=0;
    while(opts.length<4 && guard++<40){
      let w; do{ w=E.pick([s-2,s+2,s-4,s+4,s+1,s-1]); }while(usedSol.has(w)||w<1);
      const o=mkEq(w), str=eqLine(o);
      if(usedStr.has(str)) continue;
      usedSol.add(w); usedStr.add(str); opts.push(o);
    }
    return {s:s, opts:E.shuffle(opts)};
  }

  function pickFamily(diff, pick){
    if(diff === 'basic') return pick(['one_step','verify']);
    if(diff === 'challenge') return pick(['parens','two_step','word_eq','identify_eq','word_build','given_solution','missing_box']);
    return pick(['one_step','two_step','parens','verify','word_eq','word_build','given_solution','missing_box']);
  }
  E.selectA703Family = function(diff, qtype, pick){
    const family = pickFamily(diff, pick);
    if(qtype==='tf' && family==='verify') return 'two_step';
    if(qtype!=='mcq' && family==='identify_eq') return 'word_eq';
    return family;
  };
  function pickCase(f){
    if(f==='two_step') return E.pick(TWO_STEP);
    if(f==='parens') return E.pick(PARENS);
    if(f==='verify') return E.pick(VERIFY);
    if(f==='word_eq') return E.pick(WORD_EQ);
    if(f==='identify_eq') return caseIdentify();
    if(f==='word_build') return E.pick(WORD_BUILD);
    if(f==='given_solution') return E.pick(GIVEN_SOLUTION);
    if(f==='missing_box') return E.pick(MISSING_BOX);
    return E.pick(ONE_STEP);
  }
  function eqStr(x,f){
    if(f==='parens') return `${x.k}(x+${x.b})=${x.c}`;
    if(x.a===1) return x.b>=0 ? `x+${x.b}=${x.c}` : `x-${-x.b}=${x.c}`;
    if(x.b===0) return `${x.a}x=${x.c}`;
    return x.b>=0 ? `${x.a}x+${x.b}=${x.c}` : `${x.a}x-${-x.b}=${x.c}`;
  }

  function choices(family,x){
    if(family==='word_build'){
      return E.shuffle([x.eq].concat(x.wrong)).map((v,i)=>({label:['א','ב','ג','ד'][i], text:'$'+v+'$', correct:v===x.eq}));
    }
    if(family==='given_solution'){
      return x.eqs.map((v,i)=>({label:['א','ב','ג','ד'][i], text:'$'+v+'$', correct:v===x.correct}));
    }
    if(family==='missing_box'){
      const values=[x.box,x.box+1,x.box-1,x.c].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4);
      while(values.length<4) values.push(x.box+values.length+2);
      return E.shuffle(values).map((v,i)=>({label:['א','ב','ג','ד'][i], text:'$'+v+'$', correct:v===x.box}));
    }
    if(family==='verify'){
      const c2 = x.ok ? 'כן, פתרון' : 'לא פתרון';
      return E.shuffle([c2, x.ok?'לא פתרון':'כן, פתרון']).map((v,i)=>({label:['א','ב'][i], text:v, correct:v===c2}));
    }
    if(family==='identify_eq'){
      return x.opts.map((o,i)=>({label:['א','ב','ג','ד'][i], text:'$'+eqLine(o)+'$', correct:o.sol===x.s}));
    }
    const correct = x.x;
    const wrongs = family==='word_eq'
      ? [x.x+x.d, x.n1, x.x-x.d].filter(v=>v!==correct && v>0)
      : [x.c-x.b, x.x+1, x.x-1].filter(v=>v!==correct);
    const values=[correct].concat(wrongs).filter((v,i,a)=>a.indexOf(v)===i).slice(0,4);
    while(values.length<4){ let f=correct+values.length+1; while(values.indexOf(f)>=0) f++; values.push(f); }
    return E.shuffle(values).map((v,i)=>({label:['א','ב','ג','ד'][i], text:'$'+v+'$', correct:v===correct}));
  }

  function question(family,x,qtype,tfTrue){
    if(family==='identify_eq') return `איזו מהמשוואות הבאות פתרונה $x=${x.s}$?`;
    if(family==='word_eq'){
      const ctx=`מחיר ${x.item} הוא $x$ שקלים. לאחר התייקרות ב-$${x.d}$ שקלים, מחיר $${x.n1}$ ${x.pl} שווה למחיר $${x.n2}$ ${x.pl} לפני ההתייקרות.`;
      if(qtype==='tf') return `${ctx} פתרון המשוואה הוא $x=${tfTrue?x.x:x.x+x.d}$.`;
      if(qtype==='mistake') return `${ctx} תלמיד בנה את המשוואה $${x.n1}x+${x.d}=${x.n2}x$ — הוסיף את ההתייקרות פעם אחת בלבד במקום לכל ${x.item}.`;
      if(qtype==='mcq') return `${ctx}\nבנו משוואה ומצאו את המחיר המקורי $x$.`;
      return `${ctx}\nבנו משוואה המתארת את המצב ופתרו (מצאו את $x$).`;
    }
    if(family==='word_build'){
      const base=`מחיר ${x.item} היה $x$ שקלים. לאחר התייקרות של $${x.inc}$ שקלים קנו $${x.newQty}$ ${x.pl} באותו סכום שבו קנו קודם $${x.oldQty}$ ${x.pl}.`;
      if(qtype==='mcq') return `${base}\nאיזו משוואה מתאימה לסיפור?`;
      if(qtype==='tf') return `${base} המשוואה המתאימה היא $${tfTrue?x.eq:x.wrong[0]}$.`;
      if(qtype==='mistake') return `${base} תלמיד בנה את המשוואה $${x.wrong[0]}$ כי "צריך רק להוסיף ${x.inc}".`;
      return `${base}\nא. סמנו ב-$x$ את המחיר לפני ההתייקרות ובנו משוואה.\nב. פתרו ובדקו אם התשובה מתאימה להקשר.`;
    }
    if(family==='given_solution'){
      const wrong=x.eqs.find(e=>e!==x.correct);
      if(qtype==='tf') return `המשוואה $${tfTrue?x.correct:wrong}$ היא משוואה שפתרונה $x=${x.x}$.`;
      if(qtype==='mistake') return `תלמיד סימן שהמשוואה $${wrong}$ היא משוואה שפתרונה $x=${x.x}$ בלי להציב ולבדוק.`;
      const prompt = `איזו משוואה פתרונה $x=${x.x}$?`;
      if(qtype==='mcq') return prompt;
      const equations = x.eqs.map(eq => tex(eq)).join('\n');
      return prompt + ' בדקו בהצבה.\n' + equations;
    }
    if(family==='missing_box'){
      if(qtype==='tf') return `במשוואה $${x.eq}$, כדי שהפתרון יהיה $x=${x.x}$ צריך לכתוב במשבצת $${tfTrue?x.box:x.box+1}$.`;
      if(qtype==='mistake') return `במשוואה $${x.eq}$ תלמיד רצה שהפתרון יהיה $x=${x.x}$ וכתב במשבצת $${x.box+1}$, בלי להציב את $x$.`;
      return `מה צריך לכתוב במשבצת במשוואה $${x.eq}$ כדי שהפתרון יהיה $x=${x.x}$?`;
    }
    const eq = eqStr(x,family);
    if(family==='verify'){
      if(qtype==='mistake') return `תלמיד בדק אם $x=${x.x}$ פתרון של $${eq}$ והציב רק באגף שמאל בלי להשוות: "$${x.a}\\cdot ${x.x}${x.b>=0?'+'+x.b:'-'+(-x.b)}=${x.a*x.x+x.b}$ — סיימתי".`;
      return `האם $x=${x.x}$ הוא פתרון של המשוואה $${eq}$? בדקו.`;
    }
    if(qtype==='tf') return `פתרון המשוואה $${eq}$ הוא $x=${tfTrue?x.x:x.x+1}$.`;
    if(qtype==='mistake'){
      if(family==='parens') return `במשוואה $${eq}$ תלמיד פתח סוגריים: "$${x.k}x+${x.b}=${x.c}$".`;
      if(x.b===0) return `במשוואה $${eq}$ תלמיד כתב שהפתרון הוא $x=${x.c}$.`;
      const signedB = x.b > 0 ? '+' + x.b : String(x.b);
      const lhs = x.a === 1 ? 'x' : x.a + 'x';
      return `במשוואה $${eq}$ תלמיד כתב $${lhs}=${x.c}${signedB}$.`;
    }
    return `פתרו את המשוואה ובדקו:\n$$${eq}$$`;
  }

  function answer(family,x,qtype,tfTrue){
    if(family==='identify_eq'){
      const c=x.opts.find(o=>o.sol===x.s), nx=c.n===1?'x':c.n+'x';
      return `המשוואה שפתרונה $x=${x.s}$ היא $${eqLine(c)}$.
$$${c.m}x${c.a>=0?'+'+c.a:''+c.a}=${nx}${c.b>=0?'+'+c.b:''+c.b}$$
מעבירים אגפים: $$(${c.m}-${c.n})x=${c.b-c.a}\\;\\Rightarrow\\;${c.m-c.n}x=${c.b-c.a}\\;\\Rightarrow\\;x=${x.s}$$
בשאר המשוואות הצבת $x=${x.s}$ אינה מאזנת בין שני האגפים.`;
    }
    if(family==='word_eq'){
      let prefix = '';
      if(qtype==='mistake') prefix = 'הטעות: ההתייקרות חלה על כל פריט, ולכן כופלים $(x+'+x.d+')$ במספר הפריטים.\n';
      if(qtype==='tf' && !tfTrue) prefix = 'המחיר שהוצע אינו מקיים את השוויון בין הסכומים.\n';
      return `${prefix}מסמנים את המחיר המקורי ב-$x$; המחיר לאחר התייקרות הוא $x+${x.d}$.
המשוואה: $$${x.n1}(x+${x.d})=${x.n2}x$$
$$${x.n1}x+${x.n1*x.d}=${x.n2}x \\;\\Rightarrow\\; ${x.n1*x.d}=${x.n2-x.n1}x \\;\\Rightarrow\\; x=\\frac{${x.n1*x.d}}{${x.n2-x.n1}}=${x.x}$$
בדיקה: $${x.n1}\\cdot ${x.x+x.d}=${x.n1*(x.x+x.d)}$ ו-$${x.n2}\\cdot ${x.x}=${x.n2*x.x}$ ✓`;
    }
    if(family==='word_build'){
      const prefix = qtype==='mistake' || (qtype==='tf' && !tfTrue) ? 'שגוי — התוספת למחיר חלה על כל אחד מהפריטים אחרי ההתייקרות, ולכן חייבים סוגריים.\n' : '';
      return `${prefix}לפני ההתייקרות מחיר ${x.item} אחד הוא $x$.
אחרי ההתייקרות המחיר הוא $x+${x.inc}$.
הסכום החדש: $${x.newQty}(x+${x.inc})$.
הסכום הישן: $${x.oldQty}x$.
לכן המשוואה:
$$${x.eq}$$
פותרים:
$$${x.newQty}x+${x.newQty*x.inc}=${x.oldQty}x$$
$$${x.newQty*x.inc}=${x.oldQty-x.newQty}x$$
$$x=${x.x}$$
המחיר חיובי ומתאים להקשר.`;
    }
    if(family==='given_solution'){
      const prefix = qtype==='mistake' || (qtype==='tf' && !tfTrue) ? 'שגוי — כשמחפשים משוואה עם פתרון נתון, מציבים את הערך בכל אפשרות ובודקים שני אגפים.\n' : '';
      const checks=x.eqs.map(eq=>{
        let ok=eq===x.correct ? '✓' : '✗';
        return `${tex(eq)} ${ok}`;
      }).join(' ; ');
      return `${prefix}מציבים $x=${x.x}$ בכל משוואה. המשוואה היחידה שמתקיימת היא:
$$${x.correct}$$
בדיקת האפשרויות: ${checks}.`;
    }
    if(family==='missing_box'){
      const prefix = qtype==='mistake' || (qtype==='tf' && !tfTrue) ? 'שגוי — צריך להציב את הפתרון המבוקש ואז לחשב את החסר.\n' : '';
      return `${prefix}מציבים $x=${x.x}$ במשוואה:
$$${x.a}\\cdot ${x.x}+\\Box=${x.c}$$
$$${x.a*x.x}+\\Box=${x.c}$$
ולכן:
$$\\Box=${x.c}-${x.a*x.x}=${x.box}$$`;
    }
    if(family==='verify'){
      const lhs = x.a*x.x + x.b;
      const prefix = qtype==='mistake' ? 'הטעות: בדיקת פתרון דורשת השוואה לאגף ימין, לא רק חישוב.\n' : '';
      return `${prefix}מציבים $x=${x.x}$:\n$$${x.a}\\cdot ${x.x}${x.b>=0?'+'+x.b:'-'+(-x.b)}=${lhs}$$\n${x.ok ? `$${lhs}=${x.c}$ ✓ — אכן פתרון.` : `$${lhs}\\ne ${x.c}$ ✗ — אינו פתרון.`}`;
    }
    const wrong = qtype==='mistake' || (qtype==='tf' && !tfTrue);
    if(family==='parens'){
      const prefix = wrong ? 'שגוי — חוק הפילוג: מכפילים את שני האיברים בסוגריים.\n' : '';
      return `${prefix}$$${x.k}(x+${x.b})=${x.c}$$\n$$${x.k}x+${x.k*x.b}=${x.c}$$\n$$${x.k}x=${x.c-x.k*x.b}$$\n$$x=${x.x}$$\nבדיקה: $${x.k}(${x.x}+${x.b})=${x.k}\\cdot ${x.x+x.b}=${x.c}$ ✓`;
    }
    let prefix = '';
    if(qtype==='mistake') prefix = x.b===0
      ? 'הטעות: כדי לבודד את המשתנה יש לחלק את שני אגפי המשוואה במקדם שלו.\n'
      : 'הטעות: כדי לבטל את האיבר החופשי יש לבצע את הפעולה ההפוכה בשני האגפים.\n';
    if(qtype==='tf' && !tfTrue) prefix = 'הצבת הערך שבטענה נותנת שני אגפים שונים.\n';
    if(x.a===1){
      return `${prefix}$$x=${x.c}${x.b>=0?'-'+x.b:'+'+(-x.b)}=${x.x}$$\nבדיקה: $${x.x}${x.b>=0?'+'+x.b:'-'+(-x.b)}=${x.c}$ ✓`;
    }
    if(x.b===0){
      return `${prefix}$$x=\\frac{${x.c}}{${x.a}}=${x.x}$$\nבדיקה: $${x.a}\\cdot ${x.x}=${x.c}$ ✓`;
    }
    return `${prefix}$$${x.a}x=${x.c}${x.b>=0?'-'+x.b:'+'+(-x.b)}=${x.c-x.b}$$\n$$x=\\frac{${x.c-x.b}}{${x.a}}=${x.x}$$\nבדיקה: $${x.a}\\cdot ${x.x}${x.b>=0?'+'+x.b:'-'+(-x.b)}=${x.c}$ ✓`;
  }

  E.generateA703Engine = function(difficulty, questionType){
    difficulty = difficulty || 'standard'; questionType = questionType || 'open';
    const family = E.selectA703Family(difficulty, questionType, E.pick);
    const x = pickCase(family);
    const tfTrue = questionType==='tf' && Math.random()<0.5;
    const q = question(family,x,questionType,tfTrue), a = answer(family,x,questionType,tfTrue);
    if(questionType==='mcq') return E.questionTypes.mcq({question:q,answer:a,svg:'',choices:choices(family,x)});
    if(questionType==='tf') return E.questionTypes.tf({question:q,answer:a,svg:'',isTrue:tfTrue});
    if(questionType==='mistake') return E.questionTypes.mistake({question:q,answer:a,svg:''});
    return E.questionTypes.open({question:q,answer:a,svg:''});
  };
})();
