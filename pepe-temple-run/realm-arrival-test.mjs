import assert from 'node:assert/strict';
import * as THREE from '../crown-pepe-3d/vendor/three.module.js';
import {createRealmArrival} from './realm-arrival.js';
import {createTrackView} from './track-view.js';
import {createCorruptRealm} from './corrupt-realm.js';

const scene=new THREE.Scene(),arrival=createRealmArrival(THREE,scene),pose={active:false,player:{x:0,z:0}};
const root=scene.getObjectByName('CorruptionArrival'),gate=scene.getObjectByName('CorruptionRiftGate');
let d={state:'running',realm:'jade',distance:100,time:4,objects:[],turn:{visualBend:0}};
const step=()=>{const before=JSON.stringify(d);arrival.update(d,pose);assert.equal(JSON.stringify(d),before);scene.updateMatrixWorld(true);};
step();assert.equal(root.visible,false);
d.objects=[{type:'gate',lane:1,z:140,pattern:1,hit:false}];step();assert.equal(root.visible,false);
d.objects[0].z=60;step();assert.equal(arrival.diagnostics().phase,'approach');assert.equal(gate.position.z,-53*.32);assert.ok(arrival.diagnostics().strength>0);
// The tangible frame stays outside the crouch/jump corridor even in fallback.
scene.getObjectByName('RiftFrameFallback').traverse(o=>{if(!o.isMesh)return;const box=new THREE.Box3().setFromObject(o,true);assert.ok(box.min.y>=3.6||box.min.x>=3.5||box.max.x<=-3.5,'Frame blocks the open three-lane passage');});
for(const support of gate.children.filter(o=>o.name==='RiftBridgeFoundation')){const b=new THREE.Box3().setFromObject(support,true);assert.ok(b.min.y<-2.1,'Wide frame hovers above water');assert.ok(Math.abs(b.max.y-.065)<1e-6,'Frame foot does not meet foundation');assert.ok(b.max.x<=-3.19||b.min.x>=3.19,'Foundation blocks a running lane');}
const membrane=scene.getObjectByName('OpenCenterRift');assert.equal(membrane.material.depthWrite,false);assert.ok(membrane.material.fragmentShader.includes('smoothstep(.7,.8,r)'));
d.state='paused';const freeze=JSON.stringify(arrival.diagnostics()),matrices=Array.from(scene.getObjectByName('RiftMotes').instanceMatrix.array);step();assert.equal(JSON.stringify(arrival.diagnostics()),freeze);assert.deepEqual(Array.from(scene.getObjectByName('RiftMotes').instanceMatrix.array),matrices);
d.state='running';d.realm='corrupt';d.realmEntry={time:10,distance:222,lane:1,pattern:1};d.time=10.5;d.distance=236;d.objects=[];step();assert.equal(arrival.diagnostics().phase,'crossing');assert.equal(arrival.diagnostics().elapsed,.5);assert.equal(gate.position.z,14*.32);
d.state='paused';const crossing=JSON.stringify(arrival.diagnostics());step();assert.equal(JSON.stringify(arrival.diagnostics()),crossing);
pose.active=true;pose.nextHeadingYaw=Math.PI/2;pose.player={x:5,z:2};step();assert.deepEqual(arrival.diagnostics().pose,{yaw:Math.PI/2,x:5,z:2});
d.time=11.21;step();assert.equal(root.visible,false);assert.equal(arrival.diagnostics().strength,0);
pose.active=false;d={state:'running',realm:'jade',realmEntry:null,time:20,distance:0,objects:[]};step();assert.equal(root.visible,false);assert.equal(arrival.diagnostics().pattern,null);assert.equal(arrival.diagnostics().elapsed,0);
// A failed or already-resolved gate never leaves a live rift.
d.objects=[{type:'gate',z:6,hit:true,failed:true,pattern:1}];step();assert.equal(root.visible,false);
assert.throws(()=>arrival.mount(new THREE.Group()),/bounds/);
const frame=new THREE.Group();for(const side of [-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(.8,6,.6),new THREE.MeshStandardMaterial());p.position.set(side*4,5,0);frame.add(p);}arrival.mount(frame);assert.equal(arrival.diagnostics().asset,true);assert.equal(scene.getObjectByName('RiftFrameFallback').visible,false);assert.ok(Math.abs(new THREE.Box3().setFromObject(frame,true).min.y-.065)<1e-6);

class TextureLoader{load(path,ready){const t=new THREE.Texture();ready(t);return t;}}
const pickupScene=new THREE.Scene(),track=createTrackView({...THREE,TextureLoader},pickupScene),realm=createCorruptRealm(THREE,pickupScene);
const lights={key:new THREE.DirectionalLight(),rim:new THREE.DirectionalLight(),ambient:new THREE.HemisphereLight()};
const run={state:'running',realm:'jade',time:1,distance:30,visualLane:1,objects:[{type:'jade',lane:1,z:18,hit:false}],turn:{completed:0}};
track.update(run,0);let pickup;pickupScene.traverse(o=>{if(o.userData.type==='jade'&&o.visible)pickup=o;});const jadeGeometry=pickup.geometry,jadeMaterial=pickup.material;
realm.update(run,pose,lights,null);run.realm='corrupt';run.realmEntry={time:2,distance:31};run.time=2.6;track.update(run,0);realm.update(run,pose,lights,null);
assert.ok(Math.abs(realm.diagnostics().blend-.5)<1e-9,'First rendered corrupt frame lost simulation crossing time');
assert.notEqual(pickup.geometry,jadeGeometry);assert.notEqual(pickup.material,jadeMaterial);assert.equal(track.diagnostics().collectible,'fractured-shard');
const shardGeometry=pickup.geometry,shardColor=pickup.material.color.clone();pickup.geometry.computeBoundingBox();const bounds=pickup.geometry.boundingBox;assert.ok(bounds.min.y===-1&&bounds.max.y===1);assert.ok(bounds.min.x>=-1&&bounds.max.x<=1);
assert.ok([...pickup.geometry.attributes.normal.array].every(Number.isFinite));assert.equal(track.diagnostics().capacity,116);
run.time=3.5;realm.update(run,pose,lights,null);assert.ok(pickup.material.color.equals(shardColor),'Distinct shard palette recolored into hazard palette');
run.state='paused';track.update(run,0);assert.equal(pickup.geometry,shardGeometry);const frozenRotation=pickup.rotation.toArray();track.update(run,0);assert.deepEqual(pickup.rotation.toArray(),frozenRotation);
run.realm='jade';run.realmEntry=null;run.distance=0;run.time=0;track.update(run,0);realm.update(run,pose,lights,null);assert.equal(pickup.geometry,jadeGeometry);assert.equal(pickup.material,jadeMaterial);
console.log('REALM ARRIVAL PASS: open passage, gate causality, simulation timing, pause, turn basis, fallback, restart, shard identity and palette');
