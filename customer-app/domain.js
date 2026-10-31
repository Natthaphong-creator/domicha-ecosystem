export const catalog=[
{id:'milk-evap',name:'นมข้นจืด',category:'นมและความหวาน',unit:'กระป๋อง',price:3200,icon:'🥛',tag:'สินค้าประจำร้าน'},
{id:'milk-sweet',name:'นมข้นหวาน',category:'นมและความหวาน',unit:'กระป๋อง',price:2800,icon:'🥛'},
{id:'creamer',name:'ครีมเทียม',category:'นมและความหวาน',unit:'ถุง',price:8500,icon:'🥣'},
{id:'tea-red',name:'ชาแดง',category:'ชาและกาแฟ',unit:'ถุง',price:12000,icon:'🍂',tag:'ยอดนิยม'},
{id:'tea-green',name:'ชาเขียว',category:'ชาและกาแฟ',unit:'ถุง',price:13500,icon:'🍵'},
{id:'cocoa',name:'ผงโกโก้',category:'ชาและกาแฟ',unit:'ถุง',price:14500,icon:'🍫'},
{id:'lychee',name:'ไซรัปลิ้นจี่',category:'ไซรัป',unit:'ขวด',price:9500,icon:'🍹'},
{id:'strawberry',name:'ไซรัปสตรอว์เบอร์รี',category:'ไซรัป',unit:'ขวด',price:9500,icon:'🍓'},
{id:'pearl',name:'ไข่มุก',category:'ท็อปปิ้ง',unit:'ถุง',price:6500,icon:'🧋',tag:'เติมความอร่อย'},
{id:'konjac',name:'บุกบราวน์ชูการ์',category:'ท็อปปิ้ง',unit:'ถุง',price:8500,icon:'🧋'},
{id:'cups',name:'แก้ว DomiCha',category:'บรรจุภัณฑ์',unit:'แพ็ก',price:12000,icon:'🥤'},
{id:'straws',name:'หลอดไข่มุก',category:'บรรจุภัณฑ์',unit:'แพ็ก',price:3500,icon:'📦'}];
export function totals(cart){let quantity=0,subtotal=0;for(const [id,count] of Object.entries(cart)){const p=catalog.find(p=>p.id===id);if(!p||!Number.isSafeInteger(count)||count<1||count>999)throw new Error('จำนวนสินค้าไม่ถูกต้อง');quantity+=count;subtotal+=p.price*count;}return{quantity,subtotal,total:subtotal};}
export function createOrder(cart,details,now=new Date()){const sum=totals(cart);if(!sum.quantity)throw new Error('กรุณาเลือกสินค้าก่อน');for(const k of ['name','branch','delivery','phone'])if(!String(details[k]||'').trim())throw new Error('กรอกข้อมูลผู้รับและสาขาให้ครบ');if(!/^0\d{8,9}$/.test(details.phone.replace(/[\s-]/g,'')))throw new Error('ตรวจสอบหมายเลขโทรศัพท์');return{id:'DEMO-'+crypto.randomUUID().slice(0,8).toUpperCase(),createdAt:now.toISOString(),status:'demo',...sum,details:{...details},items:Object.entries(cart).map(([id,qty])=>({...catalog.find(p=>p.id===id),qty}))};}
export const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
