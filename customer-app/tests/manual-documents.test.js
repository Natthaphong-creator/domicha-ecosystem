import test from 'node:test';import assert from 'node:assert/strict';
import {manualDocumentBody,manualDocumentPreview} from '../manual-documents.js';
import {makeHandler,OWNER} from '../../supabase/functions/customer-commerce/handler.mjs';
const f={name:'TEST',address:'TEST ADDRESS',branch:'TEST',phone:'',taxId:'',fee:'35',note:''};
const items=[{name:'TEST',unit:'ถุง',quantity:'2',price:'40.50'}];
test('manual prices use integer satang and reject invalid quantity, fees and zero totals',()=>{
 const d=manualDocumentBody(f,items);assert.equal(d.items[0].price_satang,4050);assert.equal(d.deliveryFee,3500);assert.equal(d.stockMode,'none');
 for(const change of [{quantity:'0'},{quantity:'1.5'},{price:'0.001'},{name:''}])assert.throws(()=>manualDocumentBody(f,[{...items[0],...change}]));
 assert.throws(()=>manualDocumentBody({...f,fee:'-1'},items));assert.throws(()=>manualDocumentBody({...f,fee:'0'},[{...items[0],price:'0'}]));
});
test('unpaid manual previews never claim receipt or funds verification, and escape buyer text',()=>{
 const d=manualDocumentBody({...f,name:'<script>'},items),html=manualDocumentPreview(d,{seller_name:'TEST',seller_address:'TEST'});
 assert.match(html,/ใบแจ้งหนี้/);assert.match(html,/ยังไม่รับชำระ/);assert.match(html,/รายการกรอกเอง/);assert.match(html,/ไม่ตัดสต๊อก/);assert.ok(!html.includes('ผู้ตรวจสอบ: ยืนยันรับชำระแล้ว'));assert.ok(!html.includes('<script>'));assert.match(html,/฿116.00/);
});
test('manual mutations are exact-owner only and use verified actor, not request actor',async()=>{
 for(const role of ['Franchisee','Sales','otherAdmin','Owner']){let calls=0,args;const user=role==='Owner'?OWNER:'0dc9a547-a00f-4c6a-92a3-18e64233290a';const handler=makeHandler({getUser:async()=>({id:user}),profile:async()=>({role:role==='Owner'||role==='otherAdmin'?'Admin':role}),activeMember:async()=>true,isPaymentReviewer:async()=>role==='Sales',manualCreate:async p=>{calls++;args=p;return 'test';}});
 const b={action:'manual-create',requestId:'188c2ef1-7ddb-4052-b650-8c40ecb1724c',actor:'forged',document:{stockMode:'none'}};
 const r=await handler(new Request('https://x',{method:'POST',headers:{authorization:'Bearer test'},body:JSON.stringify(b)}));assert.equal(r.status,role==='Owner'?200:403);assert.equal(calls,role==='Owner'?1:0);if(args)assert.equal(args.p_actor,OWNER);
 }
});
test('quotation preview remains unpaid and uses one package line with the advertised total',()=>{
 for(const [name,price] of [['M','39000'],['L','69000'],['XL','89000']]){const d=manualDocumentBody({...f,fee:'0'},[{name:'ค่าแฟรนไชส์ แพ็กเกจ '+name,unit:'แพ็กเกจ',quantity:'1',price}]);d.kind='quotation';const html=manualDocumentPreview(d,{seller_name:'TEST',seller_address:'TEST'});assert.match(html,/<h2>ใบเสนอราคา<\/h2>/);assert.match(html,/ยังไม่รับชำระ/);assert.ok(!html.includes('ผู้ตรวจสอบ: ยืนยันรับชำระแล้ว'));assert.equal((html.match(/<tr>/g)||[]).length,2);assert.match(html,new RegExp(Number(price).toLocaleString('en-US')+'\\.00'));}
});
test('all manual/package management endpoints deny members and delegated payment reviewers',async()=>{
 for(const reviewer of [false,true]){const handler=makeHandler({getUser:async()=>({id:'0dc9a547-a00f-4c6a-92a3-18e64233290a'}),profile:async()=>({role:reviewer?'Sales':'Franchisee'}),activeMember:async()=>true,isPaymentReviewer:async()=>reviewer});for(const action of ['manual-options','manual-list','manual-detail','manual-create','manual-receive','manual-cancel','manual-packages','manual-package-save','manual-convert']){const r=await handler(new Request('https://x',{method:'POST',headers:{authorization:'Bearer test'},body:JSON.stringify({action})}));assert.equal(r.status,403,action);}}
});
test('cancelled invoice copies clearly show cancellation',async()=>{
 const {renderFullReceipt}=await import('../receipt-document.js');const d=manualDocumentBody(f,items);
 const html=renderFullReceipt({number:'TEST',issued_at:'2026-11-01T00:00:00Z',snapshot:{document_type:'ใบแจ้งหนี้',document_status:'Cancelled',seller:{seller_name:'TEST',seller_address:'TEST'},items:d.items.map(i=>({...i,total_satang:i.price_satang*i.quantity})),subtotal_satang:8100,delivery_satang:3500,total_satang:11600}},'original','logo.png',String,String);
 assert.match(html,/ยกเลิกแล้ว · ห้ามใช้อ้างอิงเรียกเก็บเงิน/);assert.ok(!html.includes('ผู้ตรวจสอบ: ยืนยันรับชำระแล้ว'));
});
test('VAT field defaults to uncharged and cannot activate tax collection before registration',()=>{
 const d=manualDocumentBody(f,items);assert.equal(d.vatMode,'none');assert.throws(()=>manualDocumentBody({...f,vatMode:'vat7'},items),/ยังไม่เปิดคิด VAT/);const html=manualDocumentPreview(d,{seller_name:'TEST',seller_address:'TEST'});assert.match(html,/VAT \(ยังไม่คิด\)/);assert.match(html,/฿0.00/);assert.match(html,/฿116.00/);
});
