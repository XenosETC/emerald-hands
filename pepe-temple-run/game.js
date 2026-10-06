(() => {
  'use strict';
  const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),$=id=>document.getElementById(id);
  const hero=new Image();hero.src='../assets/pepes-paradox/crown-platformer-idle.png';
  const sheet=new Image();sheet.src='../assets/pepes-paradox/crown-platformer-sheet.png';
  const KEY='pepe-temple-run-v1';let best=0;try{best=Number(JSON.parse(localStorage.getItem(KEY))?.best)||0;}catch{}
  let magnet=0,shield=false,corrupted=false,shards=0,realmEntry=null;let w,h,time=0,last=0,audio,sound=false,state='ready',lane=1,visualLane=1,distance=0,jade=0,speed=25,action='',actionTime=0,objects=[],spawn=0,seed=0xC0FFEE,shake=0;
  let row=0,route=1,combo=0,comboTime=0,notice='',noticeTime=0,milestone=0,canvasRatio=0;
  $('start').disabled=true;$('start').textContent='Opening the temple…';
  $('focus')?.addEventListener('click',()=>{const active=document.body.classList.toggle('play-focus');$('focus').setAttribute('aria-pressed',String(active));$('focus').textContent=active?'Exit focus ⤡':'Focus view ⤢';});
  $('best').innerHTML=`${Math.floor(best)} <i>m</i>`;
  function rand(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;}
  function resize(){const r=canvas.getBoundingClientRect();w=r.width;h=r.height;const ratio=Math.min(devicePixelRatio,2);canvasRatio=ratio;canvas.width=Math.floor(w*ratio);canvas.height=Math.floor(h*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);}new ResizeObserver(resize).observe(canvas);
  function tone(f,d=.1){if(!sound)return;audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.055,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+d);}
  function begin(){if(!window.templeCharacter?.loaded){$('message').textContent='Summoning the Rumble Crown character… Give it a moment, then enter.';return;}touch=null;corrupted=false;shards=0;realmEntry=null;const currencyLabel=$('jade-label')||$('jade').previousElementSibling;if(currencyLabel)currencyLabel.textContent='JADE';$('jade').textContent='0';const flowLabel=document.getElementById('flow-count')?.previousElementSibling;if(flowLabel)flowLabel.textContent='JADE FLOW';$('zone').textContent='01 / JADE CAUSEWAY';if($('zone-next'))$('zone-next').textContent='FIRST FROG GATE / REALM RIFT';state='running';window.TempleFeedback?.reset();window.TempleTurns?.reset();if(document.getElementById('turn-warning'))document.getElementById('turn-warning').hidden=true;magnet=0;shield=false;lane=visualLane=1;distance=jade=0;speed=25;objects=[];spawn=0;row=0;route=1;combo=0;comboTime=0;milestone=0;notice='FOLLOW THE JADE / ↑ JUMP · ↓ SLIDE';noticeTime=5;action='';actionTime=0;seed=0xC0FFEE;$('overlay').hidden=true;$('pause').textContent='Ⅱ';$('toast').textContent='';last=performance.now();tone(220,.3);}
  function pause(){if(state==='running'){touch=null;state='paused';$('pause').textContent='▶';$('pause').setAttribute('aria-label','Resume game');show('TAKE A BREATH','Temple on hold.','Your next step can wait.','Continue running');}else if(state==='paused'){state='running';$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Pause game');$('overlay').hidden=true;last=performance.now();}}
  function show(over,title,message,button){if(document.getElementById('turn-warning'))document.getElementById('turn-warning').hidden=true;$('overline').textContent=over;$('title').textContent=title;$('message').textContent=message;$('start').innerHTML=button+' <span>↗</span>';$('overlay').hidden=false;}
  function runResult(distance,jade,previousBest,type,shards=null){
    const meters=Math.floor(distance),best=Math.max(previousBest,meters),newBest=meters>previousBest,corner=type.startsWith('turn-');
    const coaching=corner?'Press or swipe '+type.slice(5)+' in the final 28 m.':type==='gap'?'Jump over broken bridges.':type==='gate'?'Slide under the low arches.':type==='boulder'?'Dodge rolling jade stones.':type==='spire'?'Dodge the corruption thorns.':'Dodge stone idols.';
    return {best,overline:newBest?'NEW PERSONAL BEST':'RUN ENDED',title:corner?'Missed the '+type.slice(5)+' corner.':type==='gap'?'Bridge missed.':type==='gate'?'Low arch collision.':type==='boulder'?'Rolling stone collision.':type==='spire'?'Corruption thorn collision.':'Stone idol collision.',message:`${meters} m escaped · ${jade} jade${shards===null?'':' · '+shards+' shards'} · Best ${best} m.\n${coaching}`};
  }
  function die(type){state='dead';shake=15;tone(85,.4);const result=runResult(distance,jade,best,type,corrupted?shards:null);best=result.best;try{localStorage.setItem(KEY,JSON.stringify({best}));}catch{}$('best').innerHTML=`${best} <i>m</i>`;show(result.overline,result.title,result.message,'Run it back');}
  function input(k){if(k==='pause'){pause();return;}if(state!=='running')return;const corner=window.TempleTurns?.input(k);if(corner?.handled){notice=corner.correct?'TURN LOCKED':"TURN "+corner.direction.toUpperCase()+" / OTHER WAY";noticeTime=1;window.TempleFeedback?.emit('clear',{lane,label:corner.correct?'TURN LOCKED':'OTHER WAY'});return;}if(k==='left')lane=Math.max(0,lane-1);if(k==='right')lane=Math.min(2,lane+1);if((k==='jump'||k==='slide')&&!action){action=k;actionTime=k==='jump'?.85:.75;tone(k==='jump'?300:160);} }
  window.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&e.target?.closest?.('[data-action]')){if(e.repeat)e.preventDefault();return;}const map={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'jump',w:'jump',W:'jump',' ':'jump',ArrowDown:'slide',s:'slide',S:'slide',Escape:'pause',p:'pause'};if(map[e.key]){e.preventDefault();if(!e.repeat)input(map[e.key]);}if(e.key==='Enter'&&state!=='running'){e.preventDefault();if(!e.repeat&&!$('start').disabled)$('start').click();}});
  $('start').onclick=()=>state==='paused'?pause():begin();$('pause').onclick=pause;$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';if(sound)tone(440);};
  document.querySelectorAll('[data-action]').forEach(b=>{b.addEventListener('pointerdown',e=>{if(e.isPrimary===false||e.button!==0)return;e.preventDefault();input(b.dataset.action);});b.addEventListener('click',e=>{if(e.detail===0)input(b.dataset.action);});});let touch;
  canvas.addEventListener('pointerdown',e=>{if(touch||e.isPrimary===false||e.button!==0||state!=='running')return;touch={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointerup',e=>{if(!touch||touch.id!==e.pointerId)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;touch=null;if(Math.max(Math.abs(dx),Math.abs(dy))>20)input(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy<0?'jump':'slide');});
  const cancelSwipe=e=>{if(touch&&touch.id===e.pointerId)touch=null;};canvas.addEventListener('pointercancel',cancelSwipe);canvas.addEventListener('lostpointercapture',cancelSwipe);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='running')pause();});
  window.addEventListener('blur',()=>{if(state==='running')pause();});
  function project(l,z){if(window.templeTrack?.loaded&&window.templeWorldProject)return window.templeWorldProject(l,z);const p=Math.pow(Math.max(0,1-z/150),2);return{x:w/2+(l-1)*w*.245*p+(window.TempleTurns?.diagnostics().visualBend||0)*w*.105*Math.pow(1-p,2),y:h*.43+h*.52*p,s:p};}
  function poly(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();}
  function rect(x,y,ww,hh,c){ctx.fillStyle=c;ctx.fillRect(x,y,ww,hh);}
  function nextPattern(){
    const add=(l,z,type)=>objects.push({lane:l,z,type,hit:false,pattern:row});
    // The first three rows introduce one action at a time; every row has an escape.
    if(row<3){
      const type=['gap','gate','idol','boulder'][row];add(1,150,type);route=row===2?2:1;
      if(row===2)add(0,150,'idol');
    }else{
      // A clear route may only move one lane per row, even at maximum speed.
      const options=[route];if(route>0)options.push(route-1);if(route<2)options.push(route+1);
      route=options[Math.floor(rand()*options.length)];
      const idolType=corrupted?'spire':'idol',types=row>4?['boulder','gap','gate',idolType]:[idolType,'gap','gate'];
      for(let l=0;l<3;l++)if(l!==route){
        // Ease into two-lane challenges after the three teaching rows.
        if(row<5&&rand()<.5)continue;
        add(l,150,types[(row+l)%types.length]);
      }
    }
    // Coins precede the hazard so the intended lane is visible early.
    for(const z of [118,126,134,142,154])add(route,z,'jade');
    if(row>2&&row%5===3)add(route,161,row%10===3?'shield':'magnet');
    row++;spawn+=Math.max(52,80-distance/65);
  }
  function update(dt){
    window.TempleFeedback?.update(dt);
    magnet=Math.max(0,magnet-dt);noticeTime=Math.max(0,noticeTime-dt);comboTime=Math.max(0,comboTime-dt);if(comboTime===0)combo=0;
    const travelled=speed*dt;distance+=travelled;speed=Math.min(49,25+distance/110);visualLane+=(lane-visualLane)*Math.min(1,dt*13);
    const turnEvent=window.TempleTurns?.update(distance,dt),turn=window.TempleTurns?.diagnostics();
    if(turnEvent?.type==='missed'){die('turn-'+turnEvent.direction);return;}
    if(turnEvent?.type==='completed'){lane=visualLane=route=1;action='';actionTime=0;spawn=Math.max(spawn,25);notice='CLEAN CORNER / KEEP THE CROWN MOVING';noticeTime=2;window.TempleFeedback?.emit('clear',{lane,label:'CLEAN CORNER'});tone(900,.2);}
    // Clear the corner approach of hazards and stop rows landing around the bend.
    if(turn)objects=objects.filter(o=>!['idol','gap','gate','boulder','spire'].includes(o.type)||Math.abs(distance+o.z-7-turn.nextDistance)>60);
    if(actionTime>0){actionTime-=dt;if(actionTime<=0)action='';}
    spawn-=travelled;if(spawn<=0){if(turn&&Math.abs(distance+143-turn.nextDistance)<95)spawn=15;else nextPattern();}
    for(const o of objects){
      o.z-=travelled;
      if(!o.hit&&o.z<=7){
        o.hit=true;
        if(o.lane===lane||(o.type==='jade'&&magnet>0)){
          if(o.type==='magnet'){magnet=10;tone(850,.3);window.TempleFeedback?.emit('magnet',{lane,label:corrupted?'SHARD MAGNET':'JADE MAGNET'});}
          else if(o.type==='shield'){shield=true;tone(500,.3);window.TempleFeedback?.emit('chain',{lane,label:'CROWN PROTECTED'});}
          else if(o.type==='jade'){if(corrupted)shards++;else jade++;combo++;comboTime=3.5;window.TempleFeedback?.emit('jade',{lane:o.lane,z:o.z,realm:corrupted?'corrupt':'jade'});tone(650+(corrupted?shards:jade)%5*90,.07);if(combo%10===0){notice=`${corrupted?'SHARD':'JADE'} FLOW / ${combo} IN A ROW`;noticeTime=2;tone(1100,.2);window.TempleFeedback?.emit('chain',{lane,label:`${combo} ${corrupted?'SHARD':'JADE'} CHAIN`});}}
          else if(!(o.type==='gap'&&action==='jump'||o.type==='gate'&&action==='slide')){
            o.failed=true;
            if(shield){shield=false;combo=0;notice='CROWN SAVED YOU / KEEP RUNNING';noticeTime=2.5;shake=10;tone(140,.2);window.TempleFeedback?.emit('shield',{lane,label:'SHIELD SAVE'});}else{die(o.type);break;}
          }
        }else if(o.type==='jade'){combo=0;}
      }
    }
    // Award one visual clear per row only after every hazard resolves cleanly.
    for(const o of objects)if(o.hit&&!o.clearAwarded&&['gap','gate','idol','boulder','spire'].includes(o.type)){
      const group=objects.filter(p=>p.pattern===o.pattern&&['gap','gate','idol','boulder','spire'].includes(p.type));
      if(group.every(p=>p.hit)){group.forEach(p=>p.clearAwarded=true);if(state==='running'&&group.every(p=>!p.failed)){
        window.TempleFeedback?.emit('clear',{lane,label:o.lane===lane&&action==='jump'&&o.type==='gap'?'CLEAN JUMP':o.lane===lane&&action==='slide'&&o.type==='gate'?'CLEAN SLIDE':'CLEAN PASS'});
        // Entry follows clean row resolution: crossing-frame pickups stay jade; later pickups are shards.
        if(!corrupted&&group.some(p=>p.type==='gate')){corrupted=true;realmEntry={time,distance,lane,pattern:group.find(p=>p.type==='gate').pattern};notice='CORRUPT FROG TEMPLE / COLLECT THE SHARDS';noticeTime=4;window.TempleFeedback?.emit('clear',{lane,label:'CORRUPT REALM ENTERED'});}
      }}
    }
    objects=objects.filter(o=>o.z>-14);
    const nextMilestone=Math.floor(distance/250);if(nextMilestone>milestone){milestone=nextMilestone;notice=`${milestone*250} M / THE TEMPLE AWAKENS`;noticeTime=3;tone(600,.25);}
    $('distance').innerHTML=`${Math.floor(distance)} <i>m</i>`;$('jade').textContent=corrupted?shards:jade;const currencyLabel=$('jade-label')||$('jade').previousElementSibling;if(currencyLabel)currencyLabel.textContent=corrupted?'SHARDS':'JADE';const flowLabel=document.getElementById('flow-count')?.previousElementSibling;if(flowLabel)flowLabel.textContent=corrupted?'SHARD FLOW':'JADE FLOW';const zone=Math.floor(distance/500);$('zone').textContent=corrupted?'CORRUPT FROG TEMPLE':['01 / JADE CAUSEWAY','02 / THE SUNKEN SANCTUM','03 / CROWN OF THE ABYSS'][Math.min(2,zone)];
    if($('flow-count'))$('flow-count').textContent=combo; if($('zone-progress'))$('zone-progress').style.width=Math.min(100,distance/10)+'%';if($('zone-next'))$('zone-next').textContent=corrupted?'CORRUPT REALM / SHARD RUN':'FIRST FROG GATE / REALM RIFT';
    const approaching=objects.find(o=>!o.hit&&['gap','gate','idol','boulder','spire'].includes(o.type)&&o.lane===lane&&o.z<55&&o.z>7);
    $('toast').textContent=approaching?(approaching.type==='gap'?'↑ JUMP / BROKEN BRIDGE':approaching.type==='gate'?'↓ SLIDE / LOW ARCH':approaching.type==='boulder'?'← → DODGE / ROLLING STONE':approaching.type==='spire'?'THORNS / DODGE':'← → DODGE / FROG IDOL'):noticeTime>0?notice:magnet>0?(corrupted?'SHARD MAGNET / ':'JADE MAGNET / ')+Math.ceil(magnet)+'s':shield?'CROWN SHIELD / ONE HIT PROTECTED':combo>=5?`${corrupted?'SHARD':'JADE'} FLOW / ${combo} IN A ROW`:corrupted?'FOLLOW THE SHARD TRAIL':'FOLLOW THE EMERALD TRAIL';
    if(turn?.announced)$('toast').textContent=turn.accepted?'TURN LOCKED / FOLLOW THE BEND':turn.window?`TURN ${turn.direction.toUpperCase()} NOW / ${Math.ceil(turn.remaining)} M`:`${turn.direction.toUpperCase()} CORNER / ${Math.ceil(turn.remaining)} M`;
    const warning=$('turn-warning');if(warning){warning.hidden=!turn?.announced;warning.classList?.toggle('urgent',Boolean(turn?.window));if(turn?.announced){$('turn-direction').textContent=turn.direction==='left'?'←':'→';$('turn-distance').textContent=`${Math.ceil(turn.remaining)} m`;$('turn-instruction').textContent=turn.accepted?'Corner locked — keep running':turn.window?`Turn ${turn.direction} now`:`${turn.direction[0].toUpperCase()+turn.direction.slice(1)} corner ahead`;}}
  }
  function draw(){if(!w)return;ctx.save();if(shake>0){ctx.translate(Math.sin(time*70)*shake,0);shake*=.88;}
    const world3d=window.templeTrack?.loaded;
    if(!world3d)window.TempleEnvironment?.draw(ctx,w,h,distance,time,project);
    if(!world3d){
    for(const o of [...objects].sort((a,b)=>b.z-a.z)){if(o.hit||o.z>150)continue;const raw=project(o.lane,o.z),p=o.type==='jade'?window.TempleFeedback?.jadePosition(raw,o,{magnet,lane,project})||raw:raw,s=p.s,x=p.x,y=p.y;if(o.type==='magnet'||o.type==='shield'){ctx.fillStyle=o.type==='shield'?'#f4da78':'#acf3dc';ctx.beginPath();ctx.arc(x,y-30*s,23*s,0,7);ctx.fill();ctx.fillStyle='#133b2c';ctx.font=`bold ${24*s}px sans-serif`;ctx.textAlign='center';ctx.fillText(o.type==='shield'?'♛':'U',x,y-22*s);}else if(o.type==='jade'){ctx.shadowColor='#a9ffa7';ctx.shadowBlur=16*s;poly([[x,y-38*s],[x+12*s,y-22*s],[x,y-5*s],[x-12*s,y-22*s]],'#cceba2');ctx.shadowBlur=0;}else if(o.type==='gap'){poly([[x- w*.105*s,y],[x+w*.105*s,y],[x+w*.115*s,y+25*s],[x-w*.115*s,y+25*s]],'#041813');ctx.strokeStyle='#dbbf79';ctx.lineWidth=3*s;ctx.beginPath();ctx.moveTo(x-w*.1*s,y);ctx.lineTo(x+w*.1*s,y);ctx.stroke();}else if(o.type==='gate'){
      const width=Math.min(w*.3,275)*s,height=width*.82;
      ctx.fillStyle='#051c1670';ctx.beginPath();ctx.ellipse(x,y,width*.48,13*s,0,0,7);ctx.fill();
      window.TempleEnvironment?.prop(ctx,'gate',x,y,width,height);
      // Warm lintel marker distinguishes slide gates from decorative scenery.
      ctx.strokeStyle='#edd48b';ctx.lineWidth=Math.max(1,3*s);ctx.beginPath();ctx.moveTo(x-width*.28,y-height*.56);ctx.lineTo(x+width*.28,y-height*.56);ctx.stroke();
    }else if(o.type==='boulder'){
      window.TempleEnvironment?.boulder(ctx,x,y,Math.min(w*.24,205)*s,distance*.055);
    }else if(o.type==='spire'){
      const width=Math.min(w*.20,170)*s;poly([[x-width*.46,y],[x-width*.24,y-width*.72],[x-width*.09,y-width*.40],[x+width*.12,y-width*1.3],[x+width*.3,y-width*.52],[x+width*.45,y]],'#6a416b');poly([[x-width*.1,y-width*.26],[x+width*.12,y-width*1.3],[x+width*.27,y-width*.5]],'#bb709b');
    }else{
      const width=Math.min(w*.21,180)*s;
      ctx.fillStyle='#051c1699';ctx.beginPath();ctx.ellipse(x,y,width*.48,12*s,0,0,7);ctx.fill();
      window.TempleEnvironment?.prop(ctx,'idol',x,y,width,width);
    }}

    const p=project(visualLane,3),jump=action==='jump'?Math.sin(Math.max(0,actionTime)/.85*Math.PI)*100:0,slide=action==='slide',size=Math.min(w*.28,240);ctx.fillStyle='#031b1599';ctx.beginPath();ctx.ellipse(p.x,h*.93,size*.3,size*.075,0,0,7);ctx.fill();const bob=state==='running'?Math.sin(time*17)*5:Math.sin(time*2)*3;ctx.save();ctx.translate(p.x,h*.92-jump+bob);ctx.rotate(state==='running'?Math.sin(time*9)*.035:0);if(!window.templeCharacter?.loaded&&sheet.complete&&sheet.naturalWidth&&state==='running'){let col=action==='jump'?0:slide?0:1+Math.floor(time*9)%2,row=action==='jump'?1:slide?2:0;const cell=sheet.naturalWidth/3;ctx.drawImage(sheet,col*cell,row*cell,cell,cell,-size/2,-size*.92,size,size);}else if(!window.templeCharacter?.loaded&&hero.complete&&hero.naturalWidth)ctx.drawImage(hero,-size/2,-size*.92,size,size);ctx.restore();
    }
    for(let i=0;i<25;i++){ctx.fillStyle='#d0e9a044';ctx.beginPath();ctx.arc((i*137+Math.sin(time*.4+i)*20)%w,(i*83+time*(6+i%3))%h,1.5,0,7);ctx.fill();}const shade=ctx.createLinearGradient(0,h*.65,0,h);shade.addColorStop(0,'#03181200');shade.addColorStop(1,'#03181288');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);const fx=world3d?window.templeEffectsContext:ctx;if(world3d&&fx)fx.clearRect(0,0,w,h);if(fx)window.TempleFeedback?.draw(fx,w,h,project,{magnet,shield,lane:visualLane,project,objects});ctx.restore();}
  function frame(now){const ratio=Math.min(devicePixelRatio,2);if(w&&h&&(canvasRatio!==ratio||canvas.width!==Math.floor(w*ratio)||canvas.height!==Math.floor(h*ratio)))resize();if($('start').disabled&&window.templeCharacter?.loaded&&window.templeTrack?.loaded&&window.templeWorld?.loaded){$('start').disabled=false;$('start').innerHTML='Enter the temple <span>↗</span>';}const dt=Math.min(.04,(now-last)/1000||0);last=now;if(state!=='paused')time+=dt;if(state==='running')update(dt);draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
  window.templeRunDiagnostics=()=>({state,time,actionTime,magnet,shield,realm:corrupted?'corrupt':'jade',shards,realmEntry:realmEntry?{...realmEntry}:null,lane,visualLane,distance,jade,best,speed,action,row,route,combo,turn:window.TempleTurns?.diagnostics(),track:window.templeTrack,scenery:window.templeScenery,world:window.templeWorld,feedback:window.TempleFeedback?.diagnostics(),environment:window.TempleEnvironment?.diagnostics(),scene:corrupted?'corrupt':window.TempleEnvironment?.sceneAt(distance),objects:objects.map(o=>({...o})),heroLoaded:hero.complete&&hero.naturalWidth>0});
})();
