// Persist only ordinary drops backed by a cleared enemy in the current approach.
export function pendingPatrolLoot(value,s){
 if(s.world==='academy'||!['approach','approach2'].includes(s.zone)||!Array.isArray(value))return [];
 const ids=s.zone==='approach'?[1,2,3]:[5,6,7],seen=new Set();
 return value.slice(0,6).filter(d=>{
  if(!d||!ids.includes(d.id)||!s.approachCleared.includes(d.id)||seen.has(d.id)||!Number.isFinite(d.x))return false;
  seen.add(d.id);return true;
 }).map(d=>({id:d.id,x:Math.max(100,Math.min(2500,d.x))}));
}
export function snapshotPatrolLoot(s){
 return pendingPatrolLoot(s.drops.filter(d=>d.kind==='loot'&&!d.boss).map(d=>({id:d.sourceId,x:d.x})),s);
}
