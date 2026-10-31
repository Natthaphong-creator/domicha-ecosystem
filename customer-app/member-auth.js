// Publishable key only. Authorization comes from protected database rows, never user_metadata.
export function approvedMember(user,profile,franchise,branch){
  return Boolean(user?.id && !user.is_anonymous && profile?.id===user.id && profile.role==='Franchisee' && franchise?.user_id===user.id && franchise.status==='Active' && franchise.branch_id && branch?.id===franchise.branch_id && branch.status==='Active');
}
export function createMemberAuth(config,request=fetch){
  let token='';
  const ready=Boolean(config?.enabled===true&&config?.url?.startsWith('https://')&&config?.publishableKey);
  async function api(path,options={}){
    const r=await request(config.url+path,{...options,headers:{apikey:config.publishableKey,...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json',...options.headers},cache:'no-store'});
    if(!r.ok)throw new Error('ไม่สามารถยืนยันบัญชีหรือสิทธิ์แฟรนไชส์ได้ กรุณาตรวจบัญชีหรือติดต่อทีม DomiCha');
    return r.status===204?null:r.json();
  }
  async function verify(){
    if(!token)throw new Error('กรุณาเข้าสู่ระบบสมาชิกแฟรนไชส์');
    const u=await api('/auth/v1/user');const id=encodeURIComponent(u.id||'');
    const [profiles,franchises]=await Promise.all([api('/rest/v1/users?select=id,full_name,role&id=eq.'+id),api('/rest/v1/franchisee_profiles?select=id,user_id,branch_id,branch_name,status&user_id=eq.'+id)]);
    const f=franchises?.length===1?franchises[0]:null;const p=profiles?.length===1?profiles[0]:null;
    const branches=f?.branch_id?await api('/rest/v1/branches?select=id,branch_name,status&id=eq.'+encodeURIComponent(f.branch_id)):[];
    if(!approvedMember(u,p,f,branches[0]))throw new Error('บัญชีนี้ยังไม่ได้รับสิทธิ์แฟรนไชส์ที่เปิดใช้งาน กรุณาติดต่อทีม DomiCha');
    return{id:u.id,franchiseId:f.id,branchId:f.branch_id,name:p.full_name||'สมาชิกแฟรนไชส์',branch:f.branch_name,phone:'',address:''};
  }
  return{ready,verify,async signIn(email,password){if(!ready)throw new Error('ระบบสมาชิกยังไม่พร้อมใช้งาน กรุณาติดต่อทีม DomiCha');const s=await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:email.trim(),password})});token=s.access_token||'';try{return await verify();}catch(e){token='';throw e;}},async signOut(){try{if(token)await api('/auth/v1/logout',{method:'POST'});}finally{token='';}}};
}
