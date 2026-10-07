// Pack generated Crown guard art without repainting the source pixels.
import {createRequire} from 'node:module';
import {join,resolve} from 'node:path';
import {copyFile,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url),sharp=require(join(process.argv[2],'sharp'));
const root=resolve(import.meta.dirname,'..'),source=process.argv[3],scale=.66;
await copyFile(source,join(root,'assets/crown-guard-source-v1.png'));
const {data,info}=await sharp(source).raw().toBuffer({resolveWithObject:true}),w=info.width,h=info.height;
if(info.channels!==4)throw Error('Guard source must preserve alpha');
const seen=new Uint8Array(w*h),queue=new Int32Array(w*h),sprites=[];
for(let n=0;n<seen.length;n++){
 if(seen[n]||data[n*4+3]<2)continue;
 seen[n]=1;queue[0]=n;let length=1,minX=w,minY=h,maxX=0,maxY=0;
 for(let i=0;i<length;i++){
  const p=queue[i],x=p%w,y=Math.floor(p/w);minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
  for(const k of [x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1])if(k>=0&&!seen[k]&&data[k*4+3]>=2){seen[k]=1;queue[length++]=k;}
 }
 if(length<100)continue;
 const width=maxX-minX+1,height=maxY-minY+1,pixels=Buffer.alloc(width*height*4);
 for(let i=0;i<length;i++){const p=queue[i],to=((Math.floor(p/w)-minY)*width+p%w-minX)*4;data.copy(pixels,to,p*4,p*4+4);}
 sprites.push({pixels,width,height,minX,minY,maxX,maxY});
}
if(sprites.length!==4)throw Error('Expected four separated sprites: '+JSON.stringify(sprites.map(({pixels,...b})=>b)));
// A rising sword may cross the implied source row; order by the soles instead.
sprites.sort((a,b)=>Number(a.maxY>h*.7)-Number(b.maxY>h*.7)||a.minX-b.minX);
const roots=[324,320,350,320],parts=[],anchors=[],bounds=[];
for(let i=0;i<4;i++){
 const s=sprites[i],width=Math.round(s.width*scale),height=Math.round(s.height*scale),left=Math.floor((512-width)/2),top=504-height;
 if(left<8||top<8)throw Error('Guard sprite lacks a safe gutter');
 const frame=await sharp(s.pixels,{raw:{width:s.width,height:s.height,channels:4}}).resize(width,height).png().toBuffer();
 const pixels=await sharp(frame).raw().toBuffer();let sole=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>=128)sole=y;
 parts.push({input:frame,left:(i%2)*512+left,top:Math.floor(i/2)*512+top});
 anchors.push({x:(left+(roots[i]+(i%2)*(w/2)-s.minX)*scale)/512,y:(top+sole+1)/512});
 bounds.push({source:[s.minX,s.minY,s.maxX,s.maxY],packed:[left,top,width,height]});
}
const output=join(root,'assets/crown-guard-v1.png');
await sharp({create:{width:1024,height:1024,channels:4,background:'#00000000'}}).composite(parts).png().toFile(output);
await sharp(output).flatten({background:'#dfe5df'}).png().toFile(join(root,'docs/crown-guard-contact.png'));
await writeFile(join(root,'guard-layout.js'),'// Official Crown guard: measured body roots and visible sole anchors.\nexport const GUARD_ANCHORS='+JSON.stringify(anchors)+';\n');
await writeFile(join(root,'docs/guard-packing.json'),JSON.stringify({scale,roots,bounds,anchors},null,2));
console.log(JSON.stringify({bounds,anchors}));
