// A bounded, cosmetic gateway. The simulation owns the exact crossing time.
export function createRealmArrival(THREE,scene){
  const root=new THREE.Group();root.name='CorruptionArrival';root.userData.realmPaletteFixed=true;root.visible=false;scene.add(root);
  const gate=new THREE.Group();gate.name='CorruptionRiftGate';root.add(gate);
  const fallback=new THREE.Group();fallback.name='RiftFrameFallback';gate.add(fallback);
  const stone=new THREE.MeshStandardMaterial({color:'#46344e',roughness:.94}),edge=new THREE.MeshStandardMaterial({color:'#b773dc',emissive:'#7937a5',emissiveIntensity:.6,roughness:.6});
  const block=new THREE.BoxGeometry(1,1,1);
  // Bridge-edge plinths root the wide frame below the water and join the deck.
  const supports=[-1,1].map(side=>{const m=new THREE.Mesh(block,stone);m.name='RiftBridgeFoundation';m.position.set(side*4,-1.25,0);m.scale.set(1.6,2.5,1.35);m.receiveShadow=true;gate.add(m);return m;});
  for(const side of [-1,1]){const m=new THREE.Mesh(block,stone);m.position.set(side*4.05,1.9,0);m.scale.set(.8,3.8,.7);fallback.add(m);}
  // Lower half remains completely open; the visible span clears all three lanes.
  const arch=new THREE.Mesh(new THREE.TorusGeometry(1,.105,5,20,Math.PI),stone);arch.scale.set(4.05,2.1,1);arch.position.y=3.8;fallback.add(arch);
  const keystone=new THREE.Mesh(new THREE.OctahedronGeometry(.35),edge);keystone.position.set(0,6,0);fallback.add(keystone);
  const material=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    uniforms:{clock:{value:0},strength:{value:0},crossing:{value:0}},
    vertexShader:'varying vec2 portalUv;void main(){portalUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 portalUv;uniform float clock,strength,crossing;
      void main(){
        vec2 q=portalUv*2.-1.;float r=length(q);float a=atan(q.y,q.x);
        float broken=.64+.36*sin(a*13.-clock*2.6+sin(a*7.+clock));
        float rim=exp(-pow((r-.91)*32.,2.))*broken;
        float inner=exp(-pow((r-.82)*58.,2.))*(.5+.5*sin(a*19.+clock*3.));
        // Transparent center preserves Crown, the low lintel and every lane.
        float alpha=(rim*.44+inner*.2)*strength*smoothstep(.7,.8,r);
        vec3 hue=mix(vec3(.48,.12,.85),vec3(.83,.62,1.),rim*.6+crossing*.3);
        gl_FragColor=vec4(hue,alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const membrane=new THREE.Mesh(new THREE.PlaneGeometry(8.4,6.6),material);membrane.name='OpenCenterRift';membrane.userData.noShadow=true;membrane.position.set(0,3.3,.4);gate.add(membrane);
  const motes=new THREE.InstancedMesh(new THREE.OctahedronGeometry(.065),edge,32);motes.name='RiftMotes';motes.userData.noShadow=true;motes.frustumCulled=false;gate.add(motes);
  const dummy=new THREE.Object3D();let asset=false,error=null,snapshot={phase:'hidden',visible:false,elapsed:0,strength:0,z:0,pattern:null};
  function mount(model){
    const box=new THREE.Box3().setFromObject(model,true),size=box.getSize(new THREE.Vector3());
    if(![size.x,size.y,size.z].every(Number.isFinite)||size.x<7||size.y<4)throw Error('Invalid rift frame bounds');
    model.position.y-=box.min.y;model.name='BlenderCorruptionPortal';let foundationMaterial;
    model.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;if(!foundationMaterial&&o.material?.map)foundationMaterial=o.material;}});
    if(foundationMaterial)for(const support of supports)support.material=foundationMaterial;
    gate.add(model);fallback.visible=false;asset=true;
  }
  function update(d,pose){
    const entry=d.realm==='corrupt'?d.realmEntry:null,elapsed=entry?Math.max(0,d.time-entry.time):0;
    const next=d.realm==='jade'?d.objects?.filter(o=>o.type==='gate'&&!o.hit&&!o.failed&&o.z>=7).sort((a,b)=>a.z-b.z)[0]:null;
    const approaching=Boolean(next&&next.z<115),crossed=Boolean(entry&&elapsed<1.2);
    root.visible=approaching||crossed;root.rotation.y=pose.active?pose.nextHeadingYaw:0;root.position.set(pose.active?pose.player.x:0,0,pose.active?pose.player.z:0);
    const z=entry?(d.distance-entry.distance)*.32:next?-(next.z-7)*.32:0;
    const bend=pose.active?0:d.turn?.visualBend||0;gate.position.set(bend*Math.pow(Math.max(0,-z)/95,2)*15,.065,z);
    const fade=entry?Math.pow(Math.max(0,1-elapsed/1.2),.7):approaching?Math.min(1,(115-next.z)/30):0;
    const strength=fade*(entry?1:.65);material.uniforms.clock.value=d.time;material.uniforms.strength.value=strength;material.uniforms.crossing.value=entry?fade:0;
    for(let i=0;i<32;i++){
      const a=i*Math.PI*2/32+d.time*.12,travel=(d.time*.3+i*.618)%1;
      dummy.position.set(Math.cos(a)*3.85,3.3+Math.sin(a)*3.05,.3+travel*.9+(entry?elapsed*3:0));
      dummy.rotation.set(a,d.time*.7+i,0);dummy.scale.setScalar((.6+travel*.8)*fade);dummy.updateMatrix();motes.setMatrixAt(i,dummy.matrix);
    }
    motes.instanceMatrix.needsUpdate=true;
    snapshot={phase:crossed?'crossing':approaching?'approach':'hidden',visible:root.visible,elapsed,strength,z,pattern:entry?.pattern??next?.pattern??null,time:d.time,pose:{yaw:root.rotation.y,x:root.position.x,z:root.position.z}};
  }
  return {mount,update,fail:e=>{error=String(e);},diagnostics:()=>({...snapshot,asset,error,particles:32,centerClear:true})};
}
