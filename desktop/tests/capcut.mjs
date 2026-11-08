import {_electron as electron} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'capcut-qa-'));
fs.mkdirSync('test-results',{recursive:true});
const output=path.resolve('test-results/capcut-export.mp4');
const application=await electron.launch({...(process.env.ARSENAL_EXE?{executablePath:process.env.ARSENAL_EXE}:{}),args:[...(process.env.ARSENAL_EXE?[]:['.']),...(process.platform==='linux'?['--no-sandbox','--ozone-platform=headless']:[]),'--use-angle=swiftshader','--enable-unsafe-swiftshader'],env:{...process.env,ARSENAL_TEST_PROFILE:profile},timeout:60000});
try{
 const page=await application.firstWindow();
 await page.setViewportSize({width:1600,height:1000});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:/,r=>r.abort());
 await application.evaluate(({session},output)=>{globalThis.capcutDownload=null;session.defaultSession.on('will-download',(_event,item)=>{item.setSavePath(output);item.once('done',(_event,state)=>{globalThis.capcutDownload=state;});});},output);
 await page.locator('[data-open="capcut-fj"]').click();
 const frame=page.frameLocator('iframe');
 await frame.getByRole('button',{name:'Create your first project'}).click({timeout:30000});
 await frame.getByRole('button',{name:'Close',exact:true}).click({timeout:60000});
 await frame.locator('input[type=file]').setInputFiles('public/app-icons/capcut-fj.png');
 const media=frame.getByRole('img',{name:'capcut-fj.png',exact:true});
 await media.waitFor();
 await media.locator('xpath=ancestor::div[contains(@class,"group")][1]').getByRole('button').click({force:true});
 await frame.getByText('00:00:05:00',{exact:true}).waitFor();
 await frame.getByRole('button',{name:'Export',exact:true}).click();
 await frame.getByRole('button',{name:'Export',exact:true}).last().click();
 const deadline=Date.now()+180000;
 let state;
 while(Date.now()<deadline){state=await application.evaluate(()=>globalThis.capcutDownload);if(state)break;await page.waitForTimeout(1000);}
 assert.equal(state,'completed','Video export must complete');
 const bytes=fs.readFileSync(output);assert(bytes.length>1000);assert.equal(bytes.subarray(4,8).toString(),'ftyp');
 await page.screenshot({path:'test-results/capcut-editor.png'});
 assert.deepEqual(errors,[]);
 // Reopen the local editor and confirm both project and imported media survive.
 const url=await frame.locator('body').evaluate(()=>location.href);
 await page.frames().find(f=>f.url()===url).goto(url);
 await frame.getByRole('img',{name:'capcut-fj.png',exact:true}).waitFor({timeout:60000});
 await frame.getByText('00:00:05:00',{exact:true}).waitFor();
 fs.writeFileSync('test-results/capcut.json',JSON.stringify({offline:true,projectPersistence:true,mediaImport:true,mp4ExportBytes:bytes.length,rendererErrors:errors},null,2));
 console.log('PASS: offline project, media import, timeline, MP4 export and project persistence.');
}finally{
 await application.evaluate(({BrowserWindow})=>{for(const w of BrowserWindow.getAllWindows()){w.forceClose=true;w.destroy();}}).catch(()=>{});
 await application.close().catch(()=>{});
}
