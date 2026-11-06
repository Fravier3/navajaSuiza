import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalog, findApps } from '../src/services/catalog.js';
import { readPreferences } from '../src/services/storage.js';
test('User-requested office, CAD and audio tools are launchable distributions',()=>{
  for(const id of ['pdfcraft','wordcraft','gridcraft','deckcraft','cadcraft','soundcraft']){
    const app=catalog.find(a=>a.id===id);assert(app?.url.startsWith('https://github.com/storytold/'));assert.match(app.sha256,/^[a-f0-9]{64}$/);
  }
  assert.equal(new Set(catalog.map(a=>a.id)).size,16);
});
test('Search handles Spanish accents and combines category with favorites',()=>{
  assert(findApps({query:'calculo'}).some(a=>a.id==='gridcraft'));
  assert.deepEqual(findApps({category:'Documentos',favoritesOnly:true,favorites:['pdfcraft','filmcraft']}).map(a=>a.id),['pdfcraft']);
  assert.equal(findApps({query:'there is no such editor'}).length,0);
});
test('Corrupt or unavailable storage does not break the launcher',()=>{
  assert.deepEqual(readPreferences({getItem(){throw new Error('blocked')}}).favorites,[]);
  assert.equal(readPreferences({getItem(){return '{broken'}}).theme,'light');
  const data=readPreferences({getItem(){return JSON.stringify({favorites:['pdfcraft',12],recent:Array(10).fill('wordcraft'),theme:'unknown',view:'list'})}});
  assert.deepEqual(data.favorites,['pdfcraft']);assert.equal(data.recent.length,6);assert.equal(data.theme,'light');assert.equal(data.view,'list');
});
