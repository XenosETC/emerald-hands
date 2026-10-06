(() => {
  'use strict';
  const directions=['left','right','right','left'];
  let distance=0,nextDistance=450,completed=0,accepted=false,heading=0,visualBend=0,failed=false;
  function reset(){distance=0;nextDistance=450;completed=0;accepted=failed=false;heading=visualBend=0;}
  function diagnostics(){const remaining=nextDistance-distance;return {direction:directions[completed%directions.length],remaining,window:!failed&&remaining>0&&remaining<=28,announced:!failed&&remaining<=70,accepted,completed,heading,visualBend,nextDistance,failed};}
  function input(direction){const d=diagnostics();if(!d.window)return {handled:false,accepted:false,direction:d.direction};if(direction!=='left'&&direction!=='right')return {handled:false,accepted:false,direction:d.direction};if(direction===d.direction)accepted=true;return {handled:true,accepted,direction:d.direction,correct:accepted};}
  function update(nextPosition,dt){distance=nextPosition;const d=diagnostics();const sign=d.direction==='left'?-1:1;
    const target=d.announced?sign*Math.max(0,Math.min(1,(70-d.remaining)/70)):0;visualBend+=(target-visualBend)*Math.min(1,dt*6);
    if(distance>=nextDistance&&!failed){if(!accepted){failed=true;return {type:'missed',direction:d.direction};}heading+=sign*Math.PI/2;completed++;nextDistance+=450;accepted=false;return {type:'completed',direction:d.direction};}return null;
  }
  window.TempleTurns={reset,input,update,diagnostics};
})();
