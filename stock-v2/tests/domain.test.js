import {test} from 'node:test';
import assert from 'node:assert/strict';
import {movement,low,escapeHtml} from '../domain.js';
test('receiving and issuing balance correctly',()=>{assert.equal(movement(5,3,'in'),8);assert.equal(movement(5,5,'out'),0)});
test('reject overdraft, fractional, negative, zero and unsafe quantities',()=>{for(const n of [0,-1,0.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>movement(5,n,'in'));assert.throws(()=>movement(5,6,'out'));assert.throws(()=>movement(Number.MAX_SAFE_INTEGER,1,'in'))});
test('reorder point includes exact minimum',()=>{assert.equal(low({stock:2,minimum:2}),true);assert.equal(low({stock:3,minimum:2}),false)});
test('user supplied text is escaped',()=>assert.equal(escapeHtml('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;'));
