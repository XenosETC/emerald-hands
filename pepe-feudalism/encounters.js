import {configureMission} from './missions.js';
import {TROOPS} from './campaign.js';
export const ENCOUNTERS={
 hunt:{name:'Briar Raider Camp',roster:['spearman','spearman','spearman','archer','spearman']},
 elderwood:{name:'Elderwood Watch Camp',roster:['guard','spearman','archer','archer','spearman']},
 jadeforest:{name:'Jadefall War Camp',roster:['guard','spearman','spearman','archer','archer','spearman'],captain:'Varric the Thorn'}
};
export function configureEncounter(b,destination){
 const origin={hunt:'mossford',elderwood:'mossford',jadeforest:'greenmere',highpass:'frostford',ashgrove:'cinderford',keep:'keep',outpost:'outpost',ruins:'port'}[destination];
 for(const u of b.units.filter(u=>u.team===1))u.origin=origin;
 b.enemyOrigin=origin;
 b.enemyReserves=[];
 const extra={outpost:8,keep:13}[destination]??0;
 for(let i=0;i<extra;i++){const type=destination==='keep'&&i===0?'shadowKnight':destination==='keep'&&i===5?'shadowMage':i%4===3?'archer':destination==='keep'&&i%3===0?'guard':'spearman',t=TROOPS[type];b.enemyReserves.push({team:1,type,origin,hp:t.hp,max:t.hp,damage:t.damage,range:t.range,speed:t.speed,cd:0,flash:0,swing:0,moving:false,facing:-1});}
 b.enemyReinforcementCd=3;

 if(destination==='keep'){
  const lord=b.units.find(u=>u.team===1&&u.type==='guard');
  if(lord)Object.assign(lord,{captain:'Lord Ashfang',hp:140,max:140,damage:13,speed:69,lord:true});
  b.encounter='The Corrupted Citadel';return;
 }
 const spec=ENCOUNTERS[destination];if(!spec){configureMission(b,destination);return;}
 b.encounter=spec.name;
 const allies=b.units.filter(u=>u.team===0),firstId=Math.max(...allies.map(u=>u.id))+1;
 b.units=[...allies,...spec.roster.map((type,i)=>{
  const t=TROOPS[type],captain=!!spec.captain&&i===0;
  return {id:firstId+i,team:1,origin,type,x:850+i%3*80,y:245+Math.floor(i/3)*85,hp:t.hp+(captain?55:0),max:t.hp+(captain?55:0),damage:t.damage+(captain?3:0),range:t.range,speed:t.speed,cd:0,flash:0,swing:0,moving:false,facing:-1,captain:captain?spec.captain:null};
 })];
 configureMission(b,destination);
}
export function drawCamp(g,b){
 if(!ENCOUNTERS[b.destination])return;
 const jade=b.destination==='jadeforest';g.save();
 for(const [x,y]of [[830,220],[1050,205]]){
  g.fillStyle='#17251d44';g.beginPath();g.ellipse(x,y+13,58,12,0,0,Math.PI*2);g.fill();
  g.fillStyle=jade?'#38533b':'#765438';g.strokeStyle='#c4af78';g.lineWidth=2;g.beginPath();g.moveTo(x,y-65);g.lineTo(x-52,y+10);g.lineTo(x+52,y+10);g.closePath();g.fill();g.stroke();g.fillStyle='#14241feb';g.beginPath();g.moveTo(x,y-48);g.lineTo(x-15,y+9);g.lineTo(x+15,y+9);g.fill();
 }
 // Stakes are scenery beyond the walkable ground, never invisible collision.
 for(let i=0;i<7;i++){const x=965+i*27;g.strokeStyle='#795d3d';g.lineWidth=7;g.beginPath();g.moveTo(x,227);g.lineTo(x+7,195);g.stroke();g.strokeStyle='#c2a67d';g.lineWidth=2;g.stroke();}
 g.strokeStyle='#b7a67a';g.lineWidth=3;g.beginPath();g.moveTo(790,218);g.lineTo(790,130);g.stroke();g.fillStyle=jade?'#65834a':'#9c463b';g.beginPath();g.moveTo(790,133);g.lineTo(835,140+Math.sin(b.time*2)*3);g.lineTo(826,166);g.lineTo(790,157);g.fill();
 g.restore();
}
