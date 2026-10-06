import assert from 'node:assert/strict';
import * as THREE from '../crown-pepe-3d/vendor/three.module.js';
import {createStoneDetail} from './surface-detail.js';
import {createTempleScenery} from './temple-scenery.js';
import {createTrackView} from './track-view.js';
const a=createStoneDetail(THREE),b=createStoneDetail(THREE);
for(const key of ['bump','roughness']){
  assert.deepEqual(a[key].image.data,b[key].image.data,'Cosmetic maps must be repeatable');
  assert.equal(a[key].image.width,128);assert.equal(a[key].generateMipmaps,true);
  assert.equal(a[key].wrapS,THREE.RepeatWrapping);
  const samples=Array.from(a[key].image.data).filter((_,i)=>i%4===0);
  assert.ok(Math.max(...samples)-Math.min(...samples)>40,'Surface must have relief/roughness variation');
}
class TextureLoader{load(path,onLoad){const map=new THREE.Texture();onLoad(map);return map;}}
const api={...THREE,TextureLoader},scene=new THREE.Scene();
createTempleScenery(api,scene);createTrackView(api,scene);
const materials=new Set();scene.traverse(o=>{if(o.isMesh&&o.material.bumpMap)materials.add(o.material);});
assert.ok(materials.size>=2,'Scenery and track must use surface detail');
for(const material of materials){assert.ok(material.bumpMap.isDataTexture);assert.ok(material.roughnessMap.isDataTexture);assert.ok(material.bumpScale>0&&material.bumpScale<.15);}
console.log('SURFACE PASS: deterministic mipmapped relief/roughness and actual track/scenery material integration');
