import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const root=import.meta.dirname;
const pin='cf5e79e919144200294fb9fed22a222592a0aeea';
const repo=path.join(root,'.upstream');
if(!fs.existsSync(path.join(repo,'.git'))){fs.mkdirSync(repo,{recursive:true});execFileSync('git',['init',repo]);execFileSync('git',['-C',repo,'remote','add','origin','https://github.com/opencut-app/opencut-classic.git']);}
execFileSync('git',['-C',repo,'fetch','--depth','1','origin',pin],{stdio:'inherit'});
execFileSync('git',['-C',repo,'checkout','--detach',pin],{stdio:'inherit'});
for(const [from,to] of [['apps/web/src','upstream-src'],['apps/web/public','public'],['LICENSE','LICENSE-MIT']])fs.cpSync(path.join(repo,from),path.join(root,to),{recursive:true});
const prefixes=['/fonts/','/effects/','/flags','/logos/','/platform-guides/','/shapes/'];
function patch(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())patch(file);else if(/\.(tsx?|css)$/.test(file)){let content=fs.readFileSync(file,'utf8');for(const prefix of prefixes)content=content.replaceAll('"'+prefix,'"/tools/capcut-fj'+prefix).replaceAll('`'+prefix,'`/tools/capcut-fj'+prefix);fs.writeFileSync(file,content);}}}
patch(path.join(root,'upstream-src'));
const brand=path.join(root,'upstream-src/site/brand.ts');
fs.writeFileSync(brand,fs.readFileSync(brand,'utf8').replace('/tools/capcut-fj/logos/opencut/svg/logo.svg','/tools/capcut-fj/capcut-fj.png'));
fs.copyFileSync(path.join(root,'../public/app-icons/capcut-fj.png'),path.join(root,'public/capcut-fj.png'));
fs.copyFileSync(path.join(root,'LICENSE-MIT'),path.join(root,'public/LICENSE-MIT'));
console.log('OpenCut Classic pinned:',pin);
