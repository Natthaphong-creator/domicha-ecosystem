import {renderFullReceipt} from './receipt-document.js';
import {date,money} from './commerce-ui.js';

// Preview only: no order reads, payment writes, receipt numbering, or archive jobs.
export function previewVatTotals(amountSatang,rateBasisPoints,priceMode){
 if(!Number.isSafeInteger(amountSatang)||amountSatang<0||amountSatang>100000000000||!Number.isInteger(rateBasisPoints)||rateBasisPoints<0||rateBasisPoints>10000||!['inclusive','exclusive'].includes(priceMode))throw Error('ข้อมูลคำนวณ VAT ไม่ถูกต้อง');
 const base=priceMode==='inclusive'?Math.round(amountSatang*10000/(10000+rateBasisPoints)):amountSatang;
 const vat=priceMode==='inclusive'?amountSatang-base:Math.round(base*rateBasisPoints/10000);
 return{base,vat,total:base+vat};
}
export function renderTaxInvoicePreview(copy='original',priceMode='inclusive',method='QR พร้อมเพย์'){
 const t=previewVatTotals(23500,700,priceMode);
 const r={number:'DEMO-TAX-000001',issued_at:'2026-11-01T09:00:00Z',received_at:'2026-11-01T09:00:00Z',snapshot:{demo:true,seller:{seller_name:'บจก.โดมิพลัสกรุ๊ป',seller_address:'77/44 หมู่ 5 ต.เสม็ด อ.เมืองชลบุรี จ.ชลบุรี 20000',seller_tax_id:'0205567033352',seller_phone:'0988247849'},buyer_name:'บริษัท ลูกค้าตัวอย่าง จำกัด',buyer_address:'99/9 ถนนตัวอย่าง ตำบลตัวอย่าง อำเภอตัวอย่าง จังหวัดตัวอย่าง 20000',branch_name:'สาขาตัวอย่าง',order_number:'DEMO-ORDER-0001',items:[{name:'ชาแดงโดมิชา',quantity:2,unit:'ถุง',price_satang:4000,total_satang:8000},{name:'ผงอัญชันมะนาว',quantity:1,unit:'ถุง',price_satang:12000,total_satang:12000}],subtotal_satang:20000,delivery_satang:3500,total_satang:t.total,payment_method:method}};
 let html=renderFullReceipt(r,copy,'assets/receipt-logo-v1.png',date,money);
 html=html.replace('<h2>ใบเสร็จรับเงิน</h2>','<h2>ใบเสร็จรับเงิน / ใบกำกับภาษี</h2>')
 .replace('ตัวอย่างรูปแบบ · ไม่ใช่ใบเสร็จจริง · ไม่มีการรับเงินจริง','ตัวอย่างสำหรับเตรียมจด VAT · ใช้อ้างอิงภาษีไม่ได้ · ไม่มีการรับเงินจริง')
 .replace('เลขที่ใบเสร็จ<br>','เลขที่เอกสาร (ตัวอย่าง)<br>')
 .replace('<p>เลขประจำตัวผู้เสียภาษี 0205567033352</p>','<p>เลขประจำตัวผู้เสียภาษี 0205567033352</p><p>สำนักงานใหญ่ (00000)</p>')
 .replace('<p><b>ที่อยู่</b>','<p><b>เลขประจำตัวผู้เสียภาษีผู้ซื้อ</b> [เลข 13 หลักของผู้ซื้อ]</p><p><b>สถานประกอบการผู้ซื้อ</b> สำนักงานใหญ่ (00000)</p><p><b>ที่อยู่</b>')
 .replace('<th>ราคาต่อหน่วย</th>',`<th>ราคา/หน่วย${priceMode==='inclusive'?' (รวม VAT)':' (ก่อน VAT)'}</th>`)
 .replace('<div class="receipt-grand-total">',`<div><span>มูลค่าก่อน VAT</span><b>${money(t.base)}</b></div><div><span>VAT 7% (อัตราสมมติ)</span><b>${money(t.vat)}</b></div><div class="receipt-grand-total">`)
 .replace('เอกสารนี้เป็นใบเสร็จรับเงิน ไม่ใช่ใบกำกับภาษี','ตัวอย่างเท่านั้น · ยังไม่เปิดออกใบกำกับภาษีจริง · อัตราและฐานภาษีต้องยืนยันก่อนเปิดใช้');
 return html;
}
export function mountTaxPreview(root){
 root.innerHTML=`<header class="owner-header"><a class="brand" href="owner.html">DomiCha</a><a href="owner.html">กลับหน้าเจ้าของแบรนด์</a></header><main><section class="card form-card tax-preview-controls"><h1>เตรียมใบกำกับภาษีสำหรับอนาคต</h1><p class="badge">ยังไม่เปิดออกเอกสารจริง</p><p>ตัวอย่างนี้ใช้ข้อมูลสมมติ ไม่ดึงออเดอร์ ไม่บันทึกรับเงิน และไม่ส่ง LINE หรือ Google Drive</p><label>ฉบับเอกสาร<select name="copy"><option value="original">ต้นฉบับ</option><option value="accounting">สำเนาสำหรับสำนักงานบัญชี</option></select></label><label>การตั้งราคาตัวอย่าง<select name="priceMode"><option value="inclusive">ราคาที่แสดงรวม VAT แล้ว</option><option value="exclusive">ราคาที่แสดงยังไม่รวม VAT</option></select></label><label>ช่องทางชำระเงิน<select name="method"><option>QR พร้อมเพย์</option><option>โอนผ่านบัญชี</option><option>เงินสด</option></select></label><p>ตัวอย่างคิด VAT 7% โดยสมมติว่าสินค้าและค่าจัดส่งทั้งหมดอยู่ในฐานภาษีเดียวกัน อัตราจริงต้องตรวจอีกครั้งเมื่อเปิดใช้</p><details><summary>ข้อมูลที่ต้องเตรียมก่อนเปิดใช้จริง</summary><p>วันที่จด VAT มีผล ข้อมูลตาม ภ.พ.20 เลขสำนักงานใหญ่/สาขา รูปแบบราคารวม/ไม่รวมภาษี ประเภทภาษีของสินค้าและค่าจัดส่ง และเลขเอกสารเริ่มต้น</p><p>ต้องกำหนดจังหวะออกใบกำกับภาษีตามความรับผิด VAT รวมถึงกรณีส่งสินค้าก่อนรับเงินกับสำนักงานบัญชี การเก็บ PDF ใน Drive ยังไม่ใช่การเปิดระบบ e-Tax Invoice</p></details><p><a href="https://www.rd.go.th/5208.html" target="_blank" rel="noopener">รายการใบกำกับภาษีตามมาตรา 86/4 — กรมสรรพากร</a></p></section><div id="tax-preview-document"></div></main>`;
 const controls=root.querySelector('.tax-preview-controls');const render=()=>{root.querySelector('#tax-preview-document').innerHTML=renderTaxInvoicePreview(controls.querySelector('[name=copy]').value,controls.querySelector('[name=priceMode]').value,controls.querySelector('[name=method]').value);};controls.addEventListener('change',render);render();
}
if(typeof document!=='undefined'&&document.querySelector('#tax-preview-app'))mountTaxPreview(document.querySelector('#tax-preview-app'));
