// World-space powerup feedback follows Crown and simulation time, including pause.
export function createAuras(THREE,scene){
  const root=new THREE.Group();root.name='CrownPowerupAuras';scene.add(root);
  const shieldMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{simulationTime:{value:0}},vertexShader:`varying vec3 surfaceNormal;varying vec3 viewDirection;void main(){vec4 p=modelViewMatrix*vec4(position,1.);surfaceNormal=normalize(normalMatrix*normal);viewDirection=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,fragmentShader:`varying vec3 surfaceNormal;varying vec3 viewDirection;uniform float simulationTime;void main(){float edge=pow(1.-abs(dot(normalize(surfaceNormal),normalize(viewDirection))),3.);float pulse=.85+.15*sin(simulationTime*3.);gl_FragColor=vec4(vec3(1.,.78,.3)*pulse,.025+edge*.28);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`});
  const shield=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),shieldMaterial);shield.scale.set(.88,1.3,.72);shield.position.y=1.15;root.add(shield);
  const magnetMaterial=new THREE.MeshBasicMaterial({color:'#73ffc0',transparent:true,opacity:.4,depthWrite:false});
  const rings=Array.from({length:2},()=>{const m=new THREE.Mesh(new THREE.TorusGeometry(.72,.018,5,36),magnetMaterial);m.rotation.x=-Math.PI/2;root.add(m);return m;});
  let snapshot={loaded:true};
  function update(d,position){
    root.position.copy(position);shield.visible=Boolean(d.shield);shieldMaterial.uniforms.simulationTime.value=d.time;
    rings.forEach((m,i)=>{m.visible=d.magnet>0;const phase=(d.time*.65+i*.5)%1;m.position.y=.12+phase*.6;m.scale.setScalar(.75+phase*.4);});
    snapshot={loaded:true,shield:shield.visible,magnet:d.magnet>0,time:d.time,position:{x:root.position.x,y:root.position.y,z:root.position.z},meshes:3};
  }
  return {update,diagnostics:()=>({...snapshot})};
}
