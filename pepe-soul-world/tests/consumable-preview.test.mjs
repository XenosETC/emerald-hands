import test from 'node:test';import assert from 'node:assert/strict';
import {createState} from '../core.js';import {consumablePreview,useItem,stats} from '../systems.js';
test('flask previews match actual capped recovery without changing the run',()=>{
 for(const id of ['healthFlask','spiritFlask'])for(const missing of [1,20,70]){
  const s=createState(),field=id==='healthFlask'?'hp':'sp',maximum=id==='healthFlask'?stats(s).health:stats(s).spirit;s.player[field]=maximum-missing;
  const before=JSON.stringify(s),preview=consumablePreview(s,id);assert.equal(JSON.stringify(s),before);
  const count=s.inventory[id],current=s.player[field];assert.equal(useItem(s,id),true);assert.equal(s.player[field]-current,preview.restore);assert.equal(s.inventory[id],count-1);assert.ok(s.player[field]<=maximum);
 }
});
test('full, empty and dead states explain refusal and spend no supplies',()=>{
 for(const id of ['healthFlask','spiritFlask'])for(const blocked of ['full','empty','dead']){
  const s=createState();if(blocked==='empty')s.inventory[id]=0;if(blocked==='dead'){s.dead=true;s.player.hp=0;}
  const before=JSON.stringify(s),preview=consumablePreview(s,id);assert.equal(preview.ready,false);assert.match(preview.reason,blocked==='full'?/already full/:blocked==='empty'?/No .*remaining/:/Revive/);assert.equal(useItem(s,id),false);assert.equal(JSON.stringify(s),before);
 }
 assert.equal(consumablePreview(createState(),'ribbitFang'),null);assert.equal(consumablePreview(createState(),'unknown'),null);
});
