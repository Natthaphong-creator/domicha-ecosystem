import {test} from 'node:test';import assert from 'node:assert/strict';import {totals,createOrder,catalog,escapeHtml} from '../domain.js';
const details={name:'ร้านตัวอย่าง',branch:'สาขาตัวอย่าง',delivery:'รับที่คลัง',phone:'0812345678'};
test('uses catalog prices in integer satang',()=>assert.deepEqual(totals({'milk-evap':2,'tea-red':1}),{quantity:3,subtotal:18400,total:18400}));
test('reject invalid quantities and products',()=>{for(const qty of [-1,0,.5,1000,NaN])assert.throws(()=>totals({'milk-evap':qty}));assert.throws(()=>totals({unknown:1}))});
test('require cart, branch, recipient and valid phone',()=>{assert.throws(()=>createOrder({},details));assert.throws(()=>createOrder({'milk-evap':1},{...details,branch:''}));assert.throws(()=>createOrder({'milk-evap':1},{...details,phone:'x'}))});
test('trial order can never be paid or become a receipt',()=>{const o=createOrder({'milk-evap':2},details);assert.equal(o.status,'demo');assert.ok(o.id.startsWith('DEMO-'));assert.equal(o.items[0].price,catalog[0].price)});
test('escape customer text',()=>assert.equal(escapeHtml('<script>'),'&lt;script&gt;'));
