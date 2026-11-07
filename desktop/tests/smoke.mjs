import {_electron as electron} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'omnidesk-qa-'));
fs.mkdirSync('test-results',{recursive:true});
const results=[];
async function launch(){return electron.launch({...(process.env.OMNIDESK_EXE?{executablePath:process.env.OMNIDESK_EXE}:{}),args:[...(process.env.OMNIDESK_EXE?[]:['.']),...(process.platform==='linux'?['--no-sandbox','--ozone-platform=headless']:[]),'--use-angle=swiftshader','--enable-unsafe-swiftshader'],env:{...process.env,OMNIDESK_TEST_PROFILE:profile},timeout:60000});}
let application;
try{
 application=await launch();
 let page=await application.firstWindow();
 page.on('dialog',d=>d.accept().catch(()=>{}));
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.locator('.tool-card').first().waitFor();
 assert.equal(await page.locator('.tool-card').count(),16);
 assert.equal(await page.title(),'OmniDesk — Tu espacio de trabajo');
 assert.equal(await page.evaluate(()=>typeof window.require),'undefined');
 await page.locator('#search').fill('Word-FJ');assert.equal(await page.locator('.tool-card').count(),1);
 await page.locator('[data-favorite="wordcraft"]').click();
 await page.locator('#search').fill('');
 await page.locator('.list-view').click();assert(await page.locator('#tools').evaluate(e=>e.classList.contains('list-layout')));
 await page.locator('.grid-view').click();
 await page.evaluate(()=>document.getAnimations().forEach(a=>a.finish()));
 await page.screenshot({path:'test-results/OmniDesk-Windows.png',fullPage:true});
 await application.evaluate(({BrowserWindow})=>{for(const w of BrowserWindow.getAllWindows()){w.forceClose=true;w.destroy();}});
 await application.close();
 application=await launch();application.process().on('exit',(code,signal)=>console.log('ELECTRON EXIT',code,signal));application.process().stderr.on('data',d=>fs.appendFileSync('test-results/electron.log',d));page=await application.firstWindow();page.on('dialog',d=>d.accept().catch(()=>{}));
 await page.locator('[data-favorite="wordcraft"].is-favorite').waitFor();
 // No HTTP network is needed for installed tools or the launcher.
 await page.route(/^https?:/,route=>route.abort());
 const ids=await page.locator('[data-open]').evaluateAll(es=>es.map(e=>e.dataset.open));
 for(const id of ids){
   if(process.env.OMNIDESK_ONLY && id!==process.env.OMNIDESK_ONLY)continue;
   await page.locator(`[data-open="${id}"]`).click();
   try{
     await page.waitForFunction(()=>['Lista para trabajar','No pudo iniciar','Se produjo un error'].includes(document.querySelector('.workspace-state')?.textContent),{},{timeout:90000});
     const status=await page.locator('.workspace-state').textContent();
     const frame=page.frames().find(f=>f.url().includes(`/tools/${id}/`));
     const detail=frame?await frame.locator('body').innerText().catch(()=>''):'';
     results.push({id,status,detail:detail.slice(-900)});
     console.log(id,status);
     await page.screenshot({path:`test-results/${id}.png`});
   }catch(e){results.push({id,status:'timeout',error:String(e)});console.log(id,'timeout');}
   await page.locator('.workspace-close').click();
   if(await page.locator('[data-leave]').isVisible())await page.locator('[data-leave]').click();
   await page.locator('#workspace').waitFor({state:'hidden'});
 }
 assert.equal(errors.length,0,errors.join('\n'));
 assert.equal(results.filter(r=>r.status==='Lista para trabajar').length,process.env.OMNIDESK_ONLY?1:16,JSON.stringify(results,null,2));
 console.log('PASS: 16 offline editors, search, favorites persistence, views and renderer isolation.');
}finally{
 fs.writeFileSync('test-results/smoke.json',JSON.stringify(results,null,2));
 if(application){await application.evaluate(({BrowserWindow})=>{for(const w of BrowserWindow.getAllWindows()){w.forceClose=true;w.destroy();}}).catch(()=>{});await application.close().catch(()=>{});}
}
