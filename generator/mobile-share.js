(function(){
  function isMobile(){return matchMedia('(max-width: 768px)').matches;}
  function toast(msg){var t=document.querySelector('.mobile-toast');if(t)t.remove();t=document.createElement('div');t.className='mobile-toast';t.textContent=msg;document.body.appendChild(t);setTimeout(function(){t.remove();},2600);}
  // the exercise most visible on screen (not always the first one)
  function card(){var best=null,area=0;document.querySelectorAll('.ex-card').forEach(function(el){var r=el.getBoundingClientRect(),h=Math.max(0,Math.min(r.bottom,innerHeight)-Math.max(r.top,0));if(h*r.width>area){area=h*r.width;best=el;}});return best||document.querySelector('.ex-card,.qcard,.engine-card');}
  function blobFromCanvas(c){return new Promise(function(r){c.toBlob(r,'image/png',0.96);});}
  async function render(){var el=card();if(!el)throw new Error('לא נמצא תרגיל');if(typeof html2canvas!=='function')throw new Error('רכיב תמונה לא נטען');return html2canvas(el,{backgroundColor:'#fff',scale:Math.min(3,devicePixelRatio||2),useCORS:true,logging:false});}
  function download(blob){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='targil.png';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1000);}
  async function copyImage(){try{var b=typeof captureExerciseCardAsPng==='function'&&card()?await captureExerciseCardAsPng(card()):await blobFromCanvas(await render());if(navigator.clipboard&&window.ClipboardItem){await navigator.clipboard.write([new ClipboardItem({'image/png':b})]);toast('התמונה הועתקה');return;}download(b);toast('התמונה ירדה כ-PNG');}catch(e){toast(e.message||'שגיאה בהעתקת תמונה');}}
  function mount(){if(!isMobile()||document.querySelector('.mobile-share-dock'))return;var d=document.createElement('div');d.className='mobile-share-dock';d.innerHTML='<button>העתק תמונה</button>';d.children[0].onclick=copyImage;document.body.appendChild(d);}
  window.TargilimMobileShare={copyImage:copyImage};document.addEventListener('DOMContentLoaded',mount);addEventListener('resize',function(){var d=document.querySelector('.mobile-share-dock');if(isMobile()&&!d)mount();if(!isMobile()&&d)d.remove();});
})();
