// Four reusable side landmarks; no gameplay state or random sequence is changed.
export function createRealmSetpieces(THREE,scene){
  const root=new THREE.Group();root.name='TempleRealmSetpieces';root.userData.realmPaletteFixed=true;scene.add(root);
  const stone=new THREE.MeshStandardMaterial({color:'#a2ad96',roughness:.95});
  const basalt=new THREE.MeshStandardMaterial({color:'#3d294c',roughness:.88,flatShading:true});
  const vein=new THREE.MeshStandardMaterial({color:'#704389',emissive:'#663092',emissiveIntensity:.48,roughness:.48,flatShading:true});
  const gold=new THREE.MeshStandardMaterial({color:'#b7a573',metalness:.28,roughness:.64});
  const jade=new THREE.MeshStandardMaterial({color:'#9bd4a2',emissive:'#529463',emissiveIntensity:.5,roughness:.32});
  const jadeColor=stone.color.clone(),corruptColor=new THREE.Color('#b2a0bd'),goldColor=gold.color.clone(),tarnishedColor=new THREE.Color('#8d728e');
  const fireflyColor=new THREE.Color('#efd895'),fragmentColor=new THREE.Color('#9673ad');
  const box=new THREE.BoxGeometry(1,1,1),dummy=new THREE.Object3D();
  const foundations=new THREE.InstancedMesh(box,stone,4);foundations.name='RealmLandmarkFoundations';foundations.receiveShadow=true;foundations.frustumCulled=false;root.add(foundations);
  const caps=new THREE.InstancedMesh(box,gold,4);caps.name='RealmLandmarkCoping';caps.frustumCulled=false;root.add(caps);

  // Angular sections expose a luminous mineral core along the broken joints.
  const centers=[[0,0,.57],[.05,1.65,.49],[-.08,3.4,.42],[-.35,5.1,.34],[-.8,6.55,.26],[-1.22,7.65,.17],[-1.5,8.4,.015]];
  function ribGeometry(core=false){
    const vertices=[];
    const triangle=(a,b,c)=>vertices.push(...a,...b,...c);
    const ring=(x,y,r)=>Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return [x+Math.cos(a)*r,y,Math.sin(a)*r];});
    for(let section=0;section<centers.length-1;section++){
      const a=centers[section],b=centers[section+1],inset=core?0:.038;
      const lo=ring(a[0],a[1]+(section?inset:0),a[2]*(core?.75:1));
      const hi=ring(b[0],b[1]-inset,b[2]*(core?.75:1));
      for(let side=0;side<6;side++){const next=(side+1)%6;triangle(lo[side],hi[next],lo[next]);triangle(lo[side],hi[side],hi[next]);}
      for(let side=1;side<5;side++){triangle(lo[0],lo[side],lo[side+1]);triangle(hi[0],hi[side+1],hi[side]);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
    const uv=new Float32Array(vertices.length/3*2);for(let i=0;i<vertices.length/3;i++){uv[i*2]=(vertices[i*3]+1.6)*.5;uv[i*2+1]=vertices[i*3+1]*.25;}
    geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.userData.profile=core?'continuous-mineral-core':'jointed-fractured-stone-rib';return geometry;
  }
  const ribs=new THREE.InstancedMesh(ribGeometry(),basalt,4),cores=new THREE.InstancedMesh(ribGeometry(true),vein,4);
  for(const [mesh,name] of [[ribs,'CorruptionRibs'],[cores,'CorruptionRibVeins']]){mesh.name=name;mesh.frustumCulled=false;mesh.receiveShadow=true;root.add(mesh);}
  const fallback=new THREE.Group();fallback.name='JadeLanternFallback';root.add(fallback);
  const fallbackParts=[];
  for(let i=0;i<4;i++){
    const group=new THREE.Group();fallback.add(group);
    for(const [y,sx,sy,sz,material] of [[.16,1.48,.32,1.48,stone],[1.4,.64,2.2,.64,stone],[2.62,1.3,.24,1.3,gold]]){const m=new THREE.Mesh(box,material);m.position.y=y;m.scale.set(sx,sy,sz);group.add(m);}
    const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.5,1),jade);orb.position.y=3.2;group.add(orb);fallbackParts.push(group);
  }
  const particleMaterial=new THREE.MeshStandardMaterial({color:'#efd895',emissive:'#efd895',emissiveIntensity:.8,roughness:.8,flatShading:true});
  const particles=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),particleMaterial,32);particles.name='RealmDriftingFragments';particles.frustumCulled=false;particles.userData.noShadow=true;root.add(particles);
  const lotusBatches=[];let asset=false,error=null,stoneTexture=null,basaltTexture=null,snapshot={realm:'jade',blend:0,placements:[]};
  function mountLotus(model){
    model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model,true),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
    if(![size.x,size.y,size.z].every(Number.isFinite)||size.y<=0||size.x>1.6||size.z>1.6||size.y>4.3)throw Error('Lotus lantern exceeds supported bounds');
    const meshes=[];model.traverse(o=>{if(o.isMesh)meshes.push(o);});if(!meshes.length||meshes.length>4)throw Error('Lotus material budget exceeded');
    for(const batch of lotusBatches){root.remove(batch);batch.geometry.dispose();batch.dispose();}lotusBatches.length=0;stoneTexture=null;
    for(const source of meshes){
      const geometry=source.geometry.clone().applyMatrix4(source.matrixWorld);geometry.translate(-center.x,-bounds.min.y,-center.z);
      const batch=new THREE.InstancedMesh(geometry,source.material,4);batch.name='BlenderJadeLotusLantern';batch.frustumCulled=false;batch.receiveShadow=true;batch.castShadow=true;root.add(batch);lotusBatches.push(batch);
      if(!stoneTexture&&source.material.map)stoneTexture=source.material.map;
    }
    fallback.visible=false;asset=true;error=null;
  }
  function setCorruptTexture(texture){basaltTexture=texture;basalt.map=texture;basalt.color.set('#b8a7c3');basalt.needsUpdate=true;}
  const wrap=(n,length)=>((n%length)+length)%length;
  const smooth=(a,b,n)=>{const t=Math.max(0,Math.min(1,(n-a)/(b-a)));return t*t*(3-2*t);};
  function update(d,pose={active:false,player:{x:0,z:0}}){
    const blend=d.realm==='corrupt'?(d.realmEntry?smooth(0,1.2,d.time-d.realmEntry.time):1):0;
    root.rotation.y=pose.active?pose.nextHeadingYaw:0;root.position.set(pose.active?pose.player.x:0,0,pose.active?pose.player.z:0);
    stone.color.copy(jadeColor).lerp(corruptColor,blend);gold.color.copy(goldColor).lerp(tarnishedColor,blend);const map=blend>=.5?basaltTexture:stoneTexture;if(stone.map!==map){stone.map=map;stone.needsUpdate=true;}
    particleMaterial.color.copy(fireflyColor).lerp(fragmentColor,blend);particleMaterial.emissive.copy(fireflyColor).multiplyScalar(1-blend);particleMaterial.emissiveIntensity=.8*(1-blend);
    const placements=[];let visible=0;
    const cornerVisible=Boolean(!pose.active&&(d.turn?.announced||d.turn?.failed)),cornerZ=cornerVisible?-d.turn.remaining*.32:0;
    for(let i=0;i<4;i++){
      const side=i%2?1:-1,z=-84+wrap(Math.floor(i/2)*54+d.distance*.32,108),x=side*6.3;
      const blocked=pose.active?z>-6.5:cornerVisible&&Math.abs(z-cornerZ)<6.5;
      const active=z<14&&z>-81&&!blocked,reveal=smooth(-81,-69,z)*(1-smooth(10,14,z));if(active)visible++;
      const scale=active?1:0;
      dummy.position.set(x,-1.2175,z);dummy.rotation.set(0,0,0);dummy.scale.set(2*scale,2.565*scale,2*scale);dummy.updateMatrix();foundations.setMatrixAt(i,dummy.matrix);
      dummy.position.y=.12;dummy.scale.set(2.04*scale,.11*scale,2.04*scale);dummy.updateMatrix();caps.setMatrixAt(i,dummy.matrix);
      dummy.position.y=.175;dummy.rotation.y=side<0?Math.PI:0;dummy.scale.setScalar(scale*reveal*blend);dummy.updateMatrix();ribs.setMatrixAt(i,dummy.matrix);cores.setMatrixAt(i,dummy.matrix);
      dummy.position.y=.175;dummy.rotation.y=0;dummy.scale.setScalar(scale*reveal*(1-blend));dummy.updateMatrix();for(const batch of lotusBatches)batch.setMatrixAt(i,dummy.matrix);
      const old=fallbackParts[i];old.position.copy(dummy.position);old.scale.copy(dummy.scale);old.visible=active&&blend<1;
      for(let mote=0;mote<8;mote++){
        const a=d.time*(.22+.035*(mote%3))+mote*2.399963+i*.7,radius=.45+(mote%3)*.14;
        dummy.position.set(x+Math.cos(a)*radius,1.8+(mote/7)*2.1+Math.sin(a*1.7)*.14+blend*(mote%3)*.85,z+Math.sin(a)*radius);
        dummy.rotation.set(a,a*.4,a*.7);dummy.scale.setScalar(scale*reveal*(.035+blend*(.11+(mote%3)*.055)));dummy.updateMatrix();particles.setMatrixAt(i*8+mote,dummy.matrix);
      }
      placements.push({x,z,active,cornerCleared:blocked,reveal});
    }
    for(const mesh of [foundations,caps,ribs,cores,particles,...lotusBatches])mesh.instanceMatrix.needsUpdate=true;
    ribs.visible=cores.visible=blend>0;for(const batch of lotusBatches)batch.visible=blend<1;
    snapshot={realm:d.realm||'jade',blend,time:d.time,distance:d.distance,visibleLandmarks:visible,placements,pose:{yaw:root.rotation.y,x:root.position.x,z:root.position.z}};
  }
  return {mountLotus,setCorruptTexture,update,fail:e=>{error=String(e);},diagnostics:()=>({...snapshot,lotusAsset:asset,lotusError:error,lotusBatches:lotusBatches.length,landmarkCapacity:4,particleCapacity:32,foundation:{width:2,depth:2,top:.065,bottom:-2.5},ribHeight:8.4,source:'Jade lotus garden / fractured corruption ribs'})};
}
