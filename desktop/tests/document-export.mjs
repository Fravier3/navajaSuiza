import {_electron as electron} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'omni-document-'));
const output=path.resolve('test-results/document-export');fs.mkdirSync(output,{recursive:true});
const app=await electron.launch({...(process.env.OMNIDESK_EXE?{executablePath:process.env.OMNIDESK_EXE}:{}),args:[...(process.env.OMNIDESK_EXE?[]:['.']),...(process.platform==='linux'?['--no-sandbox','--ozone-platform=headless']:[]),'--use-angle=swiftshader','--enable-unsafe-swiftshader'],env:{...process.env,OMNIDESK_TEST_PROFILE:profile}});
try{
 await app.evaluate(({session},out)=>{session.defaultSession.on('will-download',(_e,item)=>item.setSavePath(out+'/'+item.getFilename()));},output);
 const page=await app.firstWindow();await page.locator('[data-open=wordcraft]').click();
 await page.waitForFunction(()=>document.querySelector('.workspace-state')?.textContent==='Lista para trabajar',{}, {timeout:90000});
 const frame=page.frames().find(f=>f.url().includes('/tools/wordcraft/'));
 await frame.locator('canvas').click({position:{x:300,y:200}});
 await page.keyboard.type('OmniDesk - Prueba de documento y exportacion.');
 await page.screenshot({path:'test-results/word-edit.png'});
 await frame.evaluate(()=>{window.showSaveFilePicker=undefined;});
 await page.keyboard.press('Control+s');
 await page.waitForTimeout(2000);
 await page.screenshot({path:'test-results/word-save.png'});
 const doc=path.join(output,'Document1.docx');
 assert(fs.statSync(doc).size>1000);
 execFileSync(process.platform==='win32'?'python':'python3',['-c',"import sys,zipfile; t=zipfile.ZipFile(sys.argv[1]).read('word/document.xml').decode(); assert 'OmniDesk' in t and 'exportacion' in t",doc]);
 console.log('PASS: created, edited and exported a DOCX with verified text.');
}finally{await app.evaluate(({BrowserWindow})=>{for(const w of BrowserWindow.getAllWindows()){w.forceClose=true;w.destroy();}}).catch(()=>{});await app.close().catch(()=>{});}
