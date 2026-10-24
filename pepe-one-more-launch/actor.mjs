import {nozzles, localToScreen, clamp, smooth} from './presentation.mjs';

export function createActor() {
  const atlas = new Image();
  const integrated = new Image();
  const rigs = [];
  let integratedLoaded = false;
  integrated.src = 'assets/crown-rig-integrated-v3.png';
  const cells = [];
  let loaded = false;
  atlas.src = 'assets/crown-ship-atlas-v2.png';
  const pilotReady = atlas.decode().then(() => {
    // Read alpha bounds once so ship and rider keep their aspect ratios and share
    // attachment anchors regardless of transparent padding in the source atlas.
    const scratch = document.createElement('canvas');
    scratch.width = atlas.width; scratch.height = atlas.height;
    const c = scratch.getContext('2d', {willReadFrequently: true});
    c.drawImage(atlas, 0, 0);
    const pixels = c.getImageData(0, 0, atlas.width, atlas.height).data;
    const cw = Math.floor(atlas.width / 2), ch = Math.floor(atlas.height / 2);
    for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
      let x0 = cw, y0 = ch, x1 = 0, y1 = 0;
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        const alpha = pixels[((row * ch + y) * atlas.width + col * cw + x) * 4 + 3];
        if (alpha > 100) {x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);}
      }
      cells[row * 2 + col] = {x: col * cw + x0, y: row * ch + y0, w: x1 - x0 + 1, h: y1 - y0 + 1};
    }
    loaded = true;
    return true;
  }).catch(() => false);

  function sprite(ctx, index, x, y, width, height) {
    if (!loaded) return;
    const r = cells[index], scale = Math.min(width / r.w, height / r.h);
    const w = r.w * scale, h = r.h * scale;
    ctx.drawImage(atlas, r.x, r.y, r.w, r.h, x + (width - w) / 2, y + (height - h) / 2, w, h);
  }

  function crown(ctx, x, y, scale = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = '#513c20'; ctx.fillRect(-21, -5, 42, 15);
    ctx.fillStyle = '#efc456';
    ctx.beginPath(); ctx.moveTo(-19, 6); ctx.lineTo(-23, -12); ctx.lineTo(-10, -5); ctx.lineTo(0, -20); ctx.lineTo(11, -5); ctx.lineTo(23, -12); ctx.lineTo(19, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3ef3a8'; ctx.fillRect(-4, -6, 8, 9); ctx.restore();
  }

  function pilot(ctx, x, y, {time = 0, fear = 0, scale = 1, parachute = false} = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.rotate(Math.sin(time * (parachute ? 2.5 : 9)) * (parachute ? .08 : .012));
    if (loaded) {
      // One recovery pose at a time, without double-exposed frog silhouettes.
      sprite(ctx, fear > .6 ? 3 : 2, -57, -96, 114, 116);
    } else {
      ctx.fillStyle = '#599c3e'; ctx.fillRect(-25, -69, 50, 35);
      ctx.fillStyle = '#14272a'; ctx.fillRect(-20, -34, 40, 47);
      ctx.fillStyle = '#c67a31'; ctx.fillRect(-20, -44, 40, 8);
      ctx.fillStyle = '#e2e7c7'; ctx.fillRect(-20, -61, 14, 9); ctx.fillRect(7, -61, 14, 9);
      crown(ctx, 0, -78, .75);
    }
    if (parachute) {
      ctx.strokeStyle = '#dbd9a2'; ctx.lineWidth = 1.5;
      for (const side of [-1, 1]) {ctx.beginPath(); ctx.moveTo(side * 28, -25); ctx.lineTo(side * 66, -145); ctx.stroke();}
      ctx.fillStyle = '#263e2e';
      ctx.beginPath(); ctx.moveTo(-79, -139); ctx.quadraticCurveTo(0, -230, 79, -139); ctx.lineTo(52, -145); ctx.lineTo(27, -137); ctx.lineTo(0, -145); ctx.lineTo(-27, -137); ctx.lineTo(-52, -145); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6eac55'; ctx.beginPath(); ctx.moveTo(-73, -142); ctx.quadraticCurveTo(0, -222, 73, -142); ctx.quadraticCurveTo(0, -165, -73, -142); ctx.fill();
      ctx.strokeStyle = '#b4d77c'; ctx.beginPath(); ctx.moveTo(0, -184); ctx.lineTo(0, -144); ctx.moveTo(0, -181); ctx.lineTo(-48, -148); ctx.moveTo(0, -181); ctx.lineTo(48, -148); ctx.stroke();
    }
    ctx.restore();
  }

  function ship(ctx, {time, engine = 0, tank = 0, cooling = 0, heat = 0, build = 1, powered = false}) {
    const reveal = smooth(build);
    ctx.save(); ctx.globalAlpha *= reveal;
    if (loaded) sprite(ctx, engine >= 3 ? 1 : 0, engine >= 3 ? -76 : -52, -161, engine >= 3 ? 152 : 104, 220);
    else {ctx.fillStyle = '#28413d'; ctx.fillRect(-24, -120, 48, 176); ctx.fillStyle = '#88eab2'; ctx.fillRect(-12, -100, 24, 110); ctx.fillStyle = '#d4b263'; ctx.fillRect(-27, -30, 54, 8);}
    // Lamps and tank fill are fixed to the hull rather than to the rider animation.
    ctx.fillStyle = powered ? '#dcffb8' : '#3e7952';
    ctx.fillRect(-3, -116, 6, 4);
    if (tank > 0) for (const side of [-1, 1]) {
      const px = side * (engine >= 3 ? 61 : 36);
      ctx.fillStyle = '#102f2b'; ctx.fillRect(px - 8, -67, 16, 89);
      ctx.fillStyle = '#bca05b'; ctx.fillRect(px - 9, -66, 18, 5); ctx.fillRect(px - 9, 14, 18, 5);
      ctx.fillStyle = '#337650'; ctx.fillRect(px - 3, -55, 6, 56);
      ctx.fillStyle = '#99ec8c'; ctx.fillRect(px - 2, -53, 2, 49);
    }
    if (cooling > 0) {
      const px = engine >= 3 ? 68 : 43;
      ctx.fillStyle = '#182f2b'; ctx.fillRect(px - 13, -27, 26, 26);
      ctx.save(); ctx.translate(px, -14); ctx.rotate(time * (powered ? 24 : 8));
      ctx.fillStyle = '#b0b99a'; for (let i = 0; i < 4; i++) {ctx.rotate(Math.PI / 2); ctx.fillRect(0, -2, 10, 4);} ctx.restore();
      ctx.fillStyle = '#e9d28b'; ctx.fillRect(px - 2, -16, 4, 4);
    }
    if (heat > 65) {
      ctx.globalAlpha *= (heat - 65) / 70 * (.5 + Math.sin(time * 17) * .3);
      ctx.fillStyle = '#ff8d4844'; ctx.fillRect(-22, -122, 44, 175);
    }
    ctx.restore();
  }

  const rigReady = integrated.decode().then(() => {
    const scratch = document.createElement('canvas'); scratch.width = integrated.width; scratch.height = integrated.height;
    const c = scratch.getContext('2d', {willReadFrequently:true}); c.drawImage(integrated,0,0);
    const pixels = c.getImageData(0,0,integrated.width,integrated.height).data;
    const cw = Math.floor(integrated.width/2), ch = Math.floor(integrated.height/2);
    for(let row=0;row<2;row++)for(let col=0;col<2;col++){
      let x0=cw,y0=ch,x1=0,y1=0;
      for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(pixels[((row*ch+y)*integrated.width+col*cw+x)*4+3]>100){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
      rigs.push({x:col*cw+x0,y:row*ch+y0,w:x1-x0+1,h:y1-y0+1});
    }
    integratedLoaded=true;return true;
  }).catch(()=>false);
  const ready = Promise.all([pilotReady,rigReady]).then(results=>results.every(Boolean));

  function drawRig(ctx, pose, state) {
    const {time,active=false,boost=0,heat=0,engine=0,charge=0,fear=0,build=1}=state;
    ctx.save();ctx.translate(pose.x,pose.y);ctx.rotate(pose.tilt);
    ctx.scale(pose.scale*(1+pose.squash),pose.scale*(1-pose.squash));
    if(active||charge>0)for(const nozzle of nozzles(engine)){
      const intensity=active?1:charge;
      const baseY=nozzle===0?57:47;
      const length=(74+boost*97+Math.sin(time*43+nozzle)*11)*intensity;
      for(const [color,width,factor] of [['#237a5944',21,1.2],['#43eaa0',13,1],['#b8ffae',8,.72],['#fff4c3',3,.4]]){
        ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(nozzle-width,baseY);ctx.lineTo(nozzle-width*.7,baseY+26);ctx.lineTo(nozzle+Math.sin(time*48)*5,baseY+7+length*factor);ctx.lineTo(nozzle+width*.7,baseY+26);ctx.lineTo(nozzle+width,baseY);ctx.closePath();ctx.fill();
      }
    }
    if(integratedLoaded){
      const index=(engine>=3?2:0)+(fear>.6?1:0),r=rigs[index];
      const scale=Math.min((engine>=3?190:132)/r.w,220/r.h),w=r.w*scale,h=r.h*scale;
      // The rig is a single generated drawing: no independently pasted rider or straps.
      ctx.globalAlpha*=smooth(build);ctx.drawImage(integrated,r.x,r.y,r.w,r.h,-w/2,59-h,w,h);
      if(heat>76){ctx.globalAlpha*=clamp((heat-76)/70)*(.5+Math.sin(time*15)*.2);ctx.fillStyle='#ff864733';ctx.fillRect(-w/2,59-h,w,h);}
    }else{
      // A loading fallback uses the hull only; never reconstruct the old pasted rider.
      ship(ctx,{...state,powered:active,build});
    }
    ctx.restore();
  }
  function wreck(ctx, origin, t, engine) {
    if (!integratedLoaded) return;
    const cell = rigs[engine >= 3 ? 2 : 0];
    // Real fragments from the current ship sprite rather than unrelated confetti.
    for (let i = 0; i < 8; i++) {
      const col = i % 2, row = Math.floor(i / 2), sw = cell.w / 2, sh = cell.h / 4;
      const side = col ? 1 : -1, speed = 55 + row * 23;
      ctx.save(); ctx.globalAlpha = clamp(1 - t / 3.2);
      ctx.translate(origin.x + side * speed * t, origin.y - 80 + row * 36 - (100 + row * 20) * t + t * t * 62);
      ctx.rotate(side * t * (1.1 + row * .7));
      ctx.drawImage(integrated, cell.x + col * sw, cell.y + row * sh, sw, sh, -21, -15, 42, 32);
      ctx.restore();
    }
  }

  // Compatibility for the art-review page; the runtime uses drawRig directly.
  function draw(ctx, x, y, state) {drawRig(ctx, {x, y, scale: 1, tilt: 0, squash: 0}, {...state, fear: state.boost ? 1 : 0});}
  return {ready, draw, drawRig, crown, pilot, wreck, exhaustAnchors: (pose, engine) => nozzles(engine).map(x => localToScreen(pose, x, x === 0 ? 57 : 47))};
}
