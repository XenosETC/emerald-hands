const SOUNDS={guardBlock:[1200,380,.12,'triangle'],guardBreak:[230,40,.3,'sawtooth'],riftImpact:[130,28,.4,'triangle'],riftHit:[220,45,.16,'sawtooth'],domain:[70,280,.8,'sine'],domainPulse:[110,35,.45,'triangle'],enemyWave:[120,480,.3,'triangle'],swing:[300,75,.13,'sawtooth'],hit:[130,45,.1,'triangle'],warp:[680,160,.19,'sine'],warpLand:[180,440,.1,'triangle'],dash:[500,170,.17,'sine'],wave:[280,620,.28,'sine'],hurt:[90,35,.2,'sawtooth'],seal:[520,1040,.55,'sine'],level:[430,860,.45,'sine'],release:[110,880,.7,'triangle'],jump:[160,320,.13,'sine'],land:[75,40,.08,'triangle'],defeat:[190,50,.23,'triangle']};
// Optional local audio. A blocked or failed audio context must never stop gameplay.
export class Sound {
 constructor(createContext=()=>new (window.AudioContext||window.webkitAudioContext)()){
  this.createContext=createContext;this.enabled=false;this.ctx=null;this.master=null;this.failed=false;this.revision=0;
 }
 fail(){
  this.enabled=false;this.failed=true;
  try{this.master?.disconnect();}catch{}
  try{Promise.resolve(this.ctx?.close()).catch(()=>{});}catch{}
  this.ctx=null;this.master=null;
 }
 async enable(value){
  const revision=++this.revision;this.enabled=false;this.failed=false;
  if(!value)return false;
  try{
   if(!this.ctx){this.ctx=this.createContext();this.master=this.ctx.createGain();this.master.gain.value=.12;this.master.connect(this.ctx.destination);}
   const context=this.ctx;await context.resume();
   if(revision!==this.revision)return false;
   if(context.state!=='running')throw Error('Audio did not start');
   this.enabled=true;return true;
  }catch{
   if(revision===this.revision)this.fail();return false;
  }
 }
 play(type){
  if(!this.enabled||!this.ctx)return false;
  const spec=SOUNDS[type];if(!spec)return false;
  let oscillator,gain;
  try{
   const c=this.ctx,t=c.currentTime;oscillator=c.createOscillator();gain=c.createGain();
   oscillator.type=spec[3];oscillator.frequency.setValueAtTime(spec[0],t);oscillator.frequency.exponentialRampToValueAtTime(spec[1],t+spec[2]);
   gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime(.7,t+.015);gain.gain.exponentialRampToValueAtTime(.001,t+spec[2]);
   oscillator.connect(gain);gain.connect(this.master);
   oscillator.onended=()=>{try{oscillator.disconnect();gain.disconnect();}catch{}};
   oscillator.start(t);oscillator.stop(t+spec[2]+.01);return true;
  }catch{
   try{oscillator?.stop();}catch{}
   try{oscillator?.disconnect();gain?.disconnect();}catch{}
   this.fail();return false;
  }
 }
}
