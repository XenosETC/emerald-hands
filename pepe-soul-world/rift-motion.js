// Choreograph existing official Crown frames around their sole anchors.
const smooth=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
export function riftFrame(elapsed){
 return elapsed<.16?{clip:'attack',index:1}:elapsed<.24?{clip:'attack',index:2}:elapsed<.32?{clip:'attack',index:4}:elapsed<.43?{clip:'riftPlant',index:0}:elapsed<.54?{clip:'riftPlant',index:1}:elapsed<.58?{clip:'attack',index:5}:{clip:'idle',index:0};
}
export function riftFrames(elapsed,reduced=false){
 const starts=[0,.16,.24,.32,.43,.54,.58],start=starts.filter(t=>t<=elapsed).at(-1)??0;
 // Contact snaps faster than recovery so the planted blade reads at impact.
 const duration=start===.32?.018:start===.54?.03:.035;
 return {current:riftFrame(elapsed),previous:riftFrame(Math.max(0,start-.001)),blend:reduced?1:smooth((elapsed-start)/duration)};
}
export function riftSlash(elapsed,reduced=false){
 if(elapsed<.16||elapsed>=.36)return null;
 const progress=smooth((elapsed-.16)/.16),fade=elapsed>.32?1-(elapsed-.32)/.04:1;
 return {angle:-1.5+progress*2.8,tail:reduced?.22:.85,alpha:Math.max(0,fade)*(reduced?.35:.7),width:reduced?2:5};
}
export function riftPose(elapsed,face=1,reduced=false){
 if(reduced)return {scaleX:1,scaleY:1,lean:0};
 const age=elapsed-.32,impact=age<0?0:(1-smooth(age/.22))*smooth(age/.025),charge=smooth(elapsed/.16)*(1-smooth((elapsed-.16)/.16));
 const scaleY=1-.025*charge-.045*impact;
 return {scaleX:2-scaleY,scaleY,lean:face*(.025*impact-.012*charge)};
}
export function fractureGeometry(){
 const noise=i=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);},points=[{x:0,y:0}],shards=[];
 let x=0;for(let i=0;x<600;i++){x=Math.min(600,x+12+noise(i)*17);points.push({x,y:(noise(i+91)-.5)*9});}
 x=16;for(let i=0;x<590;i++){shards.push({x,width:9+noise(i+12)*16,height:14+noise(i+54)*54,lean:(noise(i+82)-.4)*17,branch:noise(i+19)>.45});x+=18+noise(i+31)*35;}
 return {points,shards};
}
