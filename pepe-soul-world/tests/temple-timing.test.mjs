import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,step,act,GROUND} from '../core.js';
import {templeTelegraph,staggerTempleEnemy,stepTempleEnemy} from '../temple-combat.js';
import {templeFrames} from '../temple-motion.js';

const arena=()=>{const s=createState({version:2,world:'temple',zone:'arena',approachCleared:[1,2,3],oath:true,training:3,xp:600,complete:true,seals:['frozen','crimson','void']});s.enemies[0].x=1500;s.enemies[0].timer=0;s.player.x=1340;return s;};

test('The displayed jump window clears the real cleave in both directions with reaction time',()=>{
 for(const face of [-1,1])for(const reaction of [0,.05,.1,.15]){
  const s=arena(),e=s.enemies[0];s.player.x=e.x+face*160;s.player.face=-face;
  while(templeTelegraph(e)?.label!=='JUMP / WARP NOW')step(s,{},1/60);
  for(let i=0;i<Math.round(reaction*60);i++)step(s,{},1/60);
  const hp=s.player.hp;assert.ok(act(s,'jump'));for(let i=0;i<45;i++)step(s,{},1/60);assert.equal(s.player.hp,hp);
 }
});
test('Late cue stops recommending a jump and low jumps still take the sweep',()=>{
 const s=arena(),e=s.enemies[0];step(s,{},1/60);e.timer=.15;assert.equal(templeTelegraph(e).label,'WARP / STAY CLEAR');
 for(const height of [0,60,110]){const foe={...e,mode:'windup',timer:.01};const events=stepTempleEnemy(foe,{x:1340,y:GROUND-height},1/60,GROUND);assert.equal(events.some(e=>e.type==='damage'),height<100);}
});
test('Windup meter advances to release, and the counter meter empties before the next attack',()=>{
 const s=arena(),e=s.enemies[0];step(s,{},1/60);const a=templeTelegraph(e);assert.equal(a.phase,'windup');assert.equal(a.progress,0);
 step(s,{},.05);assert.ok(templeTelegraph(e).progress>a.progress);
 e.timer=.01;step(s,{},1/60);assert.equal(templeTelegraph(e).phase,'strike');assert.equal(templeTelegraph(e).progress,1);
 e.timer=.01;step(s,{},1/60);assert.equal(templeTelegraph(e).phase,'recover');assert.equal(templeTelegraph(e).progress,1);
 e.timer=.01;step(s,{},1/60);assert.equal(templeTelegraph(e),null);e.dead=true;assert.equal(templeTelegraph(e),null);
});
test('Temple blade reaches the strike pose at release, recovers from its actual pose, and resets cleanly',()=>{
 const e={mode:'windup',windupDuration:.8,timer:.8,guardFrame:1};assert.deepEqual(templeFrames(e),{from:1,to:2,blend:0});
 assert.equal(templeFrames({...e,timer:.4}).to,2);const late=templeFrames({...e,timer:.02});assert.equal(late.to,3);assert.ok(late.blend>0&&late.blend<1);
 assert.equal(templeFrames({...e,timer:0}).blend,1);assert.deepEqual(templeFrames({...e,mode:'strike'}),{from:3,to:3,blend:1});
 staggerTempleEnemy(e);assert.equal(templeFrames(e).from,2);assert.equal(templeFrames(e).blend,0);assert.equal(templeTelegraph(e).progress,1);assert.deepEqual(e.marks,[]);
 assert.equal(templeFrames({...e,timer:.6}).blend,1);assert.deepEqual(templeFrames({mode:'idle',poseTime:0}),{from:0,to:0,blend:0});
});
test('Reduced effects keep fixed Temple key poses and identical attack warnings',()=>{
 for(const mode of ['idle','windup','strike','recover']){const e={mode,templeAttack:'cleave',timer:.4,windupDuration:.8,recoveryDuration:1.05};const f=templeFrames(e,true);assert.equal(f.blend,1);assert.equal(f.to,mode==='windup'?2:mode==='strike'?3:0);if(mode==='windup')assert.equal(templeTelegraph(e).label,'JUMP / WARP NOW');}
});
