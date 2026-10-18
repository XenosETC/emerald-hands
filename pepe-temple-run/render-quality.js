// Presentation only: never change the simulation clock or collision timing.
export const QUALITY_PROFILES=Object.freeze({
  smooth:Object.freeze({ratio:1,shadows:false}),
  balanced:Object.freeze({ratio:1.25,shadows:false}),
  high:Object.freeze({ratio:2,shadows:true})
});
export function renderQuality(mode,dpr=1){
  const profile=QUALITY_PROFILES[mode]||QUALITY_PROFILES.balanced;
  return {ratio:Math.min(Number.isFinite(dpr)&&dpr>0?dpr:1,profile.ratio),shadows:profile.shadows};
}
export function createRenderGate(){
  let pausedView=null;
  return (state,width,height,ratio,shadows)=>{
    const view=[width,height,ratio,shadows].join('|');
    if(state==='paused'&&pausedView===view)return false;
    pausedView=state==='paused'?view:null;
    return true;
  };
}
