import {createActivation} from './activation-auth.js';
const form=document.querySelector('#activate'),button=form.querySelector('button'),status=document.querySelector('#status'),error=document.querySelector('#error');
const fragment=location.hash;history.replaceState(null,'',location.pathname);
let activation;
try{const response=await fetch('auth-config.json',{cache:'no-store'});if(!response.ok)throw Error();activation=createActivation(await response.json(),fragment);if(!activation.valid)throw Error();button.disabled=false;status.textContent='รหัสผ่านจะส่งไปยังระบบสมาชิกโดยตรง ไม่บันทึกลง Google Sheet';}
catch{form.hidden=true;status.textContent='ไม่พบลิงก์คำเชิญที่ใช้งานได้ กรุณาเปิดลิงก์จากอีเมลที่ทีม DomiCha ส่งให้';}
form.addEventListener('submit',async event=>{event.preventDefault();error.textContent='';button.disabled=true;button.textContent='กำลังตั้งรหัสผ่าน…';try{await activation.setPassword(form.password.value,form.confirm.value);form.reset();form.hidden=true;status.textContent='ตั้งรหัสผ่านเรียบร้อยแล้ว เข้าสู่ระบบด้วยอีเมลและรหัสผ่านของคุณได้เลย';document.querySelector('#sign-in').hidden=false;}catch(e){error.textContent=e.message;}finally{button.disabled=false;button.textContent='ยืนยันและตั้งรหัสผ่าน';}});
