/* Deterministic world decoration: no collision, gameplay state or save writes. */
window.KekScenery=(g,s)=>{
  const box=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),w,h);};
  g.save();g.translate(-Math.round(s.camera),0);
  for(let i=0;i<24;i++){
    const x=90+i*153;if(x<s.camera-180||x>s.camera+1100)continue;
    if(x<1650){
      // Broad swamp ferns, hanging vines and wet roots.
      box(x,345,5,53,'#668850');for(let j=0;j<5;j++){box(x-32+j*6,354+j*7,35-j*4,4,'#749158');box(x+4,354+j*7,32-j*4,4,'#4c744c');}
      const sway=Math.sin(s.time*1.6+i)*3;
      box(x+53+sway,70,3,150+i%4*22,'#496a40');for(let j=0;j<4;j++)box(x+49+sway,95+j*28,10,5,'#66804a');
      // Small waterfalls and reflected light break up the swamp's flat ground.
      if(i%4===1){box(x+83,185,19,213,'#315e5b');for(let j=0;j<5;j++)box(x+85+j*3,185+(s.time*85+j*31)%190,2,22,'#81ad9c');}
    }else if(x<3200){
      // Occupied outpost: ruined windows, broken roofs and warning stripes.
      box(x,225,104,173,'#354c47');box(x+7,233,90,155,'#40564c');
      for(let j=0;j<3;j++){box(x+16+j*28,251,17,38,'#172f2e');box(x+16+j*28,250,17,3,'#839275');}
      box(x-8,219,120,9,'#7d8770');box(x+22,325,30,73,'#203731');box(x+64,329,24,18,'#af9b5b');
      for(let j=0;j<3;j++)box(x+65+j*8,330,3,16,'#4c553f');box(x+40,209,18,12,'#273c38');
      for(let row=0;row<4;row++){box(x+10,299+row*20,80,2,'#58705b');box(x+30+(row%2)*20,301+row*20,2,16,'#263f3b');}
      box(x+14,292,10,3,'#c6bd85');box(x+17,295,2,37,'#34483c');
    }else{
      box(x,144,120,254,'#324944');box(x+4,148,112,246,'#445b50');
      for(let j=0;j<6;j++){box(x+8,169+j*36,104,3,'#263d39');box(x+52+(j%2)*25,151+j*36,3,18,'#263d39');}
      box(x+35,235,45,65,'#1e332f');box(x+39,239,37,5,'#b5aa72');
      box(x+50,109,20,35,'#405c4c');box(x+43,100,34,12,'#829778');
    }
  }
  // Broken rock strata and puddle reflections beneath the collision surface.
  for(let i=0;i<40;i++){
    const x=i*113;if(x<s.camera-150||x>s.camera+1100)continue;
    box(x,420,57,4,'#3d5b4b');box(x+10,432,83,3,'#47695b');box(x+24,449,31,2,'#79917b');
    box(x+40,406,17,8,'#6f7951');box(x+44,405,9,2,'#b0ad76');
  }
  // Checkpoint transmitters are visible, with activated lamps.
  for(const x of [1720,3340]){
    const active=s.checkpoint>=x;box(x-12,347,28,51,'#526d57');box(x-6,354,16,19,active?'#c4ec92':'#a9905e');box(x,300,3,47,'#a0b18b');box(x-11,300,26,4,'#a0b18b');
    if(active){g.strokeStyle='#b7df87';g.lineWidth=2;g.beginPath();g.arc(x+1,315,14+Math.sin(s.time*3)*3,Math.PI,Math.PI*2);g.stroke();}
  }
  // Foreground mushrooms, tall reeds and small stones avoid the actor silhouette.
  for(let i=0;i<52;i++){
    const x=i*83+31;if(x<s.camera-100||x>s.camera+1050)continue;
    box(x,390,21,8,'#536549');box(x+4,386,12,4,'#7e895c');
    if(i%3===0){box(x+31,383,4,15,'#a3926e');box(x+25,379,16,5,'#b99468');}
  }
  g.restore();
};
