// Actual simulation and renderer, exported at real-time 50fps on an empty map.
import {createRequire} from 'node:module';
import {join,resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';
import {createState,act,step,WORLDS} from '../core.js';
import {Renderer} from '../render.js';
const require=createRequire(import.meta.url),mods=process.argv[2],{createCanvas,loadImage}=require(join(mods,'@napi-rs/canvas')),sharp=require(join(mods,'sharp')),root=resolve(import.meta.dirname,'..'),art={};
for(const key of ['crown-warp','item-atlas','crown-atlas','crown-run','crown-attack','enemy-atlas','mentor','effigy',...WORLDS.map(w=>w.art)]){art[key]=await loadImage(join(root,'assets',key+'.'+(WORLDS.some(w=>w.art===key)?'webp':'png')));art[key].assetKey=key;}
const canvas=createCanvas(960,540),r=new Renderer(canvas,art),s=createState();s.world='frozen';s.enemies=[];s.player.x=400;const frames=[];
for(let i=0;i<75;i++){
 if(i===15)act(s,'dash');step(s,{},.02);for(const event of s.events)r.effect(event,s);s.events.length=0;r.update(.02,s);r.draw(s,{emptyMap:true});
 const ctx=canvas.getContext('2d');ctx.fillStyle='#08151dc0';ctx.fillRect(18,18,195,34);ctx.fillStyle='#b9efd1';ctx.font='14px sans-serif';ctx.fillText('WARP STEP · FULL SPEED',30,40);
 if(i===20)await writeFile(join(root,'docs/warp-color-2026-10-17/warp-frame.png'),canvas.toBuffer('image/png'));
 frames.push(Buffer.from(ctx.getImageData(0,0,960,540).data));
}
await sharp(Buffer.concat(frames),{raw:{width:960,height:540*frames.length,channels:4,pageHeight:540}}).gif({loop:0,delay:frames.map(()=>20)}).toFile(join(root,'docs/warp-color-2026-10-17/warp-full-speed.gif'));
const metadata=await sharp(join(root,'docs/warp-color-2026-10-17/warp-full-speed.gif'),{animated:true}).metadata();
if(metadata.pages!==75||metadata.delay.some(ms=>ms!==20))throw new Error('Export timing mismatch');
console.log(JSON.stringify({frames:75,frameDelayMs:20,durationMs:1500,warpDurationMs:340,emptyMap:true}));
