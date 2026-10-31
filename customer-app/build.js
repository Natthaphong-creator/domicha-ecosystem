import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('dist',{recursive:true});for(const f of ['index.html','app.js','domain.js','style.css','_headers'])await copyFile(f,`dist/${f}`);await cp('assets','dist/assets',{recursive:true});
