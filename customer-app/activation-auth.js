export function createActivation(config,fragment,request=fetch){
 const params=new URLSearchParams(fragment.replace(/^#/,'')),hash=params.get('token_hash'),type=params.get('type');
 const valid=Boolean(config?.enabled&&config?.url?.startsWith('https://')&&config.publishableKey&&/^[a-zA-Z0-9_-]{32,256}$/.test(hash||'')&&['invite','recovery'].includes(type));
 let session=null,finished=false;
 async function api(path,body,token='',method='POST'){
  const r=await request(config.url+path,{method,cache:'no-store',referrerPolicy:'no-referrer',headers:{apikey:config.publishableKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
  if(!r.ok){if(path.endsWith('/verify'))throw Error('ลิงก์นี้ไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์ใหม่จากทีม DomiCha');throw Error('ยังตั้งรหัสผ่านไม่สำเร็จ กรุณาลองอีกครั้ง รหัสผ่านต้องเป็นไปตามข้อกำหนดของระบบ');}
  return r.status===204?null:r.json();
 }
 return{valid,async setPassword(password,confirm){
  if(!valid||finished)throw Error('กรุณาใช้ลิงก์คำเชิญที่ยังไม่หมดอายุ');
  if(typeof password!=='string'||password.length<12||password.length>128)throw Error('รหัสผ่านต้องมี 12–128 ตัวอักษร');
  if(password!==confirm)throw Error('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
  // A GET or link-preview never consumes the invitation. Only the explicit form submission does.
  if(!session){session=await api('/auth/v1/verify',{token_hash:hash,type});if(!session?.access_token)throw Error('ลิงก์นี้ไม่พร้อมใช้งาน กรุณาขอลิงก์ใหม่');}
  await api('/auth/v1/user',{password},session.access_token,'PUT');finished=true;
  try{await api('/auth/v1/logout',{},session.access_token);}catch{}finally{session=null;}
  return{ok:true};
 }};
}
