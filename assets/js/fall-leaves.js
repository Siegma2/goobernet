/* A small, pointer-transparent seasonal effect; never runs offscreen. */
(() => {
 const toggle=document.querySelector('#fall-leaves-toggle');
 if(!toggle)return;
 const layer=document.createElement('div');layer.id='fall-leaves';layer.setAttribute('aria-hidden','true');document.body.append(layer);
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let enabled=localStorage.getItem('gooberFallLeaves')==='on';
 function render(){
  toggle.checked=enabled;layer.replaceChildren();
  const paused=!enabled||motion.matches||document.hidden||document.querySelector('#player:not([hidden])');
  layer.hidden=Boolean(paused);
  document.querySelector('#fall-leaves-status').textContent=enabled?(motion.matches?'Enabled, paused for your reduced-motion preference.':'Autumn leaves are on. Turn them off any time.'):'Autumn leaves are off.';
  if(paused)return;
  for(let i=0;i<18;i++){const leaf=document.createElement('span');leaf.className='fall-leaf';leaf.style.cssText=`--x:${Math.random()*100}vw;--s:${18+Math.random()*18}px;--drift:${Math.random()*160-80}px;--duration:${12+Math.random()*14}s;--delay:${-Math.random()*26}s;--turn:${Math.random()*240-120}deg;--tint:${Math.random()*32-16}deg`;layer.append(leaf);}
 }
 function set(value){enabled=Boolean(value);localStorage.setItem('gooberFallLeaves',enabled?'on':'off');render();}
 toggle.addEventListener('change',()=>set(toggle.checked));motion.addEventListener('change',render);document.addEventListener('visibilitychange',render);
 new MutationObserver(render).observe(document.querySelector('#player'),{attributes:true,attributeFilter:['hidden']});
 window.gooberLeaves={set,get:()=>enabled};render();
})();
