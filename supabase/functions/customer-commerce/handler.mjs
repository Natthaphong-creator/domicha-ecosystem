export const OWNER='1148e8d2-679c-4241-ba67-b522a2b50d8b';
const origins=new Set(['https://domicha-customer-preview.netlify.app','http://127.0.0.1:4175','http://localhost:4175']);
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const errors={MEMBER_REQUIRED:'บัญชีสาขายังไม่พร้อมใช้งาน',OWNER_REQUIRED:'เฉพาะเจ้าของแบรนด์เท่านั้น',PRODUCT_UNAVAILABLE:'มีสินค้าที่หยุดขาย กรุณาตรวจตะกร้าใหม่',PRICE_CHANGED:'ราคาสินค้าเปลี่ยน กรุณาตรวจตะกร้าใหม่',VERSION_CONFLICT:'ข้อมูลเปลี่ยนแล้ว กรุณารีเฟรชก่อนทำรายการ',PRICE_REQUIRED:'สินค้านี้ยังไม่มีราคาขาย กรุณาตั้งราคาในคลังก่อน',STOCK_CHECK_REQUIRED:'กรุณาตรวจสต๊อกและยืนยันรายการก่อน',ORDER_LOCKED:'คำสั่งซื้อนี้ไม่อยู่ในสถานะที่แก้ไขได้',REQUEST_CONFLICT:'หมายเลขส่งรายการซ้ำกับข้อมูลเดิม กรุณาลองใหม่',ORDER_NOT_FOUND:'ไม่พบคำสั่งซื้อ',PAYMENT_NOT_READY:'แบรนด์ยังไม่เปิดรับชำระ กรุณารอการตั้งค่าบัญชี',PAYMENT_SETTINGS_REQUIRED:'กรอกข้อมูลบัญชีและผู้ขายให้ครบ',PAYMENT_REQUEST_REQUIRED:'กรุณาเปิด QR ของออเดอร์นี้ก่อนยืนยันรับเงิน',PAYMENT_EVIDENCE_REQUIRED:'กรอกเลขอ้างอิงและยืนยันว่าตรวจเงินเข้าแล้ว',PAYMENT_AMOUNT_MISMATCH:'ยอดรับเงินต้องตรงกับยอดที่ยืนยัน',PAYMENT_ALREADY_CONFIRMED:'รายการนี้ยืนยันรับเงินไปแล้ว ข้อมูลไม่ตรงกับครั้งก่อน',INVALID_PAYMENT_TIME:'ตรวจสอบวันเวลาที่เงินเข้า',BANK_REFERENCE_USED:'เลขอ้างอิงนี้ถูกใช้กับใบเสร็จอื่นแล้ว กรุณาตรวจรายการธนาคาร'};
export function makeHandler(db){return async req=>{
 const origin=req.headers.get('origin');const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(origins.has(origin)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}:{})};
 const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!origins.has(origin))return reply({error:'ไม่อนุญาตเว็บไซต์นี้'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 try{
  if(req.headers.has('x-domicha-worker')){
   const secret=req.headers.get('x-domicha-worker')||'';
   if(secret.length<40||secret.length>200||!await db.verifyWorker(secret))return reply({error:'Unauthorized'},401);
   const raw=await req.text();if(raw.length>5000)throw Error('INVALID_REQUEST');const b=JSON.parse(raw);
   if(b.action==='claim-job')return reply({data:await db.claimJob(Array.isArray(b.kinds)?b.kinds.filter(k=>['drive','line-owner'].includes(k)):[])});
   if(b.action==='finish-job'&&uuid(b.id)&&uuid(b.lease)&&typeof b.success==='boolean')return reply({data:await db.finishJob({p_id:b.id,p_lease:b.lease,p_success:b.success,p_url:typeof b.url==='string'?b.url:null,p_error:b.success?null:'Delivery failed; check worker configuration'})});
   return reply({error:'Unsupported worker action'},400);
  }
  const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  const user=token?await db.getUser(token):null;if(!user?.id||user.is_anonymous)return reply({error:'กรุณาเข้าสู่ระบบใหม่'},401);
  const profile=await db.profile(user.id);const owner=user.id===OWNER&&profile?.role==='Admin';
  if(!owner&&!(profile?.role==='Franchisee'&&await db.activeMember(user.id)))return reply({error:errors.MEMBER_REQUIRED},403);
  if(Number(req.headers.get('content-length')||0)>40000)return reply({error:'ข้อมูลมากเกินไป'},413);
  const raw=await req.text();if(raw.length>40000)return reply({error:'ข้อมูลมากเกินไป'},413);const b=JSON.parse(raw);let data;
  switch(b.action){
   case 'catalog':data=await db.catalog(owner);break;
   case 'orders':{
    const offset=b.offset??0;if(!Number.isInteger(offset)||offset<0||offset>100000)throw Error('INVALID_PAGE');
    const rows=await db.orders(owner?null:user.id,offset);data={orders:rows.slice(0,25),hasMore:rows.length>25};break;}
   case 'detail':{
    if(!uuid(b.id))throw Error('INVALID_ID');data=await db.order(b.id,owner?null:user.id);if(!data)return reply({error:errors.ORDER_NOT_FOUND},404);break;}
   case 'create':
    if(owner)return reply({error:'โปรดใช้บัญชีสาขาเพื่อสั่งสินค้า'},403);
    if(!uuid(b.requestId)||!Array.isArray(b.items)||b.items.length>100)throw Error('INVALID_ITEMS');
    data={id:await db.create({p_actor:user.id,p_request_id:b.requestId,p_items:b.items,p_recipient:b.recipient,p_phone:b.phone,p_delivery:b.delivery,p_address:b.address,p_note:b.note,p_billing:b.billing||{}})};break;
   case 'payment-settings':
    if(!owner)return reply({error:errors.OWNER_REQUIRED},403);data=await db.paymentSettings();break;
   case 'save-payment-settings':
    if(!owner)return reply({error:errors.OWNER_REQUIRED},403);
    if(!Number.isInteger(b.version)||typeof b.enabled!=='boolean'||(b.enabled&&b.verified!==true))throw Error('PAYMENT_SETTINGS_REQUIRED');
    await db.savePaymentSettings({p_actor:user.id,p_version:b.version,p_enabled:b.enabled,p_promptpay:b.promptpay,p_account:b.account,p_seller:b.seller,p_address:b.address,p_details:b.details||{}});data={saved:true};break;
   case 'payment-request':{
    if(!uuid(b.id))throw Error('INVALID_ID');const r=await db.preparePayment({p_actor:user.id,p_order:b.id});data={...r,payload:db.qrPayload(r.merchant.promptpay_id,r.amount_satang)};break;}
   case 'confirm-payment':
    if(!owner)return reply({error:errors.OWNER_REQUIRED},403);
    if(!uuid(b.id)||!Number.isInteger(b.version)||!Number.isSafeInteger(b.amount)||b.amount<=0||b.checked!==true||typeof b.reference!=='string'||typeof b.receivedAt!=='string'||!Number.isFinite(Date.parse(b.receivedAt)))throw Error('PAYMENT_EVIDENCE_REQUIRED');
    data={receiptId:await db.confirmPayment({p_actor:user.id,p_order:b.id,p_version:b.version,p_amount_satang:b.amount,p_reference:b.reference,p_received_at:b.receivedAt,p_checked:true})};break;
   case 'worker-configure':
    if(!owner)return reply({error:errors.OWNER_REQUIRED},403);
    if(typeof b.secret!=='string'||!/^[-_A-Za-z0-9]{64,128}$/.test(b.secret))throw Error('INVALID_SECRET');await db.configureWorker(b.secret,user.id);data={saved:true};break;
   case 'retry-receipt':
    if(!owner)return reply({error:errors.OWNER_REQUIRED},403);if(!uuid(b.id))throw Error('INVALID_ID');await db.retryReceipt(b.id);data={queued:true};break;
   case 'sale-status':
    if(!owner)return reply({error:errors.OWNER_REQUIRED},403);
    if(typeof b.id!=='string'||b.id.length>200||!['active','paused','hidden'].includes(b.status)||!Number.isInteger(b.version))throw Error('INVALID_STATUS');
    data=await db.saleStatus({p_actor:user.id,p_product:b.id,p_status:b.status,p_version:b.version});break;
   case 'review':
    if(!owner)return reply({error:errors.OWNER_REQUIRED},403);
    if(!uuid(b.id)||!['confirm','cancel'].includes(b.decision)||!Number.isInteger(b.version))throw Error('INVALID_REVIEW');
    if(b.decision==='confirm'&&(!Number.isSafeInteger(b.deliveryFee)||b.deliveryFee<0||b.stockChecked!==true))throw Error('STOCK_CHECK_REQUIRED');
    data={id:await db.review({p_actor:user.id,p_order:b.id,p_action:b.decision,p_version:b.version,p_delivery_fee_satang:b.decision==='confirm'?b.deliveryFee:0,p_stock_checked:b.stockChecked===true})};break;
   default:return reply({error:'ไม่รองรับรายการนี้'},400);
  }
  return reply({data});
 }catch(e){if(String(e?.message).includes('customer_receipts_bank_reference_key'))return reply({error:errors.BANK_REFERENCE_USED,code:'BANK_REFERENCE_USED'},409);const code=Object.keys(errors).find(k=>String(e?.message).includes(k));return reply({error:code?errors[code]:'ทำรายการไม่สำเร็จ กรุณาตรวจข้อมูลหรือรีเฟรชแล้วลองใหม่',code:code||'REQUEST_FAILED'},code==='VERSION_CONFLICT'||code==='PRICE_CHANGED'||code==='REQUEST_CONFLICT'?409:400);}
};}
