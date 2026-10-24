window.KekReactorArt=(g,s)=>{
  if(s.mission!==2)return;
  const box=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);};
  const label=(value,x,y,color='#cde9cf')=>{g.fillStyle=color;g.font='bold 11px monospace';g.fillText(value,x,y);};
  const active=['active','reward'].includes(s.surge.status);
  if(!active){
    box(2470,311,127,49,'#1b3842');box(2473,314,121,3,'#b4cbad');label('REACTOR SURGE',2480,334);
    label(s.completedEvents.includes('reactor-surge')?'UPGRADE CLAIMED':'OPTIONAL / E',2480,351,'#e4bb80');
    box(2529,360,6,38,'#607c76');return;
  }
  box(2500,155,622,10,'#759690');box(2500,165,622,5,'#223e49');
  box(2540,173,535,35,'#18343d');box(2544,176,527,2,'#5e817d');
  for(let i=0;i<12;i++)box(2552+i*43,183,22,5,(Math.floor(s.surge.time*5)+i)%4===0?'#c5e8b9':'#385d60');
  for(const [i,x] of KekReactor.GATES.entries()){
    const gate=KekReactor.gateState(s.surge.time,i),live=gate.state==='live',charging=gate.state==='charging';
    box(x-19,254,38,18,'#1c3945');box(x-15,257,30,5,'#9abeb1');box(x-18,392,36,6,'#aabc9d');
    const color=live?'#b7ffdf':charging||!gate.canCross?'#f1c18a':'#afd6ae';box(x-9,266,18,5,color);
    const message=gate.state==='startup'?'READY':gate.canCross?'OPEN':live?'LIVE':charging?'WAIT':'CLOSING';
    label((i+1)+' / '+message+' '+gate.remaining.toFixed(1)+'s',x-47,239,color);
    box(x-30,246,60,3,'#304f52');box(x-30,246,60*Math.max(0,Math.min(1,gate.progress)),3,color);
    // Waiting pads stay outside the damaging column; they never imply protection inside it.
    box(x-66,395,38,3,'#7caaa0');box(x-60,389,4,3,'#b8d8b2');box(x-52,386,4,3,'#b8d8b2');box(x-44,389,4,3,'#b8d8b2');
    if(s.surge.cleared[i]){box(x+23,258,4,10,'#b6e4ac');box(x+27,254,4,10,'#b6e4ac');}
    if(charging){g.setLineDash([5,7]);g.strokeStyle='#d9c491';g.strokeRect(x-14,280,28,118);g.setLineDash([]);box(x-14,280,28,118,'#f0bf7520');}
    if(live){box(x-20,280,40,118,'#7fe3cb44');box(x-14,280,28,118,'#8ee3cb');box(x-4,280,8,118,'#eeffce');
      g.strokeStyle='#d7ffe0';g.lineWidth=2;g.beginPath();for(let j=0;j<8;j++){const px=x+Math.sin(s.surge.time*34+j*2)*8,py=281+j*16;j?g.lineTo(px,py):g.moveTo(px,py);}g.stroke();
    }
    if(gate.state==='venting'){for(let j=0;j<3;j++)box(x-8+j*7,286-gate.progress*22,3,5,'#a2c1b577');}
  }
  box(3070,310,45,88,'#28514e');box(3074,314,37,5,'#cce6bf');label('EXIT',3077,338,'#edf0bc');
  // Keep the instruction panel in view as the camera passes the first conduit.
  box(s.camera+16,201,520,25,'#18343ddd');
  label('SURGE / '+s.surge.passed+' OF 3 / GREEN = CROSS / AMBER = WAIT',s.camera+24,218,'#c8e6cd');
};
