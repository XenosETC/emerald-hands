// Serialized into the game's VM by tower-visual-art.test.cjs. Free identifiers
// intentionally resolve to the real game closure: no duplicate combat formulas.
function runTowerBalance(options) {
  const orders = {
    courtyard:[0,4,2,6,1,5,7,8,3], 'floodgate-delta':[0,1,3,5,4,2,7,8,6],
    'sunscar-quarry':[2,3,4,5,0,1,6,7,8], 'twinroot-grove':[0,8,1,4,2,5,3,6,7],
    'tideglass-harbor':[0,1,2,4,3,5,6,7], 'emerald-celestial-hall':[1,2,3,4,5,0,6,7,8]
  };
  const order=orders[activeMap.id],types=order.length===8?['pepe','shard','hero','hero','alchemist','ballista','relic','druid']:['pepe','shard','hero','hero','alchemist','ballista','archer','relic','druid'];
  let ticks=0,casts=0,minFunds=state.shards;
  const bosses=[],waves=[],originalSpawn=spawnEnemy,originalFinish=finishWaveReport;
  spawnEnemy=()=>{
    const count=enemies.length;originalSpawn();const enemy=enemies.at(-1);
    if(enemies.length>count&&['warboss','tyrant','sovereign'].includes(enemy.kind))
      bosses.push({enemy,wave:state.wave,kind:enemy.kind,entered:ticks/30,startHp:enemy.maxHp,entryRelic:state.vault});
  };
  finishWaveReport=cleared=>{originalFinish(cleared);if(lastWaveReport)waves.push(JSON.parse(JSON.stringify(lastWaveReport)));};
  while(state.playing&&ticks<180000){
    // Ordinary players buy at build breaks; no instant mid-wave purchases.
    if(!state.waveActive){
      for(let n=0;n<order.length;n++){
        if(towers.filter(t=>t.type==='hero').length<2&&n>3)continue;
        if(!towerAtPad(pads[order[n]])&&state.shards>=towerTypes[types[n]].cost){selectTower(types[n]);buildOrUpgrade(pads[order[n]]);}
      }
      if(towers.filter(t=>t.type==='hero').length===2){
        for(let tier=0;tier<5;tier++)for(const i of order){const tower=towerAtPad(pads[i]);const main=tower?.type==='shard'||tower?.type==='alchemist'||tower?.type==='hero'&&tower.heroSlot===1?'special':'power';
          if(tower&&tower.tiers[main]===tier&&state.shards>=upgradeCost(tower,main)){buildOrUpgrade(pads[i]);upgradeSelected(main);}}
        for(const tower of towers){const primary=tower.path,second=tower.type==='hero'?(primary==='power'?'special':'power'):'utility';
          if(tower.tiers[primary]===5&&tower.tiers[second]<2&&state.shards>=upgradeCost(tower,second)){buildOrUpgrade(tower.pad);upgradeSelected(second);}}
      }
      if(options.strong)for(const tower of towers)if((options.strong==='support'?['ballista','alchemist']:['ballista','alchemist','hero']).includes(tower.type))tower.targetMode='strong';
      startWave();
    }
    if(options.nova!==false)for(const slot of [0,1])if(activateHeroNova(slot))casts++;
    update(1/30,false);ticks++;minFunds=Math.min(minFunds,state.shards);
    for(const boss of bosses)if(!boss.result&&!enemies.includes(boss.enemy)){
      boss.result=boss.enemy.hp<=0?'defeated':'breached';boss.remaining=Math.max(0,boss.enemy.hp)/boss.startHp;boss.seconds=ticks/30-boss.entered;
    }
  }
  spawnEnemy=originalSpawn;finishWaveReport=originalFinish;
  return JSON.stringify({map:activeMap.id,policy:options,wave:state.wave,hp:state.vault,casts,ticks,minFunds,
    bosses:bosses.map(({enemy,...boss})=>boss),waves});
}
module.exports={runTowerBalance};
