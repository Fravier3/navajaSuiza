import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {EventEmitter} from 'node:events';
const {prepareExecutable,createOmnigetLauncher}=createRequire(import.meta.url)('../electron/omniget.cjs');
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'omniget-unit-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const bundled=path.join(root,'bundled.exe'),folder=path.join(root,'profile');
 fs.writeFileSync(bundled,'verified engine');
 return {bundled,folder,expected:crypto.createHash('sha256').update('verified engine').digest('hex')};
}
test('reopening reuses the verified executable without overwriting a locked file or profile',t=>{
 const f=fixture(t),exe=prepareExecutable(f.bundled,f.folder,f.expected);
 fs.writeFileSync(path.join(f.folder,'settings.json'),'user settings');
 const marker=path.join(f.folder,'portable.txt');
 fs.utimesSync(exe,1000,1000);fs.utimesSync(marker,1000,1000);
 const copy=fs.copyFileSync;
 fs.copyFileSync=()=>{throw Object.assign(new Error('locked'),{code:'EBUSY'});};
 try{assert.equal(prepareExecutable(f.bundled,f.folder,f.expected),exe);}
 finally{fs.copyFileSync=copy;}
 assert.equal(fs.statSync(exe).mtimeMs,1000000);
 assert.equal(fs.statSync(marker).mtimeMs,1000000);
 assert.equal(fs.readFileSync(path.join(f.folder,'settings.json'),'utf8'),'user settings');
});
test('rejects a corrupt bundle and repairs an outdated installed copy',t=>{
 const f=fixture(t),exe=prepareExecutable(f.bundled,f.folder,f.expected);
 fs.writeFileSync(exe,'older engine');
 prepareExecutable(f.bundled,f.folder,f.expected);
 assert.equal(fs.readFileSync(exe,'utf8'),'verified engine');
 fs.writeFileSync(f.bundled,'corrupt');
 assert.throws(()=>prepareExecutable(f.bundled,f.folder,f.expected),/verificación/);
 assert.equal(fs.readFileSync(exe,'utf8'),'verified engine');
});
test('concurrent launches share one spawn and retry after spawn failure',async t=>{
 const f=fixture(t);let count=0,fail=true;
 const spawn=()=>{count++;const c=Object.assign(new EventEmitter(),{exitCode:null,signalCode:null,unref(){}});
 queueMicrotask(()=>c.emit(fail?'error':'spawn',new Error('spawn failed')));return c;};
 const open=createOmnigetLauncher({...f,spawn});
 const first=open();assert.equal(open(),first);
 await assert.rejects(first,/spawn failed/);
 fail=false;await Promise.all([open(),open(),open()]);await open();
 assert.equal(count,2);
 // A new Arsenal session has no child reference but must reuse the same file.
 await createOmnigetLauncher({...f,spawn})();assert.equal(count,3);
});
