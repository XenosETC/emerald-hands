export function drawSnow(g,time){g.save();g.fillStyle='#f6f6e8';g.globalAlpha=.45;for(let i=0;i<35;i++){const x=(i*137+time*9+Math.sin(time*.4+i)*12)%1200,y=(i*83+time*(13+i%4))%640;g.beginPath();g.arc(x,y,i%3===0?1.7:1,0,0,Math.PI*2);g.fill();}g.restore();}
// Deterministic scenery uses battle time, so pause freezes every particle.
export function drawAtmosphere(g,b){
 const t=b.time;
 g.save();
 if(b.environment==='winter'){drawSnow(g,t);}else if(b.environment==='forest'){
  const jade=b.destination==='jadeforest',elder=b.destination==='elderwood',ash=b.destination==='ashgrove';
  if(ash){
   g.fillStyle='#33282555';g.fillRect(0,0,1200,640);
   const haze=g.createLinearGradient(0,0,0,430);haze.addColorStop(0,'#56433599');haze.addColorStop(1,'#56433500');g.fillStyle=haze;g.fillRect(0,0,1200,430);
   for(let i=0;i<32;i++){const phase=(t*(.08+i%3*.02)+i*.031)%1;g.globalAlpha=(1-phase)*.6;g.fillStyle=i%4===0?'#ffc27a':'#b8afa0';g.fillRect((i*113+Math.sin(t*.4+i)*22)%1200,610-phase*600,i%4===0?2:3,2);}g.globalAlpha=1;
  }
  g.fillStyle=jade?'#215f4a19':elder?'#547c8815':'#b68c3310';g.fillRect(0,0,1200,640);
  for(let i=0;i<18;i++){
   const x=(i*173+t*(8+i%4))%1200,y=80+(i*97+t*13)%500;
   g.save();g.translate(x,y);g.rotate(t*.6+i);g.fillStyle=jade?'#c3e99a88':'#d0bd7280';g.beginPath();g.ellipse(0,0,4,1.5,0,0,Math.PI*2);g.fill();g.restore();
  }
  if(elder||jade){for(let i=0;i<12;i++){g.globalAlpha=.15+Math.max(0,Math.sin(t*1.5+i))*.35;g.fillStyle=jade?'#c6ffc3':'#ddf4bd';g.beginPath();g.arc(70+i*97+Math.sin(t+i)*8,190+i%3*35,2,0,Math.PI*2);g.fill();}}
 }else if(b.environment==='volcanic'){for(let i=0;i<16;i++){const phase=(t*.2+i*.063)%1;g.globalAlpha=(1-phase)*.45;g.fillStyle='#ffbc69';g.fillRect((i*83+Math.sin(t+i)*15)%1200,450-phase*300,2,3);}}else if(b.environment==='ruins'){
  const light=g.createRadialGradient(600,200,5,600,200,125);light.addColorStop(0,'#a0ffed22');light.addColorStop(1,'#a0ffed00');g.fillStyle=light;g.fillRect(450,80,300,250);
  for(let i=0;i<10;i++){g.globalAlpha=.15+.15*Math.sin(t+i);g.fillStyle='#cbfff4';g.fillRect(420+i*37+Math.sin(t*.5+i)*8,220-((t*8+i*23)%125),2,2);}
 }
 g.restore();
}
