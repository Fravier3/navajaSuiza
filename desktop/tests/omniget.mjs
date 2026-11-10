import {_electron as electron} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'omniget-qa-'));
let application=await electron.launch({...(process.env.ARSENAL_EXE?{executablePath:process.env.ARSENAL_EXE}:{}),args:process.env.ARSENAL_EXE?[]:['.'],env:{...process.env,ARSENAL_TEST_PROFILE:profile},timeout:60000});
const watchdog=setTimeout(()=>{console.error('OmniGet QA exceeded 120 seconds');application.process()?.kill();process.exit(1);},120000);
try {
 console.log('OmniGet QA: first launch');
 const page=await application.firstWindow();
 await page.locator('[data-open="omniget-fj"]').waitFor();
 const result=await page.evaluate(()=>window.arsenalNative.openOmniget());
 assert.deepEqual(result,{ok:true});
 assert(fs.existsSync(path.join(profile,'native/omniget/portable.txt')));
 assert(fs.existsSync(path.join(profile,'native/omniget/OmniGet.exe')));
 // Wait for the independent native window, not merely a successful spawn.
 const {execFileSync}=await import('node:child_process');
 let visible=false;
 for(let i=0;i<30;i++){
   const windows=execFileSync('powershell.exe',['-NoProfile','-Command',"Get-Process | Where-Object { $_.ProcessName -like '*omniget*' -and $_.MainWindowHandle -ne 0 } | Select-Object -ExpandProperty Id"],{encoding:'utf8'}).trim();
   if(windows){visible=true;break;}
   await new Promise(r=>setTimeout(r,1000));
 }
 assert(visible,'OmniGet native window did not appear');
 console.log('OmniGet QA: native window visible');
 const executable=path.join(profile,'native/omniget/OmniGet.exe');
 const before=fs.statSync(executable).mtimeMs;
 // Reproduce the reported failure: leave native OmniGet running and restart Arsenal.
 await application.evaluate(({BrowserWindow})=>{for(const w of BrowserWindow.getAllWindows())w.forceClose=true;});
 await application.close();
 console.log('OmniGet QA: Arsenal closed; restarting with native window running');
 application=await electron.launch({...(process.env.ARSENAL_EXE?{executablePath:process.env.ARSENAL_EXE}:{}),args:process.env.ARSENAL_EXE?[]:['.'],env:{...process.env,ARSENAL_TEST_PROFILE:profile},timeout:60000});
 const reopened=await application.firstWindow();
 await reopened.locator('[data-open="omniget-fj"]').waitFor();
 const results=await reopened.evaluate(()=>Promise.all([window.arsenalNative.openOmniget(),window.arsenalNative.openOmniget()]));
 assert.deepEqual(results,[{ok:true},{ok:true}]);
 console.log('OmniGet QA: reopened successfully');
 assert.equal(fs.statSync(executable).mtimeMs,before,'Running executable was overwritten');
 execFileSync('powershell.exe',['-NoProfile','-Command',"Get-Process | Where-Object { $_.Path -eq '"+path.join(profile,'native/omniget/OmniGet.exe').replaceAll("'","''")+"' } | Stop-Process -Force" ]);
 fs.mkdirSync('test-results',{recursive:true});
 fs.writeFileSync('test-results/omniget.json',JSON.stringify({launch:true,nativeWindow:true,persistentPortableProfile:true,reopenWhileRunning:true,concurrentLaunch:true}));
}finally{
 await application.evaluate(({BrowserWindow})=>{for(const w of BrowserWindow.getAllWindows())w.forceClose=true;}).catch(()=>{});
 await application.close();
 clearTimeout(watchdog);
}
