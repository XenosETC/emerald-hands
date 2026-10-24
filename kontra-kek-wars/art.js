/* Original canvas art. Animation follows simulation state and freezes on pause. */
window.KekArt = (() => {
  function box(g,x,y,w,h,color){g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),w,h);}
  function limb(g,points,color,width=5){
    g.strokeStyle='#101f23';g.lineWidth=width+3;g.lineCap='square';g.lineJoin='bevel';
    const path=()=>{g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();};
    path();g.strokeStyle=color;g.lineWidth=width;path();
  }
  function actor(g,x,y,face,enemy,phase,aim,pose={}){
    const air=pose.grounded===false,dash=pose.dashTime>0;
    const recoil=pose.recoil||0,land=pose.land||0,rails=pose.weaponMods?.includes('rails'),overclock=pose.weaponMods?.includes('overclock');
    const moving=pose.vx===undefined||Math.abs(pose.vx)>1;
    const step=moving?Math.sin(phase):0;
    const bob=air?0:moving?Math.abs(Math.cos(phase))*1.5:Math.sin((pose.time||0)*3)*.5;
    const skin=enemy?'#c0a277':'#95ca65',shadow=enemy?'#877854':'#4f874b';
    g.save();g.translate(Math.round(x+13),Math.round(y+44));g.scale(face*(1+land*.09),1-land*.12);g.translate(dash?6:0,-44+bob);
    // Rear leg, backpack, and loose headband establish depth.
    limb(g,[[-6,27],[-8+(air?-9:step*8),34-(air?6:0)],[-7+(air?-12:step*13),40-(air?5:Math.max(0,step)*5)]],shadow,6);
    box(g,-11+(air?-12:step*13),39-(air?5:Math.max(0,step)*5),14,5,'#293338');
    box(g,-17,16,9,16,'#132b2d');box(g,-17,16,6,12,enemy?'#6a7258':'#576e4b');
    const tail=pose.time||phase*.1;
    limb(g,[[-11,6],[-22,8+Math.sin(tail*13)*3],[-29-(dash?9:0),4+Math.sin(tail*13+1)*4]],enemy?'#9a5b48':'#d48159',3);
    g.save();g.translate(dash?4:0,dash?5:0);g.rotate(dash?.15:-recoil*.025+(pose.hitDirection||0)*(pose.stagger||0)*.6);
    // Torso vest, shoulder rim, ammunition and utility belt.
    box(g,-13,16,27,15,'#14262a');box(g,-11,17,23,12,enemy?'#96724e':'#c09961');
    box(g,-10,17,6,11,'#e1bd7a');box(g,-2,20,13,6,'#50664b');
    for(let i=0;i<3;i++)box(g,-1+i*4,21,2,4,'#b0b57c');
    box(g,-12,28,26,4,'#263b36');box(g,0,28,5,4,'#d7bb79');
    // Broad frog cheeks, stepped head outline, lower lip and expressive eyes.
    box(g,-16,1,33,17,'#12292b');box(g,-13,-3,12,10,'#12292b');box(g,5,-3,12,10,'#12292b');
    box(g,-14,3,29,12,skin);box(g,-11,-1,9,9,skin);box(g,7,-1,8,9,skin);
    box(g,-13,11,27,6,shadow);box(g,-10,14,22,4,'#a3b65f');
    box(g,-11,0,9,7,'#e9e5af');box(g,7,0,8,7,'#e9e5af');
    const blink=pose.time!==undefined&&Math.floor(pose.time*2)%13===12;
    if(blink){box(g,-11,3,9,3,shadow);box(g,7,3,8,3,shadow);}
    else{box(g,-6,1,3,5,'#162f2d');box(g,11,1,3,5,'#162f2d');box(g,-10,0,4,2,'#fff2cd');box(g,8,0,3,2,'#fff2cd');}
    box(g,-15,7,32,3,enemy?'#9a5b48':'#d48159');box(g,-13,7,13,1,'#f1b77b');
    box(g,-10,12,23,2,'#6e6549');box(g,10,10,4,2,'#c1d582');
    // Forearm and rifle pivot together, with mechanical recoil on each shot.
    g.save();g.translate(1-recoil*(rails?4:overclock?2:3),21);g.rotate(aim);
    limb(g,[[-5,1],[8,5],[19,1]],skin,5);
    box(g,11,-5,24,8,'#111e24');box(g,14,-4,20,3,'#71877d');
    box(g,32,-3,11,4,'#263a41');box(g,42,-3,5,3,'#bcc1a1');
    box(g,16,-8,8,3,'#293c3d');box(g,20,2,5,7,'#374c4c');box(g,12,-2,6,5,'#be9a62');
    if(pose.weapon==='PULSE'){box(g,13,-6,24,3,'#acebd8');for(let i=0;i<3;i++)box(g,18+i*6,-3,3,6,'#83c8d1');}
    if(rails){box(g,27,-7,20,2,'#a9e5df');box(g,27,3,20,2,'#71aaa9');box(g,39,-6,3,10,'#4a7b84');}
    if(overclock){for(let i=0;i<3;i++){box(g,17+i*6,-6,3,4,recoil>.4?'#f5c080':'#c29560');}box(g,34,3,7,3,'#a86d49');}
    if(recoil>.65){g.fillStyle=rails?'#aeeade':overclock?'#f3aa65':'#f5bd6f';g.beginPath();g.moveTo(47,-6);g.lineTo(rails?65:59,-1);g.lineTo(47,5);g.fill();box(g,47,-2,rails?12:7,3,'#fff6cc');}
    g.restore();g.restore();
    // Leading knee lifts on jumps; dash stretches one leg behind the body.
    limb(g,[[6,29],[9+(air?8:-step*8),34-(air?5:0)],[6+(dash?-16:air?12:-step*13),40-(air?2:Math.max(0,-step)*5)]],enemy?'#788269':'#5f9256',6);
    box(g,2+(dash?-16:air?12:-step*13),39-(air?2:Math.max(0,-step)*5),15,5,'#263338');
    box(g,4+(dash?-16:air?12:-step*13),39-(air?2:Math.max(0,-step)*5),10,2,'#a1a783');
    if(pose.flash>0){g.globalAlpha=.8;box(g,-15,3,2,14,'#ffe2ad');box(g,13,17,2,12,'#ffe2ad');}
    if(pose.hurt>0){g.globalAlpha=pose.hurt*.65;box(g,-12,17,24,3,'#ee9875');}
    g.restore();
  }
  function sky(g,s){
    const fort=s.camera>2600,outpost=s.camera>1250;
    const sky=g.createLinearGradient(0,0,0,400);sky.addColorStop(0,fort?'#2d2834':outpost?'#273a43':'#142d3d');sky.addColorStop(.65,fort?'#76594b':'#52706a');sky.addColorStop(1,'#213f3d');
    g.fillStyle=sky;g.fillRect(0,0,960,480);
    const sunX=710-s.camera*.025;g.fillStyle='#f6d59a';g.beginPath();g.arc(sunX,75,30,0,Math.PI*2);g.fill();
    // Mountains recede into mist; individual ridges avoid a tiled triangle wall.
    for(let layer=0;layer<3;layer++){
      g.fillStyle=['#3c575c','#365454','#294c48'][layer];g.beginPath();g.moveTo(0,370);
      for(let x=-100;x<=1100;x+=35){const world=x+s.camera*(.035+layer*.065);const y=140+layer*46+Math.sin(world*.007+layer)*28+Math.sin(world*.019)*17;g.lineTo(x,y);}g.lineTo(1100,420);g.closePath();g.fill();
    }
    for(let layer=0;layer<2;layer++){
      const space=240-layer*50,offset=s.camera*(.15+layer*.15)%space;
      for(let i=-1;i<7;i++){
        const x=i*space-offset,base=45+(i%3)*16;const color=layer?'#1c4038':'#294d44';
        box(g,x+57,base,13+layer*9,360,color);
        g.fillStyle=color;g.beginPath();g.moveTo(x-30,base+12);g.lineTo(x+26,base-24);g.lineTo(x+90,base-30);g.lineTo(x+151,base+18);g.lineTo(x+125,base+49);g.lineTo(x-10,base+40);g.closePath();g.fill();
        box(g,x+62,base+55,3,190,'#3b6350');
      }
    }
    // Warm shafts, low mist and moving motes are deliberately behind gameplay.
    g.save();g.globalAlpha=.06;g.fillStyle='#ffe4a6';for(let i=0;i<4;i++){const x=100+i*260-s.camera*.07%260;g.beginPath();g.moveTo(x,0);g.lineTo(x+33,0);g.lineTo(x-60,398);g.lineTo(x-160,398);g.fill();}g.restore();
    for(let i=0;i<22;i++){const x=((i*83-s.camera*.4+s.time*(i%2?7:-5))%1000+1000)%1000;const y=185+(i*47%170)+Math.sin(s.time*1.5+i)*8;g.globalAlpha=.25+Math.sin(s.time*2+i)*.2;box(g,x,y,2,2,'#ffe5aa');}g.globalAlpha=1;
    box(g,0,398,960,82,'#172e2c');box(g,0,398,960,5,'#a5ad6b');box(g,0,403,960,7,'#456342');
    for(let i=0;i<50;i++){const x=i*22-s.camera%22;box(g,x,411+(i%4)*12,12,4,'#354d3a');box(g,x+3,401,3,7,'#c3b67a');}
    const mist=g.createLinearGradient(0,332,0,400);mist.addColorStop(0,'#a4c29f00');mist.addColorStop(1,'#a4c29f22');g.fillStyle=mist;g.fillRect(0,332,960,66);
  }
  function effects(g,s){
    for(const fx of s.effects||[]){
      const t=1-fx.life/fx.max;g.save();
      if(fx.kind==='shell'){g.translate(fx.x,fx.y);g.rotate(t*13);box(g,-2,-1,5,2,'#dbb56a');}
      else if(fx.kind==='pierce'){g.translate(fx.x,fx.y);g.rotate(fx.angle);g.globalAlpha=1-t;box(g,-6,-1,24+t*24,3,'#b9f1e4');g.strokeStyle='#9ddbcf';g.lineWidth=2;g.beginPath();g.ellipse(0,0,3+t*6,9+t*8,0,0,Math.PI*2);g.stroke();}
      else if(fx.kind==='riftbreak'){g.globalAlpha=1-t;for(let i=0;i<7;i++){const angle=i*Math.PI*2/7;g.save();g.translate(fx.x+Math.cos(angle)*t*43,fx.y+Math.sin(angle)*t*35-t*18);g.rotate(angle+t*4);box(g,-2,-5,4,9,i%2?'#b6d9ba':'#c5b9df');g.restore();}}
      else if(fx.kind==='fallen'){g.globalAlpha=1-t;g.translate(fx.x+t*fx.face*22,fx.y+t*15);g.rotate(t*fx.face*1.5);actor(g,-13,-22,fx.face,true,0,0,{grounded:false});}
      else if(fx.kind==='score'){g.globalAlpha=1-t;g.fillStyle='#ffe1a0';g.font='bold 12px monospace';g.fillText('+'+fx.value,fx.x-10,fx.y-t*28);}
      else{
        const blast=fx.kind==='blast',r=blast?12+t*45:5+t*12;
        g.globalAlpha=(1-t)*(blast?.5:.8);g.strokeStyle=blast?'#e99d59':'#f7d38c';g.lineWidth=blast?5:2;g.beginPath();g.arc(fx.x,fx.y,r,0,Math.PI*2);g.stroke();
        if(t<.4){g.globalAlpha=1-t;box(g,fx.x-r*.5,fx.y-3,r,6,'#fff0ba');box(g,fx.x-3,fx.y-r*.5,6,r,'#ffe49b');}
        if(blast){g.globalAlpha=(1-t)*.45;for(let i=0;i<4;i++){g.fillStyle='#b6a98b';g.beginPath();g.arc(fx.x+Math.sin(i*2)*t*25,fx.y-t*45+i*3,6+t*15,0,Math.PI*2);g.fill();}}
      }
      g.restore();
    }
  }
  function projectiles(g,s){
    for(const b of s.bullets){
      if(b.kind==='spore'){g.save();g.translate(b.x,b.y);g.rotate(s.time*3);box(g,-5,-5,10,10,'#6f6699');box(g,-3,-3,6,6,'#e2c5ee');g.restore();continue;}
      if(b.kind==='rocket'){
        g.save();g.translate(b.x,b.y);g.rotate(Math.atan2(b.vy,b.vx));
        box(g,-7,-4,17,9,'#173340');box(g,-4,-3,12,3,'#c5d0ad');box(g,9,-2,5,5,'#e8c18b');
        box(g,-14,-2,8,4,'#f5b66b');box(g,-22,-1,10+Math.sin(s.time*45)*4,2,'#ffe3a7');
        g.globalAlpha=.25;box(g,-35,-3,15,7,'#c4d2bc');g.restore();continue;
      }
      if(b.owner==='grenade'){g.save();g.translate(b.x+4,b.y+4);g.rotate(s.time*10);box(g,-4,-5,8,10,'#172b2b');box(g,-3,-4,6,7,'#a7bf73');box(g,-1,-7,3,3,'#d8dca0');g.restore();continue;}
      const player=b.owner==='player',pulse=b.weapon==='PULSE',rails=b.mod==='rails',overclock=b.mod==='overclock',len=rails?37:pulse?29:player?18:11,a=Math.atan2(b.vy,b.vx);
      g.save();g.translate(b.x,b.y);g.rotate(a);g.globalAlpha=.25;box(g,-len*1.5,-3,len*1.7,7,rails?'#9edfd4':overclock?'#efb373':pulse?'#9ee3d9':player?'#ffe498':'#ff744f');g.globalAlpha=1;box(g,-len,-1,len,3,rails?'#8bc5c3':overclock?'#ecaa64':pulse?'#8ac9cd':player?'#e7bb62':'#e98b5a');box(g,-4,-1,rails?11:7,3,rails?'#ddfff0':pulse?'#d9ffe4':player?'#fff4cd':'#ffd1a0');if(rails){box(g,-len,4,15,1,'#97c9c4');}g.restore();
    }
  }
  function boss(g,s){
    const b=s.boss;if(b.hp<=0)return;
    const pulse=.5+Math.sin(s.time*8)*.5,recoil=b.cool>(b.phase===2?.95:1.5)?5:0;
    g.save();g.translate(b.x,b.y);
    box(g,-36,126,212,30,'#14242a');box(g,-31,122,203,9,'#81917a');
    for(let i=0;i<7;i++){box(g,-29+i*28,133,25,19,'#354b48');box(g,-24+i*28,137,15,10,'#758371');box(g,-21+i*28,139,9,6,'#243737');}
    box(g,-3,4,160,121,'#1b3236');box(g,0,0,155,119,b.flash?'#e5d1a0':'#6d897a');
    box(g,4,4,147,4,'#bdc8a2');box(g,4,111,147,8,'#3d584f');
    for(let i=0;i<5;i++){box(g,5+i*30,9,3,100,'#587261');box(g,8+i*30,12,4,3,'#b8c4a0');}
    box(g,18,-20,113,20,'#314c4a');box(g,23,-23,103,5,'#b7c1a0');box(g,27,-17,95,5,'#6c8975');
    box(g,14,14,128,24,'#213e3d');box(g,17,17,122,3,'#b8c69e');
    g.fillStyle='#d3d9b5';g.font='bold 12px monospace';g.fillText('IRON LILY',34,32);
    box(g,-36+recoil,56,69,19,'#162b31');box(g,-31+recoil,57,58,4,'#a5b59b');box(g,-33+recoil,68,60,4,'#425d57');
    for(let i=0;i<4;i++)box(g,-16+i*11+recoil,58,3,12,'#29443e');
    box(g,37,46,60,62,'#203c3a');box(g,43,52,48,50,'#a2814f');
    const glow=g.createRadialGradient(67,77,2,67,77,55);glow.addColorStop(0,'#ffe6a9aa');glow.addColorStop(1,'#ff9d4200');g.fillStyle=glow;g.fillRect(12,22,110,110);
    box(g,47,57,40,39,b.flash?'#fff1c5':b.phase===2?'#e88b59':'#c9b36e');box(g,60,60,13,33,'#fff1b2');box(g,50,62,3,24,'#96734b');
    for(let i=0;i<4;i++){box(g,108,52+i*14,30,7,'#263f3b');box(g,108,52+i*14,30,2,'#b3bfa0');}
    for(let i=0;i<2;i++){box(g,5+i*134,43,9,5,b.phase===2&&pulse>.5?'#ffad72':'#a59b68');}
    if(b.hp<45){g.globalAlpha=.2;for(let i=0;i<3;i++){g.fillStyle='#d2c5a0';g.beginPath();g.arc(100+Math.sin(s.time+i)*8,5-(s.time*30+i*14)%70,8+i*4,0,Math.PI*2);g.fill();}g.globalAlpha=1;}
    g.restore();
  }
  function turret(g,e,s){
    box(g,e.x-6,e.y+18,42,20,'#172e31');box(g,e.x-2,e.y+20,34,15,'#596f61');box(g,e.x-5,e.y+33,41,5,'#233d3c');
    box(g,e.x+2,e.y+2,27,26,e.flash?'#ffe1a1':'#80947a');box(g,e.x+4,e.y+3,23,3,'#bec9a1');
    for(let i=0;i<3;i++)box(g,e.x+22,e.y+11+i*5,5,2,'#2d4743');
    g.save();g.translate(e.x+14,e.y+12);g.rotate(Math.atan2(s.player.y+20-e.y-12,s.player.x-e.x));
    box(g,-5, -6,30-(e.recoil||0)*4,12,'#183137');box(g,0,-5,23-(e.recoil||0)*4,3,'#a0b59b');box(g,25-(e.recoil||0)*4,-4,9,7,'#3b5651');
    if(e.recoil>.8){box(g,34,-3,12,5,'#ffd3a0');box(g,37,-1,13,2,'#fff0c4');}g.restore();
    box(g,e.x+6,e.y+7,6,4,e.cool<.35?'#ffd38a':'#c58255');
  }
  return {actor,sky,effects,projectiles,boss,turret};
})();
