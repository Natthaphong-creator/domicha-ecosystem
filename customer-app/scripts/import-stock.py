# -*- coding: utf-8 -*-
"""Import only the customer-facing catalog and selling-price fields. No costs or personnel."""
import json, base64, hashlib, urllib.request
from pathlib import Path
from decimal import Decimal, InvalidOperation
ROOT=Path(__file__).resolve().parents[1]
overrides_path=ROOT/'product-image-overrides.json'
image_overrides=json.loads(overrides_path.read_text()) if overrides_path.exists() else {}
BASE='https://domichastore-default-rtdb.asia-southeast1.firebasedatabase.app/domicha_v2/store/settings/'
def read(field):
    with urllib.request.urlopen(BASE+field+'.json',timeout=30) as r:return json.load(r)
items=read('itemCatalog');prices=read('salePrices') or {}
known={'นมข้นจืด':'milk-evap','นมข้นหวาน':'milk-sweet','ครีมเทียม':'creamer','ชาแดง':'tea-red','ชาเขียว':'tea-green','โกโก้':'cocoa','ไข่มุก':'pearl','บุกบราวน์':'konjac','แก้วโดมิ':'cups','หลอดไข่มุก':'straws'}
rows=[];seen=set();images=ROOT/'assets/products';images.mkdir(parents=True,exist_ok=True)
for item in items:
    if not item or item.get('active') is False:continue
    name=str(item.get('name','')).strip()
    if not name or name in seen:continue
    seen.add(name);id=known.get(name,'stock-'+hashlib.sha256(name.encode()).hexdigest()[:14])
    try:
        number=Decimal(str(prices.get(name,0)))*100
        price=int(number) if number.is_finite() and number==number.to_integral() and 0<number<=9007199254740991 else None
    except (InvalidOperation,ValueError,TypeError):price=None
    image='';raw=item.get('image','')
    for mime,ext in [('image/png','png'),('image/jpeg','jpg'),('image/webp','webp')]:
        prefix='data:'+mime+';base64,'
        if raw.startswith(prefix):
            data=base64.b64decode(raw[len(prefix):],validate=True)
            filename=hashlib.sha256(data).hexdigest()[:20]+'.'+ext
            (images/filename).write_bytes(data);image='assets/products/'+filename;break
    if not image and raw.startswith('https://'):image=raw
    if image in image_overrides:
        replacement=image_overrides[image]
        resolved=(ROOT/replacement).resolve()
        if not resolved.is_relative_to(images.resolve()) or not resolved.is_file():
            raise ValueError('Invalid or missing product image override: '+replacement)
        image=replacement
    rows.append({'id':id,'name':name,'category':item.get('category') or 'อื่น ๆ','unit':'หน่วย','price':price,'image':image,'icon':'📦','source':'stock'})
from datetime import datetime,timezone
metadata={'importedAt':datetime.now(timezone.utc).isoformat(),'source':'https://domichasystem.netlify.app/','activeItems':len(rows),'unpricedItems':sum(p['price'] is None for p in rows),'unitNote':'ต้นทางไม่ระบุหน่วยขาย ใช้หน่วยตามคลัง'}
(ROOT/'catalog-data.js').write_text('export const catalogMetadata='+json.dumps(metadata,ensure_ascii=False)+';\nexport const importedCatalog='+json.dumps(rows,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print(json.dumps(metadata,ensure_ascii=False))
print('milk',prices.get('นมข้นจืด'),'tea',prices.get('ชาแดง'),'images',sum(bool(p['image']) for p in rows))
