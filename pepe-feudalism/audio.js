// Local synthesized cues: no downloads, autoplay, or gameplay dependencies.
export function createAudio(){
 let context=null,master=null,enabled=true,lastStep=0,played=0,lastCue=null;
 const seen=new WeakSet(),key='pepe-feudalism-sound-v1';
 try{enabled=localStorage.getItem(key)!=='off';}catch{}
 function unlock(){
  if(!enabled)return;
  try{if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;context=new Audio();master=context.createGain();master.gain.value=.22;master.connect(context.destination);}if(context.state==='suspended')context.resume().catch(()=>{});}catch{}
 }
 function tone(frequency,duration=.12,volume=.16,type='triangle',delay=0,end=frequency){
  if(!enabled||context?.state!=='running'||document.hidden)return;
  const now=context.currentTime+delay,o=context.createOscillator(),gain=context.createGain();
  o.type=type;o.frequency.setValueAtTime(frequency,now);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),now+duration);
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  o.connect(gain);gain.connect(master);o.start(now);o.stop(now+duration+.01);o.onended=()=>{o.disconnect();gain.disconnect();};
 }
 function cue(name){
  if(!enabled||context?.state!=='running'||document.hidden)return;
  played++;lastCue=name;
  if(name==='victory'){[392,494,587,784].forEach((f,i)=>tone(f,.25,.15,'triangle',i*.12));}
  else if(name==='defeat'){tone(196,.3,.15,'triangle',0,98);}
  else if(name==='arrival'||name==='reward'){[392,523,659].forEach((f,i)=>tone(f,.16,.12,'sine',i*.09));}
  else if(name==='forge'||name==='strike'){tone(800,.08,.07,'triangle',0,160);tone(1370,.055,.045,'sine',.012,540);}
  else if(name==='crush'){tone(125,.16,.12,'triangle',0,42);tone(310,.09,.055,'sine',.02,110);}
  else if(name==='arrow'){tone(950,.07,.06,'sine',0,250);}
  else if(name==='sweep'){tone(180,.2,.12,'triangle',0,650);}
  else if(name==='rally'){[330,440,550].forEach((f,i)=>tone(f,.2,.08,'sine',i*.04));}
  else if(name==='step'){tone(90,.065,.065,'triangle',0,42);}
  else {tone(name==='scroll'?260:330,.08,.06,'triangle',0,190);}
 }
 function update(b,travel,time,paused){
  if(paused||document.hidden){lastStep=time;return;}
  if((travel||b?.hero.moving)&&time-lastStep>.32){cue('step');lastStep=time;}
  let strikes=0;
  for(const effect of b?.effects??[]){if(seen.has(effect))continue;seen.add(effect);if(effect.ring)cue(effect.text==='SWEEP'?'sweep':'rally');else if(effect.arrow&&strikes++<2)cue('arrow');else if((effect.slash||effect.thrust||effect.crush)&&strikes++<2)cue(effect.crush?'crush':'strike');}
 }
 return {unlock,cue,update,toggle(){enabled=!enabled;try{localStorage.setItem(key,enabled?'on':'off');}catch{}if(master)master.gain.value=enabled?.22:0;if(enabled){unlock();cue('arrival');}return enabled;},snapshot:()=>({enabled,state:context?.state??'locked',played,lastCue})};
}
