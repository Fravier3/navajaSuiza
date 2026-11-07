import fs from 'node:fs';
fs.cpSync('../public/tools','public/tools',{recursive:true});
console.log('16 local editor distributions copied.');
