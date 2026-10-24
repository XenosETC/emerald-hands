(function(root){
  'use strict';
  const Arsenal=typeof module!=='undefined'?require('./arsenal.js'):root.KekArsenal;
  const ID='reactor-surge',START=2520,END=3070,GATES=[2660,2820,2980];
  const TIMING=Object.freeze({startup:.9,cycle:3.2,safe:1.65,warning:1,live:.4,offsets:Object.freeze([0,.7,1.4])});
  function gateState(time,index){
    if(time<TIMING.startup)return {state:'startup',remaining:TIMING.startup-time,progress:time/TIMING.startup,canCross:true};
    const phase=((time-TIMING.startup+TIMING.offsets[index])%TIMING.cycle+TIMING.cycle)%TIMING.cycle;
    if(phase<TIMING.safe){const remaining=TIMING.safe-phase;return {state:'safe',remaining,progress:phase/TIMING.safe,canCross:remaining>=.5};}
    if(phase<TIMING.safe+TIMING.warning){const remaining=TIMING.safe+TIMING.warning-phase;return {state:'charging',remaining,progress:1-remaining/TIMING.warning,canCross:false};}
    if(phase<TIMING.safe+TIMING.warning+TIMING.live)return {state:'live',remaining:TIMING.safe+TIMING.warning+TIMING.live-phase,progress:(phase-TIMING.safe-TIMING.warning)/TIMING.live,canCross:false};
    return {state:'venting',remaining:TIMING.cycle-phase+TIMING.safe,progress:(phase-3.05)/.15,canCross:true};
  }
  function create(){return {status:'idle',time:0,entryX:0,entryY:354,passed:0,cleared:[false,false,false],reward:null};}
  const nearby=s=>s.mission===2&&s.mode==='playing'&&!s.completedEvents.includes(ID)&&s.surge?.status==='idle'&&s.player.x>=2440&&s.player.x<=2620;
  function inspect(s){if(!nearby(s))return false;s.mode='surge-offer';return true;}
  function clearHazards(s){s.hazards=s.hazards.filter(h=>h.origin!==ID);}
  function enter(s){
    if(s.mode!=='surge-offer'||s.mission!==2||s.surge.status!=='idle'||s.completedEvents.includes(ID))return false;
    Object.assign(s.surge,{status:'active',time:0,passed:0,cleared:[false,false,false],entryX:s.player.x,entryY:s.player.y,entryGrounded:s.player.grounded});
    Object.assign(s.player,{x:START,y:354,vx:0,vy:0,grounded:true,jumpHeld:false,jumpBuffer:0});
    s.bullets=[];clearHazards(s);s.mode='playing';return true;
  }
  function leave(s){
    if(s.mission!==2||!['idle','active'].includes(s.surge?.status)||!['playing','paused','surge-offer'].includes(s.mode))return false;
    if(s.surge.status==='active')Object.assign(s.player,{x:s.surge.entryX+30,y:s.surge.entryY,vx:0,vy:0,grounded:s.surge.entryGrounded});
    s.camera=Math.max(0,Math.min(s.width-960,s.player.x-280));
    s.surge.status='skipped';clearHazards(s);s.bullets=[];s.mode='playing';return true;
  }
  function update(s,dt){
    if(s.mission!==2||s.mode!=='playing')return;
    const event=s.surge;event.notice=Math.max(0,(event.notice||0)-dt);
    if(s.completedEvents.includes(ID)){event.status='claimed';return;}
    if(event.status==='idle'&&s.player.x>2700)event.status='skipped';
    if(event.status!=='active')return;
    event.time+=dt;GATES.forEach((x,i)=>{if(s.player.x>x+30)event.cleared[i]=true;});event.passed=event.cleared.filter(Boolean).length;
    clearHazards(s);
    if(s.player.x>=END&&s.player.hp>0){event.status='reward';s.mode='surge-reward';s.bullets=[];return;}
    GATES.forEach((x,i)=>{
      const gate=gateState(event.time,i);
      if(gate.state==='charging'||gate.state==='live')s.hazards.push({origin:ID,gate:i,x,y:280,w:28,h:118,kind:'surge',timer:gate.state==='charging'?gate.remaining:-.01,life:TIMING.live,impacted:true});
    });
  }
  function claim(s,choice){
    if(s.mode!=='surge-reward'||s.surge?.status!=='reward'||s.completedEvents.includes(ID)||!['rails','overclock'].includes(choice))return false;
    if(!s.weaponMods.includes(choice))s.weaponMods.push(choice);
    s.completedEvents.push(ID);s.surge.reward=choice;s.surge.status='claimed';
    // Commit only the earned modifier and completion flag, not post-checkpoint score or pickups.
    for(const kit of [s.startKit,s.saved?.kit])if(kit){kit.weaponMods=[...s.weaponMods];kit.completedEvents=[...s.completedEvents];}
    Object.assign(s.player,{x:s.surge.entryX+30,y:s.surge.entryY,vx:0,vy:0,grounded:s.surge.entryGrounded});
    s.camera=Math.max(0,Math.min(s.width-960,s.player.x-280));
    clearHazards(s);s.bullets=[];s.mode='playing';s.surge.notice=2.2;return true;
  }
  const api={create,nearby,inspect,enter,leave,update,claim,gateState,TIMING,ID,START,END,GATES};
  if(typeof module!=='undefined')module.exports=api;else root.KekReactor=api;
})(globalThis);
