// Generate a reviewable service-side catalog sync; never run SQL in the browser.
import {importedCatalog} from '../catalog-data.js';
const q=v=>v==null?'null':"'"+String(v).replaceAll("'","''")+"'";
if(!importedCatalog.length)throw Error('Refusing an empty catalog');
for(const p of importedCatalog)if(p.price!==null&&(!Number.isSafeInteger(p.price)||p.price<=0||p.price>999999999999))throw Error('Invalid price: '+p.id);
console.log('begin;');
console.log('insert into public.customer_sale_products as current(id,name,category,unit,price_satang,image_path,sale_status) values\n'+importedCatalog.map(p=>'('+[p.id,p.name,p.category,p.unit,p.price,p.image||'',p.price?'active':'paused'].map(q).join(',')+')').join(',\n')+`\non conflict(id) do update set name=excluded.name,category=excluded.category,unit=excluded.unit,price_satang=excluded.price_satang,image_path=excluded.image_path,sale_status=case when excluded.price_satang is null and current.sale_status='active' then 'paused' else current.sale_status end,version=current.version+1,updated_at=now() where (current.name,current.category,current.unit,current.price_satang,current.image_path) is distinct from (excluded.name,excluded.category,excluded.unit,excluded.price_satang,excluded.image_path);`);
console.log('update public.customer_sale_products set sale_status=\'hidden\',version=version+1,updated_at=now() where sale_status<>\'hidden\' and id not in ('+importedCatalog.map(p=>q(p.id)).join(',')+');');
console.log('commit;');
