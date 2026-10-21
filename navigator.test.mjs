import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import WebSocket from 'ws';
import { start, destination } from './navigator.mjs';

test('addresses use HTTPS, keep ports and paths, and reject executable schemes',()=>{
 assert.equal(destination('example.com:8080/a?q=2'),'https://example.com:8080/a?q=2');
 assert.equal(destination(' http://example.com '),'http://example.com/');
 for(const value of ['javascript:alert(1)','data:text/html,hi','file:///etc/passwd','https://user:pass@example.com',''])assert.throws(()=>destination(value));
});
test('search terms are encoded without becoming URLs',()=>{
 assert.equal(destination('cats & stars'),'https://duckduckgo.com/?q=cats%20%26%20stars');
 assert.equal(destination('two words','google'),'https://www.google.com/search?q=two%20words');
});
test('service delivers assets and source, isolates pages, and checks Wisp origins',async()=>{
 const server=await start(0),origin='http://127.0.0.1:'+server.address().port;
 try{
  for(const path of ['/','/health','/navigator.js','/navigator.css','/destination.js','/sw.js','/scram/scramjet.all.js','/scram/scramjet.wasm.wasm','/libcurl/index.mjs','/baremux/worker.js','/source/navigator.mjs','/source/package.json','/source/package-lock.json','/source/navigator.test.mjs','/source/NAVIGATOR-SETUP.md','/credits',...['scramjet','bare-mux','libcurl-transport','wisp-js','libcurl.js'].map(name=>'/licenses/'+name)]){
   const response=await fetch(origin+path);assert.equal(response.status,200,path);assert.equal(response.headers.get('cross-origin-opener-policy'),'same-origin');assert.equal(response.headers.get('cross-origin-embedder-policy'),'require-corp');
   const text=await response.text();if(path==='/navigator.js')new Script(text.replace("import { destination } from '/destination.js';",''));if(path==='/sw.js')new Script(text);
  }
  assert.equal((await fetch(origin+'/source/.env')).status,404);
  await new Promise((resolve,reject)=>{const socket=new WebSocket(origin.replace('http:','ws:')+'/wisp/',{origin:'https://unrelated.example',handshakeTimeout:3000});socket.on('open',()=>{socket.close();reject(new Error('Foreign origin accepted'))});socket.on('error',resolve)});
  await new Promise((resolve,reject)=>{const socket=new WebSocket(origin.replace('http:','ws:')+'/wisp/',{origin,handshakeTimeout:3000});const timeout=setTimeout(()=>{socket.terminate();reject(new Error('Handshake timed out'))},5000);socket.on('message',()=>{clearTimeout(timeout);socket.close();resolve()});socket.on('error',error=>{clearTimeout(timeout);reject(error)})});
 }finally{await new Promise(resolve=>server.close(resolve))}
});
