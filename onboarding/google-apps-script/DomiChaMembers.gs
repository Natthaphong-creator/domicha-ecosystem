// Add as a separate file in the bound contract spreadsheet project.
// Never replace the existing onOpen or contract-generation functions.
var DOMICHA_MEMBERS_SHEET='117qoLgTd1LJnBFwzVcaGVeYiuG0-AXN621pzmtH7eBQ';
var DOMICHA_MEMBERS_TAB=1923021931;
var DOMICHA_MEMBERS_URL='https://rbeqowlbvdbmpvcmpbxo.supabase.co';
var DOMICHA_MEMBERS_KEY='sb_publishable_S9tNtDXNNbMIWHF26cqj3g_cSUEW0nB';
function domichaMembersMenu(){SpreadsheetApp.getUi().createMenu('DomiCha Members').addItem('ตรวจและอนุมัติสมาชิก','domichaMembersOpen').addToUi();}
function domichaMembersInstall(){
 var ss=SpreadsheetApp.getActiveSpreadsheet();if(ss.getId()!==DOMICHA_MEMBERS_SHEET)throw new Error('เปิดจากชีตสัญญา DomiCha เท่านั้น');
 var handlers=ScriptApp.getProjectTriggers().map(function(t){return t.getHandlerFunction();});
 if(handlers.indexOf('domichaMembersMenu')<0)ScriptApp.newTrigger('domichaMembersMenu').forSpreadsheet(ss).onOpen().create();
 if(PropertiesService.getScriptProperties().getProperty('DOMICHA_MEMBERS_BRIDGE')&&handlers.indexOf('domichaMembersOnSubmit')<0)ScriptApp.newTrigger('domichaMembersOnSubmit').forSpreadsheet(ss).onFormSubmit().create();
 domichaMembersMenu();
}
function domichaMembersCall_(token,payload){
 var r=UrlFetchApp.fetch(DOMICHA_MEMBERS_URL+'/functions/v1/member-onboarding',{method:'post',contentType:'application/json',headers:{apikey:DOMICHA_MEMBERS_KEY,...(token?{Authorization:'Bearer '+token}:{})},payload:JSON.stringify(payload),muteHttpExceptions:true});
 var data;try{data=JSON.parse(r.getContentText());}catch(e){throw new Error('ระบบสมาชิกยังไม่พร้อม กรุณาลองใหม่ภายหลัง');}
 if(r.getResponseCode()>=400)throw new Error(data.error||'ดำเนินการไม่สำเร็จ');return data;
}
function domichaMembersLogin(email,password){
 var r=UrlFetchApp.fetch(DOMICHA_MEMBERS_URL+'/auth/v1/token?grant_type=password',{method:'post',contentType:'application/json',headers:{apikey:DOMICHA_MEMBERS_KEY},payload:JSON.stringify({email:String(email).trim(),password:password}),muteHttpExceptions:true});
 var data=JSON.parse(r.getContentText());
 if(r.getResponseCode()>=400||!data.access_token)throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
 if(!data.user||data.user.id!=='1148e8d2-679c-4241-ba67-b522a2b50d8b')throw new Error('เฉพาะบัญชีเจ้าของแบรนด์เท่านั้น');
 domichaMembersCall_(data.access_token,{action:'list'});
 return{token:data.access_token}; // Memory only in the modal. Never store passwords or sessions in the sheet.
}
function domichaMembersConnect(token){
 var props=PropertiesService.getScriptProperties();
 var secret=props.getProperty('DOMICHA_MEMBERS_BRIDGE')||Utilities.getUuid()+Utilities.getUuid();
 domichaMembersCall_(token,{action:'configure_bridge',secret:secret});
 props.setProperty('DOMICHA_MEMBERS_BRIDGE',secret);
 domichaMembersInstall();return{ok:true};
}
function domichaMembersReadRows_(){
 var ss=SpreadsheetApp.getActiveSpreadsheet();if(!ss||ss.getId()!==DOMICHA_MEMBERS_SHEET)throw new Error('ชีตไม่ถูกต้อง');
 var sheet=ss.getSheetById(DOMICHA_MEMBERS_TAB);if(!sheet)throw new Error('ไม่พบแท็บรับข้อมูล');
 var header=sheet.getRange(1,1,1,7).getDisplayValues()[0];
 var expected=['Timestamp','ประเภทผู้ทำสัญญา','ชื่อ-นามสกุลผู้ทำสัญญา / ชื่อบริษัท','เบอร์โทรศัพท์','Email ที่ใช้งานจริง','ที่อยู่ผู้ทำสัญญา','ชื่อสาขา / ทำเลร้านที่สนใจ'];
 if(JSON.stringify(header)!==JSON.stringify(expected))throw new Error('หัวคอลัมน์ฟอร์มเปลี่ยน กรุณาตรวจการเชื่อมต่อก่อน');
 var n=sheet.getLastRow()-1;if(n<1)return[];if(n>2000)throw new Error('มีคำตอบเกินขอบเขตนำเข้าครั้งเดียว กรุณาติดต่อผู้ดูแล');
 return sheet.getRange(2,1,n,7).getDisplayValues().map(function(v,i){return{row:i+2,submitted_at:v[0],party_type:v[1],full_name:v[2],phone:v[3],email:v[4],contract_address:v[5],branch_hint:v[6]};}).filter(function(v){return v.submitted_at&&v.email;});
}
function domichaMembersIngest_(application){
 var secret=PropertiesService.getScriptProperties().getProperty('DOMICHA_MEMBERS_BRIDGE');if(!secret)throw new Error('กรุณาเชื่อมบัญชีเจ้าของแบรนด์ก่อน');
 return domichaMembersCall_('',{action:'ingest',secret:secret,application:application});
}
function domichaMembersOnSubmit(e){
 if(!e||!e.range||e.source.getId()!==DOMICHA_MEMBERS_SHEET||e.range.getSheet().getSheetId()!==DOMICHA_MEMBERS_TAB)return;
 var rows=domichaMembersReadRows_();var row=rows.find(function(x){return x.row===e.range.getRow();});if(row)domichaMembersIngest_(row);
}
function domichaMembersList(token){
 // Verify the owner before sending any sheet data to the membership service.
 domichaMembersCall_(token,{action:'list'});
 if(!PropertiesService.getScriptProperties().getProperty('DOMICHA_MEMBERS_BRIDGE'))return{needsConnect:true,applications:[],branches:[]};
 var props=PropertiesService.getScriptProperties();var last=Number(props.getProperty('DOMICHA_MEMBERS_SYNC_ROW')||1);
 var rows=domichaMembersReadRows_().filter(function(row){return row.row>last;});var batch=rows.slice(0,50);var failed=0;
 for(var i=0;i<batch.length;i++){try{domichaMembersIngest_(batch[i]);props.setProperty('DOMICHA_MEMBERS_SYNC_ROW',String(batch[i].row));}catch(e){failed++;break;}}
 var data=domichaMembersCall_(token,{action:'list'});data.importFailures=failed;data.remainingRows=Math.max(0,rows.length-batch.length);return data;
}
function domichaMembersAction(token,payload){
 if(!payload||['approve','resend','reject'].indexOf(payload.action)<0)throw new Error('คำสั่งไม่ถูกต้อง');
 if(payload.action!=='reject'&&MailApp.getRemainingDailyQuota()<1)throw new Error('โควตาส่งอีเมลวันนี้หมดแล้ว ยังไม่ได้อนุมัติหรือสร้างคำเชิญ');
 var data=domichaMembersCall_(token,payload);if(!data.delivery)return data;
 var delivery=data.delivery;
 if(!/^https:\/\/domicha-customer-preview\.netlify\.app\/activate\.html#token_hash=/.test(delivery.activation_url))throw new Error('ลิงก์คำเชิญไม่ถูกต้อง');
 var body='สวัสดีค่ะ '+delivery.name+'\n\nทีม DomiCha อนุมัติบัญชีสมาชิกของคุณแล้ว กรุณาเปิดลิงก์ด้านล่างเพื่อตั้งรหัสผ่านด้วยตนเอง\n\n'+delivery.activation_url+'\n\nกรุณาเก็บลิงก์นี้เป็นส่วนตัว ใช้ได้ครั้งเดียว หากลิงก์หมดอายุให้ติดต่อทีม DomiCha เพื่อส่งคำเชิญใหม่\nทีมงานจะไม่ขอรหัสผ่านหรือ OTP ของคุณค่ะ';
 try{MailApp.sendEmail({to:delivery.email,subject:'DomiCha — ตั้งรหัสผ่านบัญชีสมาชิกของคุณ',body:body,name:'DomiCha Members'});}
 catch(e){domichaMembersCall_(token,{action:'mail_result',id:payload.id,attempt_id:delivery.attempt_id,status:'failed'});throw new Error('สมาชิกได้รับอนุมัติแล้ว แต่ส่งอีเมลไม่สำเร็จ กรุณาโหลดสถานะแล้วกดส่งคำเชิญใหม่');}
 try{domichaMembersCall_(token,{action:'mail_result',id:payload.id,attempt_id:delivery.attempt_id,status:'sent'});}
 catch(e){throw new Error('ส่งอีเมลแล้ว แต่บันทึกสถานะไม่สำเร็จ กรุณาตรวจกล่องจดหมายก่อนกดส่งซ้ำ');}
 return{ok:true,message:'อนุมัติและส่งคำเชิญให้ '+delivery.email+' แล้ว'};
}
function domichaMembersLogout(token){UrlFetchApp.fetch(DOMICHA_MEMBERS_URL+'/auth/v1/logout',{method:'post',headers:{apikey:DOMICHA_MEMBERS_KEY,Authorization:'Bearer '+token},muteHttpExceptions:true});}
function domichaMembersOpen(){SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(DOMICHA_MEMBERS_HTML).setWidth(1020).setHeight(720),'DomiCha · ตรวจและอนุมัติสมาชิก');}
var DOMICHA_MEMBERS_HTML=String.raw`<!doctype html><html lang="th"><head><base target="_blank"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{box-sizing:border-box}body{margin:0;background:#fffaf1;color:#4c2b1b;font:15px system-ui,sans-serif}header{padding:23px 28px;background:#fff0dc;border-bottom:1px solid #efd5b8;display:flex;justify-content:space-between;gap:15px;align-items:center}h1{font-size:24px;margin:4px 0}small{color:#84634c}main{padding:25px;max-width:980px;margin:auto}button,input,select{font:inherit}button{cursor:pointer;border:1px solid #ebc9a5;border-radius:10px;padding:11px 16px;background:white;color:#723d20}.primary{background:#c95112;color:#fff;border-color:#c95112}button:disabled{opacity:.5;cursor:wait}.card{background:white;border:1px solid #efd5b8;border-radius:17px;padding:22px;margin-bottom:16px}.login{max-width:440px;margin:30px auto}label{display:block;margin:14px 0}input,select{width:100%;margin-top:7px;border:1px solid #d8c4b4;background:#fff;border-radius:8px;padding:11px;color:inherit}input:focus,select:focus{outline:2px solid #f47721;outline-offset:2px}.badge{display:inline-block;border-radius:20px;background:#fff0dc;color:#a14818;padding:6px 11px;font-size:12px}.row{display:flex;align-items:center;gap:10px;justify-content:space-between}.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}.detail{line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere}h2{font-size:19px;margin:0 0 12px}.error{color:#a42e20;white-space:pre-wrap;line-height:1.6}#notice{position:sticky;top:0;background:#fff0dc;padding:12px 20px;z-index:1;white-space:pre-wrap}#notice:empty{display:none}.toolbar{display:flex;gap:10px;align-items:center;margin-bottom:18px}.toolbar select{width:auto;margin:0}.muted{color:#85664f;line-height:1.7}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:15px}[hidden]{display:none!important}@media(max-width:600px){main{padding:14px}.grid{grid-template-columns:1fr}header{padding:18px}h1{font-size:21px}.row{align-items:flex-start}.toolbar{flex-wrap:wrap}}
</style></head><body><header><div><small>DOMICHA MEMBERS</small><h1>ตรวจและอนุมัติสมาชิก</h1><small>ตรวจอีเมลและสาขาก่อนเปิดสิทธิ์ให้ลูกค้า</small></div><button id="logout" hidden>ออกจากระบบ</button></header><div id="notice" role="status"></div><main><section id="login" class="card login"><h2>สำหรับเจ้าของแบรนด์</h2><p class="muted">ใช้บัญชีเจ้าของแบรนด์ DomiCha เพื่อดูข้อมูลและอนุมัติสมาชิก</p><form id="signIn"><label>อีเมล<input name="email" type="email" required value="domicha.tea@gmail.com" autocomplete="username"></label><label>รหัสผ่าน<input name="password" type="password" required autocomplete="current-password"></label><p class="error"></p><button class="primary">เข้าสู่ระบบ</button></form></section><section id="workspace" hidden><div class="toolbar"><select id="filter" aria-label="กรองสถานะ"><option value="pending">รอตรวจ</option><option value="approved">อนุมัติแล้ว</option><option value="needs_review">ต้องตรวจสอบ</option><option value="rejected">ไม่อนุมัติ</option><option value="all">ทั้งหมด</option></select><button id="refresh">ดึงข้อมูลล่าสุด</button><small id="count"></small></div><div id="connect" class="card" hidden><h2>เชื่อมข้อมูลจากฟอร์ม</h2><p class="muted">นำเข้าเฉพาะคำตอบในแท็บรอตรวจสอบข้อมูล และส่งคำตอบใหม่เข้าระบบสมาชิกให้ทีมงานตรวจ</p><button id="connectButton" class="primary">เชื่อมฟอร์มกับระบบสมาชิก</button></div><div id="cards"></div><p class="muted">ข้อมูลจากฟอร์มยังไม่ใช่สมาชิกที่ได้รับอนุมัติ อีเมลซ้ำกับบัญชีเดิมจะถูกระงับไว้ให้ตรวจ ไม่เปลี่ยนรหัสผ่านหรือผูกสาขาใหม่ให้บัญชีเดิมอัตโนมัติ</p></section></main><script>
let token='',data={applications:[],branches:[]};
const $=s=>document.querySelector(s),h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={pending:'รอตรวจ',processing:'กำลังดำเนินการ',approved:'อนุมัติแล้ว',rejected:'ไม่อนุมัติ',needs_review:'ต้องตรวจสอบ'};
const mails={unsent:'ยังไม่ได้ส่งคำเชิญ',ready:'เตรียมคำเชิญแล้ว / ยังไม่ยืนยันการส่ง',sent:'ส่งอีเมลแล้ว',failed:'ส่งอีเมลไม่สำเร็จ'};
function call(name,...args){return new Promise((resolve,reject)=>google.script.run.withSuccessHandler(resolve).withFailureHandler(e=>reject(Error(e.message||'ดำเนินการไม่สำเร็จ')))[name](...args));}
function message(t){$('#notice').textContent=t;}
async function refresh(){message('กำลังดึงข้อมูล…');data=await call('domichaMembersList',token);$('#connect').hidden=!data.needsConnect;draw();message(data.importFailures?'มีรายการนำเข้าไม่สำเร็จ กรุณาตรวจข้อมูลในชีต':data.remainingRows?'ยังมีคำตอบอีก '+data.remainingRows+' รายการ กดดึงข้อมูลล่าสุดเพื่อนำเข้าต่อ':'');}
function draw(){const value=$('#filter').value,rows=data.applications.filter(a=>value==='all'||a.status===value);$('#count').textContent=rows.length+' รายการ (แสดงล่าสุดสูงสุด 200 รายการ)';$('#cards').innerHTML=rows.map(a=>'<article class="card"><div class="row"><h2>'+h(a.full_name)+'</h2><span class="badge">'+h(labels[a.status]||a.status)+'</span></div><div class="detail">'+h(a.email)+'\n'+h(a.phone)+' · '+h(a.party_type)+'\nที่อยู่ทำสัญญา: '+h(a.contract_address)+'\nสาขา / ทำเลที่สนใจ: '+h(a.branch_hint||'ยังไม่ระบุ')+'</div><p><small>คำตอบแถว '+a.source_row+' · '+h(a.submitted_at)+'</small></p>'+(a.status==='pending'?'<form data-id="'+a.id+'"><label>ผูกกับสาขา<select name="branch_id" required><option value="">เลือกสาขาที่ตรวจสอบแล้ว</option>'+data.branches.map(b=>'<option value="'+b.id+'">'+h(b.branch_code+' · '+b.branch_name)+'</option>').join('')+'<option value="new">สร้างสาขาใหม่</option></select></label><div class="grid" data-new hidden><label>รหัสสาขา<input name="branch_code" maxlength="32" placeholder="เช่น DMC0013"></label><label>ชื่อสาขา<input name="branch_name" maxlength="140" value="'+h(a.branch_hint)+'"></label></div><div class="actions"><button class="primary" type="submit">อนุมัติและส่งคำเชิญ</button><button type="button" data-reject="'+a.id+'">ไม่อนุมัติ</button></div></form>':a.status==='approved'?'<p class="muted">'+h(mails[a.invitation_status]||'')+'</p><button data-resend="'+a.id+'">ส่งคำเชิญใหม่</button>':'<p class="muted">'+(a.status==='needs_review'?'ต้องตรวจสถานะบัญชีและสาขาก่อนดำเนินการต่อ':'')+'</p>')+'</article>').join('')||'<section class="card"><h2>ยังไม่มีรายการในสถานะนี้</h2><p class="muted">คำตอบจากฟอร์มจะแสดงที่นี่หลังเชื่อมข้อมูล</p></section>';
 document.querySelectorAll('form[data-id]').forEach(f=>{f.branch_id.onchange=()=>{const isNew=f.branch_id.value==='new';f.querySelector('[data-new]').hidden=!isNew;f.branch_code.required=isNew;f.branch_name.required=isNew;};f.onsubmit=e=>{e.preventDefault();const p={action:'approve',id:f.dataset.id,...(f.branch_id.value==='new'?{branch_code:f.branch_code.value,branch_name:f.branch_name.value}:{branch_id:f.branch_id.value})};act(p);};});
 document.querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>act({action:'reject',id:b.dataset.reject}));document.querySelectorAll('[data-resend]').forEach(b=>b.onclick=()=>act({action:'resend',id:b.dataset.resend}));}
async function act(payload){document.querySelectorAll('button').forEach(b=>b.disabled=true);message('กำลังดำเนินการ กรุณารอสักครู่…');let outcome='';try{const r=await call('domichaMembersAction',token,payload);outcome=r.message||(r.alreadyApproved?'รายการนี้อนุมัติแล้ว':'บันทึกแล้ว');await refresh();message(outcome);}catch(e){try{await refresh();}catch{}message(e.message);}finally{document.querySelectorAll('button').forEach(b=>b.disabled=false);}}
$('#signIn').onsubmit=async e=>{e.preventDefault();const f=e.target,b=f.querySelector('button');b.disabled=true;f.querySelector('.error').textContent='';try{const r=await call('domichaMembersLogin',f.email.value,f.password.value);token=r.token;f.password.value='';$('#login').hidden=true;$('#workspace').hidden=false;$('#logout').hidden=false;await refresh();}catch(e){f.querySelector('.error').textContent=e.message;}finally{b.disabled=false;}};
$('#refresh').onclick=()=>refresh().catch(e=>message(e.message));$('#filter').onchange=draw;$('#connectButton').onclick=async()=>{const b=$('#connectButton');b.disabled=true;try{await call('domichaMembersConnect',token);await refresh();message('เชื่อมข้อมูลจากฟอร์มแล้ว');}catch(e){message(e.message);}finally{b.disabled=false;}};
$('#logout').onclick=async()=>{const old=token;token='';data={applications:[],branches:[]};$('#cards').innerHTML='';$('#workspace').hidden=true;$('#login').hidden=false;$('#logout').hidden=true;message('');try{await call('domichaMembersLogout',old);}catch{}};
</script></body></html>`;
