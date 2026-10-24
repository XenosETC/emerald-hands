export class Soundscape {
  constructor(){this.enabled=false;this.context=null;this.nodes=null;}
  toggle(){this.enabled=!this.enabled;if(this.enabled)this.start();else if(this.nodes)this.nodes.gain.gain.setTargetAtTime(0,this.context.currentTime,.1);return this.enabled;}
  start(){
    try{
      this.context??=new AudioContext();this.context.resume();
      if(this.nodes)return;
      const c=this.context,osc=c.createOscillator(),noise=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();
      const buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.35;
      noise.buffer=buffer;noise.loop=true;osc.type='triangle';filter.type='lowpass';filter.frequency.value=240;gain.gain.value=0;
      osc.connect(filter);noise.connect(filter);filter.connect(gain);gain.connect(c.destination);osc.start();noise.start();this.nodes={osc,filter,gain};
    }catch{this.enabled=false;}
  }
  update({powered,boost,charge=0,paused=false}){
    if(!this.context||!this.nodes)return;
    const {gain,osc,filter}=this.nodes,t=this.context.currentTime;
    const volume=this.enabled&&!paused?(powered?.025+boost*.025:charge*.025):0;
    gain.gain.setTargetAtTime(volume,t,.12);osc.frequency.setTargetAtTime(55+boost*45+charge*30,t,.15);filter.frequency.setTargetAtTime(200+boost*850+charge*350,t,.15);
  }
  cue(hz,duration=.2){
    if(!this.enabled||!this.context)return;
    const c=this.context,o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.setValueAtTime(hz,c.currentTime);o.frequency.exponentialRampToValueAtTime(38,c.currentTime+duration);g.gain.setValueAtTime(.08,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+duration);
  }
}
