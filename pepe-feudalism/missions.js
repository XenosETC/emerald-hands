// Encounter objectives are battle-local. Only a completed victory grants their bonus.
export const MISSIONS = {
  elderwood: {type:'rescue', title:'The trapped herbalists', total:2, bonus:30,
    description:'Free both herbalists and defeat the raiders. Approach a cage and press F once no living guard is within 110 paces of it.'},
  ashgrove: {type:'purge', title:'Hearts of the Ashveil', total:2, bonus:45,
    description:'Destroy both Emberheart Totems and defeat the raiders. Click a totem to attack it. Each living totem heals nearby enemies for 12 every 4 seconds.'},
};

export function configureMission(b, destination) {
  const spec=MISSIONS[destination];
  b.mission=spec?{...spec}:null;
  if(!spec)return;
  if(spec.type==='rescue'){
    b.mission.captives=[{id:'willow',x:790,y:530,freed:false},{id:'fern',x:1040,y:315,freed:false}];
  }else{
    let id=Math.max(...b.units.map(u=>u.id))+1;
    for(const [x,y]of [[865,325],[1035,510]])b.units.push({id:id++,team:1,origin:b.enemyOrigin,type:'guard',structure:'emberTotem',name:'Emberheart Totem',
      x,y,hp:120,max:120,damage:0,range:0,speed:0,cd:0,flash:0,swing:0,moving:false,facing:-1,pulseCd:4});
  }
}

export function missionProgress(b) {
  if(!b.mission)return null;
  const completed=b.mission.type==='rescue'?b.mission.captives.filter(c=>c.freed).length:b.units.filter(u=>u.structure==='emberTotem'&&u.hp<=0).length;
  return {completed,total:b.mission.total,complete:completed>=b.mission.total};
}

export function captiveGuarded(b,captive) {
  return b.units.some(u=>u.team===1&&u.hp>0&&!u.structure&&Math.hypot(u.x-captive.x,u.y-captive.y)<110);
}

export function rescueCaptive(b) {
  if(!b||b.result||b.hero.hp<=0||b.mission?.type!=='rescue')return false;
  const captive=b.mission.captives.filter(c=>!c.freed&&Math.hypot(b.hero.x-c.x,b.hero.y-c.y)<=80).sort((a,c)=>Math.hypot(b.hero.x-a.x,b.hero.y-a.y)-Math.hypot(b.hero.x-c.x,b.hero.y-c.y))[0];
  if(!captive||captiveGuarded(b,captive))return false;
  captive.freed=true;
  b.effects.push({x:captive.x,y:captive.y-125,text:'HERBALIST FREED',life:1});
  return true;
}

export function missionHint(b) {
  if(b.mission?.type==='rescue'){
    if(missionProgress(b).complete)return 'Herbalists safe / defeat the remaining raiders';
    const near=b.mission.captives.find(c=>!c.freed&&Math.hypot(b.hero.x-c.x,b.hero.y-c.y)<=80);
    return near?(captiveGuarded(b,near)?'Clear the guards near this cage':'F / Free the herbalist'):'Approach a marked cage / F to free its herbalist';
  }
  if(b.mission?.type==='purge')return missionProgress(b).complete?'Totems destroyed / defeat the remaining raiders':'Click an Emberheart Totem to attack and stop its healing';
  return 'Clear the guards, then move near the marked cargo.';
}

export function stepMission(b,dt) {
  if(b.result||b.mission?.type!=='purge')return;
  for(const ward of b.units.filter(u=>u.structure==='emberTotem'&&u.hp>0)){
    ward.pulseCd=Math.max(0,ward.pulseCd-dt);
    if(ward.pulseCd>0)continue;
    ward.pulseCd=4;
    b.effects.push({x:ward.x,y:ward.y,wardPulse:true,radius:220,life:.75});
    for(const unit of b.units.filter(u=>u.team===ward.team&&!u.structure&&u.hp>0&&u.hp<u.max&&Math.hypot(u.x-ward.x,u.y-ward.y)<=220)){
      const healed=Math.min(12,unit.max-unit.hp);unit.hp+=healed;
      b.effects.push({x:unit.x,y:unit.y-85,text:'+'+healed,wardHeal:true,life:.6});
    }
  }
}

export function missionReport(b,won) {
  const progress=missionProgress(b);if(!progress)return null;
  return {title:b.mission.title,...progress,bonus:won&&progress.complete?b.mission.bonus:0,
    text:`${progress.completed}/${progress.total} ${b.mission.type==='rescue'?'herbalists rescued':'Emberheart Totems destroyed'}`};
}
