import test from 'node:test';import assert from 'node:assert/strict';import {attackTrail} from '../attack-motion.js';
import {attackCue} from '../attack-motion.js';
import {createState,act,step,abilityReady} from '../core.js';
test('attack cues follow real queue acceptance and Warp recovery eligibility',()=>{
 const s=createState(),p=s.player;act(s,'attack');assert.match(attackCue(p,abilityReady(s,'dash')),/Commit/);
 for(let i=0;i<10;i++)step(s,{},1/60);
 assert.match(attackCue(p,abilityReady(s,'dash')),/queue next/);assert.doesNotMatch(attackCue(p,abilityReady(s,'dash')),/Warp cancel/);
 act(s,'attack');assert.match(attackCue(p,false),/Cut 2 queued/);
 for(let i=0;i<9;i++)step(s,{},1/60);
 assert.match(attackCue(p,abilityReady(s,'dash')),/Warp cancel/);
 act(s,'dash');assert.equal(attackCue(p,true),null);
});
test('trails alternate direction and emphasize the third cut inside the strike window',()=>{
 const p={attack:.2,anim:.26,combo:1};const first=attackTrail(p),second=attackTrail({...p,combo:2}),third=attackTrail({...p,combo:3});
 assert.equal(first.direction,1);assert.equal(second.direction,-1);assert.ok(third.width>first.width);assert.ok(third.reach>first.reach);
 for(const anim of [0,.16,.36,.48])assert.equal(attackTrail({...p,anim}),null);
 assert.equal(attackTrail({...p,attack:0}),null);
 assert.ok(attackTrail({...p,anim:.18}).angle<attackTrail({...p,anim:.33}).angle);
 assert.ok(attackTrail({...p,combo:2,anim:.18}).angle>attackTrail({...p,combo:2,anim:.33}).angle);
});
