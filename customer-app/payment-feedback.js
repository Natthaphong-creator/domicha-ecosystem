import {escapeHtml as h} from './domain.js';
import {money} from './commerce-ui.js';
export const paymentMethods={transfer:'โอนผ่านบัญชี',promptpay:'QR พร้อมเพย์',cash:'เงินสด'};
export function paymentMethodFields(){return `<label>ช่องทางการชำระเงิน<select name="method" required><option value="">เลือกช่องทางที่ได้รับเงินจริง</option>${Object.entries(paymentMethods).map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select></label>`;}
export function bindPaymentMethodFields(form){const method=form.elements.method;if(!method)return;const update=()=>{const cash=method.value==='cash',reference=form.elements.reference;const row=reference.closest('label');row.hidden=cash;reference.disabled=cash;reference.required=!cash;const label=form.querySelector('[data-payment-check-label]');if(label)label.textContent=cash?'ได้รับและตรวจนับเงินสดครบตามยอดแล้ว':'ตรวจชื่อบัญชี ยอดเงิน และรายการเงินเข้าในธนาคารแล้ว';};method.addEventListener('change',()=>{form.elements.checked.checked=false;update();});update();}
let inFlight=false;
export function paymentConfirmationBody(order,fields){
 const method=fields.method===undefined?'transfer':fields.method;if(!Object.hasOwn(paymentMethods,method))throw Error('กรุณาเลือกช่องทางการชำระเงิน');
 const amount=String(fields.amount||'').trim(),reference=method==='cash'?'':String(fields.reference||'').trim();
 if(!/^\d+(\.\d{1,2})?$/.test(amount))throw Error('กรอกยอดเงินเข้าจริงเป็นบาท และทศนิยมไม่เกินสองตำแหน่ง');
 const satang=Math.round(Number(amount)*100);
 if(!Number.isSafeInteger(satang)||satang<=0||satang!==Math.round(Number(order.grand_total)*100))throw Error('ยอดเงินเข้าจริงต้องตรงกับยอดยืนยันของออเดอร์');
 if(method!=='cash'&&(!/^[A-Za-z0-9][A-Za-z0-9._/ -]{5,119}$/.test(reference)||reference.replace(/[^A-Za-z0-9]/g,'').length<6))throw Error('กรอกเลขอ้างอิงจากธนาคารอย่างน้อย 6 ตัวอักษรหรือตัวเลข');
 const receivedAt=new Date(fields.receivedAt);
 if(!fields.receivedAt||!Number.isFinite(receivedAt.getTime()))throw Error('กรอกวันที่และเวลาที่เงินเข้าจริง');
 if(fields.checked!==true)throw Error(method==='cash'?'กรุณายืนยันว่าได้รับและตรวจนับเงินสดครบแล้ว':'กรุณาติ๊กยืนยันว่าตรวจชื่อบัญชี ยอดเงิน และรายการเงินเข้าในธนาคารแล้ว');
 return{action:'confirm-payment',method,id:order.id,version:order.sales_revision,amount:satang,reference,receivedAt:receivedAt.toISOString(),checked:true};
}
export function paymentFeedbackHtml({kind,title,message,receiptNumber,orderNumber,amount,method}){return `<div class="payment-result-icon ${h(kind)}" aria-hidden="true">${kind==='pending'?'…':kind==='success'?'✓':'!'}</div><h2 id="payment-result-title">${h(title)}</h2><p id="payment-result-description">${h(message)}</p>${orderNumber?`<p class="payment-result-order">ออเดอร์ ${h(orderNumber)}</p>`:''}${Number.isSafeInteger(amount)?`<strong class="payment-result-amount">${h(money(amount))}</strong>`:''}${method&&paymentMethods[method]?`<p>ช่องทาง ${h(paymentMethods[method])}</p>`:''}${receiptNumber?`<p class="payment-result-receipt">เลขที่ใบเสร็จ <b>${h(receiptNumber)}</b></p>`:''}${kind==='pending'?'<p class="muted">กรุณารอสักครู่ และอย่ากดยืนยันซ้ำ</p>':'<button class="primary" data-close-payment-result type="button">ตกลง</button>'}`;}
export function showPaymentFeedback(data){
 document.querySelector('#payment-result-dialog')?.remove();
 const dialog=document.createElement('dialog');dialog.id='payment-result-dialog';dialog.className='payment-result-dialog';dialog.setAttribute('aria-labelledby','payment-result-title');dialog.setAttribute('aria-describedby','payment-result-description');dialog.innerHTML=paymentFeedbackHtml(data);document.body.append(dialog);
 dialog.addEventListener('cancel',event=>{if(data.kind==='pending')event.preventDefault();});dialog.addEventListener('close',()=>dialog.remove());dialog.querySelector('[data-close-payment-result]')?.addEventListener('click',()=>dialog.close());dialog.showModal();return dialog;
}
export async function runPaymentConfirmation({getBody,send,afterSaved,notify}){
 let body;
 try{body=getBody();}catch(error){notify({kind:'error',title:'กรุณาตรวจข้อมูลรับเงิน',message:error.message});return{ok:false};}
 notify({kind:'pending',title:'กำลังบันทึกรับเงิน',message:'ระบบกำลังยืนยันรายการและออกใบเสร็จ',orderNumber:body.orderNumber,amount:body.amount,method:body.method});
 let result;
 try{result=await send(body);if(!result?.receiptId)throw Error('ยังตรวจสอบผลบันทึกไม่ได้ กรุณารีเฟรชสถานะออเดอร์ก่อนลองใหม่');}
 catch(error){notify({kind:'error',title:'ยังยืนยันรับเงินไม่สำเร็จ',message:error.message+' หากขาดการเชื่อมต่อ กรุณารีเฟรชตรวจสถานะออเดอร์ก่อนลองซ้ำ'});return{ok:false};}
 const success={kind:'success',title:'ยืนยันรับเงินสำเร็จ',message:'บันทึกรับเงินและออกใบเสร็จแล้ว ระบบจะส่ง LINE และเก็บ PDF ตามรอบการทำงาน ตรวจผลได้จากหน้าเจ้าของแบรนด์',orderNumber:body.orderNumber,amount:body.amount,receiptNumber:result.receiptNumber,method:body.method};
 notify(success);
 try{if(await afterSaved(result)===false)throw Error('Refresh failed');}catch{notify({...success,message:'บันทึกรับเงินและออกใบเสร็จแล้ว แต่รีเฟรชหน้ารายการไม่สำเร็จ กรุณาโหลดรายการอีกครั้ง โดยไม่ต้องยืนยันรับเงินซ้ำ'});}
 return{ok:true,data:result};
}
export async function confirmPaymentFromForm({auth,order,form,afterSaved}){
 if(inFlight||form.dataset.paymentSaved==='true')return;
 const button=form.querySelector('button[type="submit"],button');const oldText=button.textContent;inFlight=true;button.disabled=true;button.textContent='กำลังตรวจและบันทึก…';
 try{const result=await runPaymentConfirmation({getBody:()=>({...paymentConfirmationBody(order,{method:form.elements.method?.value??'transfer',amount:form.elements.amount.value,reference:form.elements.reference.value,receivedAt:form.elements.receivedAt.value,checked:form.elements.checked.checked}),orderNumber:order.order_number}),send:body=>auth.commerce(body),afterSaved,notify:showPaymentFeedback});if(result.ok){form.dataset.paymentSaved='true';form.querySelectorAll('input,select,button').forEach(element=>element.disabled=true);}}
 finally{inFlight=false;if(form.dataset.paymentSaved!=='true'){button.disabled=false;button.textContent=oldText;}}
}
