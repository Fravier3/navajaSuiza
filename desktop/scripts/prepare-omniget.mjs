import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const folder = path.resolve('native/omniget');
await fs.mkdir(folder,{recursive:true});
const url='https://github.com/OpenSelena/omniget/releases/download/v0.15.1/omniget_0.15.1_x64-portable.exe';
const expected='b08853dc6e38bc3626e1c1cd407ffa842143a5b0554742e7a10ad819b70f8906';
const response=await fetch(url);if(!response.ok)throw Error(`OmniGet download: ${response.status}`);
const bytes=Buffer.from(await response.arrayBuffer());
if(createHash('sha256').update(bytes).digest('hex')!==expected)throw Error('OmniGet checksum mismatch');
await fs.writeFile(path.join(folder,'OmniGet.exe'),bytes);
for(const [name,url] of [['LICENSE','https://raw.githubusercontent.com/OpenSelena/omniget/ee980281130972b42c3b266cba2b2dbfbedd155b/LICENSE'],['omniget-v0.15.1-source.tar.gz','https://codeload.github.com/OpenSelena/omniget/tar.gz/ee980281130972b42c3b266cba2b2dbfbedd155b']]){
 const res=await fetch(url);if(!res.ok)throw Error(`${name}: ${res.status}`);
 await fs.writeFile(path.join(folder,name),Buffer.from(await res.arrayBuffer()));
}
await fs.writeFile(path.join(folder,'NOTICE.txt'),'OmniGet-FJ is an Arsenal launcher name. The bundled OmniGet 0.15.1 binary is unmodified, provided by OpenSelena under GPL-3.0. Corresponding source archive and license are included here. Source: https://github.com/OpenSelena/omniget/tree/ee980281130972b42c3b266cba2b2dbfbedd155b\n');
console.log('OmniGet 0.15.1 verified; binary, license and source included.');
