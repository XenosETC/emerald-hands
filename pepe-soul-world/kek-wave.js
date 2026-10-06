// Presentation only: a travelling sword crescent with a tapered wake.
export function waveFrames(p,reduced=false){
 if(p.waveCooldown<=.84||p.waveCooldown>1.2||p.mode!=='idle'||p.attack>0||p.dash>0||p.hurt>0||p.rift||p.domain||p.warp)return null;
 const age=1.2-p.waveCooldown,starts=[0,.12,.22,.32],index=starts.filter(t=>t<=age).length-1;
 const poses=[2,3,5,null],current=poses[index],previous=index===0?null:poses[index-1],t=Math.min(1,(age-starts[index])/.035);
 return {current,previous,blend:reduced?1:t*t*(3-2*t)};
}
export function drawWaveImpact(ctx,f,reduced=false){
 const age=1-f.life/f.max;ctx.save();ctx.translate(f.x,f.y);ctx.scale(f.face||1,1);ctx.globalAlpha*=1-age;
 ctx.strokeStyle='#d5ffec';ctx.lineWidth=3*(1-age)+1;ctx.shadowColor='#58ffb2';ctx.shadowBlur=reduced?0:12;
 ctx.beginPath();ctx.ellipse(0,0,8+age*32,24+age*50,-.25,-1.5,1.5);ctx.stroke();
 ctx.shadowBlur=0;ctx.strokeStyle='#64ffc0';ctx.lineWidth=1.5;
 for(let i=0;i<(reduced?3:7);i++){const a=(i-3)*.35,x=Math.cos(a)*(12+age*25),y=Math.sin(a)*(12+age*25);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*(12+age*40),y+Math.sin(a)*(12+age*40));ctx.stroke();}ctx.restore();
}
export function drawWaveLaunch(ctx,f,reduced=false){
 const age=1-f.life/f.max;ctx.save();ctx.translate(f.x,f.y);ctx.scale(f.face||1,1);ctx.globalAlpha*=1-age;
 ctx.strokeStyle='#baffdf';ctx.lineWidth=2;ctx.shadowColor='#45ffb4';ctx.shadowBlur=reduced?0:8;
 ctx.beginPath();ctx.ellipse(-12,0,12+age*18,30+age*24,0,-1.25,1.25);ctx.stroke();ctx.restore();
}
export function drawKekWave(ctx,q,reduced=false){
 const age=q.age||0,fade=Math.min(1,(q.life||0)/.16),birth=Math.min(1,.45+age*9);
 ctx.save();ctx.translate(q.x,q.y);ctx.scale(Math.sign(q.vx)||1,1);ctx.globalAlpha*=fade*birth;
 // The wake grows from the sword rather than appearing fully stretched at launch.
 ctx.save();ctx.scale(Math.min(1,.18+age*5),1);
 const wake=ctx.createLinearGradient(-190,0,26,0);wake.addColorStop(0,'#16be8300');wake.addColorStop(.7,'#26eaa84a');wake.addColorStop(1,'#bcffe6b0');ctx.fillStyle=wake;
 ctx.beginPath();ctx.moveTo(-190,-3);ctx.bezierCurveTo(-70,-8,-32,-51,12,-61);ctx.quadraticCurveTo(-7,0,12,61);ctx.bezierCurveTo(-32,51,-70,8,-190,3);ctx.closePath();ctx.fill();ctx.restore();
 // A filled asymmetric blade gives the leading edge a readable silhouette.
 ctx.shadowColor='#45ffb4';ctx.shadowBlur=reduced?0:18;ctx.fillStyle='#35eaa9';ctx.beginPath();ctx.moveTo(-18,-66);ctx.bezierCurveTo(60,-43,60,43,-18,66);ctx.bezierCurveTo(14,34,14,-34,-18,-66);ctx.closePath();ctx.fill();
 ctx.shadowBlur=0;ctx.strokeStyle='#e5fff2';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-18,-66);ctx.bezierCurveTo(60,-43,60,43,-18,66);ctx.stroke();
 ctx.strokeStyle='#94ffd7';ctx.lineWidth=1;for(let i=0;i<(reduced?2:5);i++){const phase=(age*3+i*.21)%1,x=-35-phase*140,y=Math.sin(i*2.4)*22;ctx.globalAlpha=fade*(1-phase)*.65;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+18+phase*20,y-2);ctx.stroke();}ctx.restore();
}
