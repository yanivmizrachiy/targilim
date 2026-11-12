(function(){
  const E = window.TargilimEngine = window.TargilimEngine || {};

  // Central math-formatting helpers. Every math token embedded in Hebrew text
  // must go through these (or be hand-wrapped KaTeX) — never raw "B=80°"/"-4"
  // inside an RTL sentence.
  E.fmt = {
    inline: function(tex){ return '$' + tex + '$'; },
    block: function(tex){ return '$$' + tex + '$$'; },
    deg: function(v){ return '$' + v + '^\\circ$'; },
    angle: function(label, value){
      return value == null
        ? '$\\sphericalangle ' + label + '$'
        : '$\\sphericalangle ' + label + '=' + value + '^\\circ$';
    },
    eq: function(left, right){ return '$' + left + '=' + right + '$'; },
    signed: function(n){ return n < 0 ? '(' + n + ')' : '' + n; },
    point: function(x, y){ return '$(' + x + ',' + y + ')$'; }
  };

  function texifyRawExpr(raw){
    return String(raw).trim()
      .replace(/π/g, '\\pi ')
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/·/g, '\\cdot ')
      .replace(/\s+/g, '');
  }

  function protectMathBidi(value){
    return String(value == null ? '' : value)
      .split(/(\$\$[\s\S]*?\$\$|\$[^$]*\$|<svg[\s\S]*?<\/svg>|<table[\s\S]*?<\/table>|<[^>]+>)/gi)
      .map(function(part){
        if(!part || /^\$\$[\s\S]*\$\$$/.test(part) || /^\$[^$]*\$/.test(part) || /^</.test(part)) return part;
        return part
          .replace(/(\d+(?:\.\d+)?)\s*°C/g, function(_, n){ return '$' + n + '^\\circ\\mathrm{C}$'; })
          .replace(/(\d+(?:\.\d+)?)\s*°/g, function(_, n){ return '$' + n + '^\\circ$'; })
          .replace(/(^|[\s(])-(\d+(?:\.\d+)?)/g, function(_, prefix, n){ return prefix + '$-' + n + '$'; })
          .replace(/\b([A-Za-z][A-Za-z0-9π²³^·+\-*/() ]{0,34}=\s*[A-Za-z0-9π²³^·+\-*/() ]{1,40})/g, function(_, expr){
            return '$' + texifyRawExpr(expr) + '$';
          });
      })
      .join('');
  }

  // One guard for every engine's multiple choice: never two options with the
  // same text (a merged duplicate keeps the correct flag); letters re-assigned.
  // Options are not invented here — a near value could also be a right answer.
  const LABELS = ['א','ב','ג','ד','ה','ו'];
  function normalizeChoices(choices){
    const out = [];
    (choices || []).forEach(function(c){
      const key = String(c.text).replace(/\s+/g, ' ').trim();
      const prev = out.find(function(o){ return o.key === key; });
      if(prev){ prev.correct = prev.correct || !!c.correct; return; }
      out.push({ key: key, text: c.text, correct: !!c.correct });
    });
    return out.map(function(c, i){ return { label: LABELS[i], text: c.text, correct: c.correct }; });
  }
  E.normalizeChoices = normalizeChoices;

  E.questionTypes = {
    open: function(o){ return { questionHTML:(o.svg?'<div class="diagram">'+o.svg+'</div>':'')+'<div class="qtext">'+protectMathBidi(o.question)+'</div>', answerHTML:protectMathBidi(o.answer) }; },
    mcq: function(o){
      o.choices = normalizeChoices(o.choices);
      const html = o.choices.map(c=>'<div class="mcq-choice '+(c.correct?'mcq-correct':'')+'"><span class="mcq-label">'+c.label+'.</span> '+protectMathBidi(c.text)+'</div>').join('');
      return { questionHTML:(o.svg?'<div class="diagram">'+o.svg+'</div>':'')+'<div class="qtext">'+protectMathBidi(o.question)+'</div><div class="mcq-choices">'+html+'</div>', answerHTML:protectMathBidi(o.answer) };
    },
    tf: function(o){ return { questionHTML:(o.svg?'<div class="diagram">'+o.svg+'</div>':'')+'<div class="qtext tf-statement"><span class="tf-label">נכון / שגוי:</span> '+protectMathBidi(o.question)+'</div>', answerHTML:'<div class="tf-verdict">'+(o.isTrue?'✓ נכון':'✗ שגוי')+'</div>\n'+protectMathBidi(o.answer) }; },
    mistake: function(o){ return { questionHTML:(o.svg?'<div class="diagram">'+o.svg+'</div>':'')+'<div class="mistake-prompt">מצאו את הטעות בפתרון הבא:</div><div class="qtext mistake-box">'+protectMathBidi(o.question)+'</div>', answerHTML:protectMathBidi(o.answer) }; }
  };
})();
