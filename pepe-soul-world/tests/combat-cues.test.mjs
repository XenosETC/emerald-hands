import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,act,step} from '../core.js';
import {combatCue} from '../combat-cues.js';
test('Wave cooldown does not hide Warp readiness and low spirit is explicit',()=>{
 const s=createState();act(s,'wave');assert.match(combatCue(s),/K · Warp · 20 SP.*Kek Wave 1.2s/);
 s.player.sp=5;s.player.waveCooldown=0;assert.match(combatCue(s),/Warp · Need 20 SP.*Wave · Need 28 SP/);
});
test('Airborne cue switches to Rift only after its unlock, and reflects its separate cooldown',()=>{
 const s=createState();act(s,'jump');step(s,{},1/60);assert.match(combatCue(s),/Kek Wave/);
 const unlocked=createState({version:2,xp:180,seals:['frozen']});act(unlocked,'jump');step(unlocked,{},1/60);
 unlocked.player.riftCooldown=3;assert.match(combatCue(unlocked),/Kek Rift 3.0s/);assert.doesNotMatch(combatCue(unlocked),/Kek Wave/);
 unlocked.player.riftCooldown=0;unlocked.player.sp=30;assert.match(combatCue(unlocked),/Kek Rift · Need 40 SP/);
});
