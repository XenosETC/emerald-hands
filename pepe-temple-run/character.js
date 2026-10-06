import {createRunnerMotion} from './runner-motion.js?v=realm-gardens-86';
import {createContactShadow} from './contact-shadow.js?v=realm-gardens-86';
import {createCorruptRealm} from './corrupt-realm.js?v=realm-gardens-86';
import {createRealmArrival} from './realm-arrival.js?v=realm-gardens-86';
import {createRealmSetpieces} from './realm-setpieces.js?v=realm-gardens-86';
import * as THREE from 'three';
import {GLTFLoader} from '../crown-pepe-3d/vendor/GLTFLoader.js';
import {createTrackView} from './track-view.js?v=realm-gardens-86';
import {createTempleScenery} from './temple-scenery.js?v=realm-gardens-86';
import {createTempleWorld} from './temple-world.js?v=realm-gardens-86';
import {createAuras} from './auras.js?v=realm-gardens-86';


// Newest rebuilt Rumble gameplay candidate, with its exported weighted rig and clips.
const canvas=document.createElement('canvas');canvas.className='character-layer';canvas.setAttribute('aria-hidden','true');document.querySelector('.arena').insertBefore(canvas,document.querySelector('.hud'));
const renderer=new THREE.WebGLRenderer({canvas,alpha:false,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor('#193e35',1);renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(60,1,.1,140);camera.position.set(0,4.6,9.5);camera.lookAt(0,2.2,-12);scene.fog=new THREE.Fog('#193e35',28,100);const track=createTrackView(THREE,scene);window.templeTrack={loaded:false};
const scenery=createTempleScenery(THREE,scene);window.templeScenery={loaded:false};
new GLTFLoader().load('assets/sculpted-guardian-carved.glb?v=carved-23',gltf=>{try{scenery.mountGuardianModel(gltf.scene,'Blender carved stone guardian');}catch(error){window.templeGuardianError=error.message;}},undefined,error=>{window.templeGuardianError='Blender guardian unavailable; using procedural sculpture';});
const world=createTempleWorld(THREE,scene);window.templeWorld={loaded:false};camera.far=450;
const auras=createAuras(THREE,scene);window.templeAuras={loaded:true};
const corruption=createCorruptRealm(THREE,scene);
const arrival=createRealmArrival(THREE,scene);
const setpieces=createRealmSetpieces(THREE,scene);
new GLTFLoader().load('assets/jade-lotus-lantern.glb?v=realm-gardens-86',g=>{try{setpieces.mountLotus(g.scene);}catch(e){setpieces.fail(e.message);}},undefined,()=>setpieces.fail('Lotus asset unavailable; using carved stone lanterns'));
new GLTFLoader().load('assets/corrupt-portal.glb?v=realm-gardens-86',g=>{try{arrival.mount(g.scene);}catch(e){arrival.fail(e.message);}},undefined,()=>arrival.fail('Carved portal unavailable; using stone frame'));
new GLTFLoader().load('assets/corrupt-realm.glb?v=realm-gardens-86',g=>{try{corruption.mount(g.scene);}catch(e){corruption.fail(e.message);}},undefined,e=>corruption.fail('Corrupt temple asset unavailable'));
new GLTFLoader().load('assets/corrupt-crystal-cluster.glb?v=realm-gardens-86',g=>{try{corruption.mountClusters(g.scene);track.mountSpireModel(g.scene);}catch(e){corruption.fail(e.message);}},undefined,e=>corruption.fail('Corrupt crystal asset unavailable'));
new THREE.TextureLoader().load('assets/corrupt-stone-basecolor.png?v=realm-gardens-86',t=>{corruption.setTexture(t);setpieces.setCorruptTexture(t);},undefined,e=>corruption.fail('Corrupt stone texture unavailable'));
scene.fog.near=38;scene.fog.far=180;
scene.traverse(o=>{if(o.isMesh){o.receiveShadow=!o.userData.noShadow;if(o.isInstancedMesh)o.castShadow=!o.userData.noShadow;}});
const effects=document.createElement('canvas');effects.className='effects-layer';effects.setAttribute('aria-hidden','true');canvas.after(effects);window.templeEffectsContext=effects.getContext('2d');
const shadow=createContactShadow(THREE);scene.add(shadow);
let latestState,viewWidth=1,viewHeight=1;const point=new THREE.Vector3(),depthPoint=new THREE.Vector3();window.templeWorldProject=(lane,z)=>{const position=track.worldPosition(lane,z,latestState);depthPoint.set(position.x,0,position.z).applyMatrix4(camera.matrixWorldInverse);point.set(position.x,0,position.z).project(camera);return{x:(point.x+1)*viewWidth/2,y:(1-point.y)*viewHeight/2,s:Math.max(.02,Math.min(1,9.5/Math.max(.1,-depthPoint.z)))};};
const ambient=new THREE.HemisphereLight('#e5f4c6','#385447',1.3);scene.add(ambient);const key=new THREE.DirectionalLight('#fff1cc',2.2);key.position.set(-3,5,7);scene.add(key);const rim=new THREE.DirectionalLight('#a7edb2',2);rim.position.set(3,3,-4);scene.add(rim);
key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-13,right:13,top:18,bottom:-14,near:.1,far:50});key.shadow.bias=-.0004;key.shadow.normalBias=.035;scene.add(key.target);
// Two bounded, shadow-free lights illuminate the real nearest braziers.
const torchLights=Array.from({length:2},()=>{const light=new THREE.PointLight('#ffae54',18,16,2);scene.add(light);return light;});
const dayFog=new THREE.Color('#193e35'),nightFog=new THREE.Color('#142b3c'),dayKey=new THREE.Color('#fff1cc'),nightKey=new THREE.Color('#c9dce9');
const abyssFog=new THREE.Color('#202440'),abyssKey=new THREE.Color('#ccc4ff'),jadeRim=new THREE.Color('#a7edb2'),abyssRim=new THREE.Color('#7be8f2'),dayAmbient=new THREE.Color('#e5f4c6'),nightAmbient=new THREE.Color('#c1d9ed');
const runnerMotion=createRunnerMotion();
let model,mixer,actions={},current,previous=performance.now(),floorOffset=0,baseScale=1,renderResizes=0,effectRatio=0;
window.templeCharacter={loaded:false,source:'CrownRebuilt / Rumble gameplay preview 2026-10-03',asset:'crown-runner-v2.glb',error:null};
function validateRunnerAsset(gltf){
  if(!gltf?.scene?.isObject3D||!Array.isArray(gltf.animations))throw Error('Crown asset is incomplete');
  const names=new Set(gltf.animations.map(clip=>clip.name.replace('Crown_','')));
  const missing=['idle','run','jump','slide','hurt'].filter(name=>!names.has(name));if(missing.length)throw Error('Crown animation missing: '+missing.join(', '));
  if(gltf.animations.some(clip=>!Number.isFinite(clip.duration)||clip.duration<=0))throw Error('Crown animation has invalid duration');
  gltf.scene.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(gltf.scene),height=bounds.getSize(new THREE.Vector3()).y;
  if(!Number.isFinite(height)||height<=0||![...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite))throw Error('Crown geometry has invalid height');
  return true;
}
function play(name){if(current===name)return;const next=actions[name];if(!next)return;const old=actions[current];next.reset();if(name==='slide'||name==='jump'||name==='hurt'){next.setLoop(THREE.LoopOnce,1);next.clampWhenFinished=true;}next.play();if(old)next.crossFadeFrom(old,.12,false);current=name;window.templeCharacter.animation=name;}
try{
  const gltf=await new GLTFLoader().loadAsync('./crown-runner-v2.glb?v=runner-flow-2');
  validateRunnerAsset(gltf);
  model=gltf.scene;model.rotation.y=Math.PI;
  model.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=true;}});
  scene.add(model);mixer=new THREE.AnimationMixer(model);
  for(const clip of gltf.animations){actions[clip.name.replace('Crown_','')]=mixer.clipAction(clip);}
  play('idle');mixer.update(0);model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model),height=bounds.getSize(new THREE.Vector3()).y;
  baseScale=2.15/height;model.scale.setScalar(baseScale);floorOffset=-bounds.min.y*baseScale;
  // Runtime accessory attaches to the newest rig; the source mesh and export stay untouched.
  model.updateMatrixWorld(true);const headBone=model.getObjectByName('head');let headMesh;
  model.traverse(o=>{if(o.isSkinnedMesh&&o.name.toLowerCase().includes('coherent')&&o.name.toLowerCase().includes('head'))headMesh=o;});
  if(headBone&&headMesh){
    const crown=new THREE.Group();crown.name='CrownGoldAccessory';const crownGold=new THREE.MeshStandardMaterial({color:'#eac470',metalness:.72,roughness:.3});
    const band=new THREE.Mesh(new THREE.TorusGeometry(.22,.035,6,24),crownGold);band.rotation.x=Math.PI/2;crown.add(band);
    const tipGeometry=new THREE.ConeGeometry(.055,.19,4);for(let i=0;i<7;i++){const a=i*Math.PI*2/7,m=new THREE.Mesh(tipGeometry,crownGold);m.position.set(Math.sin(a)*.22,.075,Math.cos(a)*.22);crown.add(m);}
    const top=new THREE.Box3().setFromObject(headMesh),anchor=headBone.getWorldPosition(new THREE.Vector3());anchor.y=top.max.y+.02;headBone.worldToLocal(anchor);crown.position.copy(anchor);headBone.add(crown);crown.traverse(o=>{if(o.isMesh)o.castShadow=true;});window.templeCharacter.crownAccessory={attached:true,bone:'head',sourceMeshChanged:false};
  }
  window.templeCharacter.clips=Object.keys(actions);window.templeCharacter.skinnedMeshes=0;
  model.traverse(o=>{if(o.isSkinnedMesh)window.templeCharacter.skinnedMeshes++;});
  window.templeCharacter.loaded=true;
}catch(e){if(model){scene.remove(model);mixer?.stopAllAction();}model=null;mixer=null;actions={};window.templeCharacter.loaded=false;window.templeCharacter.error=e.message;const start=document.querySelector('#start');if(start){start.disabled=false;start.textContent='Retry loading Crown';start.onclick=()=>window.location.reload();}document.querySelector('#message').textContent='Crown could not load. Reload the page to retry.';}
function frame(now){
  requestAnimationFrame(frame);const d=window.templeRunDiagnostics?.();if(!model||!d)return;
  const box=canvas.parentElement.getBoundingClientRect(),w=box.width,h=box.height,aspect=w/h;
  const renderRatio=Math.min(devicePixelRatio,2);if(renderer.getPixelRatio()!==renderRatio){renderer.setPixelRatio(renderRatio);renderResizes++;}if(canvas.width!==Math.floor(w*renderRatio)||canvas.height!==Math.floor(h*renderRatio)){renderer.setSize(w,h,false);renderResizes++;}window.templeCharacter.renderSizing={ratio:renderRatio,resizes:renderResizes,width:canvas.width,height:canvas.height};
  const dt=Math.min(.04,(now-previous)/1000);previous=now;
  track.update(d,d.state==='paused'?0:dt);window.templeTrack=track.diagnostics();
  const pose=track.viewPose?.()||{active:false,yaw:0,player:{x:0,z:0}},yaw=pose.yaw||0;
  arrival.update(d,pose);window.templeArrival=arrival.diagnostics();
  setpieces.update(d,pose);window.templeSetpieces=setpieces.diagnostics();
  const lightYaw=pose.active?pose.nextHeadingYaw:0,lc=Math.cos(lightYaw),ls=Math.sin(lightYaw);
  key.position.set(pose.player.x-3*lc+7*ls,8,pose.player.z+3*ls+7*lc);key.target.position.set(pose.player.x-4*ls,0,pose.player.z-4*lc);rim.position.set(pose.player.x+3*lc-4*ls,3,pose.player.z-3*ls-4*lc);
  scenery.update({...d,corruptionBlend:d.realm==='corrupt'?corruption.diagnostics().blend:0},pose);window.templeScenery=scenery.diagnostics();
  scenery.torchPositions().forEach((p,i)=>{torchLights[i].position.set(p.x,p.y,p.z);torchLights[i].intensity=18*(1+Math.sin(d.time*7+i*2)*.08);});
  window.templeScenery.torchLighting={count:2,shadowMaps:0,time:d.time,lights:torchLights.map(l=>({position:{x:l.position.x,y:l.position.y,z:l.position.z},intensity:l.intensity,distance:l.distance}))};
  world.update(d,pose);window.templeWorld=world.diagnostics();
  const night=Math.max(0,Math.min(1,(d.distance-480)/60)),abyss=THREE.MathUtils.smoothstep(d.distance,980,1040);scene.fog.color.copy(dayFog).lerp(nightFog,night).lerp(abyssFog,abyss);key.color.copy(dayKey).lerp(nightKey,night).lerp(abyssKey,abyss);key.intensity=2.55-night*.5;rim.color.copy(jadeRim).lerp(abyssRim,abyss);rim.intensity=1.55+night*.45;ambient.color.copy(dayAmbient).lerp(nightAmbient,night);ambient.intensity=1.3-night*.02;window.templeScenery.lighting={night,abyss,fog:scene.fog.color.getHexString(),keyColor:key.color.getHexString(),ambientColor:ambient.color.getHexString(),keyIntensity:key.intensity,ambientIntensity:ambient.intensity,rimIntensity:rim.intensity};
  corruption.update(d,pose,{key,rim,ambient},model);window.templeCorruption=corruption.diagnostics(); const secondary=runnerMotion.update(d);window.templeCharacter.secondaryMotion=secondary;
  const rotate=(x,z)=>({x:Math.cos(yaw)*x+Math.sin(yaw)*z,z:-Math.sin(yaw)*x+Math.cos(yaw)*z});
  viewWidth=w;viewHeight=h;latestState=d;const bend=pose.active?0:d.turn?.visualBend||0,bank=bend*.035;
  const cameraOffset=rotate(bend*.25,9.5),target=rotate(bend*.65,-12);
  camera.position.set(pose.player.x+cameraOffset.x,4.6+secondary.cameraBob+secondary.cameraDip,pose.player.z+cameraOffset.z);camera.up.set(Math.sin(bank),Math.cos(bank),0);camera.lookAt(pose.player.x+target.x,2.2,pose.player.z+target.z);camera.aspect=aspect;camera.fov=Math.max(53+Math.max(0,d.speed-25)*.12,2*Math.atan(3/(9.95*aspect))*180/Math.PI);camera.updateProjectionMatrix();
  const ratio=Math.min(devicePixelRatio,2);if(effectRatio!==ratio||effects.width!==Math.floor(w*ratio)||effects.height!==Math.floor(h*ratio)){effectRatio=ratio;effects.width=w*ratio;effects.height=h*ratio;window.templeEffectsContext.setTransform(ratio,0,0,ratio,0,0);}
  const jump=d.action==='jump'?Math.sin(d.actionTime/.85*Math.PI)*1.35:0;
  if(d.state!=='paused'){
    play(d.state==='dead'?'hurt':d.state!=='running'?'idle':d.action==='jump'?'jump':d.action==='slide'?'slide':'run');
    if(current==='run')actions.run.timeScale=d.speed/25;
    if(current==='jump')actions.jump.timeScale=actions.jump.getClip().duration/.85;
    if(current==='slide')actions.slide.timeScale=actions.slide.getClip().duration/.75;
    mixer.update(dt);
  }
  model.scale.set(baseScale*secondary.lateralStretch,baseScale*secondary.squash,baseScale*secondary.lateralStretch);
  const laneOffset=rotate((d.visualLane-1)*2.2,0);
  model.position.set(pose.player.x+laneOffset.x,floorOffset*secondary.squash+.065+jump,pose.player.z+laneOffset.z);shadow.position.x=model.position.x;shadow.position.z=model.position.z;shadow.scale.setScalar((1-jump*.2)*(1+secondary.landing*.035));
  auras.update(d,model.position);window.templeAuras=auras.diagnostics();
  shadow.visible=!d.objects.some(o=>o.type==='gap'&&Math.abs(o.lane-d.visualLane)<.48&&Math.abs(o.z-7)*.32<1.85);
  shadow.material.opacity=.35*(1-Math.max(0,jump)/1.35*.6);
  window.templeCharacter.contactShadow={visible:shadow.visible,opacity:shadow.material.opacity,scale:shadow.scale.x,position:{x:shadow.position.x,y:shadow.position.y,z:shadow.position.z},softEdge:true};
  // Lean into lane transitions without changing the source animation.
  model.rotation.x=secondary.pitch;model.rotation.z=secondary.lean+bend*-.055;model.rotation.y=Math.PI+yaw+bend*.25;
  renderer.render(scene,camera);window.templeTrack.camera={type:'perspective',fov:camera.fov,aspect:camera.aspect,bank,yaw,position:{x:camera.position.x,y:camera.position.y,z:camera.position.z}};window.templeTrack.actor={yaw:model.rotation.y,position:{x:model.position.x,y:model.position.y,z:model.position.z}};window.templeTrack.render={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,opaque:true,paintedPanorama:false,softShadows:true,shadowMapSize:1024,toneMapping:'ACES',exposure:renderer.toneMappingExposure};
  window.templeCharacter.animationTime=actions[current]?.time;window.templeCharacter.scale=[model.scale.x,model.scale.y,model.scale.z];
}
requestAnimationFrame(frame);
