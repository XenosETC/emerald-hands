// Full-speed simulation/renderer fixture; not a native browser recording.
import {createRequire} from 'node:module';
import {join,resolve} from 'node:path';
import {writeFile,stat} from 'node:fs/promises';
import {createState,WORLDS,step,act} from '../core.js';
import {Renderer} from '../render.js';
import {EXTRA_ART} from '../realm-art.js';
import {GUARDIAN_ART} from '../enemy-motion.js';
import {GuardControls} from '../guard-controls.js';
import {PointerControls} from '../pointer-controls.js';
import {guardCounterPose} from '../sword-guard.js';
const require=createRequire(import.meta.url),{createCanvas,loadImage}=require(join(process.argv[2],'@napi-rs/canvas')),sharp=require(join(process.argv[2],'sharp'));
const root=resolve(import.meta.dirname,'..'),art={};
for(const key of ['crown-domain-rise-v1','crown-domain-between-v1','crown-domain-official-v1','kek-domain-spirit-v1',...Object.values(GUARDIAN_ART),'crown-warp','item-atlas','crown-atlas','crown-run','crown-attack','enemy-atlas','approach2-enemies-v1','mentor','effigy',...WORLDS.map(w=>w.art),...EXTRA_ART]){
 art[key]=await loadImage(join(root,'assets',key+'.'+(WORLDS.some(w=>w.art===key)||key.includes('-approach')?'webp':'png')));art[key].assetKey=key;
}
const s=createState({version:2,world:'temple',zone:'arena',approachCleared:[1,2,3],oath:true,training:3,complete:true,seals:['frozen','crimson','void'],xp:1000}),e=s.enemies[0];
s.player.x=1360;e.x=1520;e.timer=.3;
const hp=s.player.hp,canvas=createCanvas(960,540),small=createCanvas(640,360),renderer=new Renderer(canvas,art),frames=[],receipt=[];
const controls=new GuardControls(s.player,new Set(),new PointerControls());
let counter=false,blocked=false,impactCapture=false,raised=false,counterAt=null,blendCapture=false;
for(let frame=0;frame<108;frame++){
 for(let sub=0;sub<2;sub++){
  if(!raised&&s.time>.15){controls.toggle();raised=true;}
  if(blocked&&!counter&&s.time>=counterAt&&renderer.freeze<=0){controls.toggle();counter=act(s,'attack');receipt.push({event:'counterAcceptedBeforeNextTick',at:s.time,accepted:counter});}
  if(renderer.freeze<=0)step(s,{guard:controls.held},1/60);
  for(const event of s.events.splice(0)){renderer.effect(event,s);if(event.type==='guardBlock'){blocked=true;counterAt=s.time+.06;receipt.push({event:event.type,at:s.time,cost:event.cost,hp:s.player.hp,sp:s.player.sp});}}
  renderer.update(1/60,s);renderer.camera=1010;
 }
 renderer.draw(s,{showcase:true});const ctx=canvas.getContext('2d');
 ctx.fillStyle='#061913e8';ctx.fillRect(285,18,390,64);ctx.textAlign='center';ctx.fillStyle='#e8dfb0';ctx.font='18px Georgia';ctx.fillText('RIBBIT FANG · SWORD GUARD',480,43);ctx.fillStyle='#b2f5d7';ctx.font='13px sans-serif';ctx.fillText(blocked?(counter?'RELEASE → COUNTER CUT':'BLOCKED · −20 SPIRIT'):'RAISE THE BLADE · HOLD S',480,65);
 ctx.fillStyle='#061913e8';ctx.fillRect(0,510,960,30);ctx.fillStyle='#a9c9bd';ctx.font='12px sans-serif';ctx.fillText('FULL-SPEED SIMULATION · FRONTAL CLEAVE BLOCKED, THEN COUNTERED',480,530);
 if(s.player.guardHit>0&&!impactCapture){await writeFile(join(root,'docs/sword-guard-impact-preview.png'),canvas.toBuffer('image/png'));impactCapture=true;}
 if(guardCounterPose(s.player)&&!blendCapture){await writeFile(join(root,'docs/guard-counter-handoff-preview.png'),canvas.toBuffer('image/png'));blendCapture=true;}
 if(frame===20)await writeFile(join(root,'docs/sword-guard-preview.png'),canvas.toBuffer('image/png'));
 small.getContext('2d').drawImage(canvas,0,0,640,360);frames.push(Buffer.from(small.getContext('2d').getImageData(0,0,640,360).data));
}
if(!blocked||!counter||!blendCapture||s.player.hp!==hp||e.hp>=e.maxHp)throw Error('Guard/counter proof failed');
const output=join(root,'docs/sword-guard-counter.gif');await sharp(Buffer.concat(frames),{raw:{width:640,height:360*frames.length,channels:4,pageHeight:360}}).gif({loop:0,delay:frames.map((_,i)=>i%3===2?40:30),effort:3}).toFile(output);
const bytes=(await stat(output)).size;if(bytes>=20_000_000)throw Error('Preview exceeds 20MB');
await writeFile(join(root,'docs/sword-guard-proof.json'),JSON.stringify({kind:'simulation/renderer fixture',seconds:3.6,frames:108,bytes,receipt,counter,playerHpBefore:hp,playerHpAfter:s.player.hp,enemyHp:e.hp},null,2));console.log(JSON.stringify({bytes,receipt,counter,enemyHp:e.hp}));
