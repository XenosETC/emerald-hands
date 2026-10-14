import test from 'node:test';import assert from 'node:assert/strict';
import {createState} from '../core.js';import {purchasePreview,forgePreview,buyItem,upgradeGear,stats} from '../systems.js';
test('purchase preview agrees with real affordability, location and pack limits without mutation',()=>{
 for(const count of [0,98,99])for(const fragments of [0,7,8,28])for(const x of [490,2000]){
  const s=createState();s.player.x=x;s.fragments=fragments;s.inventory.healthFlask=count;
  const before=JSON.stringify(s),preview=purchasePreview(s,'healthFlask');assert.equal(JSON.stringify(s),before);
  assert.equal(buyItem(s,'healthFlask'),preview.ready);
  assert.equal(s.fragments,fragments-(preview.ready?preview.cost:0));assert.equal(s.inventory.healthFlask,count+(preview.ready?1:0));
 }
 assert.equal(purchasePreview(createState(),'ribbitFang'),null);
});
test('forge preview matches actual cost, damage change and maximum rank',()=>{
 for(const rank of [0,1,2,3])for(const fragments of [0,19,60]){
  const s=createState();s.player.x=490;s.fragments=fragments;s.gearLevels.ribbitFang=rank;
  const before=JSON.stringify(s),preview=forgePreview(s);assert.equal(JSON.stringify(s),before);assert.equal(upgradeGear(s),preview.ready);
  assert.equal(stats(s).attack,preview.ready?preview.after:preview.before);assert.equal(s.fragments,fragments-(preview.ready?preview.cost:0));assert.equal(s.gearLevels.ribbitFang,rank+(preview.ready?1:0));
 }
});
test('blocked shop offers explain the actual reason and dead players spend nothing',()=>{
 const s=createState();s.player.x=490;s.fragments=7;assert.match(purchasePreview(s,'spiritFlask').reason,/Need 1 more/);assert.match(forgePreview(s).reason,/Need 13 more/);
 s.inventory.spiritFlask=99;assert.match(purchasePreview(s,'spiritFlask').reason,/Pack full/);
 s.dead=true;const before=JSON.stringify(s);assert.equal(buyItem(s,'spiritFlask'),false);assert.equal(upgradeGear(s),false);assert.equal(JSON.stringify(s),before);
});
