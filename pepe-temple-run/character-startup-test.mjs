import * as THREE from '../crown-pepe-3d/vendor/three.module.js';
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
// Execute the real startup guard without creating a browser renderer.
const source=fs.readFileSync(new URL('./character.js',import.meta.url),'utf8');
const guard=source.slice(source.indexOf('function validateRunnerAsset('),source.indexOf('\nfunction play('));
const context={THREE};vm.createContext(context);vm.runInContext(guard,context);
const clips=['idle','run','jump','slide','hurt'].map(name=>new THREE.AnimationClip('Crown_'+name,1,[]));
const valid=new THREE.Group();valid.add(new THREE.Mesh(new THREE.BoxGeometry(1,2,1),new THREE.MeshBasicMaterial()));
assert.equal(context.validateRunnerAsset({scene:valid,animations:clips}),true);
assert.throws(()=>context.validateRunnerAsset({scene:valid,animations:clips.filter(c=>c.name!=='Crown_run')}),/animation missing: run/);
assert.throws(()=>context.validateRunnerAsset({scene:new THREE.Group(),animations:clips}),/invalid height/);
const flat=new THREE.Group();flat.add(new THREE.Mesh(new THREE.BoxGeometry(1,0,1),new THREE.MeshBasicMaterial()));assert.throws(()=>context.validateRunnerAsset({scene:flat,animations:clips}),/invalid height/);
assert.throws(()=>context.validateRunnerAsset({scene:valid}),/incomplete/);
assert.throws(()=>context.validateRunnerAsset({scene:valid,animations:clips.map(c=>c.name==='Crown_jump'?new THREE.AnimationClip(c.name,0,[]):c)}),/invalid duration/);
const invalid=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());mesh.position.y=NaN;invalid.add(mesh);assert.throws(()=>context.validateRunnerAsset({scene:invalid,animations:clips}),/invalid height/);
assert.ok(source.indexOf('validateRunnerAsset(gltf);')<source.indexOf('model=gltf.scene'),'Guard runs after model mount');
console.log('CHARACTER STARTUP PASS: valid Crown, mandatory animation failure, empty/flat/nonfinite geometry rejected before mount');
