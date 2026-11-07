import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import {catalog,findApps} from '../src/services/catalog.js';
import {readPreferences} from '../src/services/storage.js';
const {resolveAsset}=createRequire(import.meta.url)('../electron/paths.cjs');
test('Windows names preserve the 16 pinned engines and searchable aliases',()=>{
 assert.equal(catalog.length,16);assert.equal(new Set(catalog.map(a=>a.id)).size,16);
 for(const a of catalog){assert(a.menuName.endsWith('-FJ'));assert.match(a.sha256,/^[a-f0-9]{64}$/);}
 assert.equal(findApps({query:'Adobe Pro-FJ'})[0].id,'pdfcraft');
 assert.equal(findApps({query:'Word-FJ'})[0].id,'wordcraft');
 assert.equal(findApps({query:'calculo'})[0].id,'gridcraft');
 assert.equal(findApps({favoritesOnly:true,favorites:['wordcraft']}).length,1);
});
test('Local protocol rejects traversal and foreign origins',()=>{
 const root=path.resolve('dist'),tools=path.resolve('tools');
 assert.equal(resolveAsset('omnidesk://app/index.html',root,tools),path.join(root,'index.html'));
 assert.equal(resolveAsset('omnidesk://app/tools/pdfcraft/app.wasm',root,tools),path.join(tools,'pdfcraft/app.wasm'));
 for(const u of ['https://app/index.html','omnidesk://evil/index.html','omnidesk://app/%2e%2e%2fsecret','omnidesk://app/%00','omnidesk://app/a%5cb'])assert.throws(()=>resolveAsset(u,root,tools));
});
test('Corrupt preferences do not prevent opening the desktop',()=>{
 assert.equal(readPreferences({getItem(){return '{bad'}}).theme,'dark');
 assert.deepEqual(readPreferences({getItem(){throw Error('blocked')}}).favorites,[]);
});
