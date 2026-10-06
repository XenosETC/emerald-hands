import test from 'node:test';
import assert from 'node:assert/strict';
import {enemyPose,GUARDIAN_STYLE} from '../enemy-motion.js';
const boss={id:4,boss:true,face:1,attackCount:0,mode:'windup',timer:.65};
test('guardian anticipation builds while the sole transform stays anchored',()=>{
 const start=enemyPose(boss,0),end=enemyPose({...boss,timer:0},0);
 assert.equal(start.charge,0);assert.equal(end.charge,1);assert.ok(end.lean<0);assert.ok(end.scaleY<1);
 // The affine transform maps local sole (0,0) to (0,0) at every phase.
 for(const mode of ['idle','windup','strike','recover']){const p=enemyPose({...boss,mode},1);assert.equal(p.scaleX*0+p.lean*0,0);assert.equal(p.scaleY*0,0);}
});
test('wave warning predicts every second guardian strike',()=>{assert.equal(enemyPose(boss,0).wave,false);assert.equal(enemyPose({...boss,attackCount:1},0).wave,true);assert.equal(enemyPose({...boss,attackCount:2},0).wave,false);});
test('reduced effects keep pose geometry stable and warnings intact',()=>{const p=enemyPose({...boss,timer:.1,attackCount:1},0,true);assert.equal(p.lean,0);assert.equal(p.scaleX,1);assert.equal(p.scaleY,1);assert.ok(p.charge>.8);assert.equal(p.wave,true);});
test('realm guardians have distinct readable attack cues',()=>{assert.equal(new Set(Object.values(GUARDIAN_STYLE).map(s=>s.wave)).size,4);assert.equal(new Set(Object.values(GUARDIAN_STYLE).map(s=>s.shape)).size,3);});
