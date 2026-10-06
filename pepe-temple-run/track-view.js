import {createStoneDetail} from './surface-detail.js?v=realm-gardens-86';
// Bounded 3D scenery; runner state is read only and cosmetic motion uses simulation time.
export function createTrackView(THREE,scene){
  const root=new THREE.Group();root.name='EmeraldTempleTrack';scene.add(root);
  const stone=new THREE.MeshStandardMaterial({color:'#526c58',roughness:.62,metalness:.07}),edge=new THREE.MeshStandardMaterial({color:'#244c3b',roughness:.85}),gold=new THREE.MeshStandardMaterial({color:'#c5b477',metalness:.55,roughness:.4}),jade=new THREE.MeshStandardMaterial({color:'#b7ffd0',emissive:'#39d988',emissiveIntensity:1.25,roughness:.35}),dark=new THREE.MeshBasicMaterial({color:'#03140e'});
  const pickupJade=new THREE.MeshStandardMaterial({color:'#62d990',emissive:'#269952',emissiveIntensity:.42,roughness:.3,metalness:.12,flatShading:true});
  const pickupShard=new THREE.MeshStandardMaterial({color:'#d4b4f4',emissive:'#804ba9',emissiveIntensity:.44,roughness:.36,metalness:.18,flatShading:true});pickupShard.userData.realmPaletteFixed=true;
  // One broken crystal blade, visibly distinct from both emeralds and rooted thorn clusters.
  const shardOutline=[[0,-1],[-.72,-.48],[-.45,.12],[-.82,.28],[.38,1],[.24,.2],[.66,-.14],[.29,-.6]],shardVertices=[];
  const shardFace=(a,b,c)=>shardVertices.push(...a,...b,...c);
  for(let i=0;i<shardOutline.length;i++){
    const a=shardOutline[i],b=shardOutline[(i+1)%shardOutline.length],frontA=[...a,.12],frontB=[...b,.12],backA=[...a,-.35],backB=[...b,-.35];
    shardFace([0,0,.6],frontB,frontA);shardFace([0,0,-.5],backA,backB);shardFace(frontA,frontB,backB);shardFace(frontA,backB,backA);
  }
  const shardCut=new THREE.BufferGeometry();shardCut.setAttribute('position',new THREE.Float32BufferAttribute(shardVertices,3));shardCut.computeVertexNormals();shardCut.userData.cut='fractured-asymmetric-shard';
  const detail=createStoneDetail(THREE);stone.bumpMap=detail.bump;stone.bumpScale=.025;stone.roughnessMap=detail.roughness;
  stone.vertexColors=true;
  // Runtime slab texture uses its own integer sequence, never the gameplay seed.
  if(typeof document!=='undefined'){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
    c.fillStyle='#73836a';c.fillRect(0,0,256,256);let grain=7241;
    for(let i=0;i<2400;i++){grain=(Math.imul(grain,1664525)+1013904223)>>>0;const x=grain%256;grain=(Math.imul(grain,1664525)+1013904223)>>>0;const y=grain%256;c.fillStyle=i%3?'#354f3830':'#bdd19b28';c.fillRect(x,y,1+i%3,1+i%2);}
    c.fillStyle='#253d2e';c.fillRect(0,0,256,5);c.fillRect(0,251,256,5);c.fillRect(0,0,4,256);c.fillRect(252,0,4,256);
    for(let i=0;i<22;i++){c.fillStyle=i%2?'#375e38aa':'#466e3a88';c.fillRect((i*47)%256,i%2?3:245,15+i%13,5+i%5);}
    c.strokeStyle='#a3ae8566';c.lineWidth=1;c.strokeRect(7,7,242,242);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;stone.map=texture;stone.color.set('#ffffff');
  }
  const box=new THREE.BoxGeometry(1,1,1),crystal=new THREE.OctahedronGeometry(1,0),ring=new THREE.TorusGeometry(.36,.09,6,12);
  const jadeCutBase=new THREE.BufferGeometry(),cutVertices=[],cutUvs=[],cutIndices=[];
  for(const [y,radius] of [[-1,.15],[-.6,.7],[.3,1],[.75,.65],[1,.15]])for(let side=0;side<8;side++){const angle=side*Math.PI/4;cutVertices.push(Math.cos(angle)*radius,y,Math.sin(angle)*radius);cutUvs.push(side/8,(y+1)/2);}
  for(let row=0;row<4;row++)for(let side=0;side<8;side++){const next=(side+1)%8,a=row*8+side,b=row*8+next,c=a+8,e=b+8;cutIndices.push(a,c,b,b,c,e);}for(let side=1;side<7;side++)cutIndices.push(0,side,side+1,32,32+side+1,32+side);
  jadeCutBase.setAttribute('position',new THREE.Float32BufferAttribute(cutVertices,3));jadeCutBase.setAttribute('uv',new THREE.Float32BufferAttribute(cutUvs,2));jadeCutBase.setIndex(cutIndices);const jadeCut=jadeCutBase.toNonIndexed();jadeCut.computeVertexNormals();jadeCut.userData.cut='elongated-eight-sided-beveled-emerald';jadeCutBase.dispose();
  const round=new THREE.SphereGeometry(1,10,7),rock=new THREE.IcosahedronGeometry(.8,1),frogStone=new THREE.MeshStandardMaterial({color:'#53745b',roughness:.85,flatShading:true}),rockJade=new THREE.MeshStandardMaterial({color:'#306b4c',emissive:'#153d2b',emissiveIntensity:.4,roughness:.5,flatShading:true});
  const boulderVertices=rock.attributes.position;
  for(let v=0;v<boulderVertices.count;v++){const x=boulderVertices.getX(v),y=boulderVertices.getY(v),z=boulderVertices.getZ(v),extreme=Math.max(Math.abs(x),Math.abs(y),Math.abs(z))>.799,carving=extreme?1:.87+.11*(.5+.5*Math.sin(x*11+z*7)*Math.cos(y*9));boulderVertices.setXYZ(v,x*carving,y*carving,z*carving);}
  boulderVertices.needsUpdate=true;rock.computeVertexNormals();rock.userData.sculpture='irregular-carved-jade-boulder';
  const smilePath=new THREE.CatmullRomCurve3([new THREE.Vector3(-.53,.075,-.1),new THREE.Vector3(-.28,.012,0),new THREE.Vector3(0,0,.025),new THREE.Vector3(.28,.012,0),new THREE.Vector3(.53,.075,-.1)]);
  const smile=new THREE.TubeGeometry(smilePath,16,.027,6,false),lip=new THREE.TubeGeometry(smilePath,16,.048,6,false),boulderBand=new THREE.TorusGeometry(.775,.018,5,18);
  const mesh=(geometry,material,parent=root)=>{const m=new THREE.Mesh(geometry,material);parent.add(m);return m;};
  const postProfile=new THREE.BufferGeometry(),postVertices=[],postUvs=[],postIndices=[];
  const outline=[[-.38,-.5],[.38,-.5],[.5,-.38],[.5,.38],[.38,.5],[-.38,.5],[-.5,.38],[-.5,-.38]];
  for(const [y,width] of [[-.5,1],[.36,.86],[.5,.74]])for(let i=0;i<8;i++){postVertices.push(outline[i][0]*width,y,outline[i][1]*width);postUvs.push(i/8,y+.5);}
  for(let row=0;row<2;row++)for(let i=0;i<8;i++){const j=(i+1)%8,a=row*8+i,b=row*8+j,c=a+8,e=b+8;postIndices.push(a,c,b,b,c,e);}for(let i=1;i<7;i++){postIndices.push(0,i,i+1,16,16+i+1,16+i);}
  postProfile.setAttribute('position',new THREE.Float32BufferAttribute(postVertices,3));postProfile.setAttribute('uv',new THREE.Float32BufferAttribute(postUvs,2));postProfile.setIndex(postIndices);postProfile.computeVertexNormals();postProfile.userData.profile='octagonal-tapered-chamfer-post';
  const floor=mesh(box,dark);floor.scale.set(7.7,.28,105);floor.position.set(0,-2.5,-43.5);
  function chamferSlab(length,target=null){
    if(target){const p=target.attributes.position,uv=target.attributes.uv,inset=Math.min(.018/length,.2);for(let v=0;v<p.count;v++){const z=Math.sign(p.getZ(v))*(p.getY(v)>.49?.5-inset:.5);p.setZ(v,z);uv.setXY(v,p.getX(v)+.5,z+.5);}p.needsUpdate=uv.needsUpdate=true;target.computeVertexNormals();target.boundingBox=null;target.boundingSphere=null;target.userData.slabLength=length;return target;}
    const insetX=.018/2.18,insetZ=Math.min(.018/length,.2),corners=[[-1,-1],[1,-1],[1,1],[-1,1]],vertices=[],uv=[];
    const ring=(y,inset)=>corners.map(([x,z])=>[x*(.5-inset*insetX),y,z*(.5-inset*insetZ)]),bottom=ring(-.5,0),shoulder=ring(.35,0),top=ring(.5,1);
    const face=(a,b,c,e)=>{for(const p of [a,b,c,a,c,e]){vertices.push(...p);uv.push(p[0]+.5,p[2]+.5);}};
    for(let i=0;i<4;i++){const j=(i+1)%4;face(bottom[i],shoulder[i],shoulder[j],bottom[j]);face(shoulder[i],top[i],top[j],shoulder[j]);}face(top[0],top[3],top[2],top[1]);face(bottom[0],bottom[1],bottom[2],bottom[3]);
    const g=target||new THREE.BufferGeometry();if(target){g.attributes.position.array.set(vertices);g.attributes.position.needsUpdate=true;g.attributes.uv.array.set(uv);g.attributes.uv.needsUpdate=true;}else{g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.attributes.position.setUsage(THREE.DynamicDrawUsage);g.attributes.uv.setUsage(THREE.DynamicDrawUsage);}g.computeVertexNormals();g.boundingBox=null;g.boundingSphere=null;g.userData.slabLength=length;g.userData.surface='physical-18mm-top-chamfer';return g;
  }
  const tiles=Array.from({length:33},(_,row)=>{const group=new THREE.Group();root.add(group);group.userData.slabs=Array.from({length:3},(_,lane)=>{
    const seed=(Math.imul(row+19,374761393)^Math.imul(lane+7,668265263))>>>0,brightness=.86+(seed%19)/100,warm=((seed>>>8)%7-3)*.006,color=[brightness+warm,brightness,brightness-warm];
    return Array.from({length:2},()=>{const geometry=chamferSlab(3.12),colors=new Float32Array(geometry.attributes.position.count*3);for(let v=0;v<geometry.attributes.position.count;v++)colors.set(color,v*3);geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));return mesh(geometry,stone,group);});
  });return group;});
  const marks=tiles.map(()=>[-1.1,1.1].map(x=>{const m=mesh(box,gold);m.scale.set(.045,.018,3.1);return {mesh:m,x};}));
  const posts=Array.from({length:18},(_,i)=>{const group=new THREE.Group();root.add(group);const pole=mesh(postProfile,edge,group),cap=mesh(postProfile,gold,group),glow=mesh(crystal,jade,group);pole.userData.railingPost=true;cap.userData.railingCap=true;pole.scale.set(.32,2.1,.32);pole.position.y=1.05;cap.scale.set(.5,.17,.5);cap.position.y=2.1;glow.scale.set(.18,.38,.18);glow.position.y=2.48;return {group,side:i%2?1:-1,index:Math.floor(i/2)};});
  const rails=Array.from({length:34},(_,i)=>{const m=mesh(box,edge);m.scale.set(.3,.65,6.1);return {mesh:m,side:i%2?1:-1,index:Math.floor(i/2)};});
  // A bounded preview junction shows the actual outgoing ninety-degree causeway.
  const corner=new THREE.Group();corner.name='TempleCornerJunction';root.add(corner);
  const landing=mesh(box,stone,corner);landing.scale.set(7.2,.12,7.2);
  // The closed far edge masks the backdrop's straight causeway and makes the turn legible.
  const endWall=mesh(postProfile,stone,corner);endWall.scale.set(7.2,1.5,.38);endWall.position.set(0,.8,-3.5);
  const endCap=mesh(chamferSlab(.5),gold,corner);endCap.scale.set(7.35,.12,.5);endCap.position.set(0,1.56,-3.5);
  for(const x of [-2.5,0,2.5]){const crest=mesh(round,frogStone,corner);crest.scale.set(.22,.2,.18);crest.position.set(x,1.8,-3.5);}
  const branch=Array.from({length:8},(_,i)=>{const slab=mesh(box,stone,corner);slab.scale.set(3.12,.12,6.6);const guards=[-1,1].map(side=>{const guard=mesh(box,edge,corner);guard.scale.set(3.12,.65,.3);return {guard,side};});return {slab,guards,index:i};});
  const arrowShape=new THREE.Shape();arrowShape.moveTo(-1,-.23);arrowShape.lineTo(0,-.23);arrowShape.lineTo(0,-.62);arrowShape.lineTo(1,0);arrowShape.lineTo(0,.62);arrowShape.lineTo(0,.23);arrowShape.lineTo(-1,.23);arrowShape.closePath();
  const arrowGeometry=new THREE.ShapeGeometry(arrowShape),arrowMaterial=new THREE.MeshBasicMaterial({color:'#ffda77',side:THREE.DoubleSide}),arrows=Array.from({length:4},()=>{const m=mesh(arrowGeometry,arrowMaterial,corner);m.rotation.x=-Math.PI/2;return m;});
  corner.visible=false;
  const incoming=Array.from({length:4},(_,i)=>{const m=mesh(box,stone,corner);m.scale.set(6.6,.12,3.12);m.position.set(0,0,5.15+i*3.2);m.visible=false;return m;});
  const paths={idol:'assets/frog-guardian-v1.png',gate:'assets/frog-lintel-v1.png',boulder:'assets/jade-boulder-v1.png'},loaded={},materials={},errors=[];
  const loader=new THREE.TextureLoader();for(const [type,path] of Object.entries(paths)){const texture=loader.load(path,()=>loaded[type]=true,undefined,()=>{loaded[type]=false;errors.push('Could not load '+path);});texture.colorSpace=THREE.SRGBColorSpace;materials[type]=new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.08,depthWrite:false});}
  loader.load('assets/temple-stone-floor-v1.png',texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2,1);texture.anisotropy=4;stone.map=texture;stone.color.set('#c4c7ad');stone.needsUpdate=true;loaded.floor=true;},undefined,()=>{loaded.floor=false;errors.push('Could not load temple stone floor');});
  const pools={},capacities={jade:48,idol:12,spire:12,gate:12,boulder:12,gap:12,shield:4,magnet:4};
  function modeledHazard(type){
    const g=new THREE.Group();root.add(g);
    const part=(geometry,material,x,y,z,sx,sy,sz)=>{const m=mesh(geometry,material,g);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;};
    const width=type==='gate'?2.1:type==='boulder'?1.6:1.5;
    part(box,gold,0,.045,0,width,.09,type==='gate'?.6:1.1);
    if(type==='spire'){for(let i=0;i<7;i++){const tall=i===3?1.75:.65+(i%3)*.28;part(new THREE.ConeGeometry(.16,tall,5),pickupJade,(i%3-1)*.34,tall/2+.09,(Math.floor(i/3)-1)*.24,1,1,1);}}else if(type==='idol'){
      part(box,edge,0,.17,0,1.45,.23,1.05);
      part(round,frogStone,0,.77,0,.63,.54,.44);
      part(round,frogStone,0,1.25,.15,.67,.32,.4);
      for(const side of [-1,1]){
        part(round,frogStone,side*.48,.44,.25,.26,.18,.29);
        part(round,frogStone,side*.37,1.51,.22,.24,.24,.22);
        part(round,gold,side*.37,1.51,.4,.15,.15,.055);
        part(round,dark,side*.37,1.51,.454,.055,.09,.02);
        part(round,dark,side*.15,1.34,.535,.027,.021,.016);
        for(let toe=0;toe<3;toe++)part(round,frogStone,side*(.33+toe*.1),.3,.49,.055,.065,.16);
      }
      part(smile,dark,0,1.12,.53,1,1,1);
      part(lip,frogStone,0,1.18,.52,1,1,1);
      part(crystal,gold,0,1.78,.08,.2,.12,.17);
    }else if(type==='gate'){
      for(const side of [-1,1]){const leg=part(postProfile,frogStone,side*.89,1.53,0,.32,2.94,.48);leg.userData.gateLeg=true;part(box,gold,side*.89,.45,.255,.36,.09,.035);}
      // Lower edge at 1.8 m: standing Crown must slide through the clear opening.
      // A rounded frog head wraps the recessed passage without extending below its clearance.
      const head=part(round,frogStone,0,2.46,.035,1.05,.53,.42);head.userData.gateSculpture='rounded-head';
      for(const side of [-1,1]){
        const cheek=part(round,frogStone,side*.79,2.15,.12,.25,.32,.34);cheek.userData.gateSculpture='deep-cheek';
        const brow=part(round,edge,side*.37,2.78,.25,.37,.18,.22);brow.userData.gateSculpture='raised-brow';
        part(round,dark,side*.13,2.39,.45,.035,.026,.018);
      }
      const recess=part(round,edge,0,2.08,.365,.72,.18,.045);recess.userData.gateSculpture='recessed-mouth';
      part(box,gold,0,1.845,.29,1.75,.09,.05);
      part(lip,frogStone,0,1.9,.32,1.6,1,1);
      for(const side of [-1,1]){
        part(box,edge,side*.89,2.93,.04,.32,.14,.58);
        const brace=part(box,edge,side*.89,1.2,.26,.085,1.05,.08);brace.rotation.z=side*.13;
        part(round,gold,side*.89,2.2,.29,.085,.11,.025);
      }
      for(const side of [-1,1]){part(round,frogStone,side*.39,2.63,.3,.25,.23,.15);part(round,gold,side*.39,2.63,.44,.13,.12,.045);}
    }else{
      const rolling=new THREE.Group();g.add(rolling);rolling.position.y=.88;g.userData.rollMesh=rolling;
      mesh(rock,rockJade,rolling);
      for(const angle of [.7,-.85]){const seam=mesh(boulderBand,edge,rolling);seam.rotation.y=angle;}
      const glow=mesh(crystal,jade,rolling);glow.scale.set(.17,.22,.17);glow.position.set(.28,.32,.67);
    }
    g.userData.height=type==='gate'?3:type==='idol'?1.9:type==='spire'?1.85:1.6;return g;
  }
  function brokenBridge(){
    const g=new THREE.Group();root.add(g);
    const part=(material,x,y,z,sx,sy,sz)=>{const m=mesh(box,material,g);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;};
    part(dark,0,-1.42,0,2.15,.08,3.7);
    for(const side of [-1,1]){
      part(edge,side*1.08,-.63,0,.12,1.38,3.7);
      part(edge,0,-.63,side*1.85,2.15,1.38,.13);
      for(let i=0;i<4;i++){const x=-.82+i*.54,z=side*(1.85+(i%2?-.06:.07));part(stone,x,.015,z,.48,.16,.22);part(gold,x,.11,z,.42,.035,.12);}
    }
    return g;
  }
  for(const [type,count] of Object.entries(capacities))pools[type]=Array.from({length:count},()=>{
    let o;if(materials[type]||type==='spire')o=modeledHazard(type);
    else if(type==='gap')o=brokenBridge();
    else if(type==='jade'){o=mesh(jadeCut,pickupJade);o.scale.set(.22,.32,.22);}
    else {o=mesh(type==='shield'?crystal:ring,type==='shield'?gold:jade);o.scale.setScalar(type==='shield'?.45:1);}
    o.visible=false;o.userData.type=type;return o;
  });
  const roadRoot=new THREE.Group();roadRoot.name='TempleOutgoingWorld';root.add(roadRoot);for(const child of [...root.children])if(child!==corner&&child!==roadRoot)roadRoot.add(child);
  const spireBatches=[],spireDummy=new THREE.Object3D();let spireAsset=false;
  function mountSpireModel(model){model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model,true),size=bounds.getSize(new THREE.Vector3());if(!Number.isFinite(size.y)||size.y<=0)throw Error('Invalid corruption thorn geometry');const scale=1.85/size.y,center=bounds.getCenter(new THREE.Vector3());model.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometry.translate(-center.x,-bounds.min.y,-center.z);geometry.scale(scale,scale,scale);const batch=new THREE.InstancedMesh(geometry,o.material,12);batch.castShadow=batch.receiveShadow=true;batch.frustumCulled=false;batch.count=0;roadRoot.add(batch);spireBatches.push(batch);});spireAsset=spireBatches.length>0;}
  let snapshot={active:0,counts:{},positions:[],distance:0,heading:0,visualBend:0},previousDistance=0,lastCompleted=0,lastDirection='left',transition=null,pose={active:false,progress:0,yaw:0,nextHeadingYaw:0,player:{x:0,z:0}};
  const wrap=(n,length)=>((n%length)+length)%length;
  const bendAt=(z,bend)=>bend*Math.pow(Math.max(0,-z)/95,2)*15;
  const transform=(x,z)=>{if(!pose.active)return {x,z};const yaw=pose.nextHeadingYaw,c=Math.cos(yaw),s=Math.sin(yaw);return {x:c*x+s*z+pose.player.x,z:-s*x+c*z+pose.player.z};};
  const worldPosition=(lane,simZ,d)=>{const z=-(simZ-7)*.32;return transform((lane-1)*2.2+bendAt(z,pose.active?0:d?.turn?.visualBend||0),z);};
  function update(d,dt){
    const completed=d.turn?.completed||0;if(d.distance<previousDistance||completed<lastCompleted)transition=null;
    if(completed>lastCompleted)transition={startTime:d.time,startDistance:d.distance,sign:lastDirection==='left'?-1:1,direction:lastDirection};
    lastCompleted=completed;
    if(transition){const progress=Math.max(0,Math.min(1,(d.time-transition.startTime)/.65)),nextHeadingYaw=-transition.sign*Math.PI/2,smooth=progress*progress*(3-2*progress);pose={active:progress<1,progress,yaw:nextHeadingYaw*smooth,nextHeadingYaw,player:{x:transition.sign*Math.max(0,d.distance-transition.startDistance)*.32,z:0},direction:transition.direction};if(progress>=1)transition=null;}
    if(!transition)pose={active:false,progress:0,yaw:0,nextHeadingYaw:0,player:{x:0,z:0}};
    lastDirection=d.turn?.direction||lastDirection;
    roadRoot.rotation.y=pose.active?pose.nextHeadingYaw:0;roadRoot.position.set(pose.active?pose.player.x:0,0,pose.active?pose.player.z:0);
    const bend=pose.active?0:d.turn?.visualBend||0,motion=d.distance*.32;
    const cornerVisible=Boolean(pose.active||d.turn?.announced&&d.turn.remaining>0||d.turn?.failed),cornerZ=pose.active?0:cornerVisible?-d.turn.remaining*.32:0,cornerX=bendAt(cornerZ,bend),cornerSign=pose.active?transition.sign:d.turn?.direction==='left'?-1:1;
    corner.visible=cornerVisible;corner.position.set(cornerX,0,cornerZ);
    incoming.forEach(m=>m.visible=pose.active);landing.position.y=pose.active?.018:0;
    if(cornerVisible){for(const p of branch){const x=cornerSign*(5.15+p.index*3.2);p.slab.position.set(x,0,0);p.slab.visible=!pose.active;for(const {guard,side} of p.guards){guard.position.set(x,.28,side*3.45);guard.visible=!pose.active;}}arrows.forEach((m,i)=>{m.position.set(cornerSign*(i*3.4),.085,0);m.scale.x=cornerSign;});}
    floor.visible=Math.abs(bend)<.03&&!cornerVisible;
    const gaps=d.objects.filter(o=>o.type==='gap'&&o.z<=150&&o.z>=-14).map(o=>({lane:o.lane,z:-(o.z-7)*.32}));let visibleGapSlabs=0;
    tiles.forEach((m,i)=>{
      const z=-95+wrap(i*3.2+motion,105.6),x=bendAt(z,bend),angle=-bend*Math.max(0,-z)/95*.3;m.position.set(x,0,z);m.rotation.y=angle;
      for(let lane=0;lane<3;lane++){
        let segments=pose.active?[[-1.56,Math.min(1.56,Math.abs(pose.player.x)+3.6-z)]].filter(([a,b])=>b-a>.025):cornerVisible?[[Math.max(-1.56,cornerZ-z-3.6),1.56]].filter(([a,b])=>b-a>.025):[[-1.56,1.56]],cut=false;
        for(const gap of gaps)if(gap.lane===lane){const lo=gap.z-z-1.85,hi=gap.z-z+1.85;if(lo<1.56&&hi>-1.56){cut=true;segments=segments.flatMap(([a,b])=>hi<=a||lo>=b?[[a,b]]:[[a,Math.min(b,lo)],[Math.max(a,hi),b]].filter(([start,end])=>end-start>.025));}}
        if(cut)visibleGapSlabs++;
        m.userData.slabs[lane].forEach((slab,j)=>{const segment=segments[j];slab.visible=Boolean(segment);if(segment){const length=segment[1]-segment[0];if(Math.abs(slab.geometry.userData.slabLength-length)>1e-6){chamferSlab(length,slab.geometry);}slab.scale.set(2.18,.12,length);slab.position.set((lane-1)*2.2,0,(segment[0]+segment[1])/2);}});
      }
      for(const mark of marks[i]){mark.mesh.position.set(x+mark.x,.075,z);mark.mesh.rotation.y=angle;mark.mesh.visible=pose.active||!cornerVisible||z>cornerZ+3.6;}
    });
    for(const p of posts){const z=-95+wrap(p.index*12+motion,108);p.group.position.set(p.side*4.05+bendAt(z,bend),0,z);p.group.visible=pose.active?z<-3.6:!cornerVisible||z>cornerZ+3.6;}
    for(const p of rails){const z=-95+wrap(p.index*6.2+motion,105.4);p.mesh.position.set(p.side*3.65+bendAt(z,bend),.28,z);p.mesh.rotation.y=-bend*Math.max(0,-z)/95*.3;p.mesh.visible=pose.active?z<-3.6:!cornerVisible||z>cornerZ+3.6;}
    const counts={},positions=[];for(const pool of Object.values(pools))for(const m of pool)m.visible=false;
    for(const o of d.objects){if(o.hit&&o.type!=='gap'||o.z>150||o.z<-14||!pools[o.type]||cornerVisible&&!pose.active&&-(o.z-7)*.32<cornerZ-3.6)continue;const index=counts[o.type]||0,m=pools[o.type][index];if(!m)continue;counts[o.type]=index+1;
      const z=-(o.z-7)*.32;let x=(o.lane-1)*2.2+bendAt(z,bend),y=o.type==='gap'?0:o.type==='jade'?.72:(materials[o.type]||o.type==='spire')?.07:1.1;
      if(o.type==='jade'&&d.magnet>0&&o.z<45){const t=Math.min(1,(45-o.z)/38);x+=((d.visualLane-1)*2.2-x)*t;y+=t*.28;}
      m.position.set(x,y,z);m.visible=true;if(o.type==='jade'){m.geometry=d.realm==='corrupt'?shardCut:jadeCut;m.material=d.realm==='corrupt'?pickupShard:pickupJade;m.rotation.y=d.time*2.5;m.rotation.z=Math.sin(d.time*3+index)*.12;}if(o.type==='boulder')m.userData.rollMesh.rotation.x=-d.time*1.5;
      if(o.type==='spire'&&spireAsset){m.visible=false;spireDummy.position.copy(m.position);spireDummy.updateMatrix();for(const batch of spireBatches)batch.setMatrixAt(index,spireDummy.matrix);}
      const world=transform(x,z);positions.push({type:o.type,lane:o.lane,simZ:o.z,x:world.x,y,z:world.z});
    }
    for(const batch of spireBatches){batch.count=counts.spire||0;batch.visible=batch.count>0;batch.instanceMatrix.needsUpdate=true;}
    snapshot={active:positions.length,counts,positions,distance:d.distance,collectible:d.realm==='corrupt'?'fractured-shard':'jade',visibleGapSlabs,cornerGeometry:'modeled-junction-with-camera-transition',cornerVisible,cornerPosition:{x:cornerX,z:cornerZ},cornerDirection:pose.active?pose.direction:d.turn?.direction||null,viewPose:{...pose,player:{...pose.player}},heading:d.turn?.heading||0,visualBend:bend,movingForward:d.distance>=previousDistance||d.distance<5};previousDistance=d.distance;
  }
  return {update,mountSpireModel,worldPosition,viewPose:()=>({...pose,player:{...pose.player}}),diagnostics:()=>({...snapshot,surfaceDetail:'weathered-relief-and-wetness',slabGeometry:'physical-18mm-top-chamfer',slabTones:'deterministic-row-lane-neutral-vertex-colors',spireAsset,spireBatches:spireBatches.length,spireHeight:1.85,postGeometry:'octagonal-tapered-chamfer-post',junctionStone:'tapered-wall-chamfer-cap-round-crests',jadeGeometry:'elongated-eight-sided-beveled-emerald',boulderGeometry:'irregular-carved-jade-boulder',hazardGeometry:'modeled',gapGeometry:'clipped-lane-slabs-with-depth',gateClearance:1.8,gatePillars:'tapered-chamfered-stone',loaded:loaded.floor===true&&Object.keys(paths).every(k=>loaded[k]===true),error:errors.length?errors.join('; '):null,capacity:Object.values(capacities).reduce((a,b)=>a+b,0),tiles:tiles.length,pillars:posts.length,assets:{...loaded},collisionZ:0,laneWidth:2.2,worldMeshCount:root.children.length})};
}
