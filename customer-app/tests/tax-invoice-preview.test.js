import test from 'node:test';import assert from 'node:assert/strict';
import {previewVatTotals,renderTaxInvoicePreview} from '../tax-invoice-preview.js';
test('future VAT preview reconciles inclusive and exclusive amounts in integer satang',()=>{
 assert.deepEqual(previewVatTotals(23500,700,'inclusive'),{base:21963,vat:1537,total:23500});
 assert.deepEqual(previewVatTotals(23500,700,'exclusive'),{base:23500,vat:1645,total:25145});
 for(let n=0;n<1000;n++){const t=previewVatTotals(n,700,'inclusive');assert.equal(t.base+t.vat,n);}
 for(const args of [[1.5,700,'inclusive'],[100,NaN,'inclusive'],[100,700,'unknown']])assert.throws(()=>previewVatTotals(...args));
});
test('both future invoice copies are unambiguously demos with buyer tax fields and separate VAT',()=>{
 for(const copy of ['original','accounting']){const html=renderTaxInvoicePreview(copy,'inclusive','<script>');assert.match(html,/ใบเสร็จรับเงิน \/ ใบกำกับภาษี/);assert.match(html,/ใช้อ้างอิงภาษีไม่ได้/);assert.match(html,/เลขประจำตัวผู้เสียภาษี/);assert.match(html,/สำนักงานใหญ่ \(00000\)/);assert.match(html,/มูลค่าก่อน VAT/);assert.match(html,/฿219.63/);assert.match(html,/฿15.37/);assert.match(html,/DEMO-TAX-000001/);assert.ok(!html.includes('<script>'));assert.match(html,copy==='accounting'?/สำเนา · สำหรับสำนักงานบัญชี/:/ต้นฉบับ/);}
});
