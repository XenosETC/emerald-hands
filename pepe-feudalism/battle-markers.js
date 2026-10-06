import {troopIdentity} from './regional-troops.js';
import {formationTarget} from './formation.js';
export function drawBattleMarkers(g,b){
 g.save();g.lineWidth=2;
 const target=b.units.find(u=>u.id===b.targetId&&u.team===1&&u.hp>0);
 if(target){g.strokeStyle='#ffd099';g.beginPath();g.ellipse(target.x,target.y+3,31+Math.sin(b.time*4)*2,12,0,0,7);g.stroke();g.fillStyle='#ffe5ad';g.beginPath();g.moveTo(target.x,target.y-157);g.lineTo(target.x-7,target.y-170);g.lineTo(target.x+7,target.y-170);g.fill();}
 else if(b.target&&Math.hypot(b.hero.x-b.target.x,b.hero.y-b.target.y)>6){g.strokeStyle='#f8e2a4';g.beginPath();g.ellipse(b.target.x,b.target.y,13,5,0,0,7);g.stroke();g.setLineDash([3,8]);g.strokeStyle='#f8e2a455';g.beginPath();g.moveTo(b.hero.x,b.hero.y);g.lineTo(b.target.x,b.target.y);g.stroke();g.setLineDash([]);}
 if(b.order==='hold'){for(const u of b.units.filter(u=>u.team===0&&!u.hero&&u.hp>0)){const p=formationTarget(b,u);g.strokeStyle=u.type==='archer'?'#e7d49b88':'#b7dcab88';g.beginPath();g.ellipse(p.x,p.y,10,4,0,0,Math.PI*2);g.stroke();}g.strokeStyle='#b7dcab';g.beginPath();g.ellipse(b.hold.x,b.hold.y,55,20,0,0,7);g.stroke();g.fillStyle='#b7dcab';g.font='12px Georgia';g.textAlign='center';g.fillText('HOLD',b.hold.x,b.hold.y+34);}
 for(const unit of b.units.filter(unit=>unit.hp>0&&(unit.stagger??0)>0)){
  g.strokeStyle='#ffe5a2';g.fillStyle='#fff2bd';g.lineWidth=2;g.beginPath();g.ellipse(unit.x,unit.y-125,19,6,0,0,Math.PI*2);g.stroke();
  for(let i=0;i<3;i++){const a=b.time*7+i*Math.PI*2/3;g.beginPath();g.arc(unit.x+Math.cos(a)*19,unit.y-125+Math.sin(a)*6,3,0,Math.PI*2);g.fill();}
 }
 g.restore();
}

export function selectedEnemyInfo(b){const target=b.units.find(u=>u.id===b.targetId&&u.team===1&&u.hp>0);return target?{name:target.name??target.captain??troopIdentity(target.type,target.origin).troopName,hp:Math.ceil(target.hp),max:target.max,damage:target.damage,structure:target.structure??null}:null;}
export function drawSelectedEnemy(g,b){const target=selectedEnemyInfo(b);if(!target)return;g.save();g.fillStyle='#172c24eb';g.strokeStyle='#d6a477';g.lineWidth=1;g.fillRect(440,14,320,60);g.strokeRect(440,14,320,60);g.font='bold 17px Georgia';g.textAlign='center';g.fillStyle='#ffe3b4';g.fillText(target.name,600,37);g.font='13px Georgia';g.fillStyle='#ead3ad';g.fillText(`${target.hp}/${target.max} health / ${target.structure?'heals nearby raiders':target.damage+' attack'}`,600,57);g.fillStyle='#633c30';g.fillRect(455,65,290,3);g.fillStyle='#eda06f';g.fillRect(455,65,290*target.hp/target.max,3);g.restore();}
