// 0D Navigator service. Original Goobernet UI, licensed under AGPL-3.0-only.
// API references: github.com/MercuryWorkshop/scramjet-app and its upstream types.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { server as wisp, logging } from '@mercuryworkshop/wisp-js/server';
import { scramjetPath } from '@mercuryworkshop/scramjet/path';
import { baremuxPath } from '@mercuryworkshop/bare-mux/node';
import { libcurlPath } from '@mercuryworkshop/libcurl-transport';

const root = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
logging.set_level(logging.NONE);
Object.assign(wisp.options, { allow_udp_streams: false, allow_private_ips: false, allow_loopback_ips: false });

export function destination(input, engine = 'duckduckgo') {
  const text = input.trim();
  if (!text) throw new Error('Type an address or search first.');
  if (/^https?:\/\//i.test(text)) {
    const url = new URL(text);
    if (url.username || url.password) throw new Error('Use an address without a username or password.');
    return url.href;
  }
  if (!/\s/.test(text) && /^[a-z\d-]+(?:\.[a-z\d-]+)+(?:\:\d+)?(?:[/?#]|$)/i.test(text)) {
    return new URL('https://' + text).href;
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(text)) throw new Error('Only HTTP and HTTPS addresses work here.');
  return (engine === 'google' ? 'https://www.google.com/search?q=' : 'https://duckduckgo.com/?q=') + encodeURIComponent(text);
}

const html = String.raw`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>0D Navigator</title><link rel="stylesheet" href="/navigator.css"><script src="/scram/scramjet.all.js"></script><script src="/baremux/index.js"></script><script type="module" src="/navigator.js"></script></head><body>
<header><a class="brand" href="https://siegma2.github.io/goobernet/" target="_blank" rel="noopener noreferrer">0D <small>NAVIGATOR</small></a><div id="tabs" role="tablist" aria-label="Browser tabs"></div><button id="new-tab" aria-label="New tab">+</button></header>
<form id="address-form" class="toolbar"><button type="button" id="back" aria-label="Back">←</button><button type="button" id="forward" aria-label="Forward">→</button><button type="button" id="reload" aria-label="Reload">↻</button><button type="button" id="home" aria-label="Home">⌂</button><input id="address" aria-label="Web address or search" placeholder="Search or enter a web address" autocomplete="off" spellcheck="false"><button type="submit">GO →</button><button type="button" id="bookmark" aria-label="Bookmark this page">☆</button><button type="button" id="settings-open" aria-label="Browser settings">⚙</button></form>
<nav id="bookmarks" aria-label="Bookmarks"></nav><p id="status" role="status" aria-live="polite">Your next internet rabbit hole starts here.</p>
<main id="viewport"><section id="start"><span class="eyebrow">A WINDOW OUT OF DIMENSION ZERO</span><h1>where we going<span>?</span></h1><p>One tab away from something interesting.</p><form id="start-form"><input id="start-address" aria-label="Search from homepage" placeholder="Search the web... :3" autocomplete="off"><button>LET'S GO ↗</button></form><div class="quicklinks"><button data-url="https://en.wikipedia.org/">WIKIPEDIA</button><button data-url="https://www.youtube.com/">YOUTUBE</button><button data-url="https://github.com/">GITHUB</button></div><small>Powered by Scramjet · Some websites may not work yet.</small></section></main>
<dialog id="settings"><form method="dialog"><button class="close" aria-label="Close settings">×</button></form><h2>CREATURE PREFERENCES</h2><label for="engine">SEARCH ENGINE</label><select id="engine"><option value="duckduckgo">DuckDuckGo</option><option value="google">Google</option></select><p>Bookmarks and your search engine stay on this browser. Tabs close when you leave.</p><p>Web requests pass through this browser service. Use a service you trust.</p><a href="/credits">Credits, licenses &amp; source</a></dialog></body></html>`;

const css = String.raw`:root{color-scheme:dark;--bg:#0d060a;--surface:#211019;--accent:#ff9bab;--line:#673342;--text:#fff1f4}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px 'Courier New',monospace;height:100dvh;display:flex;flex-direction:column;overflow:hidden}button,input,select{font:inherit;color:inherit}button{cursor:pointer;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:9px 12px}button:hover,button:focus-visible{border-color:var(--accent);background:#41202f}button:disabled{opacity:.4;cursor:default}a{color:var(--accent)}header{display:flex;align-items:center;gap:12px;padding:12px 14px 0;background:#180b12}.brand{font-size:28px;font-weight:900;text-decoration:none;white-space:nowrap}.brand small{font-size:10px;display:block;letter-spacing:2px}#tabs{display:flex;gap:5px;overflow-x:auto;flex:1;min-width:0;padding:4px 0}.tab{display:flex;flex:0 0 auto;max-width:200px;background:var(--bg);border:1px solid var(--line);border-radius:9px}.tab button{border:0;background:transparent}.tab [role=tab]{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px}.tab:has([aria-selected=true]){border-color:var(--accent);background:#41202f}.toolbar{display:flex;gap:6px;padding:10px 14px;background:#180b12}.toolbar input{min-width:0;flex:1;border:1px solid var(--line);border-radius:8px;background:var(--bg);padding:10px}#bookmarks{display:flex;gap:6px;overflow:auto;padding:0 14px 8px;background:#180b12;min-height:8px}#bookmarks button{white-space:nowrap;font-size:11px;padding:5px 8px}#status{margin:0;padding:7px 16px;color:#c895a3;font-size:11px;border-bottom:1px solid var(--line)}#viewport{flex:1;min-height:0;position:relative;overflow:hidden}#viewport iframe{width:100%;height:100%;border:0;background:white}#viewport iframe[hidden],#start[hidden]{display:none}#start{height:100%;overflow:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:35px 24px;background:radial-gradient(ellipse at 50% 120%,#69253f 0,transparent 65%)}.eyebrow{font-size:10px;letter-spacing:3px;color:var(--accent)}h1{font-size:clamp(35px,7vw,80px);letter-spacing:-5px;margin:25px 0 8px}h1 span{color:var(--accent)}#start p{color:#bb909d}#start-form{display:flex;gap:8px;width:min(650px,100%);margin:22px 0}#start-address{flex:1;min-width:0;padding:16px;background:#211019;border:1px solid var(--line);border-radius:10px}.quicklinks{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin:10px 0 35px}#start small{color:#a77c89;font-size:11px}dialog{max-width:460px;width:calc(100% - 30px);background:var(--surface);color:var(--text);border:1px solid var(--accent);border-radius:14px;padding:24px}dialog::backdrop{background:#000a}dialog label{display:block;margin:20px 0 10px}dialog select{width:100%;padding:10px;background:var(--bg)}dialog p{line-height:1.6;color:#d4aeb9}.close{float:right}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--accent);outline-offset:2px}@media(max-width:650px){.brand small{display:none}.brand{font-size:23px}header{gap:6px}.toolbar{padding:8px;gap:4px;flex-wrap:wrap}.toolbar #address{order:2;flex-basis:70%}.toolbar button[type=submit]{order:3}.toolbar button{padding:8px}h1{letter-spacing:-2px}#start-form{flex-direction:column}}`;

const client = String.raw`
import { destination } from '/destination.js';
const $=selector=>document.querySelector(selector),tabs=[];
let active,proxy,initialization,bookmarks=[];
try{const saved=JSON.parse(localStorage.getItem('odNavigatorBookmarks'));if(Array.isArray(saved))bookmarks=saved.filter(item=>typeof item?.url==='string'&&/^https?:\/\//.test(item.url)).slice(0,40)}catch{}
try{$('#engine').value=localStorage.getItem('odNavigatorEngine')==='google'?'google':'duckduckgo'}catch{}
const status=message=>$('#status').textContent=message;
function save(key,value){try{localStorage.setItem(key,value);return true}catch{status('This browser could not save your preference.');return false}}
async function initialize(){if(initialization)return initialization;initialization=(async()=>{
 if(!isSecureContext||!navigator.serviceWorker)throw new Error('Open this browser over HTTPS (or localhost).');
 if(!window.crossOriginIsolated)throw new Error('The host is missing the required isolation headers.');
 const {ScramjetController}=$scramjetLoadController();
 proxy=new ScramjetController({prefix:'/service/',files:{wasm:'/scram/scramjet.wasm.wasm',all:'/scram/scramjet.all.js',sync:'/scram/scramjet.sync.js'}});await proxy.init();
 await navigator.serviceWorker.register('/sw.js',{scope:'/'});await navigator.serviceWorker.ready;
 if(!navigator.serviceWorker.controller)await new Promise((resolve,reject)=>{const done=()=>{clearTimeout(timer);navigator.serviceWorker.removeEventListener('controllerchange',done);resolve()};const timer=setTimeout(()=>{navigator.serviceWorker.removeEventListener('controllerchange',done);reject(new Error('Worker did not start. Reload and try again.'))},10000);navigator.serviceWorker.addEventListener('controllerchange',done);if(navigator.serviceWorker.controller)done()});
 const connection=new BareMux.BareMuxConnection('/baremux/worker.js');await connection.setTransport('/libcurl/index.mjs',[{websocket:(location.protocol==='https:'?'wss://':'ws://')+location.host+'/wisp/'}]);
 })().catch(error=>{initialization=null;throw error});return initialization}
function label(url){try{return new URL(url).hostname}catch{return 'New tab'}}
function sync(){ $('#tabs').replaceChildren(...tabs.map(tab=>{const row=document.createElement('div'),pick=document.createElement('button'),close=document.createElement('button');row.className='tab';pick.type=close.type='button';pick.role='tab';pick.setAttribute('aria-selected',String(tab===active));pick.tabIndex=tab===active?0:-1;pick.textContent=label(tab.url);pick.title=tab.url||'New tab';pick.onclick=()=>activate(tab);close.textContent='×';close.setAttribute('aria-label','Close '+label(tab.url));close.onclick=()=>closeTab(tab);row.append(pick,close);return row}));$('#address').value=active.url||'';$('#start').hidden=Boolean(active.url);for(const tab of tabs)if(tab.frame)tab.frame.frame.hidden=tab!==active||!tab.url;for(const id of ['back','forward','reload','bookmark'])$('#'+id).disabled=!active.url;$('#bookmark').textContent=bookmarks.some(item=>item.url===active.url)?'★':'☆';$('#new-tab').disabled=tabs.length>=12}
function activate(tab){active=tab;sync();status(tab.error||(tab.loading?'Loading '+label(tab.url)+'...':tab.url||'Your next internet rabbit hole starts here.'))}
function newTab(){if(tabs.length>=12)return;const tab={url:'',frame:null,loading:false,request:0,timer:null};tabs.push(tab);activate(tab);$('#address').focus()}
function closeTab(tab){tab.request++;clearTimeout(tab.timer);tab.frame?.frame.remove();const index=tabs.indexOf(tab);tabs.splice(index,1);if(!tabs.length)newTab();else activate(active===tab?tabs[Math.min(index,tabs.length-1)]:active)}
function monitor(tab){clearTimeout(tab.timer);tab.timer=setTimeout(()=>{if(tab.loading&&tabs.includes(tab)){tab.error='Still loading. The site or service may be unavailable; try reload or another site.';if(tab===active)status(tab.error)}},25000)}
function attach(tab){tab.frame=proxy.createFrame();tab.frame.frame.title='Web content';tab.frame.addEventListener('urlchange',event=>{if(tabs.includes(tab)&&/^https?:\/\//.test(event.url)){tab.url=event.url;if(tab===active)sync()}});tab.frame.addEventListener('navigate',event=>{if(!tabs.includes(tab))return;tab.loading=true;tab.error='';monitor(tab);if(tab===active)status('Loading '+label(event.url)+'...')});tab.frame.frame.addEventListener('load',()=>{if(!tabs.includes(tab))return;tab.loading=false;tab.error='';clearTimeout(tab.timer);try{const current=String(tab.frame.url);if(/^https?:\/\//.test(current))tab.url=current}catch{}if(tab===active){sync();status(tab.url||'Ready')}});$('#viewport').append(tab.frame.frame)}
async function navigate(input){const tab=active;let url;try{url=destination(input,$('#engine').value)}catch(error){status(error.message);return}const request=++tab.request;tab.loading=true;tab.error='';status('Starting browser...');try{await initialize();if(!tabs.includes(tab)||tab.request!==request)return;if(!tab.frame)attach(tab);tab.url=url;tab.frame.go(url);monitor(tab);if(tab===active)activate(tab);else tab.frame.frame.hidden=true}catch(error){if(tabs.includes(tab)&&tab.request===request){tab.loading=false;tab.error=error.message||'Could not start the browser service.';if(tab===active)status(tab.error)}}}
function renderBookmarks(){$('#bookmarks').replaceChildren(...bookmarks.map(item=>{const button=document.createElement('button');button.textContent=label(item.url);button.title=item.url;button.onclick=()=>navigate(item.url);return button}))}
$('#address-form').onsubmit=event=>{event.preventDefault();navigate($('#address').value)};$('#start-form').onsubmit=event=>{event.preventDefault();navigate($('#start-address').value)};$('#new-tab').onclick=newTab;
$('#home').onclick=()=>{active.request++;active.loading=false;active.error='';active.url='';clearTimeout(active.timer);active.frame?.frame.remove();active.frame=null;activate(active)};
for(const [id,method]of [['back','back'],['forward','forward'],['reload','reload']])$('#'+id).onclick=()=>{try{active.frame?.[method]()}catch{status('Navigation failed. Enter the address again.')}};
$('#bookmark').onclick=()=>{if(!active.url)return;const index=bookmarks.findIndex(item=>item.url===active.url);if(index>=0)bookmarks.splice(index,1);else{if(bookmarks.length>=40){status('40 bookmarks already! Unstar one first.');return}bookmarks.push({url:active.url})}save('odNavigatorBookmarks',JSON.stringify(bookmarks));renderBookmarks();sync()};
$('#settings-open').onclick=()=>$('#settings').showModal();$('#engine').onchange=()=>save('odNavigatorEngine',$('#engine').value);document.querySelectorAll('[data-url]').forEach(button=>button.onclick=()=>navigate(button.dataset.url));
$('#tabs').onkeydown=event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();activate(tabs[(tabs.indexOf(active)+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length]);$('#tabs [aria-selected=true]').focus()};newTab();renderBookmarks();
`;
const worker = String.raw`importScripts('/scram/scramjet.all.js');const {ScramjetServiceWorker}=$scramjetLoadWorker();const proxy=new ScramjetServiceWorker();self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));self.addEventListener('fetch',event=>event.respondWith((async()=>{await proxy.loadConfig();return proxy.route(event)?proxy.fetch(event):fetch(event.request)})()));`;

const credits = '<!doctype html><html lang="en"><meta charset="utf-8"><title>0D credits</title><body><h1>0D Navigator</h1><p>Original Goobernet browser UI, licensed AGPL-3.0-only. SomethingOS was inspected for architecture, not copied.</p><p>Uses Mercury Workshop Scramjet (MIT), BareMux (MIT), libcurl transport (AGPL-3.0), Wisp (AGPL-3.0), and libcurl.js (AGPL-3.0).</p><ul>'+['scramjet','bare-mux','libcurl-transport','wisp-js','libcurl.js'].map(name=>'<li><a href="/licenses/'+name+'">'+name+' license</a></li>').join('')+'</ul><p>Complete application source: <a href="/source/navigator.mjs">navigator.mjs</a>, <a href="/source/package.json">package.json</a>, <a href="/source/package-lock.json">dependency lock</a>, <a href="/source/navigator.test.mjs">tests</a>, <a href="/source/NAVIGATOR-SETUP.md">setup</a>. <a href="https://github.com/MercuryWorkshop">Dependency sources</a>.</p><a href="/">Back</a></body></html>';

const assets = [['/scram/',scramjetPath],['/baremux/',baremuxPath],['/libcurl/',libcurlPath]];
const mime={'.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.json':'application/json','.map':'application/json','.css':'text/css'};
async function respond(req,res){
 res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
 const send=(body,type='text/plain; charset=utf-8',code=200)=>{res.writeHead(code,{'Content-Type':type});res.end(body)};
 if(!['GET','HEAD'].includes(req.method))return send('Method not allowed',undefined,405);
 let path;try{path=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{return send('Invalid path',undefined,400)}
 if(path==='/')return send(html,'text/html; charset=utf-8');
 if(path==='/navigator.css')return send(css,'text/css');
 if(path==='/navigator.js')return send(client,'text/javascript');
 if(path==='/destination.js')return send('export '+destination.toString(),'text/javascript');
 if(path==='/sw.js'){res.setHeader('Cache-Control','no-cache');return send(worker,'text/javascript')}
 if(path==='/health')return send(JSON.stringify({ok:true,service:'goobernet-navigator'}),'application/json');
 if(path==='/credits')return send(credits,'text/html; charset=utf-8');
 try{
  if(path.startsWith('/source/')){const name=path.slice(8);if(!['navigator.mjs','package.json','package-lock.json','navigator.test.mjs','NAVIGATOR-SETUP.md'].includes(name))return send('Not found',undefined,404);return send(await readFile(resolve(root,name)))}
  if(path.startsWith('/licenses/')){const name=path.slice(10);if(!['scramjet','bare-mux','libcurl-transport','wisp-js','libcurl.js'].includes(name))return send('Not found',undefined,404);const folder=name==='libcurl.js'?resolve(root,'node_modules/libcurl.js'):resolve(root,'node_modules/@mercuryworkshop',name);return send(await readFile(resolve(folder,'LICENSE')))}
  for(const[prefix,folder]of assets){if(!path.startsWith(prefix))continue;const file=resolve(folder,path.slice(prefix.length));if(!file.startsWith(resolve(folder)+sep))return send('Not found',undefined,404);return send(await readFile(file),mime[extname(file)]||'application/octet-stream')}
 }catch{return send('Not found',undefined,404)}
 return send('Not found',undefined,404);
}
export async function start(port=Number(process.env.PORT||8080),host=process.env.HOST||'127.0.0.1'){
 const server=createServer((req,res)=>{respond(req,res).catch(()=>{if(!res.headersSent)res.writeHead(500);res.end('Service error')})});
 server.on('upgrade',(req,socket,head)=>{let origin;try{origin=new URL(req.headers.origin)}catch{socket.destroy();return}if(req.url!=='/wisp/'||origin.host!==req.headers.host||!['http:','https:'].includes(origin.protocol)){socket.destroy();return}wisp.routeRequest(req,socket,head)});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve)});return server;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const server=await start();console.log('0D Navigator listening on port '+server.address().port);
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
