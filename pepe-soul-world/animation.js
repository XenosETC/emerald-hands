import {drawRift,drawRiftSlash,RIFT} from './kek-rift.js';
import {riftPose,riftFrames} from './rift-motion.js';
import {CLIPS,clipFrame,drawSprite,heroFrame,Renderer} from './render.js';
import {domainFrames,domainPose} from './domain-motion.js';
const canvas=document.getElementById('review'),ctx=canvas.getContext('2d'),art={};
for(const key of ['crown-guard-v1','crown-rift-planted-v1','kek-rift-eruptions-v1','crown-warp','crown-atlas','crown-run','crown-attack','crown-domain-official-v1','crown-domain-between-v1','crown-domain-rise-v1']){const im=new Image();im.src=`assets/${key}.png`;await im.decode();art[key]=im;}
const clips={...CLIPS,domain:{frames:72,fps:30},rift:{frames:66,fps:60}},renderer=new Renderer(canvas,art),floor=468;
let clip='idle',frame=0,playing=true,face=1,onion=false,speed=1,last=0,elapsed=0;
const range=document.getElementById('frame'),label=document.getElementById('frame-label');
for(const name of Object.keys(clips)){const b=document.createElement('button');b.textContent=name==='riftPlant'?'Rift impact poses':name==='rift'?'Kek Rift':name==='domain'?'Kek Domain':name[0].toUpperCase()+name.slice(1);b.dataset.clip=name;b.classList.toggle('active',name===clip);b.onclick=()=>{clip=name;frame=0;elapsed=0;range.max=clips[clip].frames-1;for(const button of document.querySelectorAll('[data-clip]'))button.classList.toggle('active',button.dataset.clip===clip);};document.getElementById('clips').append(b);}
document.getElementById('play').onclick=()=>{playing=!playing;document.getElementById('play').textContent=playing?'Pause':'Play';};document.getElementById('flip').onclick=()=>{face*=-1;document.getElementById('flip').textContent=face===1?'Face left':'Face right';};document.getElementById('onion').onclick=()=>{onion=!onion;document.getElementById('onion').setAttribute('aria-pressed',String(onion));};range.oninput=()=>{frame=Number(range.value);elapsed=0;playing=false;document.getElementById('play').textContent='Play';};document.getElementById('speed').oninput=e=>{speed=Number(e.target.value);document.getElementById('speed-label').textContent=`${speed}×`;};
function paint(index,alpha=1){
 ctx.save();ctx.globalAlpha=alpha;ctx.translate(clip==='rift'?(face===1?240:720):480,floor);const size=clip==='rift'?240:clip==='guard'?290:410;ctx.scale(size/230,size/230);
 if(clip==='rift'){const time=index/clips.rift.fps,pose=riftPose(time,face),f=heroFrame({rift:{elapsed:time}},0),fall=Math.max(0,Math.min(1,(time-RIFT.windup)/RIFT.slam));if(time>=.32)drawRift(ctx,{x:0,face,elapsed:time-.32},0,false,art['kek-rift-eruptions-v1']);drawRiftSlash(ctx,{x:0,y:-100*(1-fall*fall),face,rift:{elapsed:time}});ctx.translate(0,-100*(1-fall*fall));ctx.transform(pose.scaleX,0,pose.lean,pose.scaleY,0,0);const transition=riftFrames(time),previous=clipFrame(transition.previous.clip,transition.previous.index);if(transition.blend<1)renderer.blendPoses(ctx,previous,f,0,0,face,transition.blend);else drawSprite(ctx,art[f.sheet],f.row,f.col,f.cols,f.rows,0,0,f.size,face,alpha);}
 else if(clip==='domain'){
  const time=index/clips.domain.fps,pose=domainPose(time,face),f=heroFrame({domain:{elapsed:time}},0),transition=domainFrames(time);
  ctx.transform(pose.scaleX,0,pose.lean,pose.scaleY,0,0);
  if(transition.blend<1){const previous=heroFrame({domain:{elapsed:Math.max(0,transition.start-.001)}},0);renderer.blendPoses(ctx,previous,f,0,0,face,transition.blend);}
  else drawSprite(ctx,art[f.sheet],f.row,f.col,f.cols,f.rows,0,0,f.size,face,alpha);
 }else{const f=clipFrame(clip,index);drawSprite(ctx,art[f.sheet],f.row,f.col,f.cols,f.rows,0,0,f.size,face,alpha);}
 ctx.restore();
}
function animate(now){const dt=Math.min(.1,(now-last)/1000||0);last=now;const c=clips[clip];if(playing){elapsed+=dt*speed;const advances=Math.floor(elapsed*c.fps);if(advances){frame=(frame+advances)%c.frames;elapsed-=advances/c.fps;}}ctx.clearRect(0,0,960,540);ctx.strokeStyle='#718785';ctx.beginPath();ctx.moveTo(50,floor);ctx.lineTo(910,floor);ctx.stroke();if(onion)paint((frame+c.frames-1)%c.frames,.17);paint(frame);const time=frame/c.fps;ctx.fillStyle='#c0d5d0';ctx.font='13px system-ui';ctx.fillText(`${clip==='domain'?'KEK DOMAIN':clip==='rift'?'KEK RIFT':clip.toUpperCase()} · ${c.fps} FPS · FRAME ${frame+1}${clip==='domain'?' · '+time.toFixed(2)+'s · '+domainPose(time).phase.toUpperCase():''}`,30,35);canvas.setAttribute('aria-label',`Crown Pepe ${clip} preview, frame ${frame+1} of ${c.frames}, facing ${face===1?'right':'left'}`);range.value=frame;label.textContent=`${frame+1} / ${c.frames}`;requestAnimationFrame(animate);}requestAnimationFrame(animate);
