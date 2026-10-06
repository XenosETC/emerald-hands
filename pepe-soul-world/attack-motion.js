// Trails distinguish the three cuts while leaving the official Crown poses intact.
export function attackTrail(player){
 if(player.attack<=0||player.anim<=.16||player.anim>=.36)return null;
 const progress=(player.anim-.16)/.2,cut=Math.max(1,Math.min(3,player.combo||1));
 return {angle:cut===2?1.4-progress*2.8:-1.4+progress*2.8,direction:cut===2?-1:1,rotation:cut===2?.16:-.12,width:cut===3?7:5,reach:cut===3?133:125,height:cut===3?73:68};
}
export function attackCue(player,warpReady){
 if(player.attack<=0||player.hurt>0||player.domain)return null;
 const next=(player.combo%3)+1;
 const chain=player.queued?`Cut ${next} queued`:player.anim>.12?'J · queue next cut':'Commit your cut';
 return `CUT ${player.combo} · ${chain}${warpReady?' · K · Warp cancel':''}`;
}
