import {createTempleRoof} from './roof-geometry.js?v=realm-gardens-86';
import {createStoneDetail} from './surface-detail.js?v=realm-gardens-86';
// Bounded modeled surroundings; all movement is derived from runner simulation state.
export function createTempleScenery(THREE,scene){
  const root=new THREE.Group();root.name='EmeraldFrogTempleScenery';scene.add(root);
  const stone=new THREE.MeshStandardMaterial({color:'#41644d',roughness:.95}),moss=new THREE.MeshStandardMaterial({color:'#254f37',roughness:1}),gold=new THREE.MeshStandardMaterial({color:'#b0a16b',metalness:.25,roughness:.7}),jade=new THREE.MeshStandardMaterial({color:'#74d692',emissive:'#245c3f',emissiveIntensity:.5,roughness:.35}),water=new THREE.MeshStandardMaterial({color:'#082d29',metalness:.45,roughness:.3}),flame=new THREE.MeshBasicMaterial({color:'#ffd580'}),dark=new THREE.MeshStandardMaterial({color:'#102e22',roughness:1});
  const detail=createStoneDetail(THREE);stone.bumpMap=detail.bump;stone.bumpScale=.065;stone.roughnessMap=detail.roughness;
  let textureReady=false,textureError=null;
  new THREE.TextureLoader().load('assets/temple-stone-floor-v1.png',texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2,2);texture.anisotropy=4;stone.map=moss.map=texture;stone.color.set('#a8bbb0');moss.color.set('#7e9e82');stone.needsUpdate=moss.needsUpdate=true;textureReady=true;},undefined,()=>{textureError='Could not load temple stone texture; using material colors';});
  stone.roughness=.72;moss.roughness=.85;
  const flameShader=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:true,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{simulationTime:{value:0}}]),vertexShader:`uniform float simulationTime;varying vec2 fireUv;
    #include <fog_pars_vertex>
    void main(){fireUv=uv;vec3 p=position;float tip=clamp(p.y+.5,0.,1.);p.x+=sin(simulationTime*8.+p.y*7.)*.08*tip;p.z+=cos(simulationTime*6.+p.y*9.)*.06*tip;vec4 local=vec4(p,1.);
    #ifdef USE_INSTANCING
    local=instanceMatrix*local;
    #endif
    vec4 mvPosition=modelViewMatrix*local;gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`,fragmentShader:`uniform float simulationTime;varying vec2 fireUv;
    #include <fog_pars_fragment>
    void main(){float rise=clamp(fireUv.y,0.,1.);float turbulence=sin(fireUv.x*34.+rise*13.-simulationTime*11.)*.5+.5;float tongue=sin(fireUv.x*19.-rise*8.+simulationTime*7.)*.5+.5;float alpha=(.42+turbulence*.4)*(1.-smoothstep(.72+.18*tongue,1.,rise));vec3 color=mix(vec3(1.,.12,.006),vec3(1.,.58,.035),smoothstep(.15,.75,1.-rise)+turbulence*.16);gl_FragColor=vec4(color,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
    }`});
  const box=new THREE.BoxGeometry(1,1,1),round=new THREE.SphereGeometry(1,8,6),crystal=new THREE.OctahedronGeometry(1,0),cone=new THREE.ConeGeometry(1,1,5),roof=createTempleRoof(THREE),bowl=new THREE.LatheGeometry([[.09,0],[.2,.03],[.4,.18],[.44,.26],[.36,.24],[.17,.09],[.09,.08]].map(([x,y])=>new THREE.Vector2(x,y)),10),eyeRim=new THREE.TorusGeometry(1,.12,6,16);
  const guardianLip=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-.62,.08,0],[-.3,.015,.04],[0,-.015,.05],[.3,.015,.04],[.62,.08,0]].map(p=>new THREE.Vector3(...p))),14,.065,6,false),eyelid=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({length:7},(_,i)=>{const a=i*Math.PI/6;return new THREE.Vector3(Math.cos(a)*.2,Math.sin(a)*.16,0);})),10,.03,5,false);
  guardianLip.userData.sculpture='curved-guardian-lip';eyelid.userData.sculpture='raised-guardian-eyelid';
  const towerProfile=new THREE.Shape();towerProfile.moveTo(-.465,-.465);towerProfile.lineTo(.465,-.465);towerProfile.lineTo(.465,.465);towerProfile.lineTo(-.465,.465);towerProfile.closePath();
  const carvedBlock=new THREE.ExtrudeGeometry(towerProfile,{depth:.93,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:2,steps:1,curveSegments:1});carvedBlock.translate(0,0,-.465);carvedBlock.userData.architecture='beveled-temple-stone';
  let meshes=0;const part=(parent,geometry,material,x,y,z,sx,sy,sz)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);meshes++;return m;};
  const group=parent=>{const g=new THREE.Group();parent.add(g);return g;};
  function frog(parent,size=1){
    const g=group(parent);g.scale.setScalar(size);g.userData.sculpture='frog-guardian-with-lips-nostrils-feet';
    part(g,box,stone,0,.13,0,1.6,.26,1.25);part(g,round,stone,0,.7,0,.68,.53,.5);part(g,round,stone,0,1.15,.15,.72,.35,.45);
    for(const sign of [-1,1]){
      part(g,round,moss,sign*.52,.4,.3,.29,.2,.32);part(g,round,stone,sign*.4,1.44,.2,.26,.26,.23);part(g,round,gold,sign*.4,1.44,.42,.14,.14,.055);part(g,round,dark,sign*.4,1.44,.48,.065,.085,.02);
      part(g,eyelid,stone,sign*.4,1.44,.48,1,1,1);part(g,round,dark,sign*.18,1.3,.57,.055,.035,.024);
      const foot=part(g,round,stone,sign*.42,.28,.57,.29,.13,.35);foot.userData.sculpture='forward-guardian-foot';for(let toe=0;toe<3;toe++)part(g,round,stone,sign*(.26+toe*.13),.23,.83,.075,.065,.14);
    }
    part(g,guardianLip,stone,0,1.07,.57,1,1,1);part(g,guardianLip,dark,0,1.025,.625,1,.45,1);part(g,guardianLip,stone,0,.98,.575,.93,.5,1);return g;
  }
  const waterShader=new THREE.ShaderMaterial({fog:true,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{simulationTime:{value:0},heading:{value:0},night:{value:0},depthContrast:{value:.32},glintStrength:{value:.28},foundationCenters:{value:Array.from({length:12},()=>new THREE.Vector2())}}]),vertexShader:`
    uniform float simulationTime; varying vec3 surfaceWorld;varying vec2 surfaceLocal;
    #include <fog_pars_vertex>
    void main(){vec3 p=position;surfaceLocal=p.xy;p.z+=sin(p.x*.72+simulationTime*.65)*.045+sin(p.y*.53-simulationTime*.4)*.03;vec4 world=modelMatrix*vec4(p,1.0);surfaceWorld=world.xyz;vec4 mvPosition=viewMatrix*world;gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`,fragmentShader:`
    uniform float simulationTime;uniform float heading;uniform float night;uniform float depthContrast;uniform float glintStrength;uniform vec2 foundationCenters[12]; varying vec3 surfaceWorld;varying vec2 surfaceLocal;
    #include <fog_pars_fragment>
    float hashWater(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noiseWater(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hashWater(i),hashWater(i+vec2(1,0)),f.x),mix(hashWater(i+vec2(0,1)),hashWater(i+vec2(1)),f.x),f.y);}
    float depthWater(vec2 p){return noiseWater(p)*.57+noiseWater(p*2.07+vec2(5.3,7.1))*.28+noiseWater(p*4.13-vec2(9.2,3.7))*.15;}
    void main(){
      vec2 q=surfaceLocal;float t=simulationTime;
      vec2 drift=vec2(t*.018,-t*.025);float depth=depthWater(q*.055+drift*.12),waterPatch=depthWater(q*.19+drift);
      vec2 warped=q+vec2(waterPatch-.5,depth-.5)*1.5;
      float phaseA=warped.x*1.1+warped.y*.35+t*.75,phaseB=warped.y*.87-warped.x*.23-t*.52;
      float a=sin(phaseA),b=sin(phaseB),c=sin(warped.x*.38-warped.y*.61+t*.32);
      vec3 n=normalize(vec3(-cos(phaseA)*.055,1.,-cos(phaseB)*.045));
      vec3 normal=vec3(cos(heading)*n.x+sin(heading)*n.z,n.y,-sin(heading)*n.x+cos(heading)*n.z);
      vec3 eye=normalize(cameraPosition-surfaceWorld);float fresnel=pow(1.-max(0.,dot(normal,eye)),3.);
      vec3 deep=mix(vec3(.012,.045,.045),vec3(.025,.085,.073),depth*depthContrast+.15);
      vec3 color=mix(deep,vec3(.071,.135,.125),fresnel*.48);
      color*=mix(1.,.78,night);float crest=smoothstep(1.45,2.2,a+b+c*.25)*smoothstep(.36,.74,waterPatch);
      color+=vec3(.018,.035,.029)*crest;
      vec3 sun=normalize(vec3(cos(heading)*-.5+sin(heading)*.5,.7,-sin(heading)*-.5+cos(heading)*.5));
      float glint=pow(max(0.,dot(normal,normalize(sun+eye))),38.);
      color+=mix(vec3(.13,.105,.055),vec3(.035,.065,.085),night)*glint*glintStrength*(.3+.7*waterPatch);
      vec2 rootXZ=vec2(q.x,-q.y-43.);float contactBand=0.;
      for(int foundation=0;foundation<12;foundation++){
        vec2 delta=abs(rootXZ-foundationCenters[foundation])-vec2(2.7,2.4);
        float outsideDistance=length(max(delta,vec2(0.)))+min(max(delta.x,delta.y),0.);
        contactBand=max(contactBand,(1.-smoothstep(.03,.35,outsideDistance))*step(0.,outsideDistance));
      }
      float contactBreak=noiseWater(rootXZ*2.6+vec2(t*.12,-t*.08));
      color*=1.-contactBand*.22;
      color+=vec3(.010,.019,.016)*contactBand*smoothstep(.72,.92,contactBreak);
      gl_FragColor=vec4(color,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
    }`});
  const basin=part(root,new THREE.PlaneGeometry(65,120,32,32),waterShader,0,-2.1,-43,1,1,1);basin.rotation.x=-Math.PI/2;basin.name='TempleRippleWater';
  const terraces=[];
  for(let i=0;i<14;i++)for(const side of [-1,1]){
    const g=group(root);part(g,box,stone,side*2,-.5,0,6,1.3,7.8);part(g,box,moss,side*2,.18,0,6.15,.16,7.7);
    part(g,box,stone,side*2,-1.18,0,6.6,.22,8.2);part(g,box,stone,side*2,-.96,0,6.3,.22,8);
    for(const x of [-2.8,2.8])for(const z of [-3.55,3.55])part(g,box,stone,side*2+x,-.25,z,.37,1.05,.45);
    for(let chip=0;chip<3;chip++){const p=part(g,box,stone,side*(1.5+chip*.7),.35,2.8-chip*1.3,.24+chip*.06,.12,.23);p.rotation.y=(i+chip)*.9;p.rotation.z=(i%3-1)*.2;}
    part(g,box,gold,side*2,-.08,0,6.07,.065,7.86);
    for(const seam of [-1,1])part(g,box,dark,side*2,-.72,seam*2.35,6.03,.025,.055);
    const lotus=group(g);lotus.position.set(-side*.4,.34,1.6);for(let petal=0;petal<5;petal++){const a=petal*Math.PI*2/5;part(lotus,round,jade,Math.cos(a)*.23,0,Math.sin(a)*.23,.24,.055,.13);}part(lotus,crystal,gold,0,.15,0,.12,.22,.12);
    for(let j=0;j<3;j++)part(g,crystal,jade,side*(1.5+j*.6),.4+j*.08,-1.7+j*.2,.18+j*.06,.45+j*.14,.18+j*.05);
    terraces.push({g,index:i,side});
  }
  const shrines=[],flames=[],vines=[];
  for(let i=0;i<6;i++)for(const side of [-1,1]){
    const g=group(root);g.userData.shrineFoundation=true;
    const foundation=part(g,box,stone,0,-1.05,0,5.4,2.7,4.8);foundation.userData.shrineSupport=true;
    part(g,box,stone,0,-2.25,0,5.75,.35,5.15);part(g,box,gold,0,-.12,0,5.46,.075,4.86);
    const idol=frog(g,1.5);idol.position.y=.3;part(g,box,gold,0,.2,0,2.7,.18,2.4);
    for(const sign of [-1,1]){part(g,box,stone,sign*1.65,1,0,.3,2,.3);part(g,bowl,gold,sign*1.65,2.05,0,1,1,1);const f=part(g,cone,flameShader,sign*1.65,2.58,0,.18,.6,.18);f.userData.flameHeight=.6;flames.push(f);const inner=part(g,cone,flameShader,sign*1.65,2.55,.01,.09,.35,.09);inner.userData.flameHeight=.35;flames.push(inner);}
    shrines.push({g,index:i,side});
  }
  // Open central arch and roof silhouettes stay far away from playable lanes.
  const temple=group(root);temple.position.z=-62;
  for(const side of [-1,1]){
    part(temple,carvedBlock,stone,side*10,6,0,7,12,7);part(temple,box,gold,side*10,11.8,0,7.4,.3,7.4);
    for(let band=0;band<4;band++){part(temple,box,dark,side*10,1.5+band*2.7,3.56,7.1,.13,.13);part(temple,box,gold,side*10,1.7+band*2.7,3.59,6.6,.065,.08);}
    for(const offset of [-2.6,2.6]){part(temple,box,dark,side*10+offset,6.3,3.6,.38,9.6,.22);part(temple,box,gold,side*10+offset,6.3,3.73,.09,8.8,.08);}
    part(temple,box,dark,side*10,6.25,3.57,3.5,8.8,.12);part(temple,carvedBlock,stone,side*10,6.25,3.65,3.1,8.35,.08);
    for(let relief=0;relief<3;relief++){const emblem=part(temple,crystal,stone,side*10,3+relief*3,3.82,.8,.95,.3);emblem.rotation.z=Math.PI/4;part(temple,crystal,jade,side*10,3+relief*3,4.1,.22,.35,.09);}
    part(temple,carvedBlock,stone,side*10,.6,.1,7.8,1.2,7.8);part(temple,box,gold,side*10,1.25,.1,7.6,.1,7.6);
    part(temple,guardianLip,stone,side*10,1.58,4.02,4,3,1);
    for(let tier=0;tier<3;tier++){const r=part(temple,roof,moss,side*10,13+tier*1.5,0,7-tier,2,7-tier);r.rotation.y=Math.PI/4;const trim=part(temple,roof,gold,side*10,12.06+tier*1.5,0,7.16-tier,.16,7.16-tier);trim.rotation.y=Math.PI/4;}
    const giant=frog(temple,3);giant.position.set(side*10,12,2.8);
    for(let i=0;i<5;i++){const v=part(temple,box,moss,side*(6.5+i*.6),8-i*.3,4,.08,3+i*.5,.08);vines.push(v);}
  }
  const lipPoints=[[-7,11.5,3],[-5,13,3.5],[0,13.6,3.8],[5,13,3.5],[7,11.5,3]].map(p=>new THREE.Vector3(...p)),lipCurve=new THREE.CatmullRomCurve3(lipPoints);
  part(temple,new THREE.TubeGeometry(lipCurve,20,.8,7,false),stone,0,0,0,1,1,1);
  const browCurve=new THREE.CatmullRomCurve3(lipPoints.map(p=>p.clone().add(new THREE.Vector3(0,1.55,-1))));part(temple,new THREE.TubeGeometry(browCurve,20,1.55,7,false),stone,0,0,0,1,1,1);
  const trimCurve=new THREE.CatmullRomCurve3(lipPoints.map(p=>p.clone().add(new THREE.Vector3(0,-.28,.7))));part(temple,new THREE.TubeGeometry(trimCurve,20,.17,6,false),gold,0,0,0,1,1,1);
  for(const side of [-1,1]){const cheekCurve=new THREE.CatmullRomCurve3([[side*7,11.5,3],[side*8,8,3],[side*7.5,4,2.5]].map(p=>new THREE.Vector3(...p)));part(temple,new THREE.TubeGeometry(cheekCurve,12,.8,6,false),stone,0,0,0,1,1,1);}
  for(const side of [-1,1]){part(temple,round,stone,side*3.3,16.1,3.1,2.1,1.8,1.6);part(temple,round,jade,side*3.3,16.1,4.6,1.1,1.1,.2);part(temple,round,dark,side*3.3,16.1,4.85,.33,.6,.04);}
  for(const side of [-1,1])part(temple,eyeRim,gold,side*3.3,16.1,4.86,1.18,1.18,1);
  for(const side of [-1,1]){part(temple,round,stone,side*1.45,14.6,4.1,.62,.4,.5);part(temple,round,dark,side*1.45,14.58,4.56,.26,.16,.07);}
  // Bake the four fixed stone arch curves into one surface; their editable sources remain inspectable.
  const archCurves=temple.children.filter(o=>o.isMesh&&o.geometry.type==='TubeGeometry'&&o.material===stone&&o.geometry!==guardianLip);
  const archPositions=[],archNormals=[],archUvs=[];
  for(const source of archCurves){source.updateMatrix();const geometry=source.geometry.clone().applyMatrix4(source.matrix).toNonIndexed();archPositions.push(...geometry.attributes.position.array);archNormals.push(...geometry.attributes.normal.array);archUvs.push(...geometry.attributes.uv.array);geometry.dispose();source.userData.consolidatedArch=true;source.visible=false;}
  const archGeometry=new THREE.BufferGeometry();archGeometry.setAttribute('position',new THREE.Float32BufferAttribute(archPositions,3));archGeometry.setAttribute('normal',new THREE.Float32BufferAttribute(archNormals,3));archGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(archUvs,2));archGeometry.userData.architecture='consolidated-sculpted-arch';
  const mergedArch=new THREE.Mesh(archGeometry,stone);temple.add(mergedArch);
  // Instance every repeated geometry/material pair while retaining lightweight transform groups.
  const originals=[];root.traverse(o=>{if(o.isMesh&&o!==basin)originals.push(o);});const buckets=new Map();
  for(const m of originals){m.visible=false;if(m.userData.consolidatedArch)continue;const key=m.geometry.uuid+'/'+m.material.uuid;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(m);}
  const batches=[...buckets.values()].map(sources=>{const batch=new THREE.InstancedMesh(sources[0].geometry,sources[0].material,sources.length);batch.frustumCulled=false;if(sources[0].material===flameShader){batch.userData.noShadow=true;batch.castShadow=batch.receiveShadow=false;}batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(batch);return {batch,sources};});
  const inverseRoot=new THREE.Matrix4(),instanceMatrix=new THREE.Matrix4();
  const torchPoint=new THREE.Vector3();let torchPositions=[];
  let guardianBatches=[],guardianAsset=null;
  const guardianGroups=[];root.traverse(o=>{if(o.userData.sculpture==='frog-guardian-with-lips-nostrils-feet')guardianGroups.push(o);});
  const isGuardianPart=o=>{while(o&&o!==root){if(guardianGroups.includes(o))return true;o=o.parent;}return false;};
  for(const b of batches){b.guardianMask=b.sources.map(isGuardianPart);b.guardianOnly=b.guardianMask.every(Boolean);b.retainedSources=b.sources.filter((_,i)=>!b.guardianMask[i]);}
  function mountGuardianModel(model,sourceName='Blender sculpted guardian'){
    if(model===null){for(const {batch} of guardianBatches){root.remove(batch);batch.dispose();}guardianBatches=[];guardianAsset=null;return;}
    model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
    if(!Number.isFinite(size.y)||size.y<=0)throw Error('Guardian model has no valid geometry');
    const scale=1.75/size.y,normalization=new THREE.Matrix4().makeScale(scale,scale,scale).multiply(new THREE.Matrix4().makeTranslation(-center.x,-bounds.min.y,-center.z));
    const meshes=[];model.traverse(o=>{if(o.isMesh)meshes.push(o);});if(!meshes.length||meshes.length>8)throw Error('Guardian mesh budget exceeded');
    for(const {batch} of guardianBatches){root.remove(batch);batch.dispose();}
    guardianBatches=meshes.map(source=>{const batch=new THREE.InstancedMesh(source.geometry,source.material,guardianGroups.length);batch.frustumCulled=false;batch.castShadow=batch.receiveShadow=true;batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(batch);return {batch,local:new THREE.Matrix4().multiplyMatrices(normalization,source.matrixWorld)};});
    guardianAsset={loaded:true,source:sourceName,normalizedFootprint:{width:size.x*scale,depth:size.z*scale},instances:guardianGroups.length,drawBatches:guardianBatches.length};
  }
  let snapshot={};const wrap=(value,length)=>((value%length)+length)%length;
  function update(d,pose={active:false,yaw:0,player:{x:0,z:0}}){
    root.rotation.y=pose.active?pose.nextHeadingYaw:0;root.position.set(pose.active?pose.player.x:0,0,pose.active?pose.player.z:0);
    temple.scale.setScalar(1-Math.min(1,Math.max(0,d.corruptionBlend||0))*.999);const advance=d.distance*.32;for(const p of terraces){const z=-99+wrap(p.index*8+advance,112);p.g.position.set(p.side*8.8,0,z);}
    for(const p of shrines){const z=-94+wrap(p.index*18+advance,108);p.g.position.set(p.side*10.8,0,z);}
    flames.forEach((f,i)=>{f.scale.y=(f.userData.flameHeight||.5)*(1+Math.sin(d.time*8+i)*.12);f.rotation.y=d.time*.6+i;});
    vines.forEach((v,i)=>v.rotation.z=Math.sin(d.time*.7+i)*.035);
    shrines.forEach((p,i)=>waterShader.uniforms.foundationCenters.value[i].set(p.g.position.x,p.g.position.z));waterShader.uniforms.simulationTime.value=d.time;waterShader.uniforms.heading.value=root.rotation.y;waterShader.uniforms.night.value=THREE.MathUtils.smoothstep(d.distance,480,540);
    flameShader.uniforms.simulationTime.value=d.time;
    root.updateMatrixWorld(true);
    // Select one outer flame on each bank; return world positions so light follows the actual bowl through corners.
    torchPositions=[-1,1].map(side=>{const shrine=shrines.filter(p=>p.side===side).sort((a,b)=>Math.abs(a.g.position.z+10)-Math.abs(b.g.position.z+10))[0];const flame=flames.find(f=>f.parent===shrine.g&&Math.sign(f.position.x)===side);flame.getWorldPosition(torchPoint);return {x:torchPoint.x,y:torchPoint.y,z:torchPoint.z};});
    inverseRoot.copy(root.matrixWorld).invert();for(const {batch,sources,retainedSources,guardianOnly} of batches){const activeSources=guardianAsset?retainedSources:sources;batch.count=activeSources.length;batch.visible=!guardianAsset||!guardianOnly;if(!batch.visible)continue;activeSources.forEach((m,i)=>{instanceMatrix.multiplyMatrices(inverseRoot,m.matrixWorld);batch.setMatrixAt(i,instanceMatrix);});batch.instanceMatrix.needsUpdate=true;}
    for(const {batch,local} of guardianBatches){guardianGroups.forEach((g,i)=>{instanceMatrix.multiplyMatrices(inverseRoot,g.matrixWorld).multiply(local);batch.setMatrixAt(i,instanceMatrix);});batch.instanceMatrix.needsUpdate=true;}
    snapshot={guardianAsset:guardianAsset?{...guardianAsset}:null,loaded:true,surfaceDetail:'weathered-relief-and-wetness',assetsReady:textureReady,error:textureError,geometry:'modeled-emerald-frog-temple',archGeometry:'sculpted-frog-mouth-curved-lips',towerGeometry:'beveled-stone-recessed-relief-panels',guardianGeometry:guardianAsset?'blender-sculpted-guardian':'curved-lips-eyelids-nostrils-forward-feet',roofGeometry:'upturned-four-sided-pagoda',brazierGeometry:'open-lathe-bowl',flameGeometry:'instanced-procedural-orange-fire',flameTime:flameShader.uniforms.simulationTime.value,meshCount:meshes,renderInstances:batches.reduce((n,b)=>n+b.sources.length,0)+1,compactedMixedInstances:guardianAsset?batches.filter(b=>!b.guardianOnly).reduce((n,b)=>n+b.sources.length-b.batch.count,0):0,compactedMixedTriangles:guardianAsset?batches.filter(b=>!b.guardianOnly).reduce((n,b)=>n+(b.sources.length-b.batch.count)*(b.batch.geometry.index?b.batch.geometry.index.count:b.batch.geometry.attributes.position.count)/3,0):0,archConsolidation:{sourceCurves:archCurves.length,savedDrawBatches:archCurves.length-1},suppressedGuardianBatches:guardianAsset?batches.filter(b=>b.guardianOnly).length:0,drawBatches:batches.filter(b=>b.batch.visible).length+guardianBatches.length+1,waterGeometry:'fogged-procedural-ripple-plane',waterShading:'local-space-ripples-restrained-sun-glint',waterTime:waterShader.uniforms.simulationTime.value,waterDepth:"local-layered-noise-soft-crest",waterContact:{foundations:12,halfWidth:2.7,halfDepth:2.4,band:.35,space:"temple-local"},terraces:terraces.length,shrines:shrines.length,flames:flames.length,vines:vines.length,minimumPropCenterX:10.8,shrineSupport:{attached:true,centerX:10.8,width:5.4,depth:4.8,topY:.3,bottomY:-2.4},farTempleZ:temple.position.z,distance:d.distance,time:d.time,pose:{active:Boolean(pose.active),yaw:root.rotation.y,player:{x:root.position.x,z:root.position.z}}};
  }
  return {update,mountGuardianModel,torchPositions:()=>torchPositions.map(p=>({...p})),diagnostics:()=>({...snapshot})};
}
