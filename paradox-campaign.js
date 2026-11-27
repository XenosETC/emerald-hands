(function(root){
  "use strict";
  const key="emerald-pepe-paradox-campaign-v1";
  const levels=Object.freeze([
    {id:1,name:"Jade Mountain",biome:"jade",base:"Frogspire Outpost",stages:["Moonlit Approach","Bellwind Crossing","Echo Monastery","Fallen's Gate","Frogspire Outpost"]},
    {id:2,name:"Corrupt Marsh",biome:"marsh",base:"Lantern Refuge",stages:["Violet Causeway","Sentinel Reeds","The Flooded Archive","Heart of the Blight","Lantern Refuge"]},
    {id:3,name:"Cinder Crown",biome:"volcano",planned:true,base:"Ember Watch",stages:["Ashen Steps","Lava Choir","Obsidian Ascent","Cinder Warden","Ember Watch"]},
    {id:4,name:"Moonlit Citadel",biome:"moon",planned:true,base:"Pepina's Sanctuary",stages:["Silver Road","Palace of Echoes","The Broken Crown","Fallen's Last Stand","Pepina's Sanctuary"]},
  ].map(Object.freeze));
  const stages=Object.freeze(levels.flatMap(level=>level.stages.map((name,i)=>Object.freeze({id:`${level.id}-${i+1}`,level:level.id,stage:i+1,index:(level.id-1)*5+i,name,biome:level.biome,base:i===4,planned:!!level.planned,event:i===3?"surge":i===1?"patrol":"trail"}))));
  const upgrades=Object.freeze([
    {id:"dash",name:"Winged Travel Boots",cost:8,base:1,art:0,benefit:"Dash recharges in 0.7s instead of 0.9s."},
    {id:"ward",name:"Lotus Ward",cost:10,base:1,art:1,benefit:"Contact protection lasts 1.6s instead of 1.1s."},
    {id:"leap",name:"Frogstep Soles",cost:16,base:2,art:0,benefit:"Stronger jump: launch speed 780 instead of 740."},
    {id:"lens",name:"Lantern Lens",cost:12,base:2,art:1,benefit:"Adds 18 units of journey collectible reach."},
  ].map(Object.freeze));
  function fresh(){return {version:1,current:"1-1",completed:[],claimed:{},shards:0,owned:[],inProgress:null,legacyImported:false};}
  function normalize(value){
    const state=fresh();if(!value||value.version!==1)return state;
    state.completed=[...new Set(Array.isArray(value.completed)?value.completed:[])].filter(id=>stages.some(s=>s.id===id&&!s.planned));
    state.owned=[...new Set(Array.isArray(value.owned)?value.owned:[])].filter(id=>upgrades.some(u=>u.id===id));
    state.shards=Number.isSafeInteger(value.shards)?Math.max(0,Math.min(1000,value.shards)):0;
    for(const [id,count] of Object.entries(value.claimed||{}))if(stages.some(s=>s.id===id&&!s.planned&&!s.base)&&Number.isSafeInteger(count))state.claimed[id]=Math.max(0,Math.min(12,count));
    state.current=stages.some(s=>s.id===value.current&&!s.planned)?value.current:"1-1";
    state.legacyImported=!!value.legacyImported;
    if(value.inProgress&&value.inProgress.id===state.current){
      const p=value.inProgress;
      state.inProgress={id:p.id,slot:Number.isInteger(p.slot)?Math.max(0,Math.min(5,p.slot)):0,x:Number.isFinite(p.x)?Math.max(0,Math.min(5296,p.x)):180,
        shards:indices(p.shards,12),relics:indices(p.relics,2),frogs:indices(p.frogs,1),tauntDone:!!p.tauntDone};
    }
    return state;
  }
  function indices(values,max){return [...new Set(Array.isArray(values)?values:[])].filter(i=>Number.isInteger(i)&&i>=0&&i<max);}
  function load(storage,legacy){
    try{const raw=storage?.getItem(key);if(raw)return normalize(JSON.parse(raw));}catch{}
    const state=fresh();
    if(legacy?.best?.paradox?.stage>=2){state.completed=["1-1"];state.current="1-2";state.legacyImported=true;}
    return state;
  }
  function save(storage,state){try{storage.setItem(key,JSON.stringify(normalize(state)));return true;}catch{return false;}}
  function unlocked(state,stage){return !stage.planned&&(stage.index===0||state.completed.includes(stages[stage.index-1].id)||state.completed.includes(stage.id));}
  function complete(state,stage,count=0){
    const next=normalize(state);if(!next.completed.includes(stage.id))next.completed.push(stage.id);
    const old=next.claimed[stage.id]||0,earned=stage.base?0:Math.max(0,Math.min(12,count)-old);
    next.shards+=earned;if(!stage.base)next.claimed[stage.id]=Math.max(old,Math.min(12,count));
    const following=stages[stage.index+1];next.current=following&&!following.planned?following.id:stage.id;next.inProgress=null;
    return {state:next,earned};
  }
  function purchase(state,id,base){
    const item=upgrades.find(u=>u.id===id);if(!item||item.base>base||state.owned.includes(id)||state.shards<item.cost)return null;
    const next=normalize(state);next.shards-=item.cost;next.owned.push(id);return next;
  }
  function layout(stage,legacy){
    if(stage.index===0)return JSON.parse(JSON.stringify(legacy));
    if(stage.base)return {platforms:[{x:0,y:610,w:5400,h:110}],echo:[],shards:[],relics:[],frogs:[],wisps:[],sentinels:[],shrines:[{x:180,y:610,lit:true}],signs:[]};
    const variants={
      "1-2":[[0,610,780],[900,565,620],[1650,610,850],[2630,560,720],[3490,610,720],[4340,610,1060]],
      "1-3":[[0,610,870],[1010,580,450],[1590,540,850],[2570,610,760],[3460,565,640],[4240,610,1160]],
      "1-4":[[0,610,760],[880,565,660],[1670,610,790],[2590,565,760],[3480,610,650],[4260,610,1140]],
      "2-1":[[0,610,840],[970,580,600],[1700,610,780],[2610,565,720],[3460,610,690],[4280,610,1120]],
      "2-2":[[0,610,790],[920,565,650],[1700,610,830],[2660,580,650],[3440,565,710],[4280,610,1120]],
      "2-3":[[0,610,850],[990,580,540],[1660,540,800],[2590,610,730],[3450,580,700],[4280,610,1120]],
      "2-4":[[0,610,760],[890,565,650],[1670,610,800],[2600,565,720],[3450,610,680],[4260,610,1140]],
    };
    const platforms=variants[stage.id].map(([x,y,w])=>({x,y,w,h:720-y}));
    const moving=[{x:680,y:465,w:180,h:24,moving:true,baseX:680,amplitude:75,speed:1,phase:0,dx:0},
      {x:1830,y:420,w:190,h:24,moving:true,baseX:1830,amplitude:110,speed:1.1,phase:2,dx:0},
      {x:3730,y:430,w:180,h:24,moving:true,baseX:3730,amplitude:85,speed:1.2,phase:1,dx:0}];
    const onGround=x=>{const p=platforms.find(p=>x>=p.x&&x<=p.x+p.w);return p?.y||550;};
    const xs=[450,650,1090,1320,1780,2020,2300,2850,3090,3660,3990,4730];
    const marsh=stage.biome==="marsh";
    return {platforms:[...platforms,...moving],echo:[{x:790,y:490,w:140,h:22,realm:"echo"},{x:1510,y:460,w:150,h:22,realm:"jade"},{x:3330,y:470,w:150,h:22,realm:"echo"}],
      shards:xs.map((x,i)=>({x,y:onGround(x)-(i%3===1?200:90),got:false})),relics:[{x:1370,y:365,got:false},{x:3990,y:370,got:false}],frogs:[{x:715,y:535,got:false}],
      wisps:[{x:1190,y:onGround(1190)-70,r:27,homeX:1190,range:55,speed:1.15,phase:0,banished:0},{x:2860,y:onGround(2860)-70,r:28,homeX:2860,range:60,speed:1.05,phase:1.2,banished:0}],
      sentinels:marsh?[{x:2090,homeX:2090,y:onGround(2090)-62,range:90,phase:0,banished:0},{x:3810,homeX:3810,y:onGround(3810)-62,range:100,phase:1.5,banished:0}]:[],
      shrines:platforms.map((p,i)=>({x:i===0?180:p.x+70,y:p.y,lit:i===0})),
      signs:[{x:400,y:610,title:stage.name.toUpperCase(),hint:marsh?"Sentinels charge · jump or dash":"Follow Pepina's lantern trail"},{x:1980,y:onGround(1980),title:stage.event==="surge"?"CORRUPTION SURGE":"PEPINA'S SIGNAL",hint:stage.event==="surge"?"Violet pulse: Echo realm is safe":"A clue waits beyond the crossing"},{x:4520,y:610,title:"THE NEXT WAYGATE",hint:"Stage progress saves at lanterns"}]};
  }
  root.ParadoxCampaign=Object.freeze({key,levels,stages,upgrades,fresh,normalize,load,save,unlocked,complete,purchase,layout});
})(typeof window==="undefined"?globalThis:window);
