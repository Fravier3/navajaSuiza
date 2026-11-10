import {_electron as electron} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'omniget-qa-'));
const application=await electron.launch({...(process.env.ARSENAL_EXE?{executablePath:process.env.ARSENAL_EXE}:{}),args:process.env.ARSENAL_EXE?[]:['.'],env:{...process.env,ARSENAL_TEST_PROFILE:profile},timeout:60000});
try {
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
 execFileSync('powershell.exe',['-NoProfile','-Command',"Get-Process | Where-Object { $_.Path -eq '"+path.join(profile,'native/omniget/OmniGet.exe').replaceAll("'","''")+"' } | Stop-Process -Force" ]);
 fs.mkdirSync('test-results',{recursive:true});
 fs.writeFileSync('test-results/omniget.json',JSON.stringify({launch:true,nativeWindow:true,persistentPortableProfile:true}));
}finally{
 await application.evaluate(({BrowserWindow})=>{for(const w of BrowserWindow.getAllWindows()){w.forceClose=true;w.destroy();}}).catch(()=>{});
 await application.close();
}
