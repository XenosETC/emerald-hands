/* Mission two's industrial art and animation share the simulation clock. */
window.KekFoundry=(()=>{
  const box=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);};
  function line(g,x1,y1,x2,y2,c,w=3){g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();}
  function fan(g,x,y,r,t){g.save();g.translate(x,y);g.rotate(t);for(let i=0;i<4;i++){g.rotate(Math.PI/2);box(g,3,-3,r,6,'#698c96');}g.restore();}
  function background(g,s){
    const sky=g.createLinearGradient(0,0,0,480);sky.addColorStop(0,'#101b32');sky.addColorStop(.6,'#31495a');sky.addColorStop(1,'#1a393e');g.fillStyle=sky;g.fillRect(0,0,960,480);
    for(let layer=0;layer<3;layer++)for(let i=-1;i<9;i++){
      const x=i*160-s.camera*(.06+layer*.08)%160,y=95+layer*57+(i%3)*19;
      box(g,x,y,110,305,['#233248','#263f50','#294a54'][layer]);box(g,x+12,y-35,20,35,'#273e50');
      for(let row=0;row<5;row++)for(let col=0;col<4;col++)box(g,x+12+col*23,y+18+row*30,9,5,(row+col+i)%3?'#52757d':'#a7b999');
      box(g,x-5,y-4,120,6,'#5d7475');
    }
    g.save();g.translate(-s.camera,0);
    for(let i=0;i<22;i++){
      const x=i*225;if(x<s.camera-250||x>s.camera+1100)continue;
      box(g,x,255,145,143,'#244149');box(g,x+4,258,137,8,'#66878a');
      box(g,x+15,276,42,56,'#152e3b');fan(g,x+36,304,16,s.time*4+i);
      box(g,x+73,275,57,48,'#193540');
      for(let j=0;j<4;j++)box(g,x+80,283+j*9,42,3,j===i%4?'#97e2dd':'#456f76');
      box(g,x+8,348,128,9,'#a38562');for(let j=0;j<8;j++)box(g,x+10+j*16,348,7,9,'#364b4b');
      box(g,x+158,155,13,243,'#263f49');box(g,x+160,155,3,243,'#79989a');
      box(g,x+154,152,24,8,'#9ca994');box(g,x+175,179,68,8,'#3a5960');
      for(let j=0;j<3;j++){g.globalAlpha=.08;g.fillStyle='#c8d7d4';g.beginPath();g.arc(x+163+Math.sin(s.time*2+i+j)*10,145-(s.time*27+j*25)%90,13+j*7,0,Math.PI*2);g.fill();g.globalAlpha=1;}
      if(i%3===1){box(g,x+30,85,5,150,'#6c8280');box(g,x+18,228,28,7,'#a4b7a3');line(g,x+32,235,x+32+Math.sin(s.time+i)*8,254,'#c29e6b',3);}
    }
    for(const x of [2040,3940]){
      const active=s.checkpoint>=x;
      box(g,x-11,347,25,51,'#233f4b');box(g,x-8,351,19,4,'#9fbab0');box(g,x-5,361,13,18,active?'#b1f3df':'#b89a6d');
      line(g,x+1,346,x+1,311,'#a1b8ae',3);line(g,x-10,310,x+12,310,'#a1b8ae',2);
      if(active){g.strokeStyle='#b4f6df';g.lineWidth=2;g.beginPath();g.arc(x+1,316,12+Math.sin(s.time*3)*3,Math.PI,Math.PI*2);g.stroke();}
    }
    g.restore();
    box(g,0,398,960,82,'#1b323a');box(g,0,398,960,5,'#b7c6ae');box(g,0,403,960,6,'#526a6a');
    for(let i=0;i<36;i++){const x=i*32-s.camera%32;box(g,x,413,22,4,'#47666a');box(g,x+7,429,19,2,'#82a6a6');box(g,x+3,447,25,2,'#526f73');}
    // Rain behind the fighters never covers warnings or the HUD.
    for(let i=0;i<75;i++){const x=((i*83-s.camera*.35-s.time*105)%1040+1040)%1040;const y=(i*47+s.time*410)%395;line(g,x,y,x-5,y+14,'#829fa944',1);}
  }
  function enemy(g,e,s){
    g.save();
    g.translate((e.hitDirection||0)*(e.stagger||0)*35,e.state==='windup'&&e.type==='rocketeer'?3:0);
    if(e.state==='windup'){
      const charge=Math.max(0,Math.min(1,1-e.cool/.5));
      box(g,e.x-4,e.y-15,40,3,'#23444b');box(g,e.x-4,e.y-15,40*charge,3,'#ffcb88');
    }
    if(e.type==='rocketeer'){
      KekArt.actor(g,e.x,e.y-6,e.x>s.player.x?-1:1,true,s.time*4,0,{...e,time:s.time,vx:0});
      const face=e.x>s.player.x?-1:1;g.save();g.translate(e.x+14,e.y+13);g.scale(face,1);
      g.translate(-(e.recoil||0)*5,0);box(g,-12,-8,20,23,'#263e4a');box(g,-9,-6,14,4,'#8ab5b8');box(g,3,-4,37,12,'#172e3c');box(g,7,-3,28,3,'#c2cfb1');box(g,29,0,10,4,e.cool<.5?'#f5ba71':'#718e94');if(e.recoil>.7){box(g,-27,-2,15,5,'#e9a56a');box(g,-34,0,10,2,'#fff1bf');}g.restore();
    }else if(e.type==='drone'){
      g.save();g.translate(e.x+20,e.y+13+(e.recoil||0)*3);g.rotate(Math.sin(s.time*4+e.x*.01)*.035+(e.recoil||0)*.08);
      const x=0,y=0;
      line(g,x-32,y-5,x+32,y-5,'#93b9b9',4);
      for(const side of [-1,1]){box(g,x+side*29-10,y-9,20,7,'#1a3443');line(g,x+side*29-16,y-13,x+side*29+16,y-13,'#98d7d0',2);fan(g,x+side*29,y-13,14,s.time*32);}
      box(g,x-22,y-10,44,25,'#142d3d');box(g,x-18,y-9,36,5,'#aac4bc');box(g,x-15,y-3,30,15,e.flash?'#fff0be':'#48747b');
      box(g,x-6,y+2,12,8,e.cool<.35?'#f5be77':'#99e6de');box(g,x-3,y+16,6,8,'#b5bbaa');
      g.restore();
    }else{
      const x=e.x+14,y=e.y+12+(e.state==='windup'?3:0),step=e.animStride||0;
      for(const side of [-1,1])for(let i=0;i<3;i++){
        const foot=x+side*(21+i*5),kneeY=y+7+Math.sin(step+i)*4;
        line(g,x+side*(6+i*3),y,foot,kneeY,'#13303d',6);line(g,foot,kneeY,foot+side*6,398,'#9ba88f',3);
      }
      box(g,x-20,y-9,40,18,'#18333e');box(g,x-16,y-10,32,5,'#a1b8aa');box(g,x-13,y-3,26,10,e.flash?'#fff0c4':'#5b8080');
      box(g,x-7,y-2,14,5,e.charge>0||e.cool<.4?'#ffbb74':'#a5dfd2');
      if(e.state==='charge'){const direction=e.direction||1;box(g,x-direction*24,y+7,13,2,'#88a99a');box(g,x-direction*32,y+12,11,2,'#547a72');}
    }
    g.restore();
  }
  function boss(g,s){
    const b=s.boss;if(b.hp<=0)return;g.save();g.translate(b.x,b.y);
    // Six articulated feet follow the Warden's actual side-to-side motion.
    for(const side of [-1,1])for(let i=0;i<3;i++){
      const hip=85+side*(30+i*12),knee=85+side*(72+i*13),lift=Math.max(0,Math.sin(s.time*4+i+side))*7;
      line(g,hip,95,knee,128-lift,'#142b3c',12);line(g,hip,95,knee,128-lift,'#71959b',7);
      line(g,knee,128-lift,knee+side*12,158-lift,'#a7bcad',5);box(g,knee-6+side*12,155-lift,24,6,'#233f49');
    }
    box(g,-6,12,182,98,'#142b3a');box(g,0,7,170,98,b.flash?'#6c9298':'#48717c');box(g,5,10,160,5,'#b0c7b9');
    for(const x of [8,128]){box(g,x,-10,34,35,'#243e4d');for(let j=0;j<3;j++)box(g,x+5+j*9,-5,5,18,b.cool<.8?'#edb97c':'#789a9e');}
    box(g,47,-20,76,18,'#1f3a49');box(g,53,-17,64,5,'#a7bdb0');
    const coreX=85,coreY=58,r=28;
    g.fillStyle=b.flash?'#fff6c6':'#193845';g.beginPath();g.arc(coreX,coreY,r+7,0,Math.PI*2);g.fill();
    const glow=g.createRadialGradient(coreX,coreY,3,coreX,coreY,68);glow.addColorStop(0,b.phase===2?'#ffb87aaa':'#a0fff0aa');glow.addColorStop(1,'#91ffec00');g.fillStyle=glow;g.fillRect(17,-10,136,136);
    for(let i=0;i<8;i++){const a=s.time*(b.phase===2?4:2)+i*Math.PI/4;g.save();g.translate(coreX,coreY);g.rotate(a);box(g,20,-4,9,8,b.phase===2?'#f4bd82':'#b7e6d6');g.restore();}
    box(g,74,41,22,34,b.flash?'#fff6cb':b.phase===2?'#f6b37b':'#b5f7e3');box(g,80,44,9,28,'#efffe0');
    if(b.exposed){for(const side of [-1,1])box(g,85+side*40,35,6,44,'#ddf8bb');}
    box(g,-47+(b.recoil||0)*6,53,97,18,'#1a3544');box(g,-44,54,88,4,'#a9c8c1');box(g,-50,55,9,14,b.cool<.8?'#bcfff0':'#648d96');
    for(let i=0;i<4;i++){box(g,119,38+i*13,38,5,'#152e3d');box(g,119,38+i*13,38,1,'#99b7ab');}
    g.fillStyle='#d5e6cd';g.font='bold 10px monospace';g.fillText('TEMPEST',50,99);
    g.restore();
  }
  function hazards(g,s){
    for(const h of s.hazards){if(h.kind==='surge')continue;
      const left=h.x-h.w/2;
      if(h.kind==='beam'){
        if(h.timer>0){g.setLineDash([10,8]);line(g,left,h.y+7,left+h.w,h.y+7,'#c5f7dc',2);g.setLineDash([]);box(g,left,h.y-5,h.w*(1-Math.min(1,h.timer/1.1)),2,'#d8e7b7');g.fillStyle='#d2f3d7';g.font='bold 11px monospace';g.fillText(h.high?'HIGH LINE / STAY LOW':h.timer<.28?'LOW LINE / JUMP NOW':'LOW LINE / GET READY',left+60,h.y-10);}
        else{box(g,left,h.y-5,h.w,h.h+10,'#66cdc755');box(g,left,h.y,h.w,h.h,'#9df3dd');box(g,left,h.y+5,h.w,4,'#f0ffdd');}
      }else{
        g.strokeStyle='#edbb83';g.lineWidth=2;g.strokeRect(left,h.y,h.w,h.h);
        if(h.timer>0){g.fillStyle='#ffe2ac';g.font='bold 11px monospace';g.fillText('▼ MISSILE',left,h.y-9);line(g,h.x,h.y-70,h.x,h.y-10,'#d5eaca88',2);}
        else{box(g,left,h.y,h.w,h.h,'#e9be83');box(g,h.x-12,h.y-45,24,h.h+45,'#fff1b6');}
      }
    }
  }
  return {background,enemy,boss,hazards};
})();
