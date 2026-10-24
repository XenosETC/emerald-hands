const E=require('./engine.js'),fs=require('node:fs');
const samples=[];
for(const controlHz of [30,60,120])for(const dodge of [false,true]){
  const s=E.create(2);s.mode='playing';let input={},entryHp=null;
  for(let tick=0;tick<120*80&&s.mode==='playing';tick++){
    if(tick%(120/controlHz)===0){
      const p=s.player,danger=s.hazards.some(h=>!h.high&&h.timer>0&&h.timer<.28&&(h.kind==='beam'||Math.abs(h.x-p.x)<90));
      input={left:dodge&&p.x>4250,right:p.x<4180,fire:true,jump:dodge&&danger&&p.grounded,dash:dodge&&s.boss.active&&s.bullets.some(b=>b.owner==='enemy'&&Math.abs(b.x-p.x)<70&&Math.abs(b.y-p.y-20)<35)};
    }
    E.update(s,1/120,input);if(s.boss.active&&entryHp===null)entryHp=s.player.hp;
  }
  samples.push({controlHz,strategy:dodge?'respond to warnings':'hold fire and advance',result:s.mode,armorAtBoss:entryHp,armorLeft:s.player.hp,bossHp:s.boss.hp,seconds:Math.round(s.time*100)/100,kills:s.kills});
}
fs.writeFileSync('kontra-kek-wars/balance-verification-v5.json',JSON.stringify({status:'provisional automated calibration; not human balance approval',changes:{enemyActivation:600,lockWarning:.5,droneSpeed:175,droneCadence:1.9,rocketSpeed:195,rocketCadence:2.5,railWarning:1.1,wardenPhaseOneCadence:2.15,wardenPhaseTwoCadence:1.85,phaseChangeGrace:.65,recoveryDamageMultiplier:1.25},samples},null,2));
console.table(samples);
if(samples.filter(x=>x.strategy==='respond to warnings').some(x=>x.result!=='won'))process.exitCode=1;
