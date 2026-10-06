// Realm presentation follows simulation time; never changes hazards or movement.
export function createCorruptRealm(THREE,scene){
  const root=new THREE.Group();root.name='CorruptTempleRealm';root.visible=false;scene.add(root);
  if(typeof window!=='undefined')window.templeCorruptionScene=root;
  const landmark=new THREE.Group();landmark.name='CorruptTempleLandmark';landmark.position.set(0,0,-88);landmark.scale.setScalar(1.8);root.add(landmark);
  const originals=new Map(),fog=new THREE.Color('#30213f'),keyTint=new THREE.Color('#e9c8f3'),rimTint=new THREE.Color('#ca72ff'),fillTint=new THREE.Color('#c6b1d3');
  let previousRealm='jade',enteredAt=0,blend=0,loaded=false,error=null,texture=null;const clusters=[],dummy=new THREE.Object3D();
  const skip=o=>{for(let p=o;p;p=p.parent)if(p===root||p.isSkinnedMesh||p.name==='CrownGoldAccessory'||p.userData.realmPaletteFixed)return true;return false;};
  function mount(g){const bounds=new THREE.Box3().setFromObject(g,true),size=bounds.getSize(new THREE.Vector3());if(!Number.isFinite(size.y)||size.y<=0)throw Error('Invalid corrupt landmark bounds');g.position.y-=bounds.min.y;let foundationMaterial;g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(!foundationMaterial&&o.material?.map)foundationMaterial=o.material;}});landmark.add(g);foundationMaterial=foundationMaterial?.clone()||new THREE.MeshStandardMaterial();foundationMaterial.fog=false;foundationMaterial.color.set('#35233f');if(foundationMaterial.emissive)foundationMaterial.emissive.set('#000000');foundationMaterial.roughness=1;foundationMaterial.metalness=0;const foundation=new THREE.Mesh(new THREE.BoxGeometry(size.x*1.04,4.4,size.z*1.08),foundationMaterial||new THREE.MeshStandardMaterial({color:'#302039',roughness:.95}));foundation.position.set((bounds.min.x+bounds.max.x)/2,-2.2,(bounds.min.z+bounds.max.z)/2);foundation.castShadow=foundation.receiveShadow=true;foundation.name='CorruptAltarFoundation';landmark.add(foundation);const terrace=new THREE.Mesh(new THREE.BoxGeometry(15,1.8,14),foundation.material);terrace.position.set(0,-.9,0);terrace.receiveShadow=true;terrace.name='CorruptAltarTerrace';landmark.add(terrace);loaded=true;}
  function setTexture(value){texture=value;texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2,1);}
  function mountClusters(g){g.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(g,true);if(!Number.isFinite(bounds.min.y))throw Error('Invalid crystal cluster');g.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometry.translate(0,-bounds.min.y,0);const batch=new THREE.InstancedMesh(geometry,o.material,24);batch.castShadow=batch.receiveShadow=true;batch.frustumCulled=false;root.add(batch);clusters.push(batch);});}
  function update(d,pose,lights,hero){
    if(d.realm==='corrupt'&&previousRealm!=='corrupt')enteredAt=d.realmEntry?.time??d.time;
    blend=d.realm==='corrupt'?Math.min(1,Math.max(0,(d.time-enteredAt)/1.2)):0;previousRealm=d.realm||'jade';root.visible=blend>0;
    if(typeof document!=='undefined')document.body.dataset.realm=blend>.5?'corrupt':'jade';
    root.rotation.y=pose.active?pose.nextHeadingYaw:0;root.position.set(pose.active?pose.player.x:0,0,pose.active?pose.player.z:0);
    for(let shrine=0;shrine<12;shrine++){const side=shrine<6?-1:1,z=-94+(((shrine%6)*18+d.distance*.32)%108+108)%108;for(let corner=0;corner<2;corner++){dummy.position.set(side*12.45,.3,z+(corner?1.3:-1.3));dummy.scale.setScalar(.8);dummy.updateMatrix();for(const batch of clusters)batch.setMatrixAt(shrine*2+corner,dummy.matrix);}}for(const batch of clusters)batch.instanceMatrix.needsUpdate=true;
    scene.traverse(o=>{if(skip(o)||!o.material)return;for(let p=o;p;p=p.parent)if(p===hero)return;
      for(const m of Array.isArray(o.material)?o.material:[o.material])if(!m.userData.realmPaletteFixed&&!originals.has(m)){
        const entry={color:m.color?.clone(),emissive:m.emissive?.clone(),map:m.map,target:null};
        if(entry.color){const luminance=entry.color.r*.25+entry.color.g*.55+entry.color.b*.2;entry.target=new THREE.Color(luminance*.68+.045,luminance*.28+.015,luminance*.9+.065);}
        if(m.isShaderMaterial&&m.fragmentShader.includes('#include <tonemapping_fragment>')){m.uniforms.realmCorruption={value:0};m.fragmentShader='uniform float realmCorruption;\n'+m.fragmentShader.replace('#include <tonemapping_fragment>','float realmLuma=dot(gl_FragColor.rgb,vec3(.25,.55,.2));gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(realmLuma*.72+.012,realmLuma*.26+.004,realmLuma*1.08+.025),realmCorruption*.82);\n#include <tonemapping_fragment>');m.needsUpdate=true;}
        originals.set(m,entry);
      }
    });
    for(const [m,base] of originals){if(base.color)m.color.copy(base.color).lerp(base.target,blend*.78);if(base.emissive&&base.emissive.r+base.emissive.g+base.emissive.b>0)m.emissive.copy(base.emissive).lerp(rimTint,blend*.8);if(m.uniforms?.realmCorruption)m.uniforms.realmCorruption.value=blend;
      const map=blend>.5&&texture&&base.map&&m.roughness>.6?texture:base.map;if(m.map!==map){m.map=map;m.needsUpdate=true;}}
    // Crown remains the same character; only the environment lighting changes.
    scene.fog?.color.lerp(fog,blend);lights.key.color.lerp(keyTint,blend);lights.rim.color.lerp(rimTint,blend);lights.ambient.color.lerp(fillTint,blend);
  }
  return {mount,mountClusters,setTexture,fail:e=>{error=String(e);},update,diagnostics:()=>({loaded,error,realm:previousRealm,blend,source:'Blender corrupt frog temple',textureReady:Boolean(texture),crystalInstances:clusters.length?24:0,crystalBatches:clusters.length,landmarkZ:landmark.position.z,landmarkVisible:root.visible&&loaded,materials:originals.size,pose:{yaw:root.rotation.y,x:root.position.x,z:root.position.z}})};
}
