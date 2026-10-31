export const OWNER='1148e8d2-679c-4241-ba67-b522a2b50d8b';
const origins=new Set(['https://domicha-customer-preview.netlify.app','http://127.0.0.1:4175','http://localhost:4175']);
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const errors={MEMBER_REQUIRED:'บัญชีสาขายังไม่พร้อมใช้งาน',OWNER_REQUIRED:'เฉพาะเจ้าของแบรนด์เท่านั้น',PRODUCT_UNAVAILABLE:'มีสินค้าที่หยุดขาย กรุณาตรวจตะกร้าใหม่',PRICE_CHANGED:'ราคาสินค้าเปลี่ยน กรุณาตรวจตะกร้าใหม่',VERSION_CONFLICT:'ข้อมูลเปลี่ยนแล้ว กรุณารีเฟรชก่อนทำรายการ',PRICE_REQUIRED:'สินค้านี้ยังไม่มีราคาขาย กรุณาตั้งราคาในคลังก่อน',STOCK_CHECK_REQUIRED:'กรุณาตรวจสต๊อกและยืนยันรายการก่อน',ORDER_LOCKED:'คำสั่งซื้อนี้ไม่อยู่ในสถานะที่แก้ไขได้',REQUEST_CONFLICT:'หมายเลขส่งรายการซ้ำกับข้อมูลเดิม กรุณาลองใหม่',ORDER_NOT_FOUND:'ไม่พบคำสั่งซื้อ'};
export function makeHandler(db){return async req=>{
 const origin=req.headers.get('origin');const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(origins.has(origin)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}:{})};
 const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!origins.has(origin))return reply({error:'ไม่อนุญาตเว็บไซต์นี้'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 try{
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
    data={id:await db.create({p_actor:user.id,p_request_id:b.requestId,p_items:b.items,p_recipient:b.recipient,p_phone:b.phone,p_delivery:b.delivery,p_address:b.address,p_note:b.note})};break;
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
 }catch(e){const code=Object.keys(errors).find(k=>String(e?.message).includes(k));return reply({error:code?errors[code]:'ทำรายการไม่สำเร็จ กรุณาตรวจข้อมูลหรือรีเฟรชแล้วลองใหม่',code:code||'REQUEST_FAILED'},code==='VERSION_CONFLICT'||code==='PRICE_CHANGED'||code==='REQUEST_CONFLICT'?409:400);}
};}
