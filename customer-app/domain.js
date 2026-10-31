import {importedCatalog} from './catalog-data.js';
export const catalog=importedCatalog;
export function totals(cart){let quantity=0,subtotal=0;for(const [id,count] of Object.entries(cart)){const p=catalog.find(p=>p.id===id);if(!p||!Number.isSafeInteger(p.price)||p.price<=0||!Number.isSafeInteger(count)||count<1||count>999)throw new Error('จำนวนสินค้าไม่ถูกต้อง');quantity+=count;subtotal+=p.price*count;}return{quantity,subtotal,total:subtotal};}
export function createOrder(cart,details,now=new Date()){const sum=totals(cart);if(!sum.quantity)throw new Error('กรุณาเลือกสินค้าก่อน');for(const k of ['name','branch','delivery','phone'])if(!String(details[k]||'').trim())throw new Error('กรอกข้อมูลผู้รับและสาขาให้ครบ');if(!/^0\d{8,9}$/.test(details.phone.replace(/[\s-]/g,'')))throw new Error('ตรวจสอบหมายเลขโทรศัพท์');if(!['รับที่คลัง','จัดส่ง'].includes(details.delivery))throw new Error('เลือกวิธีรับสินค้า');if(details.delivery==='จัดส่ง'&&!String(details.address||'').trim())throw new Error('กรอกที่อยู่จัดส่ง');return{id:'DEMO-'+crypto.randomUUID().slice(0,8).toUpperCase(),createdAt:now.toISOString(),status:'demo',...sum,details:{...details},items:Object.entries(cart).map(([id,qty])=>({...catalog.find(p=>p.id===id),qty}))};}
export const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function fulfillment(order){
  const shipping=order.details.delivery==='จัดส่ง';
  const stages=shipping?['รอยืนยันชำระ','เตรียมสินค้า','จัดส่งแล้ว','ส่งสำเร็จ']:['รอยืนยันชำระ','เตรียมสินค้า','พร้อมรับสินค้า','รับสินค้าแล้ว'];
  // Trial orders never claim a payment, shipment or pickup has happened.
  return {shipping,stages,active:-1,label:'ยังไม่เริ่มดำเนินการ · คำสั่งซื้อทดลอง'};
}
