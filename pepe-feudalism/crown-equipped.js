import {CROWN_POSES} from './crown-poses.js';
const SCOUT_FRAMES=[{x:65,y:60,w:582,h:545,anchor:330},{x:746,y:70,w:508,h:548,anchor:1000},{x:30,y:730,w:728,h:454,anchor:475,clip:true},{x:755,y:682,w:499,h:523,anchor:995}];
const JADE_FRAMES=[{x:65,y:55,w:575,h:575,anchor:330},{x:705,y:70,w:535,h:575,anchor:1000},{x:45,y:716,w:758,h:475,anchor:475,clip:true,clipHeight:185},{x:767,y:676,w:475,h:550,anchor:995,clipLeft:true}];
const BASALT_FRAMES=[{x:65,y:5,w:540,h:650,anchor:330},{x:750,y:20,w:484,h:643,anchor:1000},{x:32,y:663,w:735,h:560,anchor:475,clip:true,clipHeight:300},{x:752,y:656,w:480,h:587,anchor:995,clipLeft:true}];
export const EQUIPPED_LOOKS={scout:{weapon:'axe',armor:'leather',shield:'oak',src:'assets/crown-scout-axe-v1.png',frames:SCOUT_FRAMES},jade:{weapon:'sword',armor:'jade',shield:'jade',src:'assets/crown-jade-sword-v1.png',frames:JADE_FRAMES},basalt:{weapon:'spear',armor:'basalt',shield:'holy',src:'assets/crown-basalt-spear-v1.png',frames:BASALT_FRAMES}};
export function equippedLook(state){return Object.entries(EQUIPPED_LOOKS).find(([,look])=>look.weapon===state.weapon&&look.armor===state.armor&&look.shield===state.shield)?.[0]??null;}
const wornFrames=(frames,hands,shields)=>frames.map((p,i)=>({...p,clip:false,clipLeft:false,hand:hands[i],shield:shields[i]}));
export const WORN_LOOKS={
 leather:{src:'assets/crown-worn-leather-v1.png',frames:wornFrames([{x:88,y:60,w:430,h:545,anchor:330},{x:750,y:70,w:390,h:548,anchor:1000},{x:30,y:730,w:534,h:454,anchor:475},{x:752,y:682,w:418,h:523,anchor:995}],[[38,-61],[23,-64],[14,-83],[26,-64]],[[-35,-61],[-35,-62],[-82,-57],[-28,-54]])},
 jade:{src:'assets/crown-worn-jade-v1.png',frames:wornFrames([{x:100,y:55,w:450,h:575,anchor:330},{x:748,y:70,w:416,h:575,anchor:1000},{x:45,y:716,w:535,h:475,anchor:475},{x:765,y:676,w:435,h:550,anchor:995}],[[47,-70],[28,-67],[19,-81],[31,-67]],[[-44,-55],[-52,-56],[-59,-58],[-39,-52]])},
 basalt:{src:'assets/crown-worn-basalt-v1.png',frames:wornFrames([{x:88,y:85,w:430,h:570,anchor:330},{x:748,y:85,w:392,h:578,anchor:1000},{x:30,y:730,w:512,h:493,anchor:475},{x:750,y:715,w:402,h:528,anchor:995}],[[38,-71],[28,-73],[9,-95],[31,-69]],[[-42,-65],[-49,-70],[-88,-61],[-30,-60]])}
};
export function crownAppearance(state){if(WORN_LOOKS[state.armor])return {key:'worn-'+state.armor,src:WORN_LOOKS[state.armor].src,baked:false,worn:true};return {key:null,src:'assets/crown-base-v2.png',baked:false,worn:false};}
export function equippedPose(index,key='scout'){const look=key.startsWith('worn-')?WORN_LOOKS[key.slice(5)]:EQUIPPED_LOOKS[key];return {...CROWN_POSES[index],...look.frames[index]};}
export function drawCrownFrame(g,image,p,scale,bob=0){
 g.save();const left=-(p.anchor-p.x)*scale,top=-p.h*scale+bob;
 if(p.clip){g.beginPath();g.moveTo(left,top);g.lineTo(left+p.w*scale,top);g.lineTo(left+p.w*scale,top+(p.clipHeight??200)*scale);g.lineTo(left+530*scale,top+(p.clipHeight??200)*scale);g.lineTo(left+530*scale,top+p.h*scale);g.lineTo(left,top+p.h*scale);g.closePath();g.clip();}
 if(p.clipLeft){g.beginPath();g.moveTo(left+50*scale,top);g.lineTo(left+p.w*scale,top);g.lineTo(left+p.w*scale,top+p.h*scale);g.lineTo(left,top+p.h*scale);g.lineTo(left,top+160*scale);g.lineTo(left+50*scale,top+160*scale);g.closePath();g.clip();}
 g.drawImage(image,p.x,p.y,p.w,p.h,left,top,p.w*scale,p.h*scale);g.restore();
}
