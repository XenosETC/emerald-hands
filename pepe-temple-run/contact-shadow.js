// Small deterministic falloff texture; no DOM, network assets or gameplay state.
export function createContactShadow(THREE){
  const size=64,pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const radius=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2)),t=Math.max(0,Math.min(1,radius)),falloff=1-t*t*(3-2*t),i=(y*size+x)*4;
    pixels[i]=pixels[i+1]=pixels[i+2]=255;pixels[i+3]=Math.round(255*falloff);
  }
  const texture=new THREE.DataTexture(pixels,size,size,THREE.RGBAFormat);texture.magFilter=texture.minFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
  const mesh=new THREE.Mesh(new THREE.CircleGeometry(.65,24),new THREE.MeshBasicMaterial({color:'#061c13',map:texture,transparent:true,opacity:.35,depthWrite:false}));
  mesh.name='SoftContactShadow';mesh.rotation.x=-Math.PI/2;mesh.position.y=.08;return mesh;
}
