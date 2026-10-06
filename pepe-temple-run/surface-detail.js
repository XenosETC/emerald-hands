// Shared cosmetic maps; independent of gameplay state and its random sequence.
export function createStoneDetail(THREE){
  const size=128,height=new Uint8Array(size*size*4),roughness=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const index=(y*size+x)*4;
    const grain=((Math.imul(x+17,374761393)^Math.imul(y+31,668265263))>>>0)%29;
    const vein=Math.abs(Math.sin(x*.075+Math.sin(y*.055)*1.4));
    const crack=vein<.035?30:0;
    const relief=Math.round(139+Math.sin(x*.17+y*.11)*9+grain-crack);
    // Low-frequency irregular patches avoid bright periodic ribbons on the wet deck.
    const patch=(Math.sin(x*.043+Math.sin(y*.071)*1.7)+Math.cos(y*.037+Math.sin(x*.063)))*.25+.5;
    const wet=Math.round(186+patch*43+grain*.22);
    height.set([relief,relief,relief,255],index);
    roughness.set([wet,wet,wet,255],index);
  }
  const texture=data=>{const map=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.magFilter=THREE.LinearFilter;map.minFilter=THREE.LinearMipmapLinearFilter;map.generateMipmaps=true;map.repeat.set(2,2);map.needsUpdate=true;return map;};
  return {bump:texture(height),roughness:texture(roughness)};
}
