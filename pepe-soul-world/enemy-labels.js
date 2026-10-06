// Stable screen-space label lanes, independent from enemy movement and combat rules.
export function enemyLabelLayout(enemies,ground){
 const placed=[],layout=new Map();
 for(const e of enemies.filter(e=>!e.dead).slice().sort((a,b)=>Number(!!b.boss)-Number(!!a.boss)||a.x-b.x||String(a.id).localeCompare(String(b.id)))){
  const width=e.boss?190:150,base=ground-(e.boss?315:245);let y=base,x=e.x;
  while(placed.some(p=>Math.abs(p.x-x)<(p.width+width)/2+10&&Math.abs(p.y-y)<60)){y-=60;if(y<ground-360){y=base;x-=width+15;}}
  const box={x,y,width};placed.push(box);layout.set(e.id,box);
 }
 return layout;
}
