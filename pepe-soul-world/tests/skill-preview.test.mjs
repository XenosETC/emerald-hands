import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,snapshot} from '../core.js';
import {SKILLS,skillPreview,learn,stats} from '../systems.js';
test('each next-rank preview matches learned stats without changing the run',()=>{
 for(const id of Object.keys(SKILLS)){
 const s=createState({version:1,xp:1000,seals:['frozen']});const saved=snapshot(s),preview=skillPreview(s,id);
 assert.deepEqual(snapshot(s),saved);assert.equal(preview.reasons.length,0);assert.equal(learn(s,id),true);
 for(const change of preview.changes)assert.equal(stats(s)[change.key],change.after);
 }
});
test('skill locks explain level, points, seal, death and max rank and agree with learning',()=>{
 const s=createState();assert.ok(skillPreview(s,'awakening').reasons.some(r=>r.includes('seal')));assert.equal(learn(s,'awakening'),false);
 assert.ok(skillPreview(s,'warp').reasons.some(r=>r.includes('level')));assert.ok(skillPreview(s,'warp').reasons.some(r=>r.includes('point')));
 s.xp=1000;s.dead=true;assert.equal(learn(s,'warp'),false);assert.ok(skillPreview(s,'warp').reasons.includes('Revive before learning'));
 s.dead=false;s.skills.warp=3;assert.equal(skillPreview(s,'warp').maxed,true);assert.equal(learn(s,'warp'),false);assert.equal(skillPreview(s,'missing'),null);
});
