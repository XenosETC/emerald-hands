import * as THREE from '../crown-pepe-3d/vendor/three.module.js';
import {createTrackView} from './track-view.js';
import assert from 'node:assert/strict';
class TextureLoader {load(path,onLoad){const t=new THREE.Texture();onLoad(t);return t;}}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const scene=new THREE.Scene(),track=createTrackView({...THREE,TextureLoader},scene);
const d={state:'running',distance:30,time:1,visualLane:1,objects:[{type:'spire',lane:1,z:7,hit:false}],turn:{completed:0,visualBend:0}};
function update(dt=.04){const input=JSON.stringify(d);track.update(d,dt);assert.equal(JSON.stringify(d),input,'View mutated simulation');scene.updateMatrixWorld(true);}
update();
const fallback=[];scene.traverse(o=>{if(o.userData.type==='spire')fallback.push(o);});
assert.equal(fallback.filter(o=>o.visible).length,1);assert.equal(fallback[0].children.filter(o=>o.geometry.type==='ConeGeometry').length,7);
const fallbackBox=new THREE.Box3().setFromObject(fallback[0],true);assert.ok(fallbackBox.min.y>=.069999);assert.ok(fallbackBox.max.y<=1.93);assert.ok(fallbackBox.max.x-fallbackBox.min.x<2.2);
// Sparse rotated geometry produces phantom corners with the coarse Box3 path.
const fixture=new THREE.Group();
for(let i=0;i<2;i++){
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-.25,0,0,.25,0,0,0,2,0],3));geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial());mesh.rotation.z=i?-.35:.35;mesh.position.set(i?.1:-.1,3,.15*i);fixture.add(mesh);
}
fixture.updateMatrixWorld(true);const precise=new THREE.Box3().setFromObject(fixture,true),coarse=new THREE.Box3().setFromObject(fixture);
assert.ok(coarse.max.y>precise.max.y+.01,'Fixture does not reproduce phantom bounds');
track.mountSpireModel(fixture);update();
const road=scene.children[0].children.find(o=>o.name==='TempleOutgoingWorld'),batches=road.children.filter(o=>o.isInstancedMesh);
assert.equal(track.diagnostics().spireAsset,true);assert.equal(track.diagnostics().spireBatches,2);assert.equal(batches.length,2);
function check(){
 const box=new THREE.Box3(),matrix=new THREE.Matrix4();
 for(const batch of batches){assert.equal(batch.count,1);batch.getMatrixAt(0,matrix);near(matrix.elements[13],.07);const worldMatrix=new THREE.Matrix4().multiplyMatrices(batch.matrixWorld,matrix);const b=new THREE.Box3().setFromBufferAttribute(batch.geometry.attributes.position).applyMatrix4(worldMatrix);box.union(b);
 const local=new THREE.Box3().setFromBufferAttribute(batch.geometry.attributes.position);assert.ok(local.min.y>=-1e-6);}
 near(box.min.y,.07);near(box.max.y,1.92);assert.ok(box.max.x-box.min.x<2.2);
 const actual=new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().multiplyMatrices(batches[0].matrixWorld,matrix)),expected=track.worldPosition(1,7,d);near(actual.x,expected.x);near(actual.z,expected.z);
 assert.ok(fallback.every(o=>!o.visible));
}
check();const frozen=batches.map(b=>Array.from(b.instanceMatrix.array));d.state='paused';update(0);assert.deepEqual(batches.map(b=>Array.from(b.instanceMatrix.array)),frozen);
d.state='running';d.distance=449;d.time=10;d.turn={announced:true,remaining:1,direction:'left',completed:0};update();
d.distance=450;d.time=10.04;d.turn={announced:false,remaining:450,direction:'right',completed:1};update();d.distance=459;d.time=10.365;update();assert.equal(track.viewPose().active,true);check();
d.distance=0;d.time=0;d.turn={completed:0};d.objects=[];update();assert.equal(track.viewPose().active,false);assert.ok(batches.every(b=>b.count===0&&!b.visible));assert.equal(track.diagnostics().counts.spire,undefined);
console.log('SPIRE VIEW PASS: fallback, precise rotated bounds, normalized grounding, collision-plane position, shared turn basis, pause and restart');
