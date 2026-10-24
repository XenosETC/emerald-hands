(function(root){
  'use strict';
  const WIDTH=4200,GROUND=398;
  const Missions=typeof module!=='undefined'?require('./missions.js'):root.KekMissions;
  const Arsenal=typeof module!=='undefined'?require('./arsenal.js'):root.KekArsenal;
  const Reactor=typeof module!=='undefined'?require('./reactor-surge.js'):root.KekReactor;
  const platforms=[{x:400,y:320,w:210},{x:820,y:280,w:200},{x:1190,y:330,w:180},{x:1610,y:285,w:240},{x:2060,y:325,w:220},{x:2490,y:280,w:220},{x:2920,y:325,w:160}];
  const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  function createBase(){return {mode:'ready',time:0,score:0,kills:0,camera:0,shake:0,checkpoint:70,combo:0,chain:0,banner:0,hazards:[],player:{x:70,y:GROUND-44,w:26,h:44,vx:0,vy:0,face:1,hp:5,inv:0,cool:0,grounded:true,weapon:'RIFLE',grenades:3,grenadeCool:0,dashTime:0,dashCool:0},enemies:[550,930,1280,1500,1800,2190,2400,2630,2850,3110].map((x,i)=>({x,y:GROUND-38,w:28,h:38,hp:i%3===2?5:3,type:i%3===2?'turret':'soldier',cool:1.1+i%3*.3,flash:0})),bullets:[],particles:[],pickups:[{x:710,y:365,w:24,h:24,type:'S'},{x:1920,y:365,w:24,h:24,type:'H'},{x:2780,y:365,w:24,h:24,type:'S'}],boss:{x:3920,y:244,w:155,h:154,hp:90,max:90,cool:1.5,active:false,flash:0},events:[]};}
  function create(id=1){
    const s=createBase(),m=Missions.get(id);s.mission=m.id;s.width=m.width;s.platforms=m.platforms;s.startScore=0;s.startKills=0;s.weapons=['RIFLE'];s.upgrades=[];s.weaponMods=[];s.completedEvents=[];s.surge=Reactor.create();s.combat={shots:0,hits:0,pierces:0};s.startKit=Arsenal.snapshot(s);
    if(m.id===2){
      s.enemies=m.enemies.map(([type,x],i)=>({type,x,y:type==='drone'?270: type==='crawler'?374:360,baseY:270,w:type==='drone'?40:28,h:type==='crawler'?24:type==='drone'?26:38,hp:type==='rocketeer'?5:3,cool:1.2+i%3*.3,flash:0}));
      s.pickups=[{x:680,y:365,w:24,h:24,type:'S'},{x:2240,y:365,w:24,h:24,type:'H'},{x:3540,y:365,w:24,h:24,type:'H'}];
      s.boss={x:4490,baseX:4490,y:238,w:170,h:160,hp:120,max:120,cool:1.8,active:false,flash:0,type:'warden'};
    }
    if(m.id===3){
      s.enemies=m.enemies.map(([type,x],i)=>({type,x,y:type==='wisp'?285:360,baseY:285,w:30,h:type==='wisp'?30:38,hp:type==='wisp'?3:4,cool:1.3+i%3*.3,flash:0}));
      s.pickups=[{x:640,y:365,w:24,h:24,type:'P'},{x:1960,y:365,w:24,h:24,type:'H'},{x:3220,y:365,w:24,h:24,type:'H'}];
      s.boss={x:4080,baseX:4080,y:235,w:165,h:163,hp:110,max:110,cool:1.8,active:false,flash:0,type:'bloom'};
    }
    return s;
  }
  function advance(previous){
    const next=Missions.next(previous.mission);if(previous.mode!=='won'||!next)return null;
    const s=create(next.id);s.mode='playing';s.score=s.startScore=previous.score;s.kills=s.startKills=previous.kills;
    Arsenal.restore(s,Arsenal.snapshot(previous));s.startKit=Arsenal.snapshot(s);s.startWeapon=s.player.weapon;s.realmArrival=2.2;return s;
  }
  function mission(s){return Missions.get(s.mission);}
  function aimedShot(s,x,y,speed,offset=0,kind='bullet',target=null){
    const angle=Math.atan2((target?.y??s.player.y+20)-y,(target?.x??s.player.x+13)-x)+offset;
    s.bullets.push({x,y,w:kind==='rocket'?13:7,h:kind==='rocket'?8:7,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,owner:'enemy',kind,life:4});
  }
  function updateFoundryEnemy(s,e,dt){
    const p=s.player;if(s.boss.active||s.surge.status==='active'||Math.abs(e.x-p.x)>600)return;
    e.stagger=Math.max(0,(e.stagger||0)-dt);if(e.stagger>0){e.state='stagger';return;}
    e.cool-=dt;
    e.state=e.cool<.5?'windup':e.recoil>.1?'recovery':'patrol';
    if(e.cool<.5&&!e.lock)e.lock={x:p.x+13,y:p.y+20};
    if(e.type==='crawler'){
      e.charge=Math.max(0,(e.charge||0)-dt);
      if(e.cool<=0){e.charge=.45;e.direction=Math.sign((e.lock?.x??p.x)-e.x);e.lock=null;e.cool=2.55;s.events.push('warning');}
      e.vx=e.charge>0?e.direction*235:e.cool<.4?0:Math.sign(p.x-e.x)*30;
      e.x=Math.max(0,Math.min(s.width-30,e.x+e.vx*dt));
    }else if(e.type==='drone'){
      e.y=e.baseY+Math.sin(s.time*2.5+e.x*.01)*25;
      if(e.cool<=0){aimedShot(s,e.x+20,e.y+20,175,0,'bullet',e.lock);e.lock=null;e.cool=1.9;e.recoil=1;}
    }else if(e.type==='rocketeer'&&e.cool<=0){
      aimedShot(s,e.x+14,e.y+12,195,-.035,'rocket',e.lock);e.lock=null;e.cool=2.5;e.recoil=1;
    }
    e.state=e.type==='crawler'&&e.charge>0?'charge':e.cool<.5?'windup':e.recoil>.1?'recovery':'patrol';
    e.animStride=(e.animStride||0)+Math.abs(e.vx||0)*dt*.12;
    if(hit(p,e))damage(s);
  }
  function updateWarden(s,dt){
    const b=s.boss,p=s.player;if(!b.active||b.hp<=0)return;
    if(b.phase===2&&!b.phaseAnnounced){b.phaseAnnounced=true;b.cool+=.65;b.phaseBanner=1.4;}
    b.phaseBanner=Math.max(0,(b.phaseBanner||0)-dt);
    b.exposed=b.attack>0&&b.cool>1;
    b.x=b.baseX+Math.sin(s.time*1.4)*16;b.flash=Math.max(0,b.flash-dt);b.cool-=dt;
    if(b.cool<.8&&!b.marked){
      b.marked=true;
      if(b.attack%2===0){
        const high=b.phase===2&&b.attack%4===0;
        s.hazards.push({kind:'beam',x:(mission(s).arena+b.x)/2,y:high?290:374,w:b.x-mission(s).arena,h:14,timer:1.1,life:.18,high});
        b.intent=high?'HIGH RAIL / STAY LOW':'LOW RAIL / JUMP';
      }else{
        s.hazards.push({kind:'missile',x:p.x+13,y:GROUND-48,w:90,h:48,timer:1,life:.2});
        if(b.phase===2)s.hazards.push({kind:'missile',x:Math.max(mission(s).arena+50,p.x-145),y:GROUND-48,w:90,h:48,timer:1.2,life:.2});
        b.intent='MISSILE LOCK / KEEP MOVING';
      }
      s.events.push('warning');
    }
    if(b.cool<=0){
      if(b.attack%2===1){aimedShot(s,b.x,b.y+65,195,-.2,'rocket');aimedShot(s,b.x,b.y+65,195,.2,'rocket');}
      b.attack++;b.marked=false;b.cool=b.phase===2?1.85:2.15;b.recoil=1;s.events.push('boss');
    }
    b.recoil=Math.max(0,(b.recoil||0)-dt*5);if(hit(p,b))damage(s);
  }
  function updateRift(s,dt){
    const p=s.player;
    for(const e of s.enemies){
      if(e.hp<=0||s.boss.active||Math.abs(e.x-p.x)>620)continue;
      e.flash=Math.max(0,e.flash-dt);e.stagger=Math.max(0,(e.stagger||0)-dt);
      e.recoil=Math.max(0,(e.recoil||0)-dt*4);e.land=Math.max(0,(e.land||0)-dt*4);e.recover=Math.max(0,(e.recover||0)-dt);
      if(e.stagger>0){e.state='stagger';continue;}
      e.cool-=dt;
      if(e.cool<.5&&!e.lock)e.lock={x:p.x+13,y:p.y+20};
      if(e.type==='wisp'){
        e.y=e.baseY+Math.sin(s.time*2+e.x*.01)*30;
        if(e.cool<=0){aimedShot(s,e.x+15,e.y+15,165,0,'spore',e.lock);e.lock=null;e.cool=2.2;e.recoil=1;e.recover=.3;}
      }else{
        if(e.cool<=0){
          const target=e.lock?.x??p.x;e.launchX=e.x;e.landingX=Math.max(0,Math.min(s.width-30,e.x+Math.max(-130,Math.min(130,target-e.x))));
          e.direction=Math.sign(e.landingX-e.x)||1;e.leap=.72;e.lock=null;e.cool=2.8;
        }
        const wasLeaping=e.leap>0;e.leap=Math.max(0,(e.leap||0)-dt);
        if(wasLeaping){const progress=1-e.leap/.72;e.x=e.launchX+(e.landingX-e.launchX)*progress;e.y=360-Math.sin(progress*Math.PI)*78;}
        if(wasLeaping&&!e.leap){e.land=1;e.recover=.28;burst(s,e.x+15,GROUND,'#9daf91',7);}
      }
      e.state=e.leap>0?'leap':e.recover>0?'recovery':e.cool<.5?'windup':'patrol';
      if(hit(p,e))damage(s);
    }
    const b=s.boss;if(!b.active||b.hp<=0)return;
    if(b.phase===2&&!b.phaseAnnounced){b.phaseAnnounced=true;b.cool+=.75;b.phaseBanner=1.5;s.events.push('bloom-phase');}
    b.phaseBanner=Math.max(0,(b.phaseBanner||0)-dt);b.cool-=dt;b.flash=Math.max(0,b.flash-dt);b.x=b.baseX+Math.sin(s.time)*12;
    b.exposed=b.attack>0&&b.cool>1.1;b.exposureBonus=1.15;
    const open=b.exposed?1:b.marked?.2:.55;b.bloomOpen=(b.bloomOpen??.55)+(open-(b.bloomOpen??.55))*Math.min(1,dt*6);
    if(b.cool<.6&&!b.marked){
      b.marked=true;b.intent=b.attack%2?'SPORE LOCK / LEAVE THE MARK':'ROOT WAVE / HOLD JUMP';
      if(b.attack%2){
        s.hazards.push({kind:'root',x:p.x+13,y:GROUND-42,w:90,h:42,timer:1.1,life:.2});
        if(b.phase===2)s.hazards.push({kind:'root',x:Math.max(mission(s).arena+45,p.x-135),y:GROUND-42,w:90,h:42,timer:1.4,life:.2});
      }else s.hazards.push({kind:'rootwave',x:b.x-35,y:378,w:72,h:20,timer:1.05,life:3,vx:-290});
      s.events.push('warning');
    }
    if(b.cool<=0){
      if(b.attack%2){for(let i=-1;i<=1;i++)aimedShot(s,b.x,b.y+75,160,i*.18,'spore');}
      b.cool=b.phase===2?2.05:2.4;b.attack++;b.marked=false;s.events.push('boss');
    }
    if(hit(p,b))damage(s);
  }
  function burst(s,x,y,color,n=16){for(let i=0;i<n;i++)s.particles.push({x,y,vx:Math.cos(i*2.4)* (40+i%5*25),vy:Math.sin(i*2.4)*100-40,life:.4+i%4*.12,color});}
  // Checkpoints capture earned progress once; retry restores rather than duplicating it.
  function checkpoint(s,x){
    s.checkpoint=x;s.player.hp=Math.min(5,s.player.hp+2);s.player.grenades=Math.max(2,s.player.grenades);
    s.saved={x,score:s.score,kills:s.kills,time:s.time,weapon:s.player.weapon,grenades:s.player.grenades,enemies:s.enemies.map(e=>({...e})),pickups:s.pickups.map(p=>({...p})),kit:Arsenal.snapshot(s)};
    s.banner=2.5;s.events.push('checkpoint');
  }
  function retry(previous){
    const saved=previous.saved,s=create(previous.mission);s.mode='playing';s.score=s.startScore=previous.startScore||0;s.kills=s.startKills=previous.startKills||0;Arsenal.restore(s,previous.startKit||{weapons:[previous.startWeapon||'RIFLE'],upgrades:[],weapon:previous.startWeapon||'RIFLE'});s.startKit=Arsenal.snapshot(s);s.player.weapon=s.startWeapon=previous.startWeapon||s.player.weapon;if(!saved)return s;
    s.saved=JSON.parse(JSON.stringify(saved));s.checkpoint=saved.x;s.score=saved.score;s.kills=saved.kills;s.time=saved.time;if(saved.kit)Arsenal.restore(s,saved.kit);
    s.enemies=saved.enemies.map(e=>({...e}));s.pickups=saved.pickups.map(p=>({...p}));
    Object.assign(s.player,{x:saved.x,weapon:saved.weapon,grenades:saved.grenades,inv:1.5});
    s.boss.active=saved.x===mission(s).bossCheckpoint;s.camera=Math.max(0,Math.min(s.width-960,s.player.x-280));return s;
  }
  function damage(s){const p=s.player;if(p.inv||p.dashTime>0||s.mode!=='playing')return;p.hp--;p.hurt=1;p.inv=1.5;s.combo=0;s.chain=0;s.shake=.2;s.events.push('hurt');burst(s,p.x+12,p.y+15,'#e6bb69');if(p.hp<=0)s.mode='dead';}
  function impact(s,x,y,color='#ffe1a2',large=false){
    s.effects??=[];s.effects.push({x,y,kind:large?'blast':'hit',life:large?.5:.16,max:large?.5:.16});
    burst(s,x,y,color,large?28:7);
  }
  // Finish explosions after a result without advancing combat, rewards or inputs.
  function settle(s,dt){
    if(!['won','dead'].includes(s.mode))return;
    s.terminalAge=(s.terminalAge||0)+dt;if(s.terminalAge>.8)return;
    for(const fx of s.effects||[])fx.life-=dt;s.effects=(s.effects||[]).filter(fx=>fx.life>0);
    for(const a of s.particles){a.life-=dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.vy+=250*dt;}s.particles=s.particles.filter(a=>a.life>0);
  }
  function kill(s,e){s.combo=Math.min(4,s.combo+1);s.chain=3;s.score+=(e.type==='turret'?250:150)*s.combo;s.kills++;impact(s,e.x+14,e.y+15,e.type==='wisp'||e.type==='stalker'?'#c2d8cd':'#f2a760',true);if(e.type==='wisp'||e.type==='stalker')s.effects.push({kind:'riftbreak',x:e.x+14,y:e.y+16,life:.45,max:.45});s.hitstop=.028;s.shake=.12;s.events.push('kill');if(e.type==='soldier'||e.type==='rocketeer')s.effects.push({x:e.x+13,y:e.y+22,kind:'fallen',face:Math.sign(e.hitDirection||1),life:.45,max:.45});s.effects.push({x:e.x+14,y:e.y-5,kind:'score',value:(e.type==='turret'?250:150)*s.combo,life:.7,max:.7});}
  function update(s,dt,input={}){
    if(s.mode!=='playing')return;
    if(s.hitstop>0){s.hitstop=Math.max(0,s.hitstop-dt);return;}
    s.time+=dt;s.realmArrival=Math.max(0,(s.realmArrival||0)-dt);s.shake=Math.max(0,s.shake-dt);const p=s.player;
    s.effects??=[];for(const fx of s.effects){fx.life-=dt;if(fx.kind==='shell'){fx.x+=fx.vx*dt;fx.y+=fx.vy*dt;fx.vy+=550*dt;}}s.effects=s.effects.filter(fx=>fx.life>0);
    p.recoil=Math.max(0,(p.recoil||0)-dt*(p.shotStyle==='overclock'?13:9));p.hurt=Math.max(0,(p.hurt||0)-dt*7);p.land=Math.max(0,(p.land||0)-dt*5);
    const previousStride=p.stride||0;
    p.stride=previousStride+Math.abs(p.vx)*dt*.1;
    if(p.grounded&&p.dashTime<=0&&Math.floor(p.stride/Math.PI)!==Math.floor(previousStride/Math.PI))burst(s,p.x+13,p.y+44,s.mission===2?'#9daea4':'#82916c',3);
    const wasGrounded=p.grounded;
    p.coyote=wasGrounded?.085:Math.max(0,(p.coyote||0)-dt);
    if(input.jump&&!p.jumpHeld)p.jumpBuffer=.11;else p.jumpBuffer=Math.max(0,(p.jumpBuffer||0)-dt);
    p.jumpAge=(p.jumpAge||0)+dt;
    if(!input.jump&&p.jumpAge>.1&&p.vy<-170)p.vy=-170;
    p.jumpHeld=!!input.jump;
    s.combo??=0;s.chain=Math.max(0,(s.chain||0)-dt);if(!s.chain)s.combo=0;s.banner=Math.max(0,(s.banner||0)-dt);s.hazards??=[];
    p.dashCool=Math.max(0,(p.dashCool||0)-dt);p.dashTime=Math.max(0,(p.dashTime||0)-dt);
    if(input.dash&&!p.dashCool){p.dashTime=.19;p.dashCool=s.upgrades.includes('coil')?1.25:1.6;p.dashFace=input.left?-1:input.right?1:p.face;s.events.push('dash');}
    p.inv=Math.max(0,p.inv-dt);p.cool-=dt;p.grenadeCool-=dt;
    p.vx=p.dashTime>0?p.dashFace*570:((input.right?1:0)-(input.left?1:0))*205;if(p.vx)p.face=Math.sign(p.vx);
    if(p.jumpBuffer>0&&p.coyote>0){p.vy=-440;p.jumpAge=0;p.grounded=false;p.coyote=0;p.jumpBuffer=0;s.events.push('jump');burst(s,p.x+13,p.y+44,'#8d9d71',5);}
    const oldBottom=p.y+p.h;p.vy+=1120*dt;p.x=Math.max(s.surge.status==='active'?Reactor.START:s.boss.active?mission(s).arena:0,Math.min(s.surge.status==='active'?Reactor.END+5:s.width-p.w,p.x+p.vx*dt));p.y+=p.vy*dt;p.grounded=false;
    if(p.y+p.h>=GROUND){p.y=GROUND-p.h;p.vy=0;p.grounded=true;}
    for(const f of s.platforms)if(p.vy>=0&&oldBottom<=f.y+1&&p.y+p.h>=f.y&&p.x+p.w>f.x&&p.x<f.x+f.w){p.y=f.y-p.h;p.vy=0;p.grounded=true;}
    Reactor.update(s,dt);if(s.mode!=='playing')return;
    if(p.grounded&&!wasGrounded){p.land=1;s.events.push('land');burst(s,p.x+13,p.y+44,'#8d9d71',6);}
    p.aim=input.up?(p.vx?-Math.PI/4:-Math.PI/2):input.down&&!p.grounded?(p.vx?Math.PI/4:Math.PI/2):0;
    if(input.fire&&p.cool<=0){const gun=Arsenal.tuned(s);p.cool=gun.cadence;let dx=p.face,dy=0;if(input.up){dy=-1;dx=p.vx?p.face:0;}else if(input.down&&!p.grounded){dy=1;dx=p.vx?p.face:0;}const angle=Math.atan2(dy,dx);for(const offset of gun.angles)s.bullets.push({x:p.x+13+Math.cos(angle)*46,y:p.y+21+Math.sin(angle)*46,w:8,h:4,vx:Math.cos(angle+offset)*gun.speed,vy:Math.sin(angle+offset)*gun.speed,owner:'player',life:1.3,damage:gun.damage,pierce:gun.pierce,weapon:p.weapon,mod:s.weaponMods[0]||null,hitTargets:[]});p.recoil=1;p.shotStyle=s.weaponMods[0]||'standard';s.combat.shots++;s.events.push('shot');s.effects.push({x:p.x+13,y:p.y+22,vx:-p.face*65,vy:-110,kind:'shell',life:.45,max:.45});}
    if(input.grenade&&p.grenades>0&&p.grenadeCool<=0){p.grenades--;p.grenadeCool=.6;s.bullets.push({x:p.x+12,y:p.y,w:9,h:9,vx:p.face*290,vy:-310,owner:'grenade',life:1.1});s.events.push('grenade');}
    const cameraTarget=Math.max(0,Math.min(s.width-960,p.x-280));s.camera+=(cameraTarget-s.camera)*(1-Math.exp(-12*dt));
    for(const e of s.enemies){if(e.hp<=0||s.mission===3)continue;e.flash=Math.max(0,e.flash-dt);e.recoil=Math.max(0,(e.recoil||0)-dt*7);if(s.mission===2){updateFoundryEnemy(s,e,dt);continue;}if(Math.abs(e.x-p.x)>730)continue;e.stagger=Math.max(0,(e.stagger||0)-dt);if(e.stagger>0)continue;e.cool-=dt;if(e.cool<=0){e.recoil=1;const a=Math.atan2(p.y+20-e.y-12,p.x-e.x);s.bullets.push({x:e.x+14,y:e.y+12,w:7,h:7,vx:Math.cos(a)*205,vy:Math.sin(a)*205,owner:'enemy',life:4});e.cool=e.type==='turret'?1.05:1.65;}if(e.type==='soldier'&&Math.abs(e.x-p.x)>200)e.x+=Math.sign(p.x-e.x)*27*dt;if(hit(p,e))damage(s);}
    const boss=s.boss,m=mission(s);if(p.x>m.checkpoint-20&&s.checkpoint<m.checkpoint)checkpoint(s,m.checkpoint);
    if(p.x>m.bossTrigger&&!boss.active){boss.active=true;s.bullets=s.bullets.filter(b=>b.owner==='player');checkpoint(s,m.bossCheckpoint);}
    boss.phase=boss.hp<=boss.max/2?2:1;boss.attack??=0;
    // Mortars lock a location before impact; they never track the player afterward.
    if(s.mission===1&&boss.active&&boss.hp>0&&boss.cool<.38&&boss.attack%2===1&&!boss.marked){boss.marked=true;s.hazards.push({x:p.x+13,y:GROUND-46,w:100,h:46,timer:1.05,life:.22,kind:'mortar'});if(boss.phase===2)s.hazards.push({x:Math.max(3290,p.x-150),y:GROUND-46,w:100,h:46,timer:1.25,life:.22,kind:'mortar'});s.events.push('warning');}
    if(s.mission===2)updateWarden(s,dt);if(s.mission===3)updateRift(s,dt);
    if(s.mission===1&&boss.active&&boss.hp>0){boss.cool-=dt;boss.flash=Math.max(0,boss.flash-dt);if(boss.cool<=0){boss.cool=boss.phase===2?1.05:1.65;if(boss.attack%2===0){for(let i=-1;i<=1;i++){const a=Math.atan2(p.y+20-(boss.y+74),p.x-boss.x)+i*.18;s.bullets.push({x:boss.x,y:boss.y+74,w:10,h:10,vx:Math.cos(a)*225,vy:Math.sin(a)*225,owner:'enemy',life:4});}}boss.attack++;boss.marked=false;s.events.push('boss');}if(hit(p,boss))damage(s);}
    for(const h of s.hazards){h.timer-=dt;if(h.timer<=0){if(h.vx)h.x+=h.vx*dt;if(!h.impacted){h.impacted=true;burst(s,h.x,GROUND-10,h.kind==='rootwave'||h.kind==='root'?'#bcd7b7':'#ffbd76',24);s.shake=.2;s.events.push('boom');}h.life-=dt;if(hit(p,{x:h.x-h.w/2,y:h.y,w:h.w,h:h.h}))damage(s);}}
    s.hazards=s.hazards.filter(h=>h.timer>0||h.life>0);
    for(const b of s.bullets){b.life-=dt;const previousX=b.x,previousY=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;const sweep={x:Math.min(previousX,b.x),y:Math.min(previousY,b.y),w:b.w+Math.abs(b.x-previousX),h:b.h+Math.abs(b.y-previousY)};if(b.owner==='grenade'){b.vy+=700*dt;if(b.y>=GROUND-8||b.life<=0){b.life=0;impact(s,b.x,b.y,'#ffd18a',true);s.shake=.3;s.events.push('boom');for(const e of s.enemies)if(e.hp>0&&Math.hypot(e.x-b.x,e.y-b.y)<180){e.hp-=8;if(e.hp<=0)kill(s,e);}if(boss.hp>0&&Math.hypot(boss.x+40-b.x,boss.y+90-b.y)<220){boss.hp-=15;boss.flash=.12;}}}else if(b.owner==='player'){for(const e of s.enemies)if(e.hp>0&&!(b.hitTargets||[]).includes(s.enemies.indexOf(e))&&hit(sweep,e)){e.hp-=b.damage;e.flash=.1;e.stagger=.09;e.hitDirection=Math.sign(b.vx);impact(s,b.x,b.y,b.mod==='rails'?'#a8f1e3':b.mod==='overclock'?'#f6c791':'#ffe1a2');s.combat.hits++;s.events.push('hit');b.hitTargets??=[];b.hitTargets.push(s.enemies.indexOf(e));b.pierce=(b.pierce||1)-1;if(b.pierce<=0)b.life=0;else if(b.mod==='rails'){s.combat.pierces++;s.effects.push({kind:'pierce',x:e.x+e.w/2,y:b.y,angle:Math.atan2(b.vy,b.vx),life:.18,max:.18});s.events.push('pierce');}if(e.hp<=0)kill(s,e);break;}if(b.life>0&&boss.active&&boss.hp>0&&hit(sweep,boss)){boss.hp-=b.damage*(boss.exposed?(boss.exposureBonus||1.25):1);boss.flash=.08;b.life=0;impact(s,b.x,b.y,'#c3f389');s.events.push('hit');}}else if(hit(sweep,p)){damage(s);b.life=0;}}
    s.bullets=s.bullets.filter(b=>b.life>0&&b.x>s.camera-150&&b.x<s.camera+1150&&b.y>-100&&b.y<520);
    for(const item of s.pickups)if(!item.used&&hit(p,item)){item.used=true;if(item.type==='S')Arsenal.unlock(s,'SPREAD');else if(item.type==='P')Arsenal.unlock(s,'PULSE');else p.hp=Math.min(5,p.hp+2);s.score+=100;burst(s,item.x,item.y,'#c5ed8b');s.events.push('pickup');}
    for(const a of s.particles){a.life-=dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.vy+=250*dt;}s.particles=s.particles.filter(a=>a.life>0);
    if(boss.hp<=0&&s.mode==='playing'){boss.hp=0;s.mode='won';s.score+=5000+p.hp*500;impact(s,boss.x+70,boss.y+60,'#ffcc80',true);impact(s,boss.x+20,boss.y+110,'#ffcc80',true);impact(s,boss.x+130,boss.y+30,'#ffcc80',true);s.events.push('win');}
  }
  const api={create,advance,mission,inspectSurge:Reactor.inspect,enterSurge:Reactor.enter,leaveSurge:Reactor.leave,claimSurge:Reactor.claim,reward:Arsenal.reward,swap:Arsenal.swap,update,retry,settle,hit,platforms,GROUND,WIDTH};if(typeof module!=='undefined')module.exports=api;else root.KekEngine=api;
})(globalThis);
