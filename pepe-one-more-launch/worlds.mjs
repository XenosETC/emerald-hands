import {realms,realmAt,realmTrack,panelAt,validateRealms} from './realms.mjs';
import {clamp} from './presentation.mjs';
export const worlds=realms;
export const worldAt=realmAt;
export function worldBlend(alt){const current=worldAt(alt),i=worlds.indexOf(current);return {current,previous:worlds[Math.max(0,i-1)],blend:i===0?1:Math.min(1,(alt-current.at)/220)};}

export function createWorldRenderer(){
  validateRealms();
  const images=new Map(),pending=new Map(),surfaces=[];
  function load(path){
    if(!pending.has(path))pending.set(path,(async()=>{const img=new Image();img.src=path;try{await img.decode();images.set(path,img);return true;}catch{return false;}})());
    return pending.get(path);
  }
  const ready=Promise.all(worlds.map(async realm=>{
    const results=await Promise.all(realm.panels.map(load));
    if(!results.every(Boolean))await load(realm.fallback);
    return {world:realm.id,loaded:results.every(Boolean)};
  }));

  function drawPanel(ctx,W,H,height,index,camera,base,time,cameraX,slot){
    const descriptor=panelAt(index);if(!descriptor)return;
    const y=base+(camera-index-1)*height,bottom=y+height;
    if(y>H+1||bottom<0)return;
    const img=images.get(descriptor.asset)||images.get(descriptor.realm.fallback);
    if(!img)return;
    let surface=surfaces[slot];
    if(!surface){surface=document.createElement('canvas');surfaces[slot]=surface;}
    if(surface.width!==Math.ceil(W)||surface.height!==Math.ceil(H)){surface.width=Math.ceil(W);surface.height=Math.ceil(H);}
    const c=surface.getContext('2d');c.clearRect(0,0,W,H);c.imageSmoothingEnabled=false;c.globalCompositeOperation='source-over';
    const scale=height/img.height,iw=img.width*scale;
    const pan=clamp(-cameraX*.035+Math.sin(time*.035+index)*4,-Math.max(0,(iw-W)/2),Math.max(0,(iw-W)/2));
    c.save();if(descriptor.sequence%2){c.translate(W,0);c.scale(-1,1);}c.drawImage(img,(W-iw)/2+pan,y,iw,height);c.restore();
    const fade=80;
    if(y>-fade||bottom<H+fade){
      const mask=c.createLinearGradient(0,0,0,H),points=[0,H,y,y+fade,bottom-fade,bottom].filter(v=>v>=0&&v<=H).sort((a,b)=>a-b);
      for(const point of [...new Set(points)]){const alpha=clamp(Math.min((point-y)/fade,(bottom-point)/fade));mask.addColorStop(point/H,`rgba(0,0,0,${alpha})`);}
      c.globalCompositeOperation='destination-in';c.fillStyle=mask;c.fillRect(0,0,W,H);c.globalCompositeOperation='source-over';
    }
    ctx.drawImage(surface,0,0);
  }

  function draw(ctx,W,H,alt,time,velocity,ignition,options={}){
    const track=realmTrack(alt),current=track.realm,position=track.position;
    // Keep a real tall panel's aspect ratio. Only two viewport-sized compositing
    // buffers are retained; adding more realms does not allocate a giant world canvas.
    const panelHeight=Math.max(W*3,H*1.8),base=H*.82+panelHeight*.05;
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,current.sky[0]);sky.addColorStop(1,current.sky[1]);ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    let slot=0;
    for(let index=Math.max(0,Math.floor(position)-1);index<=Math.floor(position)+1;index++){
      const y=base+(position-index-1)*panelHeight;
      if(y<=H&&y+panelHeight>=0)drawPanel(ctx,W,H,panelHeight,index,position,base,time,options.cameraX||0,slot++);
    }
    if(position<1){
      const shift=position*panelHeight;
      ctx.save();ctx.globalAlpha=clamp(1-position);
      for(let i=0;i<30;i++){const x=(i*173.9+Math.sin(time*.4+i)*20)%W,y=(i*91.7+time*(2+i%3)+shift*.23)%H;ctx.fillStyle=i%3?'#fff1b8aa':'#b9f6ab88';ctx.fillRect(x,y,2,2);}
      if(shift<H*.4)for(let i=0;i<6;i++){const r=(time*(ignition?90:12)+i*31)%220;ctx.strokeStyle=`rgba(204,255,210,${(1-r/220)*(ignition?.3:.08)})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(W*.5,H*.82+shift,r,r*.11,0,0,Math.PI*2);ctx.stroke();}
      if(shift<H*.3)for(const side of [-1,1])for(let i=0;i<8;i++){const x=side<0?i*17:W-i*17,y=H*.93+shift,lean=Math.sin(time*2+i)*3+(ignition?side*26:0);ctx.strokeStyle=i%2?'#6c9d55':'#326648';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y+30);ctx.quadraticCurveTo(x+lean*.4,y-30,x+lean,y-65-i%3*12);ctx.stroke();}
      if(ignition)for(let i=0;i<5;i++){const x=W*.15+i*W*.15+Math.sin(time+i)*22,y=H*.48-Math.sin(time*2+i)*24;ctx.strokeStyle='#e5e3bd';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-6,y);ctx.lineTo(x,y+Math.sin(time*17+i)*5);ctx.lineTo(x+6,y);ctx.stroke();}
      ctx.restore();
    }
    if(position>.6&&position<2){
      ctx.save();ctx.globalAlpha=.07;
      for(let i=0;i<6;i++){const x=(i*237+time*(8+i))%(W+240)-120,y=(i*161+position*panelHeight*.17)%(H+140)-70;ctx.fillStyle='#ffe8c6';ctx.fillRect(x-45,y,115,12);ctx.fillRect(x-22,y-13,72,16);ctx.fillRect(x+12,y-23,28,15);}ctx.restore();
    }
    if(position>1.65){
      ctx.save();ctx.globalAlpha=clamp((position-1.65)*.8);ctx.globalCompositeOperation='screen';
      for(let i=0;i<90;i++){const x=(i*173.1)%W,y=(i*91.3+position*panelHeight*(.12+i%3*.09))%H;ctx.strokeStyle=position>4?'#c8edff77':position>2.8?'#edbfff77':'#9effd177';ctx.lineWidth=i%5===0?2:1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+2+Math.min(Math.abs(velocity)*.035,19));ctx.stroke();}
      if(position>2.8){ctx.translate(W*.5,H*.37);for(let i=0;i<3;i++){ctx.save();ctx.rotate(time*(.045+i*.02)+position*.08);ctx.strokeStyle=['#edbfff22','#ffcc8122','#9df7ff22'][i];ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,0,130+i*53,50+i*20,i,0,Math.PI*2);ctx.stroke();ctx.restore();}}ctx.restore();
    }
    return current;
  }

  function foreground(ctx,W,H,alt,time){
    const position=realmTrack(alt).position;if(position<1.6)return;
    ctx.save();ctx.globalAlpha=clamp((position-1.6)*.35,0,.42);
    for(let i=0;i<9;i++){const side=i%2?1:-1,x=side>0?W-20-(i%3)*32:20+(i%3)*32,y=(i*191+position*H*1.1)%(H+140)-70,size=9+i%3*8;ctx.save();ctx.translate(x,y);ctx.rotate(time*.05+i+position*.09);ctx.fillStyle=position>4?'#63879e':position>2.7?'#9e70ad':'#397c69';ctx.beginPath();ctx.moveTo(0,-size);ctx.lineTo(size*.65,0);ctx.lineTo(0,size);ctx.lineTo(-size*.65,0);ctx.closePath();ctx.fill();ctx.strokeStyle=position>4?'#cdf0f5':position>2.7?'#e1b1d4':'#94d6ad';ctx.lineWidth=1;ctx.stroke();ctx.restore();}ctx.restore();
  }
  return {draw,foreground,ready};
}
