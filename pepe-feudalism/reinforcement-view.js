export function reinforcementStatus(b,team){
 const reserves=team?b.enemyReserves:b.reserves,count=reserves?.length??0,active=b.units.filter(u=>u.team===team&&!u.hero&&u.hp>0).length,cooldown=team?b.enemyReinforcementCd:b.reinforcementCd;
 return {count,active,message:!count?'No reserves':active>=12?'Frontline full':`Next arrival: ${Math.max(0,Math.ceil(cooldown??0))}s`};
}
export function drawReinforcements(g,b){for(const team of [0,1]){const status=reinforcementStatus(b,team),x=team?960:22;g.save();g.fillStyle='#163027dc';g.strokeStyle=team?'#b76c5b':'#b5bb73';g.lineWidth=1;g.fillRect(x,581,218,48);g.strokeRect(x,581,218,48);g.textAlign='left';g.font='bold 13px Georgia';g.fillStyle=team?'#f2bba6':'#eee4b4';g.fillText(`${team?'Enemy':'Crown'} reserves / ${status.count}`,x+12,600);g.font='12px Georgia';g.fillStyle='#ddd2a5';g.fillText(status.message,x+12,619);g.restore();}}
