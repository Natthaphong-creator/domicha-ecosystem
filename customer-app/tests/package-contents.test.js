import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {renderFullReceipt} from '../receipt-document.js';
const contents=JSON.parse(readFileSync(new URL('../data/franchise-package-contents.json',import.meta.url),'utf8'));
test('M/L/XL include the supplied 34 equipment and 39 ingredient lines with distinct structures',()=>{
 for(const p of Object.values(contents)){assert.equal(p.equipment.length,34);assert.equal(p.ingredients.length,39);assert.ok(p.ingredients.includes('ครีมเทียม 2 ถุง'));assert.ok(p.ingredients.includes('น้ำตาลทรายขาว 3 ถุง'));assert.ok(p.ingredients.includes('หลอดเจาะมุก 1 แพค'));}
 assert.match(contents['1'].package[0],/จัดหาเคาน์เตอร์/);assert.match(contents['2'].package[0],/1.6/);assert.match(contents['3'].package[0],/2 × 2/);
});
test('all document types and accounting copies retain one priced line plus an escaped contents annex',()=>{
 for(const type of ['ใบเสนอราคา','ใบแจ้งหนี้','ใบเสร็จรับเงิน'])for(const copy of ['original','accounting']){
 const r={number:'TEST-CONTENTS',issued_at:'2026-11-01',received_at:'2026-11-01',snapshot:{document_type:type,seller:{seller_name:'TEST',seller_address:'TEST'},buyer_name:'TEST',items:[{name:'แพ็กเกจ M',unit:'แพ็กเกจ',quantity:1,price_satang:3900000,total_satang:3900000}],subtotal_satang:3900000,delivery_satang:0,total_satang:3900000,payment_method:'เงินสด',package_template:{name:'แพ็กเกจ M',contents:{...contents['1'],package:['<script>']}}}};
 const before=JSON.stringify(r),html=renderFullReceipt(r,copy,'logo.png',String,String);assert.equal((html.match(/<tr>/g)||[]).length,2);assert.match(html,/รายละเอียดแพ็กเกจแนบท้าย/);assert.match(html,/หม้อต้มน้ำร้อน 1 หม้อ/);assert.match(html,/บราวน์ชูการ์ 1 ขวด/);assert.ok(!html.includes('<script>'));assert.equal(JSON.stringify(r),before);
 }
});
