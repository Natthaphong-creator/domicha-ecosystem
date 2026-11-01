// Standalone worker. OAuth scope drive.file limits access to files created by this app.
var DOMICHA_PAYMENT_API='https://rbeqowlbvdbmpvcmpbxo.supabase.co/functions/v1/customer-commerce';
function domichaPaymentsInstall(){
 var p=PropertiesService.getScriptProperties();if(!p.getProperty('DOMICHA_PAYMENT_WORKER_KEY'))throw new Error('Set DOMICHA_PAYMENT_WORKER_KEY in Script properties first');
 // Verify the configured credential without claiming any real job.
 domichaPaymentApi_({action:'claim-job',kinds:[]});
 if(!p.getProperty('DOMICHA_RECEIPT_ROOT')){var f=domichaDriveCreate_({name:'DomiCha Receipts',mimeType:'application/vnd.google-apps.folder'});p.setProperty('DOMICHA_RECEIPT_ROOT',f.id);}
 if(!ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()==='domichaPaymentsRun';}))ScriptApp.newTrigger('domichaPaymentsRun').timeBased().everyMinutes(5).create();
}
function domichaPaymentsRun(){
 var lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
 try{
  var p=PropertiesService.getScriptProperties();var kinds=[];
  if(p.getProperty('DOMICHA_RECEIPT_ROOT'))kinds.push('drive');
  if(p.getProperty('DOMICHA_LINE_ACCESS_TOKEN')&&p.getProperty('DOMICHA_LINE_OWNER_TARGET'))kinds.push('line-owner');
  for(var n=0;n<6;n++){
   var work=domichaPaymentApi_({action:'claim-job',kinds:kinds});if(!work)return;
   var job=work.job;var url=null;var success=false;
   try{if(job.kind==='drive')url=domichaArchiveReceipt_(work.receipt,job.id);else domichaLineReceipt_(work.receipt,job);success=true;}catch(e){/* Never log tokens, bank references or full customer documents. */}
   domichaPaymentApi_({action:'finish-job',id:job.id,lease:job.lease_id,success:success,url:url});
  }
 }finally{lock.releaseLock();}
}
function domichaPaymentApi_(body){
 var key=PropertiesService.getScriptProperties().getProperty('DOMICHA_PAYMENT_WORKER_KEY');if(!key)throw new Error('Worker key missing');
 var r=UrlFetchApp.fetch(DOMICHA_PAYMENT_API,{method:'post',contentType:'application/json',headers:{'x-domicha-worker':key},payload:JSON.stringify(body),muteHttpExceptions:true});
 if(r.getResponseCode()!==200)throw new Error('Payment queue request failed: '+r.getResponseCode());
 return JSON.parse(r.getContentText()).data;
}
function domichaDriveRequest_(path,options){
 options=options||{};options.headers={Authorization:'Bearer '+ScriptApp.getOAuthToken()};options.muteHttpExceptions=true;
 var r=UrlFetchApp.fetch('https://www.googleapis.com/'+path,options);if(r.getResponseCode()<200||r.getResponseCode()>=300){var reason='unknown';try{var err=JSON.parse(r.getContentText()).error;reason=err.errors&&err.errors[0]&&err.errors[0].reason||err.status||reason;}catch(e){}throw new Error('Drive request failed: '+r.getResponseCode()+' ('+reason+')');}return JSON.parse(r.getContentText());
}
function domichaDriveCreate_(meta){return domichaDriveRequest_('drive/v3/files?fields=id',{method:'post',contentType:'application/json',payload:JSON.stringify(meta)});}
function domichaDriveChild_(parent,name,folder){
 // All names are generated internally from fixed prefixes, UUIDs, month or receipt numbers.
 if(!/^[A-Za-z0-9 _.-]+$/.test(name)||!/^[A-Za-z0-9_-]+$/.test(parent))throw new Error('Invalid generated path');
 var q="'"+parent+"' in parents and trashed=false and name='"+name+"'"+(folder?" and mimeType='application/vnd.google-apps.folder'":'');
 var rows=domichaDriveRequest_('drive/v3/files?q='+encodeURIComponent(q)+'&fields=files(id)&pageSize=10').files;
 if(rows.length>1)throw new Error('Duplicate generated path requires review');
 return rows.length?rows[0].id:null;
}
function domichaDriveFolder_(parent,name){return domichaDriveChild_(parent,name,true)||domichaDriveCreate_({name:name,mimeType:'application/vnd.google-apps.folder',parents:[parent]}).id;}
function domichaArchiveReceipt_(r,jobId){
 var s=r.snapshot;var p=PropertiesService.getScriptProperties();var root=p.getProperty('DOMICHA_RECEIPT_ROOT');
 var customer=domichaDriveFolder_(root,'Customer-'+s.customer_id);var branch=domichaDriveFolder_(customer,'Branch-'+s.branch_id);var month=Utilities.formatDate(new Date(r.issued_at),'Asia/Bangkok','yyyy-MM');var folder=domichaDriveFolder_(branch,month);
 var filename=r.number+'.pdf';var existing=domichaDriveChild_(folder,filename,false);if(existing)return 'https://drive.google.com/file/d/'+existing+'/view';
 var pdf=Utilities.newBlob(domichaReceiptHtml_(r),'text/html','receipt.html').getAs('application/pdf').setName(filename);
 var boundary='domicha_'+Utilities.getUuid().replace(/-/g,'');var meta=JSON.stringify({name:filename,parents:[folder],mimeType:'application/pdf',description:'DomiCha receipt '+r.number+'; branch '+s.branch_name+'; job '+jobId});
 var head=Utilities.newBlob('--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+meta+'\r\n--'+boundary+'\r\nContent-Type: application/pdf\r\n\r\n').getBytes();
 var tail=Utilities.newBlob('\r\n--'+boundary+'--').getBytes();
 var file=domichaDriveRequest_('upload/drive/v3/files?uploadType=multipart&fields=id',{method:'post',contentType:'multipart/related; boundary='+boundary,payload:head.concat(pdf.getBytes(),tail)});
 // No public permissions are added. The owner's inherited access is preserved.
 return 'https://drive.google.com/file/d/'+file.id+'/view';
}
function domichaLineReceipt_(r,job){
 // LINE keeps retry keys for 24h. Stop before expiry instead of risking duplicate alerts.
 if(Date.now()-new Date(job.created_at).getTime()>23*60*60*1000)throw new Error('LINE retry window expired; manual review required');
 var p=PropertiesService.getScriptProperties(),s=r.snapshot;
 var text='DomiCha รับชำระแล้ว\nสาขา: '+s.branch_name+'\nยอด: '+(s.total_satang/100).toFixed(2)+' บาท\nใบเสร็จ: '+r.number+'\nเจ้าของตรวจเงินเข้าและยืนยันแล้ว';
 var response=UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push',{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+p.getProperty('DOMICHA_LINE_ACCESS_TOKEN'),'X-Line-Retry-Key':job.id},payload:JSON.stringify({to:p.getProperty('DOMICHA_LINE_OWNER_TARGET'),messages:[{type:'text',text:text}]}),muteHttpExceptions:true});
 if(response.getResponseCode()!==200&&!(response.getResponseCode()===409&&Object.keys(response.getHeaders()).some(function(k){return k.toLowerCase()==='x-line-accepted-request-id';})))throw new Error('LINE delivery failed');
}
function domichaReceiptHtml_(r){
 var s=r.snapshot;var e=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
 var m=function(v){return (v/100).toFixed(2)+' บาท';};var dt=function(v){return Utilities.formatDate(new Date(v),'Asia/Bangkok','dd/MM/yyyy HH:mm');};
 return '<!doctype html><html><head><meta charset="UTF-8"><style>body{font-family:Tahoma,sans-serif;color:#39291f;font-size:12px;padding:35px;line-height:1.8}h1{color:#c95112}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #ddd;text-align:left;padding:10px}p{white-space:pre-line}small{display:block}strong{font-size:18px}</style></head><body><h1>DomiCha</h1><h2>ใบเสร็จรับเงิน · ฉบับรายละเอียด</h2><p>'+e(s.seller.seller_name)+'\n'+e(s.seller.seller_address)+'\nเลขประจำตัวผู้เสียภาษี '+e(s.seller.seller_tax_id||'')+'\nโทร. '+e(s.seller.seller_phone||'')+'</p><p>เลขที่ '+e(r.number)+'\nออกเอกสาร '+dt(r.issued_at)+'\nรับเงิน '+dt(r.received_at)+'</p><p>ลูกค้า '+e(s.buyer_name)+'\nสาขา '+e(s.branch_name)+'\n'+e(s.buyer_address)+'</p><p>อ้างอิงคำสั่งซื้อ '+e(s.order_number)+'</p><table><tr><th>รายการ</th><th>จำนวน</th><th>รวม</th></tr>'+s.items.map(function(i){return '<tr><td>'+e(i.name)+'<small>'+m(i.price_satang)+' / '+e(i.unit)+'</small></td><td>'+e(i.quantity)+'</td><td>'+m(i.total_satang)+'</td></tr>';}).join('')+'</table><p>ค่าสินค้า '+m(s.subtotal_satang)+'\nค่าจัดส่ง '+m(s.delivery_satang)+'</p><strong>รับชำระแล้ว '+m(s.total_satang)+'</strong><p>ชำระโดย '+e(s.payment_method)+'\nเจ้าของตรวจสอบเงินเข้าแล้ว</p><p>เอกสารนี้เป็นใบเสร็จรับเงิน ไม่ใช่ใบกำกับภาษี</p></body></html>';
}
// Creates only a clearly labelled PDF format check. It never marks an order Paid or notifies LINE.
function domichaPaymentsTestDrive(){
 var root=PropertiesService.getScriptProperties().getProperty('DOMICHA_RECEIPT_ROOT');if(!root)throw new Error('Install worker first');
 var html='<!doctype html><html><head><meta charset="UTF-8"></head><body style="font-family:Tahoma,sans-serif;line-height:1.8;padding:35px"><h1>DomiCha · ตรวจรูปแบบเอกสาร</h1><h2>ทดสอบระบบจัดเก็บ PDF เท่านั้น</h2><p>เอกสารนี้ไม่ใช่ใบเสร็จรับเงิน ไม่มีการโอนเงินหรือยืนยันชำระ</p><table><tr><th>รายการทดสอบ</th><th>จำนวน</th><th>ตัวอย่างยอด</th></tr><tr><td>ชาแดง</td><td>1 หน่วย</td><td>40.00 บาท</td></tr></table><p>ค่าจัดส่งตัวอย่าง 35.50 บาท</p><strong>ตัวอย่างยอดรวม 75.50 บาท</strong><p>ใช้เพื่อตรวจตัวอักษรภาษาไทยและการเปิดไฟล์เท่านั้น</p></body></html>';
 var pdf=Utilities.newBlob(html,'text/html','test.html').getAs('application/pdf');var boundary='test_'+Utilities.getUuid().replace(/-/g,'');var folder=domichaDriveFolder_(root,'System Tests');var meta=JSON.stringify({name:'TEST-ONLY-no-payment-'+Utilities.formatDate(new Date(),'Asia/Bangkok','yyyyMMdd-HHmmss')+'.pdf',parents:[folder],mimeType:'application/pdf'});
 var head=Utilities.newBlob('--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+meta+'\r\n--'+boundary+'\r\nContent-Type: application/pdf\r\n\r\n').getBytes();var tail=Utilities.newBlob('\r\n--'+boundary+'--').getBytes();
 var file=domichaDriveRequest_('upload/drive/v3/files?uploadType=multipart&fields=id',{method:'post',contentType:'multipart/related; boundary='+boundary,payload:head.concat(pdf.getBytes(),tail)});
 console.log('TEST PDF: https://drive.google.com/file/d/'+file.id+'/view');
}
