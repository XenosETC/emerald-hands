// Shared four-sided pagoda profile: falling roof pitch ends in visibly lifted eaves.
export function createTempleRoof(THREE){
  const profile=[[.015,.52],[.22,.28],[.5,.02],[.76,-.24],[1,-.34],[1.12,-.24]],vertices=[],uvs=[],indices=[];
  for(let row=0;row<profile.length;row++){const [radius,y]=profile[row];for(let corner=0;corner<5;corner++){const angle=corner*Math.PI/2;vertices.push(Math.cos(angle)*radius,y,Math.sin(angle)*radius);uvs.push(corner/4,row/(profile.length-1));}}
  for(let row=0;row<profile.length-1;row++)for(let face=0;face<4;face++){const a=row*5+face,b=a+1,c=a+5,d=c+1;indices.push(a,b,c,b,d,c);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.userData.profile=profile.map(p=>[...p]);geometry.userData.architecture='upturned-four-sided-pagoda';return geometry;
}
