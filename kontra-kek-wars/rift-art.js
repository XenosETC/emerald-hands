/* Jade Rift scenery and ordinary combat. Proposed Rift realm events remain unimplemented. */
window.KekRift=(()=>{
  const box=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);};
  function vine(g,points,c,w){g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();}
  function crystal(g,x,y,size,t){
    g.save();g.translate(x,y);g.fillStyle='#2c766f';g.beginPath();g.moveTo(-size*.5,0);g.lineTo(0,-size);g.lineTo(size*.5,-size*.3);g.lineTo(size*.3,0);g.fill();
    g.fillStyle='#b4eed2';g.beginPath();g.moveTo(0,-size);g.lineTo(size*.17,-size*.3);g.lineTo(0,-size*.12);g.fill();
    g.globalAlpha=.25+Math.sin(t)*.1;box(g,-size*.2,-size*.5,size*.4,2,'#e3ffda');g.restore();
  }
  function background(g,s){
    const sky=g.createLinearGradient(0,0,0,480);sky.addColorStop(0,'#241a3c');sky.addColorStop(.55,'#42516b');sky.addColorStop(1,'#244c49');g.fillStyle=sky;g.fillRect(0,0,960,480);
    const moonX=740-s.camera*.025,halo=g.createRadialGradient(moonX,80,25,moonX,80,120);halo.addColorStop(0,'#c1dfc32b');halo.addColorStop(1,'#c1dfc300');g.fillStyle=halo;g.fillRect(moonX-120,-40,240,240);
    g.fillStyle='#c4e6c2';g.beginPath();g.arc(moonX,80,33,0,Math.PI*2);g.fill();
    for(let l=0;l<3;l++)for(let i=-1;i<8;i++){
      const x=i*180-s.camera*(.06+l*.06)%180,y=145+l*45+Math.sin(i*2+l)*30;
      g.fillStyle=['#3b405b','#334b5a','#285050'][l];g.beginPath();g.moveTo(x+10,y);g.lineTo(x+39,y-15);g.lineTo(x+82,y-10);g.lineTo(x+113,y-21);g.lineTo(x+150,y);g.lineTo(x+132,y+18);g.lineTo(x+115,y+20);g.lineTo(x+97,y+73);g.lineTo(x+74,y+31);g.lineTo(x+48,y+51);g.lineTo(x+35,y+15);g.closePath();g.fill();
      box(g,x+30,y-3,95,4,'#6c8e85');box(g,x+63,y+14,2,26,'#5a817d');
    }
    g.save();g.translate(-s.camera,0);
    for(let i=0;i<24;i++){
      const x=i*200;if(x<s.camera-200||x>s.camera+1100)continue;
      const sway=Math.sin(s.time*.9+i)*8;
      vine(g,[[x,398],[x+22,295],[x+10+sway,185],[x+40+sway,120]],'#193a43',22);
      vine(g,[[x+13,308],[x+64,235],[x+100+sway,208]],'#2a5b5b',10);
      for(let j=0;j<4;j++){g.fillStyle=j%2?'#477c70':'#385d68';g.beginPath();g.ellipse(x+20+sway+j*18,130+j*17,47,14,-.4,0,Math.PI*2);g.fill();}
      crystal(g,x+78,398,25+i%3*12,s.time+i);
      for(let j=0;j<3;j++){box(g,x+45+j*9,390-j%2*5,7,8,'#375e5c');box(g,x+45+j*9,389-j%2*5,7,2,'#86a690');}
      for(let j=0;j<3;j++){box(g,x+120+j*13,383,3,15,'#7f8b76');box(g,x+114+j*13,379+j%2*3,16,5,'#be9ac5');}
    }
    for(const x of [1840,3540]){box(g,x-12,348,27,50,'#3b5761');box(g,x-7,354,17,22,s.checkpoint>=x?'#c8f7ce':'#a791bd');crystal(g,x+2,342,23,s.time);}
    g.restore();
    box(g,0,398,960,82,'#203e41');box(g,0,398,960,6,'#86a989');box(g,0,404,960,7,'#3c6b59');
    for(let i=0;i<40;i++){const x=i*29-s.camera%29;box(g,x,414+i%3*12,18,3,'#4c6c64');box(g,x+5,401,3,8,'#b6d6a2');}
    for(let i=0;i<9;i++){const x=i*130-s.camera*.3%130;g.globalAlpha=.08;box(g,x,350+Math.sin(s.time*.5+i)*6,150,7,'#bdd5c2');}g.globalAlpha=1;
    for(let i=0;i<35;i++){const x=((i*73-s.camera*.3+s.time*6)%980+980)%980,y=180+i*37%190+Math.sin(s.time+i)*10;g.globalAlpha=.35;box(g,x,y,2,3,i%2?'#c4abd8':'#c1efc3');}g.globalAlpha=1;
  }
  function enemy(g,e,s){
    const x=e.x+15,y=e.y+18,windup=e.state==='windup',charge=windup?Math.max(0,1-e.cool/.5):0;
    g.save();g.translate((e.hitDirection||0)*(e.stagger||0)*25,0);
    if(windup){box(g,e.x-5,e.y-17,40,3,'#2a4252');box(g,e.x-5,e.y-17,40*charge,3,'#e9c59b');}
    if(e.type==='wisp'){
      if(windup&&e.lock){g.strokeStyle='#d8b9db';g.lineWidth=1;g.beginPath();g.arc(e.lock.x,e.lock.y,8,0,Math.PI*2);g.stroke();}
      for(let i=5;i>=0;i--){const tailX=x+Math.sin(s.time*4+i*.7)*8,tailY=y+12+i*5;g.globalAlpha=.12+(5-i)*.07;box(g,tailX-5,tailY,10-i,5,'#b1b8df');}g.globalAlpha=1;
      g.save();g.translate(x,y);g.rotate(Math.sin(s.time*3+e.x)*.1+(e.recoil||0)*.16);g.scale(1-charge*.18+(e.recoil||0)*.18,1+charge*.1);
      for(let i=0;i<3;i++){g.strokeStyle=i%2?'#82b7aa':'#b6abd0';g.lineWidth=2;g.beginPath();g.ellipse(0,-1,20-i*4,9+i*2,s.time*.7+i,0,Math.PI*2);g.stroke();}
      crystal(g,0,14,30,s.time*3);box(g,-8,-4,16,5,windup?'#ffd699':'#e6f5d9');box(g,-3,-4,4,5,'#435972');
      if(e.flash>0){box(g,-15,-8,2,15,'#f6e6bf');}g.restore();
    }else{
      const airborne=e.leap>0,progress=airborne?1-e.leap/.72:0,face=e.direction||Math.sign(s.player.x-e.x)||1;
      if(windup&&e.lock){const landing=e.x+Math.max(-130,Math.min(130,e.lock.x-e.x))+15;g.setLineDash([4,4]);g.strokeStyle='#bcaad2';g.beginPath();g.ellipse(landing,396,20,4,0,0,Math.PI*2);g.stroke();g.setLineDash([]);}
      if(airborne){g.globalAlpha=.18;box(g,x-face*26,y+8,18,3,'#a4c9aa');box(g,x-face*39,y+15,18,2,'#7aaba1');g.globalAlpha=1;}
      const crouch=charge*5+(e.land||0)*4;
      for(const side of [-1,1])for(let i=0;i<3;i++){
        const hip=x+side*(5+i*3),knee=x+side*(13+i*6),foot=x+side*(20+i*8);
        const tuck=airborne?Math.sin(progress*Math.PI)*9:0;
        vine(g,[[hip,y+4+crouch],[knee,y+10+crouch-tuck],[foot,y+20-tuck]],'#183c46',6);
        vine(g,[[hip,y+4+crouch],[knee,y+10+crouch-tuck],[foot,y+20-tuck]],'#91b69b',3);
      }
      g.save();g.translate(x,y+crouch);g.scale(face,1-(e.land||0)*.12);
      g.fillStyle='#163b43';g.beginPath();g.moveTo(-20,3);g.lineTo(-14,-14);g.lineTo(10,-17);g.lineTo(23,-3);g.lineTo(15,11);g.lineTo(-13,10);g.fill();
      g.fillStyle=e.flash>0?'#719a84':'#527e71';g.beginPath();g.moveTo(-16,1);g.lineTo(-11,-10);g.lineTo(8,-13);g.lineTo(19,-3);g.lineTo(11,6);g.lineTo(-10,6);g.fill();
      for(let i=0;i<3;i++)crystal(g,-10+i*9,-7,12+i%2*5,s.time);
      box(g,9,-5,13,4,windup?'#f2c79f':'#dceac1');box(g,18,-5,2,4,'#314c54');box(g,-14,2,16,2,'#adc7a6');g.restore();
    }
    g.restore();
  }
  function boss(g,s){
    const b=s.boss;if(b.hp<=0)return;const x=b.x+80,y=b.y+75+Math.sin(s.time*1.6)*2,open=b.bloomOpen??.55;
    for(let i=0;i<5;i++){
      const base=x+(i-2)*43,mid=x+(i-2)*31;
      vine(g,[[x+(i-2)*14,y+24],[mid+Math.sin(s.time*1.6+i)*7,y+66],[base,398]],'#193e45',12);
      vine(g,[[x+(i-2)*14,y+24],[mid+Math.sin(s.time*1.6+i)*7,y+66],[base,398]],i%2?'#628d76':'#426f68',7);
      crystal(g,base,398,15+(i%2)*7,s.time+i);
    }
    // Outer petals fold during preparation and open during the recovery window.
    for(let layer=0;layer<2;layer++)for(let i=0;i<8;i++){
      const a=i*Math.PI/4+layer*.22+Math.sin(s.time*.9)*.035,rad=(layer?29:39)+open*(layer?9:24);
      g.save();g.translate(x+Math.cos(a)*rad,y+Math.sin(a)*rad*.68);g.rotate(a);
      const length=(layer?26:34)+open*5,width=(layer?10:13)+open*4;
      g.fillStyle=layer?(i%2?'#8aa794':'#9b93b3'):(i%2?'#65788e':'#5c8d7d');g.strokeStyle='#24434c';g.lineWidth=2;
      g.beginPath();g.ellipse(0,0,length,width,0,0,Math.PI*2);g.fill();g.stroke();
      vine(g,[[-length*.7,0],[0,-2],[length*.75,0]],b.phase===2?'#c2afd7':'#9fbfa6',1.5);
      if(b.flash>0)box(g,length-10,-3,8,2,'#efe7bb');g.restore();
    }
    g.fillStyle='#173b45';g.beginPath();g.arc(x,y,33,0,Math.PI*2);g.fill();
    const glow=g.createRadialGradient(x,y,3,x,y,65);glow.addColorStop(0,b.exposed?'#daf3bc99':'#bba2db66');glow.addColorStop(1,'#b6f7cd00');g.fillStyle=glow;g.fillRect(x-65,y-65,130,130);
    crystal(g,x,y+26,49+open*10,s.time*3);box(g,x-14,y-1,28,5,b.flash?'#fff5cb':b.marked?'#e9c09d':'#e5edce');box(g,x-3,y-1,5,5,'#4d526a');
    for(let i=0;i<5;i++){const a=s.time*(b.phase===2?1.7:.7)+i*Math.PI*2/5;g.globalAlpha=.45;box(g,x+Math.cos(a)*(75+open*8),y+Math.sin(a)*42,3,3,b.phase===2?'#d5b7eb':'#bde4b9');}g.globalAlpha=1;
    if(b.exposed){g.fillStyle='#d8edc1';g.font='bold 10px monospace';g.fillText('CORE OPEN',x-28,y-49);}
  }
  function hazards(g,s){
    for(const h of s.hazards){const x=h.x-h.w/2;
      if(h.kind==='rootwave'){
        if(h.timer>0){
          g.setLineDash([9,7]);vine(g,[[KekEngine.mission(s).arena,391],[h.x,391]],'#c5abd8',2);g.setLineDash([]);
          const labelX=Math.max(s.camera+20,s.player.x-100);g.fillStyle='#e6d7eb';g.font='bold 11px monospace';g.fillText('ROOT WAVE / IN '+h.timer.toFixed(1)+'s',labelX,364);box(g,labelX,369,145*(1-h.timer/1.05),2,'#b9d4ac');
        }else{
          box(g,x,h.y,h.w,h.h,'#4b796c');for(let i=0;i<4;i++)crystal(g,x+8+i*17,h.y+h.h,21+i%2*5,s.time);
          for(let i=1;i<5;i++){g.globalAlpha=.22-i*.04;box(g,h.x+h.w/2+i*18,390,22,4,'#94b69b');}g.globalAlpha=1;
        }
      }else if(h.timer>0){
        g.strokeStyle='#d6b4e3';g.lineWidth=2;g.beginPath();g.ellipse(h.x,394,h.w/2,6,0,0,Math.PI*2);g.stroke();
        box(g,x,h.y,h.w,h.h,'#baa0d31a');box(g,x,h.y-6,h.w*Math.max(0,1-h.timer/1.4),3,'#c7a9dd');
        g.fillStyle='#ecdcf0';g.font='bold 10px monospace';g.fillText('SPORE LOCK '+h.timer.toFixed(1)+'s',x,h.y-13);
      }else{box(g,x,h.y,h.w,h.h,'#517f68');for(let i=0;i<h.w;i+=22)crystal(g,x+i,h.y+h.h,36,s.time);}
    }
  }
  return {background,enemy,boss,hazards};
})();
