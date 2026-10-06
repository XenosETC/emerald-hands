import {createStoneDetail} from './surface-detail.js?v=realm-gardens-86';
import {createTempleRoof} from './roof-geometry.js?v=realm-gardens-86';
// A complete modeled surrounding world, with no panorama or gameplay random calls.
export function createTempleWorld(THREE,scene){
  const root=new THREE.Group();root.name='Temple360World';scene.add(root);
  const rock=new THREE.MeshStandardMaterial({color:'#40584d',roughness:1,flatShading:true}),moss=new THREE.MeshStandardMaterial({color:'#325540',roughness:1}),leaves=new THREE.MeshStandardMaterial({color:'#234937',roughness:1,flatShading:true}),bark=new THREE.MeshStandardMaterial({color:'#273c30',roughness:1}),gold=new THREE.MeshStandardMaterial({color:'#a79861',roughness:.7}),jade=new THREE.MeshStandardMaterial({color:'#82cc94',emissive:'#214a31',emissiveIntensity:.4});
  const stoneDetail=createStoneDetail(THREE);rock.bumpMap=moss.bumpMap=stoneDetail.bump;rock.bumpScale=.12;moss.bumpScale=.07;rock.roughnessMap=stoneDetail.roughness;
  const matteRoofData=new Uint8Array(stoneDetail.roughness.image.data);
  for(let i=0;i<matteRoofData.length;i+=4){const matte=Math.round(230+matteRoofData[i+1]/255*25);matteRoofData[i]=matteRoofData[i+1]=matteRoofData[i+2]=matte;}
  const matteRoofMap=stoneDetail.roughness.clone();matteRoofMap.source=new THREE.Source({...stoneDetail.roughness.image,data:matteRoofData});matteRoofMap.needsUpdate=true;
  const roofStone=moss.clone();roofStone.color.set('#465f4b');roofStone.bumpScale=.10;roofStone.roughness=.96;roofStone.roughnessMap=matteRoofMap;roofStone.metalness=0;roofStone.userData.surface='weathered-pagoda-stone';
  const leafVariants=['#497950','#578457','#3d7151','#648d60'].map(color=>new THREE.MeshStandardMaterial({color,emissive:'#326b45',emissiveIntensity:.4,roughness:.86,side:THREE.DoubleSide,vertexColors:true}));
  const foliageTime={value:0},flutterVertex=`
    float flutterPhase=0.;
    #ifdef USE_INSTANCING
    flutterPhase=instanceMatrix[3].x*.21+instanceMatrix[3].z*.13;
    #endif
    float tipWeight=pow(clamp(uv.y,0.,1.),2.);
    transformed.x+=sin(foliageTime*1.7+flutterPhase+uv.y*5.)*.018*tipWeight;
    transformed.y+=sin(foliageTime*2.1+flutterPhase*.7+uv.x*4.)*.022*tipWeight;`;
  const addFlutter=shader=>{shader.uniforms.foliageTime=foliageTime;shader.vertexShader='uniform float foliageTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n'+flutterVertex);};
  for(const material of leafVariants){material.onBeforeCompile=addFlutter;material.customProgramCacheKey=()=> 'temple-leaf-flutter-20';material.userData.foliageTime=foliageTime;}
  const leafDepth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,side:THREE.DoubleSide});leafDepth.onBeforeCompile=addFlutter;leafDepth.customProgramCacheKey=()=> 'temple-leaf-depth-flutter-20';leafDepth.userData.foliageTime=foliageTime;
  let assetsReady=false,assetError=null;new THREE.TextureLoader().load('assets/temple-stone-floor-v1.png',texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2,2);texture.anisotropy=4;rock.map=bark.map=roofStone.map=texture;rock.color.set('#9cad9e');bark.color.set('#647e63');rock.needsUpdate=bark.needsUpdate=roofStone.needsUpdate=true;assetsReady=true;},undefined,()=>assetError='Stone texture unavailable; using world material colors');
  const box=new THREE.BoxGeometry(1,1,1),stone=new THREE.IcosahedronGeometry(1,1),round=new THREE.IcosahedronGeometry(1,1),trunk=new THREE.CylinderGeometry(.7,1,1,6),roof=createTempleRoof(THREE);
  const gorgeLintel=new THREE.BoxGeometry(1,1,1,8,2,2),lintelVertices=gorgeLintel.attributes.position;
  for(let v=0;v<lintelVertices.count;v++){
    const x=lintelVertices.getX(v),y=lintelVertices.getY(v),z=lintelVertices.getZ(v),rise=Math.cos(x*Math.PI);
    const profileY=y+2.0*rise-.10*Math.abs(x)*(.5+y),bevel=Math.abs(z)>.49&&Math.abs(y)>.49?.065:0;
    lintelVertices.setXYZ(v,x*(1-bevel*.6),profileY+(y<0?bevel:-bevel),z*(1-bevel));
  }
  lintelVertices.needsUpdate=true;gorgeLintel.computeVertexNormals();gorgeLintel.userData.architecture='curved-chamfered-gorge-lintel';
  const gorgePillar=new THREE.BufferGeometry(),pillarVertices=[],pillarUvs=[],pillarIndices=[];
  const pillarCorners=[[-.38,-.5],[.38,-.5],[.5,-.38],[.5,.38],[.38,.5],[-.38,.5],[-.5,.38],[-.5,-.38]];
  for(const [y,width] of [[-.5,1],[.38,.74],[.5,.88]])for(let i=0;i<8;i++){pillarVertices.push(pillarCorners[i][0]*width,y,pillarCorners[i][1]*width);pillarUvs.push(i/8,y+.5);}
  for(let ring=0;ring<2;ring++)for(let i=0;i<8;i++){const j=(i+1)%8,a=ring*8+i,b=ring*8+j,c=a+8,e=b+8;pillarIndices.push(a,c,b,b,c,e);}for(let i=1;i<7;i++)pillarIndices.push(0,i,i+1,16,16+i+1,16+i);
  gorgePillar.setAttribute('position',new THREE.Float32BufferAttribute(pillarVertices,3));gorgePillar.setAttribute('uv',new THREE.Float32BufferAttribute(pillarUvs,2));gorgePillar.setIndex(pillarIndices);gorgePillar.computeVertexNormals();gorgePillar.userData.architecture='tapered-chamfer-gorge-pillar';
  // Retain the curved profile, with a closed deep eave edge and shaded stone underside.
  const roofPosition=Array.from(roof.attributes.position.array),roofUv=Array.from(roof.attributes.uv.array),roofIndex=Array.from(roof.index.array),roofVertexCount=roof.attributes.position.count;
  for(let v=0;v<roofVertexCount;v++){roofPosition.push(roofPosition[v*3],roofPosition[v*3+1]-.09,roofPosition[v*3+2]);roofUv.push(roofUv[v*2],roofUv[v*2+1]);}
  const topIndex=[...roofIndex];for(let i=0;i<topIndex.length;i+=3)roofIndex.push(topIndex[i]+roofVertexCount,topIndex[i+2]+roofVertexCount,topIndex[i+1]+roofVertexCount);
  for(let edge=25;edge<29;edge++)roofIndex.push(edge,edge+roofVertexCount,edge+1,edge+1,edge+roofVertexCount,edge+1+roofVertexCount);
  roof.setAttribute('position',new THREE.Float32BufferAttribute(roofPosition,3));roof.setAttribute('uv',new THREE.Float32BufferAttribute(roofUv,2));roof.setIndex(roofIndex);roof.deleteAttribute("normal");roof.computeVertexNormals();roof.userData.solidEaveDepth=.09;
  // Fractured asymmetric strata replace the soft spherical ridge and moss-cap outline.
  const cliffVertices=stone.attributes.position;
  for(let v=0;v<cliffVertices.count;v++){
    const x=cliffVertices.getX(v),y=cliffVertices.getY(v),z=cliffVertices.getZ(v),fracture=1+.17*Math.sin(x*7+z*5)+.08*Math.cos(z*11-y*4);
    cliffVertices.setXYZ(v,x*fracture+.09*y, y>0?.22+Math.floor(y*4)*.19+.055*Math.sin(x*4+z*3):y*.86,z*(1+.12*Math.cos(x*6-y*3)));
  }
  cliffVertices.needsUpdate=true;stone.computeVertexNormals();stone.computeBoundingBox();stone.userData.formation='fractured-asymmetric-rock-strata';
  const splitCap=stone.clone(),splitVertices=splitCap.attributes.position;
  for(let v=0;v<splitVertices.count;v++){
    const x=splitVertices.getX(v),y=splitVertices.getY(v),z=splitVertices.getZ(v);
    // Diagonal weathered cleft breaks the repeated horizontal shelf silhouette.
    const cleft=Math.exp(-Math.pow((x+z*.45-.12)*3.5,2));
    splitVertices.setXYZ(v,x*(1+.11*Math.sin(z*5))+y*.07,y-(y>0?.29*cleft:0)+.09*x,z+.12*y*Math.sin(x*4));
  }
  splitVertices.needsUpdate=true;splitCap.computeVertexNormals();splitCap.computeBoundingBox();splitCap.userData={...stone.userData,formation:'cleft-diagonal-rock-cap'};
  const rootCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.55,-.55,.15),new THREE.Vector3(1.45,-.95,.5),new THREE.Vector3(2.6,-1.1,.7)]),rootGeometry=new THREE.TubeGeometry(rootCurve,9,.24,5,false);
  // Endpoint-aligned arching boughs: shared unit length, with a pronounced organic bend.
  const supportCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,-.5,0),new THREE.Vector3(.07,-.25,.06),new THREE.Vector3(.11,.04,.10),new THREE.Vector3(.065,.3,.065),new THREE.Vector3(0,.5,0)]);
  const supportGeometry=new THREE.TubeGeometry(supportCurve,16,.012,6,false);
  const leafGeometry=new THREE.BufferGeometry(),leafVertices=[],leafIndices=[],leafUvs=[],leafColors=[];
  for(let row=0;row<17;row++){
    const t=row/16,envelope=Math.sin(t*Math.PI),width=Math.max(.003,Math.pow(envelope,.82)*.31*(1+.2*Math.sin(t*Math.PI*8)));
    for(let col=0;col<5;col++){
      const side=col/2-1,edge=Math.abs(side),rib=Math.pow(1-edge,3)*.12*envelope,tipCurl=.2*Math.pow(t,4),cup=.30*edge*edge*envelope;
      const y=envelope*(.24-edge*.08)+rib+cup+tipCurl+.026*Math.sin(t*Math.PI*10+side*.6)*edge*envelope;
      const asymmetricLobe=1+.075*side*Math.sin(t*17+.7);
      leafVertices.push(side*width*asymmetricLobe+.045*envelope*Math.sin(t*Math.PI*.7),y,t*1.4+.018*side*envelope*Math.sin(t*13));leafUvs.push(col/4,t);
      const mottling=.9+.06*Math.sin(t*19+side*7),spine=(1-edge)*.065;leafColors.push(mottling+spine+.025*envelope,mottling+spine*.4,mottling-.08-spine*.35);
    }
  }
  for(let row=0;row<16;row++)for(let col=0;col<4;col++){const a=row*5+col,b=a+1,c=a+5,e=c+1;leafIndices.push(a,c,b,b,c,e);}
  leafGeometry.setAttribute('position',new THREE.Float32BufferAttribute(leafVertices,3));leafGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(leafUvs,2));leafGeometry.setAttribute('color',new THREE.Float32BufferAttribute(leafColors,3));leafGeometry.setIndex(leafIndices);leafGeometry.computeVertexNormals();
  let partCount=0;const part=(parent,g,m,x,y,z,sx,sy,sz)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);partCount++;return o;};
  const group=()=>{const g=new THREE.Group();root.add(g);return g;};
  // Two rock ridges enclose the horizon in all directions; irregular facets add actual depth.
  for(let layer=0;layer<2;layer++)for(let i=0;i<36;i++){
    const angle=i*Math.PI*2/36,baseRadius=layer?118:88,frontOpening=Math.abs(Math.sin(angle)*baseRadius)<38&&Math.cos(angle)<0;if(frontOpening)continue;
    const radius=baseRadius,x=Math.sin(angle)*radius,z=Math.cos(angle)*radius,height=18+layer*9+(i*13%17);
    const p=part(root,stone,rock,x,height*.43-4,z,8+layer*3,height*.58,11+layer*3);p.rotation.y=angle;p.rotation.z=Math.sin(i*3)*.13;
    const cap=part(root,(i+layer)%3===0?splitCap:stone,moss,x,height*.86-3,z,(7+layer*2)*(1+.1*Math.sin(i*2.3)),2.6+.8*Math.cos(i*1.7),9+layer*2);cap.rotation.y=angle+.3*Math.sin(i);cap.rotation.z=.08*Math.cos(i*2);
  }
  // Broad banks ground every rotating view without covering the track or bridge holes.
  // Solid banks keep fern roots supported; only the water-facing edge meanders outward.
  const shoreline=new THREE.BoxGeometry(164,.5,350,1,1,35),shorePositions=shoreline.attributes.position;
  for(let v=0;v<shorePositions.count;v++)if(shorePositions.getX(v)<0){const z=shorePositions.getZ(v),recess=.4+1.25*(.5+.5*Math.sin(z*.071+Math.sin(z*.19)*.7));shorePositions.setX(v,-82+recess);}
  shorePositions.needsUpdate=true;shoreline.computeVertexNormals();shoreline.computeBoundingBox();shoreline.userData.shoreGeometry='solid-irregular-water-contact';
  const shore=[];for(const side of [-1,1]){const bank=part(root,shoreline,rock,side*100,-.25,0,1,1,1);if(side<0)bank.rotation.y=Math.PI;bank.userData.shoreBank=true;shore.push(bank);}
  const trees=[];
  for(let i=0;i<64;i++){
    const angle=i*Math.PI*2/64,radius=34+i%5*6;let x=Math.sin(angle)*radius;const z=Math.cos(angle)*radius;x=(x<0?-1:1)*Math.max(24,Math.abs(x));
    const g=group(),height=8+(i*7%12);g.position.set(x<0?Math.min(x,-26):Math.max(x,26),0,z);g.userData.initialZ=z;g.userData.initialX=g.position.x;
    const lean=.7+.4*Math.sin(i*2.17),nodes=[new THREE.Vector3(0,0,0),new THREE.Vector3(Math.sin(i)*lean,height*(.34+.035*Math.cos(i)),Math.cos(i)*.5),new THREE.Vector3(-Math.sin(i)*lean*.8,height*(.7+.025*Math.sin(i)),Math.sin(i)*.65),new THREE.Vector3(Math.sin(i)*lean,height,Math.cos(i)*.55)];
    for(let segment=0;segment<3;segment++){const a=nodes[segment],b=nodes[segment+1],axis=b.clone().sub(a),mid=a.clone().add(b).multiplyScalar(.5),radius=.9-segment*.21,stem=part(g,trunk,bark,mid.x,mid.y,mid.z,radius,axis.length(),radius);stem.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis.normalize());}
    // Irrational angular spacing and smooth per-tree variation avoid stacked leaf shelves.
    for(let frond=0;frond<12;frond++){
      const phase=i*1.73+frond*2.41,a=frond*2.399963+i*.35+.22*Math.sin(phase),reach=.6+.8*(.5+.5*Math.sin(phase*1.37)),tip=nodes[3];
      const leaf=part(g,leafGeometry,leafVariants[(i+frond)%4],tip.x+Math.sin(a)*reach,height+.35+Math.sin(phase)*.85,tip.z+Math.cos(a)*reach,1.9+.5*(1+Math.sin(phase*.8)),1.6+.6*(.5+.5*Math.cos(phase)),2.6+.95*(.5+.5*Math.sin(phase*.63)));
      leaf.rotation.set(-.18+.48*Math.sin(phase*.91),a,.24*Math.cos(phase*1.2));leaf.userData.crownFrond=true;
    }
    for(const sign of [-1,1]){const r=part(g,rootGeometry,bark,0,1.05,0,1,1,1);r.rotation.y=sign>0?0:Math.PI;}
    g.userData.vines=[];for(let vine=0;vine<2;vine++)for(let segment=0;segment<2;segment++){const v=part(g,trunk,moss,(vine?1:-1)*2.5+segment*.1,height-1.8-segment*2.2,1.3,.055,2.3,.055);v.userData.baseAngle=(vine?1:-1)*.05;g.userData.vines.push(v);}
    trees.push(g);
  }
  const ferns=[];
  for(let i=0;i<24;i++){
    const g=group(),side=i%2?1:-1;g.userData.understory=true;g.position.set(side*(23.2+i%5*1.4+.4*Math.sin(i*3)) ,.015,-78+(i*23%138));
    for(let f=0;f<6;f++){
      const phase=i*1.37+f*2.1,a=f*2.399963+i*.6+.18*Math.sin(phase);
      const leaf=part(g,leafGeometry,leafVariants[(f+i)%4],0,0,0,1.8+.45*Math.sin(phase),1.5+.45*Math.cos(phase),1.8+.6*(.5+.5*Math.sin(phase*.73)));
      leaf.rotation.order="YXZ";leaf.rotation.y=a;leaf.rotation.x=-.25-.52*(.5+.5*Math.sin(phase*.81));leaf.rotation.z=.06*Math.sin(phase);leaf.userData.understoryFrond=true;
    }
    ferns.push(g);
  }
  const highCanopies=[];
  for(let i=0;i<8;i++){
    const g=group();g.position.z=-80+i*16;g.userData.supports=[];
    for(const side of [-1,1]){
      const attachment=new THREE.Vector3(side*(13.5+(i%3)*.6+(side>0?.3:0)),20+(i%3)*.45,(i%2?1:-1)*1.3+side*.6);
      for(let leaf=0;leaf<3;leaf++){
        const angle=side*Math.PI/2+side*(leaf-1)*.48+Math.sin(i*2+leaf)*.12;
        const f=part(g,leafGeometry,leafVariants[(i+leaf+(side>0?1:0))%4],attachment.x+side*leaf*.23,attachment.y+leaf*.26,attachment.z+(leaf-1)*.24,3.8+leaf*.4,2.6,4.3+((i+leaf)%3)*.45);f.rotation.y=angle;f.rotation.x=-.18-leaf*.12;f.rotation.z=side*(leaf-1)*.08;
        const direction=new THREE.Vector3(Math.sin(angle),0,Math.cos(angle)),length=4.7;
        const ridge=part(g,supportGeometry,bark,f.position.x+direction.x*length*.5,f.position.y+.12,f.position.z+direction.z*length*.5,2.4,length,2.4);ridge.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);
      }
      const stem=part(g,trunk,bark,side*19,7.8,0,.2,15.6,.2),limb=part(g,supportGeometry,bark,0,0,0,1,1,1);g.userData.supports.push({side,stem,limb,attachment});
    }
    highCanopies.push(g);
  }
  const courtyard=[],gorge=[];
  for(let i=0;i<12;i++){const angle=i*Math.PI*2/12,x=Math.sin(angle)*124,z=Math.cos(angle)*124;if(Math.abs(x)<18&&z<0)continue;for(let layer=0;layer<4;layer++){const leaf=part(root,leafGeometry,leafVariants[layer],x,17+layer*3,z,7+layer*.8,3,8);leaf.rotation.y=angle+layer*Math.PI/2;}}
  for(const side of [-1,1]){
    const court=group();court.position.set(side*24,0,-78);
    for(let col=0;col<4;col++){const column=part(court,box,rock,(col-1.5)*2,2.4,Math.sin(col)*3,1.2,5.8,1.2);column.rotation.z=side*(.15+col*.22);part(court,box,gold,(col-1.5)*2,.25,Math.sin(col)*3,2,.25,2);}
    const emblem=part(court,new THREE.TorusGeometry(2.5,.22,6,16),gold,0,10,0,1,1,1);part(court,round,rock,0,9.9,0,1.7,1.15,.4);for(const x of [-.8,.8]){part(court,round,rock,x,10.8,.1,.55,.5,.35);part(court,round,jade,x,10.8,.4,.22,.23,.06);}part(court,box,moss,0,13,0,.12,3,.12);courtyard.push(court);
    const arch=group();arch.position.set(side*33,0,-38);
    for(const x of [-5,5]){part(arch,gorgePillar,rock,x,5,0,1.5,10,1.8);part(arch,box,gold,x,2,1,1.6,.13,.15);}part(arch,gorgeLintel,rock,0,10,0,11.5,1.6,2);part(arch,box,gold,0,12.9,1.08,3.5,.12,.1);for(const x of [-2,2])part(arch,round,jade,x,13.0,1.1,.7,.65,.2);gorge.push(arch);
    const farArch=arch.clone(true);root.add(farArch);farArch.position.set(side*24,0,-124);farArch.userData.gorgeSkyLandmark=true;
    for(const m of farArch.children){if(m.geometry===gorgePillar&&m.scale.y===10){m.position.y=18;m.scale.y=36;m.userData.groundedGorgeColumn=true;}else if(m.position.y===10)m.position.y=36;else if(m.position.y===12.9)m.position.y=38.9;else if(m.position.y===13.0)m.position.y=39.0;}
    partCount+=arch.children.length;gorge.push(farArch);
  }
  const ruins=[];
  for(const side of [-1,1])for(let i=0;i<3;i++){
    const g=group();g.position.set(side*(22+i*2),0,-45+i*44);
    for(let step=0;step<3;step++)part(g,box,rock,0,.35+step*.5,0,9-step,.7,8-step);
    for(const x of [-2.8,2.8])for(const z of [-2.5,2.5]){part(g,box,rock,x,4,z,.7,6,.7);part(g,box,gold,x,2.3,z,.77,.12,.77);}
    for(let tier=0;tier<2;tier++){const r=part(g,roof,roofStone,0,7+tier*1.8,0,6-tier,2.5+i*.15-tier*.2,6-tier);r.rotation.y=Math.PI/4;r.userData.pagodaTier=true;const trim=part(g,roof,gold,0,6.08+tier*1.8-i*.05,0,6.1-tier,.12,6.1-tier);trim.rotation.y=Math.PI/4;}
    part(g,round,rock,0,2.6,1,1.7,1.25,1.2);
    for(const x of [-.85,.85]){part(g,round,rock,x,3.7,1.4,.6,.6,.4);part(g,round,jade,x,3.7,1.75,.26,.26,.06);}
    ruins.push(g);
  }
  const fallMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:true,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{simulationTime:{value:0}}]),vertexShader:`varying vec2 waterfallUv;
    #include <fog_pars_vertex>
    void main(){waterfallUv=uv;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`,fragmentShader:`varying vec2 waterfallUv;uniform float simulationTime;
    #include <fog_pars_fragment>
    float waterHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float waterNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(waterHash(i),waterHash(i+vec2(1.,0.)),f.x),mix(waterHash(i+vec2(0.,1.)),waterHash(i+vec2(1.)),f.x),f.y);}
    void main(){vec2 q=vec2(waterfallUv.x*7.,waterfallUv.y*5.+simulationTime*1.4);float bend=(waterNoise(q*.7)-.5)*.18;float streams=waterNoise(vec2((waterfallUv.x+bend)*31.,waterfallUv.y*5.+simulationTime*2.6));float turbulence=waterNoise(q*2.1+vec2(8.,11.));float edgeWidth=.06+turbulence*.07;float edges=smoothstep(0.,edgeWidth,waterfallUv.x)*smoothstep(0.,edgeWidth,1.-waterfallUv.x);float foam=smoothstep(.48,.83,streams*.7+turbulence*.3)*(1.-smoothstep(.035,.24+turbulence*.08,waterfallUv.y));float baseVeil=(1.-smoothstep(.01,.16,waterfallUv.y))*waterNoise(vec2(waterfallUv.x*12.,simulationTime*.65));foam=foam*.7+baseVeil*.18;vec3 color=mix(vec3(.1,.27,.25),vec3(.37,.56,.48),streams*.45+turbulence*.18);color+=vec3(.13,.17,.14)*foam;gl_FragColor=vec4(color,edges*(.39+streams*.22+foam*.12));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
    }`});
  const sprayGeometry=new THREE.BufferGeometry(),sprayPositions=[],sprayPhases=[];for(let i=0;i<36;i++){sprayPositions.push(Math.sin(i*2.4)*1.2,.12,Math.cos(i*2.4)*.6);sprayPhases.push(i/36);}sprayGeometry.setAttribute('position',new THREE.Float32BufferAttribute(sprayPositions,3));sprayGeometry.setAttribute('phase',new THREE.Float32BufferAttribute(sprayPhases,1));
  const sprayMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:true,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{simulationTime:{value:0},mistOpacity:{value:.26},mistLift:{value:1.15}}]),vertexShader:`attribute float phase;uniform float simulationTime;uniform float mistLift;varying float particleAge;varying float mistPhase;
    #include <fog_pars_vertex>
    void main(){particleAge=fract(phase+simulationTime*.19);mistPhase=phase;vec3 p=position;p.x+=sin(phase*22.)*particleAge*.7;p.y+=sin(particleAge*3.1415926)*mistLift;p.z+=cos(phase*31.)*particleAge*.6;vec4 mvPosition=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mvPosition;gl_PointSize=clamp((1.+sin(particleAge*3.1415926))*(140.+phase*90.)/max(1.,-mvPosition.z),1.,22.);
    #include <fog_vertex>
    }`,fragmentShader:`varying float particleAge;varying float mistPhase;uniform float mistOpacity;
    #include <fog_pars_fragment>
    void main(){vec2 puff=(gl_PointCoord-.5)*vec2(1.,1.2+.3*sin(mistPhase*17.));float radial=exp(-dot(puff,puff)*15.);float ageFade=smoothstep(0.,.16,particleAge)*(1.-smoothstep(.48,1.,particleAge));float a=radial*ageFade*mistOpacity;gl_FragColor=vec4(.32,.48,.43,a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
    }`});
  const waterfalls=[],sprays=[];for(const side of [-1,1])for(const z of [-38,28]){const g=group();g.position.set(side*32,0,z);part(g,stone,rock,0,8,0,6,10,4);const fall=part(g,new THREE.PlaneGeometry(3,15),fallMaterial,0,7.5,4.1,1,1,1);fall.rotation.y=-side*.25;waterfalls.push(fall);const spray=new THREE.Points(sprayGeometry,sprayMaterial);spray.position.set(0,.1,4.4);spray.frustumCulled=false;g.add(spray);sprays.push(spray);}
  const skyMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{simulationTime:{value:0},night:{value:0},gorge:{value:0}},vertexShader:`varying vec3 skyDirection;void main(){skyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 skyDirection;uniform float simulationTime;uniform float night;uniform float gorge;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float softNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
    float wisps(vec2 p){return softNoise(p)*.55+softNoise(p*2.03+vec2(13.2,7.4))*.28+softNoise(p*4.07+vec2(3.1,19.2))*.17;}
    vec3 distantHorizon(vec3 direction,vec3 skyColor){
      vec3 result=skyColor;
      for(int layer=0;layer<3;layer++){
        float index=float(layer);
        vec2 terrainCoord=direction.xz*(3.2+index*2.7)+vec2(13.4+index*8.1,7.2-index*3.7);
        float profile=softNoise(terrainCoord)*.7+softNoise(terrainCoord*2.13)*.3;
        float ridgeHeight=.012+index*.017+profile*.027;
        float coverage=(1.-smoothstep(ridgeHeight-.003,ridgeHeight+.004,direction.y))*(1.-smoothstep(.085,.10,direction.y));
        vec3 ridgeColor=mix(vec3(.19,.31,.30),vec3(.025,.062,.076),night);
        ridgeColor=mix(ridgeColor,vec3(.040,.062,.097),gorge*.38);
        result=mix(result,ridgeColor,coverage*(.22+index*.09));
      }
      return result;
    }
    void main(){vec3 d=normalize(skyDirection);float elevation=max(0.,d.y);vec3 day=mix(vec3(.32,.46,.45),vec3(.045,.19,.29),pow(elevation,.65));vec3 dusk=mix(vec3(.035,.11,.14),vec3(.008,.025,.06),elevation);float horizon=exp(-abs(d.y)*7.);day+=vec3(.12,.075,.025)*horizon;vec3 color=mix(day,dusk,night)+vec3(-.002,.006,.024)*gorge;vec2 cloudPlane=d.xz/max(.18,d.y+.35);vec2 drift=vec2(simulationTime*.003,-simulationTime*.001);float shape=wisps(cloudPlane*vec2(1.4,3.7)+drift);float streak=wisps(cloudPlane*vec2(2.6,7.8)+drift*.6+vec2(4.,13.));float veil=smoothstep(.39,.66,shape+streak*.14)*smoothstep(-.045,.055,d.y);vec3 cloudDay=mix(vec3(.24,.36,.36),vec3(.68,.66,.53),smoothstep(.38,.68,streak));vec3 cloudColor=mix(cloudDay,vec3(.065,.105,.13),night);color=mix(color,cloudColor,veil*(.5-night*.27));color+=vec3(.11,.09,.045)*pow(max(0.,dot(d,normalize(vec3(-.5,.18,-.65)))),32.)*(1.-night);float sun=smoothstep(.9984,.9991,dot(d,normalize(vec3(-.5,.18,-.65))));float moon=smoothstep(.9984,.9991,dot(d,normalize(vec3(.55,.2,-.42))));color+=vec3(.78,.64,.37)*sun*(1.-night)+vec3(.36,.43,.38)*moon*night;vec2 uv=vec2(atan(d.z,d.x)/6.2831853+.5,asin(d.y)/3.1415926+.5)*vec2(720.,360.);float star=step(.986,hash(floor(uv)))*(1.-smoothstep(.025,.075,length(fract(uv)-.5)))*step(.05,d.y);color+=vec3(.5,.58,.53)*star*night*(.8+.2*sin(simulationTime*.35+hash(floor(uv))*12.));color=distantHorizon(d,color);gl_FragColor=vec4(color,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`});
  const sky=part(root,new THREE.SphereGeometry(180,32,20),skyMaterial,0,0,0,1,1,1);sky.name='TempleFullSphereSky';sky.renderOrder=-100;sky.frustumCulled=false;
  const originals=[];root.traverse(o=>{if(o.isMesh&&o!==sky&&!waterfalls.includes(o))originals.push(o);});const buckets=new Map();for(const o of originals){const key=o.geometry.uuid+'/'+o.material.uuid;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);o.visible=false;}
  const batches=[...buckets.values()].map(sources=>{const batch=new THREE.InstancedMesh(sources[0].geometry,sources[0].material,sources.length);batch.frustumCulled=false;if(leafVariants.includes(sources[0].material))batch.customDepthMaterial=leafDepth;batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(batch);return {batch,sources};});
  const inverse=new THREE.Matrix4(),matrix=new THREE.Matrix4();let receipt={};
  function update(d,pose={active:false,player:{x:0,z:0}}){
    root.rotation.y=pose.active?pose.nextHeadingYaw:0;root.position.set(pose.active?pose.player.x:0,0,pose.active?pose.player.z:0);
    for(const [i,tree] of trees.entries()){tree.position.z=-80+((tree.userData.initialZ+80+d.distance*.32)%140+140)%140;tree.rotation.z=Math.sin(d.time*.2+i)*.006;tree.userData.vines.forEach((vine,j)=>vine.rotation.z=vine.userData.baseAngle+Math.sin(d.time*.45+i+j)*.045);}
    const courtyardBlend=THREE.MathUtils.smoothstep(d.distance,480,540),gorgeBlend=THREE.MathUtils.smoothstep(d.distance,980,1040),chapter=gorgeBlend>=.5?2:courtyardBlend>=.5?1:0;
    const chapterNames=['Canopy Corridor','Sunken Ruined Courtyard','Waterfall Gorge'];
    rock.color.set('#9cad9e').lerp(new THREE.Color('#809d92'),courtyardBlend).lerp(new THREE.Color('#738f98'),gorgeBlend);moss.color.set('#325540').lerp(new THREE.Color('#365c54'),gorgeBlend);
    trees.forEach(g=>{g.position.x=g.userData.initialX+Math.sign(g.userData.initialX)*(courtyardBlend*8+gorgeBlend*6);});
    highCanopies.forEach((g,i)=>{g.position.z=-85+((i*16+d.distance*.32)%128+128)%128;const width=1-courtyardBlend*.24-gorgeBlend*.18;g.scale.set(1,1,width);for(const {side,stem,limb,attachment} of g.userData.supports){stem.position.x=side*19;stem.scale.set(.2,15.6,.2);const a=new THREE.Vector3(side*19,15.6,0),b=attachment.clone(),direction=b.clone().sub(a);limb.position.copy(a).add(b).multiplyScalar(.5);limb.scale.set(direction.length(),direction.length(),direction.length());limb.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());if(side<0)limb.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI));}});
    courtyard.forEach(g=>g.scale.setScalar(.03+courtyardBlend*(1-gorgeBlend)*.97));gorge.forEach(g=>g.scale.setScalar(.03+gorgeBlend*.97));
    skyMaterial.uniforms.simulationTime.value=fallMaterial.uniforms.simulationTime.value=sprayMaterial.uniforms.simulationTime.value=d.time;skyMaterial.uniforms.night.value=THREE.MathUtils.smoothstep(d.distance,480,540);
    foliageTime.value=d.time;
    skyMaterial.uniforms.gorge.value=gorgeBlend;leafVariants.forEach(material=>material.emissiveIntensity=.4-skyMaterial.uniforms.night.value*.18);
    root.updateMatrixWorld(true);inverse.copy(root.matrixWorld).invert();for(const {batch,sources} of batches){sources.forEach((o,i)=>{matrix.multiplyMatrices(inverse,o.matrixWorld);batch.setMatrixAt(i,matrix);});batch.instanceMatrix.needsUpdate=true;}
    receipt={loaded:true,assetsReady,error:assetError,full3D:true,cliffGeometry:"fractured-asymmetric-rock-strata",cliffProfiles:2,gorgeFraming:"far-pair-portrait-visible",gorgeLandmarkHeight:36,gorgeLintel:"curved-chamfered-stone",gorgeArchRise:3.2,gorgePillars:"tapered-chamfer-grounded",panorama:false,organicTrunks:true,crownDistribution:"asymmetric-spiral-varied-tilt",canopySupports:"curved-endpoint-aligned-boughs",parts:partCount,drawBatches:batches.length+waterfalls.length+sprays.length+1,chapter:{index:chapter,name:chapterNames[chapter],courtyardBlend,gorgeBlend,landmarks:chapter===0?'layered high canopy':chapter===1?'collapsed columns and hanging frog emblems':'carved waterfall gorge arches'},trees:trees.length,shoreGeometry:"solid-irregular-water-contact",ferns:ferns.length,understoryGeometry:"grounded-asymmetric-six-frond-clusters",highCanopies:highCanopies.length,canopyGeometry:'curved-individual-fronds',canopyComposition:'asymmetric-side-branch-clusters',leafGeometry:'lobed-ribbed-curled-vertex-colored',leafVertices:85,ruins:ruins.length,waterfalls:waterfalls.length,waterfallGeometry:'layered-noise-turbulent-flow-foam',foliageFlutter:true,flutterTime:foliageTime.value,flutterShadow:'matching-depth-shader',sprayPoints:sprays.length*36,mistGeometry:"local-soft-age-faded-base-puffs",mistOpacity:sprayMaterial.uniforms.mistOpacity.value,sprayTime:sprayMaterial.uniforms.simulationTime.value,roofGeometry:'upturned-four-sided-pagoda',pagodaEaves:"closed-depth-varied-tier-pitch",roofSurface:"weathered-pagoda-stone",skyAtmosphere:'layered-horizon-cloud-depth',skyDistantLayers:3,skyRidgeMaxElevation:.10,skyGeometry:'full-sphere-procedural',skyRadius:180,simulationTime:d.time,waterfallTime:fallMaterial.uniforms.simulationTime.value,night:skyMaterial.uniforms.night.value,pose:{active:Boolean(pose.active),yaw:root.rotation.y,player:{x:root.position.x,z:root.position.z}}};
  }
  return {update,diagnostics:()=>({...receipt})};
}
