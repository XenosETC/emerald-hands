// Cosmetic secondary motion only. Simulation time also makes pause deterministic.
export function createRunnerMotion(){
  let previousAction='run',previousTime=-1,previousDistance=-1,landedAt=-Infinity,last={cameraBob:0,cameraDip:0,lean:0,pitch:0,squash:1,lateralStretch:1,landing:0,slideWeight:0};
  return {update(d){
    if(d.state==='paused')return {...last};
    if(d.time<previousTime||(Number.isFinite(d.distance)&&d.distance<previousDistance)){previousAction='run';landedAt=-Infinity;}
    if(d.state==='running'&&previousAction==='jump'&&d.action!=='jump')landedAt=d.time;
    const elapsed=Math.max(0,d.time-landedAt),landing=d.state==='running'&&elapsed<.22?Math.sin(elapsed/.22*Math.PI):0;
    const running=d.state==='running',stride=running&&(!d.action||d.action==='run')?Math.sin(d.time*Math.min(15,9+d.speed*.1))*.022:0;
    const jumpPhase=d.action==='jump'?Math.max(0,Math.min(1,d.actionTime/.85)):0;
    const squash=1-landing*.035;
    const slideRamp=running&&d.action==='slide'?Math.max(0,Math.min(1,(.75-d.actionTime)/.12,d.actionTime/.12)):0,slideWeight=slideRamp*slideRamp*(3-2*slideRamp);
    last={cameraBob:stride,cameraDip:-landing*.045-.16*slideWeight,lean:running?Math.max(-.18,Math.min(.18,(d.lane-d.visualLane)*-.18)):0,pitch:running&&d.action==='jump'?Math.sin(jumpPhase*Math.PI*2)*.055:0,squash,lateralStretch:1/Math.sqrt(squash),landing,slideWeight};
    previousAction=d.action;previousTime=d.time;previousDistance=d.distance??previousDistance;return {...last};
  }};
}
