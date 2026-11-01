import {createClient} from 'npm:@supabase/supabase-js@2.45.4';
import generatePayload from 'npm:promptpay-qr@0.5.0';
import {makeHandler} from './handler.mjs';
import {reviewerAccounts} from './reviewer-accounts.mjs';
const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const check=async(q:any)=>{const{data,error}=await q;if(error)throw error;return data;};
const fields='id,order_number,branch_id,recipient_name,contact_phone,delivery_method,shipping_address,note,subtotal,delivery_fee,grand_total,quote_state,order_status,payment_status,created_at,quote_confirmed_at,sales_revision,payment_received_at,payment_confirmed_at,receipt_number,billing_data';
function orders(user:string|null){let q=admin.from('franchisee_orders').select(fields).eq('sales_channel','customer-v1');if(user)q=q.eq('user_id',user);return q;}
async function sha(secret:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(secret)))).map(b=>b.toString(16).padStart(2,'0')).join('');}
const paymentFields='id,order_number,recipient_name,branch_id,grand_total,quote_state,order_status,payment_status,sales_revision,created_at';
function paymentOrders(actor:string){let q=admin.from('franchisee_orders').select(paymentFields).eq('sales_channel','customer-v1').eq('quote_state','confirmed').eq('order_status','Confirmed').eq('payment_status','Pending').eq('stock_checked',true);if(actor!=='1148e8d2-679c-4241-ba67-b522a2b50d8b')q=q.neq('user_id',actor);return q;}
const db={
 manualPackages:()=>check(admin.from('manual_franchise_packages').select('id,name,description,price_satang,active,version').order('id')),
 manualPackageSave:(p:any)=>check(admin.rpc('save_manual_franchise_package',p)),
 manualConvert:(p:any)=>check(admin.rpc('convert_manual_quotation',p)),
 manualCustomers:(actor:string)=>check(admin.rpc('manual_document_customers',{p_actor:actor})),
 manualList:(offset:number)=>check(admin.from('manual_sales_documents').select('id,number,status,document_kind,version,created_at,snapshot->buyer_name,snapshot->branch_name,snapshot->total_satang').order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+25)),
 manualDetail:async(id:string)=>{const d=await check(admin.from('manual_sales_documents').select('id,number,status,document_kind,parent_document_id,version,snapshot,created_by,created_at').eq('id',id).maybeSingle());if(!d)return null;d.child=await check(admin.from('manual_sales_documents').select('id,number').eq('parent_document_id',id).maybeSingle());d.receipt=await check(admin.from('customer_receipts').select('id,number,issued_at,received_at,bank_reference,snapshot').eq('manual_document_id',id).maybeSingle());if(d.receipt)d.receipt_jobs=await check(admin.from('customer_receipt_jobs').select('kind,status,result_url').eq('receipt_id',d.receipt.id));return d;},
 manualCreate:(p:any)=>check(admin.rpc('create_manual_sales_document',p)),
 manualReceive:(p:any)=>check(admin.rpc('receive_manual_sales_document',p)),
 manualCancel:(p:any)=>check(admin.rpc('cancel_manual_sales_document',p)),
 ...reviewerAccounts(admin,check),
 paymentQueue:(actor:string,offset:number)=>check(paymentOrders(actor).order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+25)),
 paymentReviewDetail:async(actor:string,id:string)=>{const o=await check(paymentOrders(actor).eq('id',id).maybeSingle());if(!o)return null;const b=await check(admin.from('branches').select('branch_name').eq('id',o.branch_id).maybeSingle());o.branch_name=b?.branch_name||'';o.payment_request=await check(admin.from('customer_payment_requests').select('amount_satang,quote_revision').eq('order_id',id).maybeSingle());return o;},
 getUser:async(token:string)=>{const{data,error}=await admin.auth.getUser(token);return error?null:data.user;},
 profile:(id:string)=>check(admin.from('users').select('role').eq('id',id).maybeSingle()),
 activeMember:async(id:string)=>{const f=await check(admin.from('franchisee_profiles').select('branch_id').eq('user_id',id).eq('status','Active').maybeSingle());return f&&!!await check(admin.from('branches').select('id').eq('id',f.branch_id).eq('status','Active').maybeSingle());},
 catalog:(owner:boolean)=>{let q=admin.from('customer_sale_products').select('id,name,category,unit,price_satang,image_path,sale_status,version').order('category').order('name');if(!owner)q=q.neq('sale_status','hidden');return check(q);},
 orders:(user:string|null,offset:number)=>check(orders(user).order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+25)),
 order:async(id:string,user:string|null)=>{const o=await check(orders(user).eq('id',id).maybeSingle());if(!o)return null;o.items=await check(admin.from('franchisee_order_items').select('product_id,product_name,unit,quantity,unit_price,line_total').eq('franchisee_order_id',id).order('created_at'));const b=await check(admin.from('branches').select('branch_name').eq('id',o.branch_id).maybeSingle());o.branch_name=b?.branch_name||'';
const settings=await check(admin.from('customer_payment_settings').select('enabled').eq('id',true).single());o.payment_ready=settings.enabled;
o.payment_request=o.payment_status==='Pending'&&o.quote_state==='confirmed'&&(settings.enabled||user===null)?await check(admin.from('customer_payment_requests').select('amount_satang,merchant,created_at').eq('order_id',id).maybeSingle()):null;
const receipt=await check(admin.from('customer_receipts').select('id,number,issued_at,received_at,snapshot').eq('order_id',id).maybeSingle());o.receipt=receipt;
if(receipt&&user===null){const audit=await check(admin.from('customer_receipts').select('confirmed_by').eq('id',receipt.id).single());const confirmer=await check(admin.from('users').select('full_name').eq('id',audit.confirmed_by).maybeSingle());o.payment_confirmer={id:audit.confirmed_by,name:confirmer?.full_name||audit.confirmed_by};}
if(receipt&&user===null)o.receipt_jobs=await check(admin.from('customer_receipt_jobs').select('id,kind,status,attempts,result_url,last_error').eq('receipt_id',receipt.id));
return o;},
 create:(p:any)=>check(admin.rpc('create_customer_sales_order_billing',p)),
 saleStatus:(p:any)=>check(admin.rpc('set_customer_sale_status',p)),
 review:(p:any)=>check(admin.rpc('review_customer_sales_order',p)),
 paymentSettings:async()=>({settings:await check(admin.from('customer_payment_settings').select('enabled,promptpay_id,account_name,seller_name,seller_address,details,version').eq('id',true).single()),workerConfigured:!!await check(admin.from('customer_payment_worker').select('id').eq('id',true).maybeSingle())}),
 savePaymentSettings:(p:any)=>check(admin.rpc('save_customer_payment_settings',p)),
 preparePayment:(p:any)=>check(admin.rpc('prepare_customer_payment',p)),
 qrPayload:(id:string,satang:number)=>generatePayload(id,{amount:satang/100}),
 receiptConfirmation:async(id:string)=>{const r=await check(admin.from('customer_receipts').select('number').eq('id',id).single());return{receiptNumber:r.number};},
 confirmPayment:(p:any)=>check(admin.rpc('confirm_customer_payment_by_method',p)),
 configureWorker:async(secret:string,actor:string)=>check(admin.from('customer_payment_worker').upsert({id:true,secret_sha256:await sha(secret),updated_by:actor,updated_at:new Date().toISOString()})),
 verifyWorker:async(secret:string)=>{const r=await check(admin.from('customer_payment_worker').select('secret_sha256').eq('id',true).maybeSingle());return !!r&&r.secret_sha256===await sha(secret);},
 claimJob:(kinds:string[])=>check(admin.rpc('claim_customer_receipt_job',{p_kinds:kinds})),
 finishJob:(p:any)=>check(admin.rpc('finish_customer_receipt_job',p)),
 retryReceipt:(id:string)=>check(admin.from('customer_receipt_jobs').update({status:'pending',attempts:0,next_attempt_at:new Date().toISOString(),last_error:null}).eq('receipt_id',id).eq('status','failed'))
};
Deno.serve(makeHandler(db));
