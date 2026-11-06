import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root = path.resolve('dist');
const apps = JSON.parse(fs.readFileSync('apps.lock.json','utf8'));
for(const name of ['icon-192.png','icon-512.png','apple-touch-icon.png','maskable-512.png']) assert(fs.existsSync(path.join(root,'icons',name)),`Missing PWA icon: ${name}`);
let total = 0;
const walk = directory => fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(directory,entry.name)):[path.join(directory,entry.name)]);
for(const file of walk(root)) {
  total += fs.statSync(file).size;
  assert(!/\.map$|\/\.env|\/node_modules\/|\/src\//.test(file),`Unexpected development file: ${file}`);
}
assert(total < 950_000_000,'Site exceeds safe Pages budget');
for(const app of apps) {
  const dir=path.join(root,'tools',app.id);
  const files=walk(dir);
  assert(files.some(f=>f.endsWith('.wasm')),`Missing wasm: ${app.id}`);
  for(const wasm of files.filter(f=>f.endsWith('.wasm'))) {
    const fd=fs.openSync(wasm,'r');const header=Buffer.alloc(4);fs.readSync(fd,header,0,4,0);fs.closeSync(fd);
    assert.equal(header.toString('hex'),'0061736d',`Invalid wasm: ${wasm}`);
  }
  const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
  for(const match of html.matchAll(/(?:src|href)=["'](\.?\/?[^"'#?]+)["']/g)) {
    if (/^https?:|^data:/.test(match[1]))continue;
    assert(fs.existsSync(path.resolve(dir,match[1])),`Broken asset ${app.id}: ${match[1]}`);
  }
  assert(fs.existsSync(path.join(dir,'LICENSE-MIT')),`Missing license: ${app.id}`);
  assert(fs.existsSync(path.join(root,'app-icons',`${app.id}.png`)),`Missing icon: ${app.id}`);
}
const shell = ['index.html','manifest.webmanifest',...walk(path.join(root,'assets')).map(f=>path.relative(root,f)),...walk(path.join(root,'icons')).map(f=>path.relative(root,f))];
const hash=crypto.createHash('sha256');for(const file of shell)hash.update(fs.readFileSync(path.join(root,file)));
const version=hash.digest('hex').slice(0,14);
fs.writeFileSync(path.join(root,'sw.js'),`
const CACHE='navaja-shell-${version}';
const ROOT='/navajaSuiza/';
const SHELL=${JSON.stringify(shell.map(f=>'/navajaSuiza/'+f))};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL))));
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('navaja-shell-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(e.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(ROOT)||url.pathname.startsWith(ROOT+'tools/'))return;
  if(e.request.mode==='navigate')e.respondWith(fetch(e.request).catch(()=>caches.match(ROOT+'index.html')));
  else if(SHELL.includes(url.pathname))e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request)));
});
`);
console.log(`Verified ${apps.length} official apps; ${(total/1_000_000).toFixed(1)} MB. Shell ${version}.`);
