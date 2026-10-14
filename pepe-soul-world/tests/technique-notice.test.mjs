import test from 'node:test';import assert from 'node:assert/strict';
import {createState,step,act,snapshot} from '../core.js';import {claimQuest} from '../systems.js';
import {techniqueNotice,techniqueMessage} from '../technique-notice.js';

test('an actual first guardian seal pickup explains Release and the airborne L change once',()=>{
 const s=createState({version:2,oath:true,training:3,xp:180,world:'frozen',zone:'arena',approachCleared:[1,2,3],guardianDefeated:true,x:2000});
 assert.deepEqual(techniqueNotice(false,s),{known:false,text:null});
 step(s,{},1/60);assert.deepEqual(s.seals,['frozen']);
 const before=snapshot(s),notice=techniqueNotice(false,s);
 assert.equal(notice.known,true);assert.match(notice.text,/R: Soul Release/);assert.match(notice.text,/Jump \+ L: Kek Rift/);assert.match(notice.text,/Grounded L stays Kek Wave/);
 assert.deepEqual(snapshot(s),before);assert.equal(techniqueNotice(true,s).text,null);
 act(s,'release');assert.ok(s.player.release>0);
 const loaded=createState(snapshot(s));assert.equal(techniqueNotice(true,loaded).text,null);
});

test('a saved seal below level three does not advertise techniques before a real unlock',()=>{
 const s=createState({version:2,oath:true,training:3,xp:120,seals:['frozen']});
 assert.equal(techniqueNotice(false,s).text,null);
 assert.equal(claimQuest(s,'firstCut'),true);assert.equal(s.xp,150);
 assert.ok(techniqueNotice(false,s).text);
});

test('nearby gear pickup messages retain the unlock explanation during its visible window',()=>{
 const notice={text:'NEW · R: Soul Release',until:6500};
 assert.equal(techniqueMessage('',notice,0),notice.text);
 assert.equal(techniqueMessage('Rime Fang recovered',notice,100),'NEW · R: Soul Release · Rime Fang recovered');
 assert.equal(techniqueMessage('New objective',notice,6500),'New objective');
 assert.equal(techniqueMessage('Ordinary loot',null,0),'Ordinary loot');
});
