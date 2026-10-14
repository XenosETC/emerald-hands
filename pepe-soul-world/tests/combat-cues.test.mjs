import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,act,step} from '../core.js';
import {combatCue} from '../combat-cues.js';
test('Wave cooldown does not hide Warp readiness and low spirit is explicit',()=>{
 const s=createState();act(s,'wave');assert.match(combatCue(s),/K · Warp · 20 SP.*Kek Wave · Cooldown 1.2s/);
 s.player.sp=5;s.player.waveCooldown=0;assert.match(combatCue(s),/Warp · Need 20 SP.*Wave · Need 28 SP/);
});
test('Airborne cue switches to Rift only after its unlock, and reflects its separate cooldown',()=>{
 const s=createState();act(s,'jump');step(s,{},1/60);assert.match(combatCue(s),/Kek Wave/);
 const unlocked=createState({version:2,xp:180,seals:['frozen']});act(unlocked,'jump');step(unlocked,{},1/60);
 unlocked.player.riftCooldown=3;assert.match(combatCue(unlocked),/Kek Rift · Cooldown 3.0s/);assert.doesNotMatch(combatCue(unlocked),/Kek Wave/);
 unlocked.player.riftCooldown=0;unlocked.player.sp=30;assert.match(combatCue(unlocked),/Kek Rift · Need 40 SP/);
});

test('real hit recovery counts down without granting or buffering rejected techniques',async()=>{
 const {attemptAction}=await import('../action-feedback.js');
 const s=createState({version:2,world:'crimson',oath:true,training:3,x:800,xp:420,seals:['frozen']});
 const initialHealth=s.player.hp;
 for(let frame=0;frame<120&&!s.player.hurt;frame++)step(s,{},1/60);
 assert.ok(s.player.hurt>0);assert.ok(s.player.hp<initialHealth);
 const before=JSON.stringify(s);assert.match(combatCue(s),/HIT RECOVERY · 0\.4s · Retry after recovery/);assert.equal(JSON.stringify(s),before);
 const spirit=s.player.sp,casts=s.projectiles.filter(p=>p.friendly).length;
 assert.equal(attemptAction(s,'release'),false);assert.equal(s.player.sp,spirit);assert.equal(s.player.release,0);
 for(let frame=0;frame<10;frame++)step(s,{},1/60);
 assert.match(combatCue(s),/HIT RECOVERY · 0\.2s/);
 for(let frame=0;frame<30&&s.player.hurt>0;frame++)step(s,{},1/60);
 assert.equal(s.player.hurt,0);
 assert.doesNotMatch(combatCue(s),/HIT RECOVERY/);assert.equal(s.player.release,0);assert.equal(s.projectiles.filter(p=>p.friendly).length,casts);
 assert.equal(attemptAction(s,'release'),true);assert.ok(s.player.release>0);
});

test('tiny positive hit locks never claim zero seconds and defeat keeps revival guidance',()=>{
 const s=createState();s.player.hurt=.00001;assert.match(combatCue(s),/HIT RECOVERY · 0\.1s/);
 s.dead=true;assert.doesNotMatch(combatCue(s),/HIT RECOVERY/);assert.match(combatCue(s),/Revive first/);
});
