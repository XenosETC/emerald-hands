import {equippedPose,drawCrownFrame} from './crown-equipped.js';
import {CROWN_POSES} from './crown-poses.js';
import {availableContracts,drawContractMarker} from './quest-map.js';
import {drawWorldLife} from './world-life.js';
import {QUESTS} from './adventure.js';
export const WORLD={width:3000,height:1800};
export const NODES=[
 {id:'home',name:'Crownhaven',x:850,y:1000,kind:'town',art:0},
 {id:'hunt',name:'Briar Forest',x:650,y:1220,kind:'forest',art:3,battle:'hunt'},
 {id:'mossford',name:'Mossford',x:1080,y:850,kind:'town',art:0},
 {id:'elderwood',name:'Elderwood Grove',x:1000,y:650,kind:'forest',art:3,battle:'hunt'},
 {id:'port',name:'Tideharbor',x:790,y:1440,kind:'port',art:2},
 {id:'ruins',name:'Moonwell Ruins',x:2120,y:1220,kind:'ruins',art:4,battle:'hunt'},
 {id:'sunspire',name:'Sunspire Castle',x:1640,y:870,kind:'castle',art:1},
 {id:'outpost',name:'Reedwatch',x:1920,y:1050,kind:'castle',art:1,battle:'outpost'},
 {id:'eastport',name:'Eastwatch Port',x:2440,y:1360,kind:'port',art:2},
 {id:'jadeforest',name:'Jadefall Forest',x:2510,y:960,kind:'forest',art:3,battle:'hunt'},
 {id:'frostford',name:'Frostford',x:1700,y:340,kind:'town',art:0,regionalArt:0},
 {id:'pearlport',name:'Pearlport',x:760,y:650,kind:'port',art:2,facing:-1},
 {id:'greenmere',name:'Greenmere',x:650,y:850,kind:'town',art:0},
 {id:'highpass',name:'Highpass Shrine',x:1460,y:420,kind:'ruins',art:4,battle:'hunt'},
 {id:'snowcastle',name:'Wintercrown Castle',x:1170,y:320,kind:'castle',art:1,regionalArt:1},
 {id:'cinderford',name:'Cinderford',x:2350,y:650,kind:'town',art:0,regionalArt:2},
 {id:'ashgrove',name:'Ashveil Grove',x:2250,y:940,kind:'forest',art:3,battle:'hunt'},
 {id:'keep',name:'Ashfang Keep',x:2740,y:630,kind:'fortress',art:5,battle:'keep',corrupted:true}
];
export const ROADS=[['home','hunt'],['home','mossford'],['hunt','port'],['mossford','elderwood'],['mossford','sunspire'],['elderwood','sunspire'],['sunspire','outpost'],['outpost','ruins'],['outpost','eastport'],['sunspire','highpass'],['eastport','jadeforest'],['frostford','highpass'],['highpass','snowcastle'],['snowcastle','elderwood'],['elderwood','pearlport'],['pearlport','greenmere'],['greenmere','home'],['greenmere','mossford'],['frostford','cinderford'],['outpost','ashgrove'],['ashgrove','jadeforest'],['jadeforest','cinderford'],['cinderford','keep']];
export function route(from,to){const queue=[[from]],seen=new Set([from]);while(queue.length){const p=queue.shift(),id=p.at(-1);if(id===to)return p;for(const edge of ROADS){if(!edge.includes(id))continue;const next=edge.find(x=>x!==id);if(!seen.has(next)){seen.add(next);queue.push([...p,next]);}}}return [];}
export function startTravel(from,to){const ids=route(from,to);if(ids.length<2)return null;const origin=NODES.find(n=>n.id===from);return {from,to,x:origin.x,y:origin.y,ids,index:1,progress:0};}
export function stepTravel(t,dt){if(!t)return false;const next=NODES.find(n=>n.id===t.ids[t.index]);const d=Math.hypot(next.x-t.x,next.y-t.y),step=330*dt;if(d<=step){t.x=next.x;t.y=next.y;t.index++;if(t.index>=t.ids.length)return true;}else{t.x+=(next.x-t.x)/d*step;t.y+=(next.y-t.y)/d*step;}return false;}
export const mapImage=(typeof Image==='undefined'?{}:new Image());mapImage.src='assets/world-v1.png';
export const landmarks=(typeof Image==='undefined'?{}:new Image());landmarks.src='assets/landmarks-v1.png';
export const regionalLandmarks=(typeof Image==='undefined'?{}:new Image());regionalLandmarks.src='assets/regional-landmarks-v1.png';
export const camera={x:1000,y:1100,zoom:.62};
export function centerCamera(x,y){const halfW=600/camera.zoom,halfH=320/camera.zoom;camera.x=halfW>1500?1500:Math.max(halfW,Math.min(3000-halfW,x));camera.y=halfH>900?900:Math.max(halfH,Math.min(1800-halfH,y));}
export function frameRoute(from,to){const points=route(from,to).map(id=>NODES.find(n=>n.id===id));if(!points.length)return;const xs=points.map(p=>p.x),ys=points.map(p=>p.y),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);camera.zoom=Math.max(.35,Math.min(.8,1000/(right-left+350),470/(bottom-top+350)));centerCamera((left+right)/2,(top+bottom)/2);}
export function worldPoint(p){return {x:(p.x-600)/camera.zoom+camera.x,y:(p.y-320)/camera.zoom+camera.y};}
export function nodeAt(p){const w=worldPoint(p);return NODES.find(n=>Math.hypot(n.x-w.x,n.y-w.y)<100);}
export function drawWorld(g,state,selected,travel,crown,time,gear={}){const {drawShield,drawHeldWeapon}=gear;
 g.fillStyle='#234b54';g.fillRect(0,0,1200,640);g.save();g.translate(600,320);g.scale(camera.zoom,camera.zoom);g.translate(-camera.x,-camera.y);
 if(mapImage.complete&&mapImage.naturalWidth)g.drawImage(mapImage,0,0,3000,1800);
 for(const [a,b]of ROADS){const p=NODES.find(n=>n.id===a),q=NODES.find(n=>n.id===b);g.strokeStyle='#655b3c88';g.lineWidth=10;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(q.x,q.y);g.stroke();g.strokeStyle='#efdcaa';g.lineWidth=3;g.setLineDash([12,12]);g.stroke();g.setLineDash([]);}
 const preview=travel?.ids??(selected!==state.location?route(state.location,selected):[]);
 if(preview.length){g.strokeStyle=travel?'#fff09d':'#ffe4aacc';g.lineWidth=travel?6:4;if(!travel)g.setLineDash([18,9]);g.beginPath();preview.forEach((id,i)=>{const n=NODES.find(n=>n.id===id);i?g.lineTo(n.x,n.y):g.moveTo(n.x,n.y);});g.stroke();g.setLineDash([]);}
 drawWorldLife(g,NODES,time);
 for(const n of NODES){if(n.corrupted){const glow=g.createRadialGradient(n.x,n.y-35,8,n.x,n.y-35,100);glow.addColorStop(0,'#ea592733');glow.addColorStop(1,'#ea592700');g.fillStyle=glow;g.fillRect(n.x-110,n.y-150,220,220);for(let i=0;i<6;i++){const phase=(time*.3+i*.17)%1;g.fillStyle=`rgba(255,147,65,${(1-phase)*.6})`;g.fillRect(n.x-65+i*24+Math.sin(time+i)*6,n.y-20-phase*100,3,4);}}if(n.id===selected){g.strokeStyle='#fff0aa';g.lineWidth=4;g.beginPath();g.ellipse(n.x,n.y+15,100,42,0,0,7);g.stroke();}const image=n.regionalArt===undefined?landmarks:regionalLandmarks;if(image.complete&&image.naturalWidth){const w=image.naturalWidth/3,h=image.naturalHeight/(n.regionalArt===undefined?2:1);const art=n.regionalArt??n.art;g.save();g.translate(n.x,n.y);g.scale(n.facing??1,1);g.drawImage(image,art%3*w,Math.floor(art/3)*h,w,h,-100,-150,200,180);g.restore();}if(n.kind==='castle'||n.kind==='fortress'){g.strokeStyle='#e0d0a1';g.lineWidth=3;g.beginPath();g.moveTo(n.x+68,n.y-35);g.lineTo(n.x+68,n.y-104);g.stroke();g.fillStyle=n.battle&&!state.owned.includes(n.id)?'#b84d39':'#98be66';g.beginPath();g.moveTo(n.x+68,n.y-104);g.lineTo(n.x+98,n.y-94);g.lineTo(n.x+68,n.y-79);g.fill();}g.fillStyle='#183229ee';g.fillRect(n.x-102,n.y+33,204,29);g.fillStyle='#f5e2b1';g.textAlign='center';g.font='18px Georgia';g.fillText(n.name,n.x,n.y+54);
 drawContractMarker(g,n,availableContracts(state,n));
 const active=QUESTS.some(q=>q.target===n.id&&state.quests[q.id]==='active'),ready=QUESTS.some(q=>q.board===n.id&&state.quests[q.id]==='ready');if(active||ready){const y=n.y-180+Math.sin(time*3)*7;g.fillStyle=ready?'#bbed91':'#ffe085';g.strokeStyle='#55431d';g.lineWidth=3;g.beginPath();g.moveTo(n.x,y-22);g.lineTo(n.x+20,y);g.lineTo(n.x,y+22);g.lineTo(n.x-20,y);g.closePath();g.fill();g.stroke();g.fillStyle='#263529';g.font='bold 25px Georgia';g.fillText(ready?'✓':'!',n.x,y+8);}}
 const loc=NODES.find(n=>n.id===state.location)||NODES[0],p=travel??loc;g.fillStyle='#f6dda655';g.beginPath();g.ellipse(p.x,p.y+15,28,12,0,0,7);g.fill();if(crown.complete&&crown.naturalWidth){const next=travel?NODES.find(n=>n.id===travel.ids[travel.index]):null,facing=next&&next.x<p.x?-1:1;const index=travel?(Math.floor(time*8)%2?1:3):0,pose=crown.renderSet?equippedPose(index,crown.renderSet):CROWN_POSES[index];g.save();g.translate(p.x,p.y);g.scale(facing,1);const bob=travel?Math.sin(time*16)*1.2:Math.sin(time*2)*.4;g.save();g.translate(0,(10+bob)/camera.zoom);g.scale(.4/camera.zoom,.4/camera.zoom);drawCrownFrame(g,crown,pose,.25);const sockets=pose;if(!crown.bakedGear){if(state.shield&&drawShield)drawShield(g,state.shield,...sockets.shield,.8);if(drawHeldWeapon)drawHeldWeapon(g,state.weapon,...sockets.hand,.65);}g.restore();g.restore();}g.restore();

}
