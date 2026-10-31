import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('dist',{recursive:true});for(const f of ['index.html','app.js','domain.js','catalog-data.js','member-auth.js','auth-config.json','style.css','_headers','activate.html','activate.js','activation-auth.js'])await copyFile(f,`dist/${f}`);await cp('assets','dist/assets',{recursive:true});
