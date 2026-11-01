// Use the existing Auth Admin API; never grant direct auth.users table access.
export function validReviewerAccount(user,email){return Boolean(user?.id&&user.email_confirmed_at&&!user.is_anonymous&&!user.deleted_at&&(!user.banned_until||Date.parse(user.banned_until)<=Date.now())&&(!email||user.email?.toLowerCase()===email.toLowerCase()));}
export function reviewerAccounts(admin,check){
 const authUser=async id=>{const {data,error}=await admin.auth.admin.getUserById(id);if(error)throw Error('REVIEWER_ACCOUNT_REQUIRED');return data.user;};
 return{
  isPaymentReviewer:async id=>{const grant=await check(admin.from('customer_payment_reviewers').select('user_id').eq('user_id',id).eq('active',true).maybeSingle());if(!grant)return false;try{return validReviewerAccount(await authUser(id));}catch{return false;}},
  paymentReviewers:async actor=>{const rows=await check(admin.rpc('list_customer_payment_reviewers',{p_actor:actor}));return Promise.all(rows.map(async row=>{let confirmed=false;try{confirmed=validReviewerAccount(await authUser(row.id),row.email);}catch{}return {...row,confirmed};}));},
  setPaymentReviewer:async p=>{if(p.p_active){const u=await check(admin.from('users').select('id,email').ilike('email',p.p_email.replace(/[\\%_]/g,'\\$&')).maybeSingle());if(!u||!validReviewerAccount(await authUser(u.id),p.p_email))throw Error('REVIEWER_ACCOUNT_REQUIRED');}return check(admin.rpc('set_customer_payment_reviewer',p));},
  claimReviewerInvite:p=>check(admin.rpc('claim_customer_reviewer_invite',p)),
  generateReviewerInvite:async(email,name,existingId)=>{if(existingId){const u=await authUser(existingId);if(u.email?.toLowerCase()!==email||u.email_confirmed_at||u.is_anonymous||u.deleted_at||(u.banned_until&&Date.parse(u.banned_until)>Date.now()))throw Error('REVIEWER_ACCOUNT_EXISTS');}const {data,error}=await admin.auth.admin.generateLink({type:'invite',email,options:{data:{full_name:name}}});if(error)throw error;return {user:data.user,hash:data.properties?.hashed_token};},
  completeReviewerInvite:p=>check(admin.rpc('complete_customer_reviewer_invite',p))
 };
}
