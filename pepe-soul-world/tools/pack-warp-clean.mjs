// Finish the generated edge-cleanup candidate without moving any atlas cells.
import {createRequire} from 'node:module';
import {join,resolve} from 'node:path';
const require=createRequire(import.meta.url),sharp=require(join(process.argv[2],'sharp'));
const root=resolve(import.meta.dirname,'..');
const {data,info}=await sharp(join(root,'assets/crown-warp-clean-source-v1.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const {width:w,height:h}=info,out=Buffer.from(data);
// Colored matte contamination remains confined to the cutout boundary.
// Remove it and contract the noisy mask by one source pixel (0.4 game pixels).
for(let y=0;y<h;y++)for(let x=0;x<w;x++){
 const i=(y*w+x)*4;let alpha=data[i+3],edge=false;
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
  const nx=x+dx,ny=y+dy,a=nx<0||ny<0||nx>=w||ny>=h?0:data[(ny*w+nx)*4+3];
  alpha=Math.min(alpha,a);if(a<128)edge=true;
 }
 const [r,g,b]=data.subarray(i,i+3);
 if(edge&&Math.max(r,b)>g*1.25&&Math.abs(r-b)<130)alpha=0;
 out[i+3]=alpha;if(!alpha)out.fill(0,i,i+4);
}
await sharp(out,{raw:{width:w,height:h,channels:4}}).png().toFile(join(root,'assets/crown-warp.png'));
console.log('Warp atlas packed with a clean one-pixel inset alpha boundary; cell layout preserved.');
