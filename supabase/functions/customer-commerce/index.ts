import {createClient} from 'npm:@supabase/supabase-js@2.45.4';
import {makeHandler} from './handler.mjs';
const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const check=async(q:any)=>{const{data,error}=await q;if(error)throw error;return data;};
const fields='id,order_number,branch_id,recipient_name,contact_phone,delivery_method,shipping_address,note,subtotal,delivery_fee,grand_total,quote_state,order_status,payment_status,created_at,quote_confirmed_at,sales_revision';
function orders(user:string|null){let q=admin.from('franchisee_orders').select(fields).eq('sales_channel','customer-v1');if(user)q=q.eq('user_id',user);return q;}
const db={
 getUser:async(token:string)=>{const{data,error}=await admin.auth.getUser(token);return error?null:data.user;},
 profile:(id:string)=>check(admin.from('users').select('role').eq('id',id).maybeSingle()),
 activeMember:async(id:string)=>{const f=await check(admin.from('franchisee_profiles').select('branch_id').eq('user_id',id).eq('status','Active').maybeSingle());return f&&!!await check(admin.from('branches').select('id').eq('id',f.branch_id).eq('status','Active').maybeSingle());},
 catalog:(owner:boolean)=>{let q=admin.from('customer_sale_products').select('id,name,category,unit,price_satang,image_path,sale_status,version').order('category').order('name');if(!owner)q=q.neq('sale_status','hidden');return check(q);},
 orders:(user:string|null,offset:number)=>check(orders(user).order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+25)),
 order:async(id:string,user:string|null)=>{const o=await check(orders(user).eq('id',id).maybeSingle());if(!o)return null;o.items=await check(admin.from('franchisee_order_items').select('product_id,product_name,unit,quantity,unit_price,line_total').eq('franchisee_order_id',id).order('created_at'));const b=await check(admin.from('branches').select('branch_name').eq('id',o.branch_id).maybeSingle());o.branch_name=b?.branch_name||'';return o;},
 create:(p:any)=>check(admin.rpc('create_customer_sales_order',p)),
 saleStatus:(p:any)=>check(admin.rpc('set_customer_sale_status',p)),
 review:(p:any)=>check(admin.rpc('review_customer_sales_order',p))
};
Deno.serve(makeHandler(db));
