// Render-only choreography; hit timing remains in the simulation.
export function domainVisual(elapsed,reduced=false){
 const rise=Math.max(0,Math.min(1,(elapsed-.25)/.6)),dissolve=Math.max(0,Math.min(1,(elapsed-1.75)/.65));
 return {rise,dissolve,opacity:elapsed>=2.4?0:rise*(1-dissolve)*(reduced?.35:.58),fragmented:!reduced&&dissolve>0};
}
export function domainFragment(col,row,dissolve){return {x:Math.sin(col*2.4+row*1.7)*dissolve*36,y:-dissolve*(18+row*5),alpha:Math.max(0,1-dissolve)};}

const smooth=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
export function domainFrames(elapsed,reduced=false){
 const stage=elapsed<.18?{index:0,previous:-1,start:0}:elapsed<.42?{index:4,previous:0,start:.18}:elapsed<1.25?{index:1,previous:4,start:.42}:elapsed<1.65?{index:2,previous:1,start:1.25}:elapsed<1.86?{index:6,previous:2,start:1.65}:elapsed<2.06?{index:5,previous:6,start:1.86}:elapsed<2.22?{index:3,previous:5,start:2.06}:{index:-1,previous:3,start:2.22};
 // Different limb silhouettes read best as drawn frames, without double faces.
 // Only the near-identical prayer/pulse cloth poses receive a short blend.
 return {...stage,blend:reduced||stage.index!==2?1:smooth((elapsed-stage.start)/.08)};
}
export function domainImpact(elapsed,reduced=false){
 const age=elapsed-1.25;
 const strength=age<0||age>=.5?0:(1-smooth(age/.5))*smooth(age/.04);
 return {zoom:reduced?1:1+strength*.025,flash:reduced?0:strength*.065,echo:reduced?0:strength*.2,ripple:age<0||age>.5?0:smooth(age/.5),alpha:age<0||age>.5?0:(1-age/.5)*(reduced?.3:.8)};
}
// Transform the official sprite around its sole anchor. No floor translation.
export function domainPose(elapsed,face=1,reduced=false){
 const charge=smooth(elapsed/.45)*(1-smooth((elapsed-1.25)/.22));
 const pulse=smooth((elapsed-1.25)/.08)*(1-smooth((elapsed-1.33)/.3));
 const recover=smooth((elapsed-1.63)/.15)*(1-smooth((elapsed-1.9)/.5));
 if(reduced)return {scaleX:1,scaleY:1,lean:0,phase:elapsed<.45?'charge':elapsed<1.25?'hold':elapsed<1.63?'pulse':'recover'};
 const scaleY=1-.045*charge+.025*pulse-.012*recover;
 return {scaleX:2-scaleY,scaleY,lean:face*(.012*charge-.018*pulse),phase:elapsed<.45?'charge':elapsed<1.25?'hold':elapsed<1.63?'pulse':'recover'};
}

// Player-facing cast cues use the same boundaries as the drawn pose sequence.
export function domainCue(elapsed){
 const progress=Math.max(0,Math.min(1,elapsed/2.4));
 return {label:elapsed<.42?'Plant':elapsed<1.25?'Prayer':elapsed<1.65?'Pulse':'Recover',progress};
}
