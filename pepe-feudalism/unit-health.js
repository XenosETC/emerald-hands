// Draw after all sprites so a nearer soldier cannot hide a wounded ally's bar.
export function drawUnitHealth(g,units){
 for(const u of units){
  if(u.hp<=0)continue;
  const ratio=Math.max(0,Math.min(1,u.hp/u.max)),width=u.hero?58:42;
  const x=u.x-width/2,y=u.y-(u.structure?157:u.hero?142:124);
  g.save();g.fillStyle='#102019';g.fillRect(x-2,y-2,width+4,9);
  g.strokeStyle=u.hero?'#e8d992':u.team?'#bd6c60':'#779987';g.lineWidth=1;g.strokeRect(x-2,y-2,width+4,9);
  g.fillStyle=ratio<=.25?'#ff795f':ratio<=.5?'#efc26c':u.team?'#e2906f':'#b6d583';g.fillRect(x,y,width*ratio,5);
  // A persistent notch makes critical health legible without relying on color.
  if(ratio<=.25){g.fillStyle='#fff2cf';g.font='bold 12px Georgia';g.textAlign='center';g.fillText('!',x-7,y+6);}
  g.restore();
 }
}
