import test from 'node:test';import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import {APPROACH_ART,EXTRA_ART,sceneArt,sceneSurface,portalCell,riftCamera} from '../realm-art.js';
test('every enemy realm has two distinct approach paintings and retains its guardian scene',async()=>{
 const keys=[];for(const world of ['frozen','crimson','void']){assert.equal(sceneArt(world,'arena'),world);for(const zone of ['approach','approach2']){const key=sceneArt(world,zone);keys.push(key);assert.equal(key,APPROACH_ART[world][zone]);assert.ok(sceneSurface(world,zone)>.6&&sceneSurface(world,zone)<.85);await access(new URL(`../assets/${key}.webp`,import.meta.url));}}
 assert.equal(new Set(keys).size,6);assert.equal(sceneArt('academy','approach'),'academy');assert.equal(EXTRA_ART.length,14);
});
test('all four realm portals map to unique atlas cells',()=>{assert.deepEqual(['academy','frozen','crimson','void'].map(portalCell),[0,1,2,3]);});
test('painted portals and Rift eruptions ship equal-sized RGBA atlas cells',async()=>{
 for(const key of ['realm-portals-v1','kek-rift-eruptions-v1']){const b=await readFile(new URL(`../assets/${key}.png`,import.meta.url));assert.equal(b.readUInt32BE(16),2048);assert.equal(b.readUInt32BE(20),640);assert.equal(b[25],6,'RGBA preserves transparent openings and VFX gutters');}
});
test('Rift camera accents are bounded, fade out and are disabled in reduced effects',()=>{
 for(let i=0;i<=62;i++){const t=i/100,v=riftCamera(t);assert.ok(v.zoom>=1&&v.zoom<=1.043);assert.ok(v.shade>=0&&v.shade<=.16);assert.ok(v.flash>=0&&v.flash<=.22);assert.deepEqual(riftCamera(t,true),{zoom:1,shade:0,flash:0});}
 assert.deepEqual(riftCamera(undefined),{zoom:1,shade:0,flash:0});assert.deepEqual(riftCamera(.62),{zoom:1,shade:0,flash:0});
});
