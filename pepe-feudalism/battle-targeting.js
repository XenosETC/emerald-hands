// Match the painted depth order: a foreground enemy receives an overlapping click.
export function enemyAtPoint(units,point){
 return units.filter(u=>{
  if(u.team!==1||u.hp<=0)return false;
  const rx=u.structure?52:48,ry=u.structure?75:48,center=u.structure?75:50;
  return ((u.x-point.x)/rx)**2+((u.y-center-point.y)/ry)**2<=1;
 }).sort((a,b)=>b.y-a.y||Math.abs(a.x-point.x)-Math.abs(b.x-point.x))[0]??null;
}
