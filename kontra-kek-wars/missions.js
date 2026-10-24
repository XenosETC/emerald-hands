(function(root){
  'use strict';
  const missions={
    1:{id:1,title:'IRON LILY',location:'OCCUPIED SWAMP',boss:'IRON LILY',width:4200,checkpoint:1720,bossTrigger:3290,bossCheckpoint:3340,arena:3240,
      platforms:[{x:400,y:320,w:210},{x:820,y:280,w:200},{x:1190,y:330,w:180},{x:1610,y:285,w:240},{x:2060,y:325,w:220},{x:2490,y:280,w:220},{x:2920,y:325,w:160}]},
    2:{id:2,title:'STORMFORGE',location:'THE ASHEN FOUNDRY',boss:'TEMPEST WARDEN',width:4800,checkpoint:2040,bossTrigger:3890,bossCheckpoint:3940,arena:3840,
      platforms:[{x:360,y:330,w:210},{x:860,y:290,w:190},{x:1350,y:320,w:220},{x:1860,y:285,w:240},{x:2350,y:330,w:240},{x:2840,y:295,w:210},{x:3300,y:325,w:220}],
      enemies:[['crawler',560],['rocketeer',850],['drone',1180],['crawler',1440],['rocketeer',1690],['drone',2180],['crawler',2390],['rocketeer',2670],['drone',3010],['crawler',3260],['rocketeer',3510],['drone',3700]]},
    3:{id:3,title:'JADE RIFT',location:'THE SHATTERED GROVE',boss:'RIFT BLOOM',width:4400,checkpoint:1840,bossTrigger:3490,bossCheckpoint:3540,arena:3440,
      platforms:[{x:380,y:320,w:180},{x:850,y:285,w:220},{x:1300,y:325,w:210},{x:1740,y:285,w:200},{x:2200,y:325,w:200},{x:2650,y:290,w:230},{x:3050,y:325,w:180}],
      enemies:[['stalker',540],['wisp',850],['stalker',1200],['wisp',1500],['stalker',1980],['wisp',2260],['stalker',2550],['wisp',2880],['stalker',3180]]}
  };
  const api={get:id=>missions[id]||missions[1],next:id=>missions[id+1]||null};
  if(typeof module!=='undefined')module.exports=api;else root.KekMissions=api;
})(globalThis);
