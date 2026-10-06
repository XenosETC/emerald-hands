import test from 'node:test';
import assert from 'node:assert/strict';
import {crownAppearance} from '../crown-equipped.js';
test('all armor and held-gear combinations retain worn armor rather than falling back to clothing',()=>{
 for(const armor of ['leather','jade','basalt'])for(const weapon of ['sword','axe','spear','mace','dagger'])for(const shield of [null,'oak','jade','holy']){
  const appearance=crownAppearance({armor,weapon,shield});
  assert.equal(appearance.worn,true);assert.notEqual(appearance.src,'assets/crown-base-v2.png');
 }
 assert.equal(crownAppearance({armor:null,weapon:'axe',shield:'jade'}).worn,false);
});
