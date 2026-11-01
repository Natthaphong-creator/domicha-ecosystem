import {build} from 'esbuild';
import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('dist',{recursive:true});for(const f of ['index.html','customer.webmanifest','owner.webmanifest','owner.html','owner.js','payment-review.html','payment-review.js','commerce-ui.js','payment-ui.js','app.js','domain.js','catalog-data.js','member-auth.js','auth-config.json','style.css','_headers','activate.html','activate.js','activation-auth.js'])await copyFile(f,`dist/${f}`);await cp('assets','dist/assets',{recursive:true});

await build({entryPoints:['src/qr.js'],bundle:true,format:'esm',platform:'browser',outfile:'dist/qr.js',minify:true});
await copyFile('dist/qr.js','qr.js');
