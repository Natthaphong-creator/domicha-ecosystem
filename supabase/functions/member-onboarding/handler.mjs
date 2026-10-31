export const OWNER_ID='1148e8d2-679c-4241-ba67-b522a2b50d8b';
export const SHEET_ID='117qoLgTd1LJnBFwzVcaGVeYiuG0-AXN621pzmtH7eBQ';
export const APP_URL='https://domicha-customer-preview.netlify.app';
export class PublicError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const fail=(m,s=400)=>{throw new PublicError(m,s)};
export function normalizeApplication(input){
 const text=(key,max,optional=false)=>{const v=typeof input?.[key]==='string'?input[key].trim():'';if((!optional&&!v)||v.length>max)fail('ข้อมูล '+key+' ไม่ครบหรือยาวเกินกำหนด');return v;};
 const email=text('email',254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('อีเมลไม่ถูกต้อง');
 if(!Number.isSafeInteger(input.row)||input.row<2||input.row>100000)fail('ตำแหน่งคำตอบไม่ถูกต้อง');
 const submitted=text('submitted_at',100);
 return{source_key:SHEET_ID+':1923021931:'+input.row+':'+submitted,source_row:input.row,submitted_at:submitted,
 party_type:text('party_type',80),full_name:text('full_name',160),phone:text('phone',40),email,contract_address:text('contract_address',1500),branch_hint:text('branch_hint',200,true)};
}
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
export async function digest(secret){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(secret)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function constantEqual(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
export function makeHandler(db){return async req=>{
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer'};
 const result=(x,status=200)=>new Response(JSON.stringify(x),{status,headers});
 if(req.method!=='POST')return result({error:'POST required'},405);
 try{
  const raw=await req.text();if(raw.length>20000)fail('ข้อมูลใหญ่เกินกำหนด',413);
  let p;try{p=JSON.parse(raw)}catch{fail('ข้อมูลไม่ถูกต้อง')}
  if(p.action==='ingest'){
   if(typeof p.secret!=='string'||p.secret.length<48||p.secret.length>200)fail('ไม่ได้รับอนุญาต',401);
   const hash=await db.bridgeHash();if(!constantEqual(hash,await digest(p.secret)))fail('ไม่ได้รับอนุญาต',401);
   const application=normalizeApplication(p.application);await db.ingest(application);return result({ok:true});
  }
  const token=req.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/)?.[1];if(!token)fail('กรุณาเข้าสู่ระบบเจ้าของแบรนด์',401);
  const user=await db.getUser(token);if(!user||user.id!==OWNER_ID||user.is_anonymous)fail('เฉพาะเจ้าของแบรนด์เท่านั้น',403);
  const profile=await db.getProfile(user.id);if(profile?.id!==OWNER_ID||profile.role!=='Admin')fail('เฉพาะเจ้าของแบรนด์เท่านั้น',403);
  if(p.action==='configure_bridge'){
   if(typeof p.secret!=='string'||p.secret.length<48||p.secret.length>200)fail('คีย์เชื่อมต่อไม่ถูกต้อง');
   await db.configureBridge(await digest(p.secret),user.id);return result({ok:true});
  }
  if(p.action==='list')return result({applications:await db.list(),branches:await db.branches()});
  if(!uuid(p.id))fail('รหัสรายการไม่ถูกต้อง');const a=await db.application(p.id);if(!a)fail('ไม่พบรายการ',404);
  if(p.action==='reject'){
   if(!await db.reject(a.id))fail('สถานะรายการเปลี่ยนแล้ว กรุณาโหลดใหม่',409);
   await db.event(a.id,user.id,'rejected');return result({ok:true});
  }
  if(p.action==='mail_result'){
   if(!uuid(p.attempt_id)||!['sent','failed'].includes(p.status))fail('สถานะอีเมลไม่ถูกต้อง');
   if(!await db.mailResult(a.id,p.attempt_id,p.status))fail('สถานะคำเชิญเปลี่ยนแล้ว กรุณาโหลดใหม่',409);
   await db.event(a.id,user.id,'email_'+p.status);return result({ok:true});
  }
  if(!['approve','resend'].includes(p.action))fail('คำสั่งไม่ถูกต้อง');
  if(p.action==='approve'&&a.status==='approved')return result({ok:true,alreadyApproved:true});
  if(p.action==='resend'&&a.status!=='approved')fail('ยังไม่ได้อนุมัติรายการ',409);
  if(p.action==='approve'&&a.status!=='pending')fail('รายการนี้ต้องตรวจสอบสถานะก่อน',409);
  let branchId=null,branchCode=null,branchName=null;
  if(p.action==='approve'){
   if(p.branch_id){if(!uuid(p.branch_id))fail('สาขาไม่ถูกต้อง');branchId=p.branch_id;const b=await db.branch(branchId);if(!b||b.status!=='Active')fail('สาขานี้ยังไม่เปิดใช้งาน');}
   else{branchCode=String(p.branch_code||'').trim().toUpperCase();branchName=String(p.branch_name||'').trim();if(!/^[A-Z0-9][A-Z0-9-]{1,31}$/.test(branchCode)||!branchName||branchName.length>140)fail('กรอกรหัสและชื่อสาขาให้ครบ');if(await db.branchCodeExists(branchCode))fail('รหัสสาขานี้มีแล้ว กรุณาเลือกจากสาขาเดิม',409);}
  }
  // Existing staff/member accounts are never overwritten or reset from a form.
  const existing=await db.account(a.email);
  if(existing&&(existing.id!==a.auth_user_id||existing.role!=='Franchisee'))fail('อีเมลนี้มีบัญชีอยู่แล้ว กรุณาตรวจสมาชิกเดิม',409);
  let inviteType='invite';
  if(a.auth_user_id){const u=await db.authUser(a.auth_user_id);if(!u||u.email?.toLowerCase()!==a.email)fail('ข้อมูลบัญชีไม่ตรงกัน',409);if(u.email_confirmed_at){if(p.action!=='resend')fail('บัญชีนี้เปิดใช้งานแล้ว',409);const f=await db.membership(a.auth_user_id);if(!f||f.status!=='Active'||f.branch_id!==a.branch_id)fail('สิทธิ์สมาชิกเปลี่ยนแล้ว กรุณาตรวจสอบก่อน',409);inviteType='recovery';}}
  const attempt=crypto.randomUUID();
  if(!await db.claim(a.id,p.action,attempt))fail('มีรายการกำลังดำเนินการ กรุณาโหลดใหม่',409);
  let linkedUserId=a.auth_user_id;
  try{
   // Generate, do not email, so membership is committed before delivery.
   const invitation=await db.generateInvite(a.email,a.full_name,inviteType);
   if(!invitation.user?.id||!invitation.hash)throw new Error('INVITE_GENERATION_FAILED');
   if(linkedUserId&&linkedUserId!==invitation.user.id)throw new Error('INVITE_ACCOUNT_MISMATCH');
   linkedUserId=invitation.user.id;await db.recordAuthUser(a.id,attempt,linkedUserId);
   if(p.action==='approve')await db.finalize(a.id,linkedUserId,user.id,branchId,branchCode,branchName);
   await db.inviteReady(a.id,attempt);await db.event(a.id,user.id,p.action==='approve'?'invite_prepared':'invite_prepared_again');
   return result({ok:true,delivery:{email:a.email,name:a.full_name,attempt_id:attempt,activation_url:APP_URL+'/activate.html#token_hash='+encodeURIComponent(invitation.hash)+'&type='+inviteType}});
  }catch{
   // Do not retry an uncertain partial approval automatically.
   await db.failed(a.id,attempt,p.action==='resend');
   fail('ยังจัดเตรียมคำเชิญไม่สำเร็จ กรุณาตรวจสถานะก่อนลองอีกครั้ง',502);
  }
 }catch(e){return result({error:e instanceof PublicError?e.message:'ระบบยังดำเนินการไม่สำเร็จ กรุณาลองใหม่ภายหลัง'},e instanceof PublicError?e.status:500);}
};}
