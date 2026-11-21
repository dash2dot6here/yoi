/* Two independent, sequential nights. No records or night counts are merged. */
window.configureNightModules=()=>{
 if(new URLSearchParams(location.search).get("legacy")!=="1")return;
 const params=new URLSearchParams(location.search),embedded=params.get('module')==='saturday';
 const english=()=>document.documentElement.lang.startsWith('en');
 const badge=document.createElement('div');badge.className='module-night-badge';$('#nightSwitch').replaceWith(badge);
 const updateBadge=()=>{badge.textContent=english()?(state.night?'SATURDAY · 21:00 → SUNDAY 05:00':'WEDNESDAY · 21:00 → THURSDAY 05:00'):(state.night?'周六夜 · 21:00 → 周日05:00':'周三夜 · 21:00 → 周四05:00');};
 const originalRender=window.renderStory;
 window.renderStory=()=>{originalRender();updateBadge();};updateBadge();
 const heading=document.createElement('header');heading.className='night-module-heading';heading.innerHTML='<span class="eyebrow"></span><h2></h2><p></p>';
 $('#nightStory').before(heading);
 const labels=()=>{heading.querySelector('.eyebrow').textContent=state.night?'SATURDAY NIGHT':'WEDNESDAY NIGHT';heading.querySelector('h2').textContent=english()?(state.night?'A Saturday night in Changsha':'A Wednesday night in Changsha'):(state.night?'周六夜的长沙':'周三夜的长沙');heading.querySelector('p').textContent=english()?'Each night is calculated separately. Use the controls to explore this module.':'本模块独立计算；以下筛选只影响这一晚。';};labels();
 const languageObserver=new MutationObserver(labels);languageObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 if(embedded){
  document.body.classList.add('story-module');document.documentElement.style.setProperty('--host-height',(Number(params.get('screen'))||722)+'px');
  const tell=()=>parent.postMessage({type:'night-module-height',height:Math.ceil(document.body.scrollHeight)},location.origin);
  new ResizeObserver(tell).observe(document.body);requestAnimationFrame(tell);
  const go=target=>{parent.postMessage({type:'night-module-scroll',offset:target.getBoundingClientRect().top+scrollY},location.origin);};
  $$('.chapter-bridge').forEach(link=>link.onclick=e=>{e.preventDefault();const sections=$$('.story-section'),i=sections.indexOf(link.closest('.story-section'));const next=sections.slice(i+1).find(s=>getComputedStyle(s).display!=='none');if(next)go(next);});
  window.scrollStoryTo=tab=>go(tab==='method'?$('#storyMethods'):tab==='explore'?$('#q4'):$('#q1'));
  addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent)return;const d=e.data;if(d.type==='night-module-language'){state.lang=d.lang;translate();}if(d.type==='night-module-screen'){document.documentElement.style.setProperty('--host-height',d.height+'px');tell();}});
  // The host scrolls this expanded module, so every chapter is available immediately.
  $$('.story-section').forEach(el=>el.classList.add('is-visible'));
  return;
 }
 const navNight=document.createElement('span');navNight.className='nav-night-label';$('.topbar nav').append(navNight);let showingSaturday=false;const setNavNight=()=>{const intro=document.querySelector('#cityModule'),introActive=intro&&intro.getBoundingClientRect().top<=110&&intro.getBoundingClientRect().bottom>100;navNight.textContent=introActive?'03:00 overview':english()?(showingSaturday?'Saturday night':'Wednesday night'):(showingSaturday?'周六夜':'周三夜');};setNavNight();
 const weekend=document.createElement('section');weekend.id='weekendModule';weekend.className='weekend-module';
 const frame=document.createElement('iframe');frame.title='周六夜的长沙 / Saturday night in Changsha';frame.src='?module=saturday&night=1&screen='+innerHeight;frame.className='night-module-frame';frame.setAttribute('scrolling','no');weekend.append(frame);$('#nightStory').after(weekend);
 const next=document.createElement('a');next.className='module-next';next.href='#weekendModule';next.textContent='继续看周六夜 ↓';$('#q7').append(next);
 const syncLanguage=()=>{labels();setNavNight();next.textContent=english()?'Continue to Saturday night ↓':'继续看周六夜 ↓';frame.contentWindow?.postMessage({type:'night-module-language',lang:state.lang},location.origin);};
 new MutationObserver(syncLanguage).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});frame.onload=syncLanguage;
 addEventListener('resize',()=>frame.contentWindow?.postMessage({type:'night-module-screen',height:innerHeight},location.origin));
 addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==frame.contentWindow)return;const d=e.data;if(d.type==='night-module-height'&&Number.isFinite(d.height))frame.style.height=d.height+'px';if(d.type==='night-module-scroll'&&Number.isFinite(d.offset)){const top=frame.getBoundingClientRect().top+scrollY+d.offset-60;scrollTo({top,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}});
 let pending=false;const updateControls=()=>{const b=weekend.getBoundingClientRect();showingSaturday=b.top<=110&&b.bottom>100;$('.controls').classList.toggle('outside-active-module',showingSaturday);setNavNight();};addEventListener('scroll',()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{updateControls();pending=false;});},{passive:true});
};
