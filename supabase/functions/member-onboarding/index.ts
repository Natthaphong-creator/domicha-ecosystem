import {createClient} from 'npm:@supabase/supabase-js@2.45.4';
import {makeHandler,SHEET_ID} from './handler.mjs';
const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const check=async(q:any)=>{const{data,error}=await q;if(error)throw error;return data;};
const table=()=>admin.from('customer_applications');
const db={
 getUser:async(token:string)=>{const{data,error}=await admin.auth.getUser(token);return error?null:data.user;},
 getProfile:(id:string)=>check(admin.from('users').select('id,role').eq('id',id).maybeSingle()),
 bridgeHash:async()=>{const x=await check(admin.from('customer_onboarding_bridge').select('secret_sha256').eq('spreadsheet_id',SHEET_ID).maybeSingle());return x?.secret_sha256;},
 configureBridge:(hash:string,id:string)=>check(admin.from('customer_onboarding_bridge').upsert({spreadsheet_id:SHEET_ID,secret_sha256:hash,updated_by:id,updated_at:new Date().toISOString()})),
 ingest:(a:any)=>check(table().upsert(a,{onConflict:'source_key',ignoreDuplicates:true})),
 list:()=>check(table().select('id,source_row,submitted_at,party_type,full_name,phone,email,contract_address,branch_hint,status,branch_id,approved_at,invitation_status,invitation_sent_at,invite_generated_at').order('created_at',{ascending:false}).limit(200)),
 branches:()=>check(admin.from('branches').select('id,branch_code,branch_name').eq('status','Active').order('branch_code')),
 branch:(id:string)=>check(admin.from('branches').select('id,status').eq('id',id).maybeSingle()),
 branchCodeExists:async(code:string)=>!!await check(admin.from('branches').select('id').eq('branch_code',code).maybeSingle()),
 application:(id:string)=>check(table().select('*').eq('id',id).maybeSingle()),
 account:(email:string)=>check(admin.from('users').select('id,role').ilike('email',email.replace(/[\\%_]/g,'\\$&')).maybeSingle()),
 authUser:async(id:string)=>{const{data,error}=await admin.auth.admin.getUserById(id);if(error)throw error;return data.user;},
 membership:(id:string)=>check(admin.from('franchisee_profiles').select('status,branch_id').eq('user_id',id).maybeSingle()),
 reject:async(id:string)=>{const rows=await check(table().update({status:'rejected'}).eq('id',id).eq('status','pending').select('id'));return rows.length===1;},
 claim:async(id:string,action:string,attempt:string)=>{
  let q=table().update(action==='approve'?{status:'processing',invite_attempt_id:attempt}:{invite_attempt_id:attempt,invitation_status:'unsent',invite_generated_at:new Date().toISOString()}).eq('id',id).eq('status',action==='approve'?'pending':'approved');
  if(action==='resend')q=q.or('invite_generated_at.is.null,invite_generated_at.lt.'+new Date(Date.now()-60000).toISOString());
  return (await check(q.select('id'))).length===1;
 },
 generateInvite:async(email:string,name:string,type:'invite'|'recovery')=>{const{data,error}=await admin.auth.admin.generateLink({type,email,options:{data:{full_name:name}}});if(error)throw error;return{user:data.user,hash:data.properties?.hashed_token};},
 recordAuthUser:(id:string,attempt:string,userId:string)=>check(table().update({auth_user_id:userId}).eq('id',id).eq('invite_attempt_id',attempt)),
 finalize:(id:string,userId:string,actorId:string,branchId:string|null,code:string|null,name:string|null)=>check(admin.rpc('finalize_customer_application',{p_application_id:id,p_user_id:userId,p_actor_id:actorId,p_branch_id:branchId,p_branch_code:code,p_branch_name:name})),
 inviteReady:(id:string,attempt:string)=>check(table().update({invitation_status:'ready',invite_generated_at:new Date().toISOString()}).eq('id',id).eq('invite_attempt_id',attempt)),
 failed:(id:string,attempt:string,resend:boolean)=>check(table().update(resend?{invitation_status:'failed'}:{status:'needs_review',invitation_status:'failed'}).eq('id',id).eq('invite_attempt_id',attempt).eq('status',resend?'approved':'processing')),
 mailResult:async(id:string,attempt:string,status:string)=>{const rows=await check(table().update({invitation_status:status,...(status==='sent'?{invitation_sent_at:new Date().toISOString()}: {})}).eq('id',id).eq('status','approved').eq('invite_attempt_id',attempt).eq('invitation_status','ready').select('id'));return rows.length===1;},
 event:(id:string,actorId:string,type:string)=>check(admin.from('customer_onboarding_events').insert({application_id:id,actor_id:actorId,event_type:type}))
};
Deno.serve(makeHandler(db));
