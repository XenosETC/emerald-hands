(() => {
  'use strict';
  // Fixed capacity and recycled slots keep pickup effects inexpensive on phones.
  const pool=Array.from({length:96},()=>({life:0}));
  const pulses=Array.from({length:8},()=>({life:0}));let pulseCursor=0;
  const powerPulses=Array.from({length:4},()=>({life:0}));let powerCursor=0;
  let cursor=0,sequence=0,label='',labelTime=0,counts={};
  const palettes={jade:'#baffb3',chain:'#f0d888',clear:'#d1ffe3',shield:'#ffe7a0',magnet:'#9cffe3'};
  function reset(){pool.forEach(p=>p.life=0);pulses.forEach(p=>p.life=0);powerPulses.forEach(p=>p.life=0);powerCursor=pulseCursor=0;cursor=sequence=0;label='';labelTime=0;counts={};}
  function emit(type,event={}){
    counts[type]=(counts[type]||0)+1;
    if(type==='jade'){const pulse=pulses[pulseCursor++%pulses.length];Object.assign(pulse,{life:.28,max:.28,lane:event.lane??1,z:event.z??7,color:event.realm==='corrupt'?'#d291ff':'#8fe8ae'});}
    const powerKind=type==='magnet'?'magnet':type==='shield'?'shield-save':type==='chain'&&event.label==='CROWN PROTECTED'?'shield-activation':null;
    if(powerKind){const pulse=powerPulses[powerCursor++%powerPulses.length];Object.assign(pulse,{life:.45,max:.45,lane:event.lane??1,z:event.z??7,kind:powerKind,color:powerKind==='magnet'?'#76e8bc':powerKind==='shield-save'?'#efb369':'#e8d48d'});}
    const count=type==='shield'?28:type==='chain'?18:type==='clear'?10:7;
    for(let i=0;i<count;i++){
      const p=pool[cursor++%pool.length],angle=(sequence++*2.39996323)%(Math.PI*2),speed=type==='shield'?.16:.07;
      Object.assign(p,{life:type==='shield'?.65:.5,max:type==='shield'?.65:.5,lane:event.lane??1,z:event.z??7,x:0,y:0,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-.045,color:event.realm==='corrupt'?'#d291ff':palettes[type]||palettes.jade,size:type==='shield'?4:2.5});
    }
    if(event.label){label=event.label;labelTime=1.2;}
  }
  function update(dt){labelTime=Math.max(0,labelTime-dt);for(const pulse of pulses)pulse.life=Math.max(0,pulse.life-dt);for(const pulse of powerPulses)pulse.life=Math.max(0,pulse.life-dt);for(const p of pool)if(p.life>0){p.life=Math.max(0,p.life-dt);p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=dt*.08;}}
  function jadePosition(point,object,state){
    if(!(state.magnet>0&&object.z<45))return point;
    const target=state.project(state.lane,3),t=Math.max(0,Math.min(1,(45-object.z)/38));
    return {x:point.x+(target.x-point.x)*t,y:point.y+(target.y-32-point.y)*t,s:point.s};
  }
  function draw(ctx,w,h,project,state){
    ctx.save();const hero=project(state.lane,3);
    if(state.magnet>0){
      ctx.strokeStyle='#98ffdc';ctx.lineWidth=1.5;
      for(const o of state.objects)if(!o.hit&&o.type==='jade'&&o.z<45&&o.z>7){const p=jadePosition(project(o.lane,o.z),o,state);ctx.globalAlpha=.35;ctx.beginPath();ctx.moveTo(p.x,p.y-20*p.s);ctx.quadraticCurveTo(hero.x,h*.73,hero.x,h*.87);ctx.stroke();}
    }
    if(state.shield&&!window.templeAuras?.loaded){ctx.globalAlpha=.55;ctx.strokeStyle='#ffe7a0';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(hero.x,h*.85,Math.min(w*.12,100),h*.11,0,0,Math.PI*2);ctx.stroke();}
    for(const p of pool)if(p.life>0){const anchor=project(p.lane,p.z);ctx.globalAlpha=p.life/p.max;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(anchor.x+p.x*w,anchor.y-24+p.y*h,p.size*(.5+p.life/p.max),0,Math.PI*2);ctx.fill();}
    for(const pulse of pulses)if(pulse.life>0){const anchor=project(pulse.lane,pulse.z),progress=1-pulse.life/pulse.max;ctx.globalAlpha=Math.sin(Math.PI*progress)*.48;ctx.strokeStyle=pulse.color||'#8fe8ae';ctx.lineWidth=1.4*(1-progress*.6);ctx.beginPath();ctx.arc(anchor.x,anchor.y-24,5+18*(1-Math.pow(1-progress,2)),0,Math.PI*2);ctx.stroke();}
    for(const pulse of powerPulses)if(pulse.life>0){const anchor=project(pulse.lane,pulse.z),progress=1-pulse.life/pulse.max;ctx.globalAlpha=Math.sin(Math.PI*progress)*.5;ctx.strokeStyle=pulse.color;ctx.lineWidth=2*(1-progress*.6);ctx.beginPath();ctx.arc(anchor.x,anchor.y-24,12+24*progress,0,pulse.kind==='shield-save'?Math.PI*1.6:Math.PI*2);ctx.stroke();}
    if(labelTime>0){ctx.globalAlpha=Math.min(1,labelTime*3);ctx.textAlign='center';ctx.font=`700 ${Math.max(13,Math.min(19,w*.032))}px sans-serif`;ctx.lineWidth=4;ctx.strokeStyle='#06271f';ctx.fillStyle='#e1ffce';const labelY=h*(window.templeTrack?.loaded?.57:.68);ctx.strokeText(label,w/2,labelY);ctx.fillText(label,w/2,labelY);}
    ctx.restore();
  }
  window.TempleFeedback={reset,emit,update,jadePosition,draw,diagnostics:()=>({active:pool.filter(p=>p.life>0).length,capacity:pool.length,pickupPulses:pulses.filter(p=>p.life>0).length,pulseCapacity:pulses.length,pulseLife:pulses.map(p=>p.life),powerPulses:powerPulses.filter(p=>p.life>0).map(p=>({kind:p.kind,life:p.life,color:p.color})),powerCapacity:powerPulses.length,label,labelTime,events:{...counts}})};
})();
