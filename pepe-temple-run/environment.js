(() => {
  const images = {}, paths = {
    background: 'assets/emerald-frog-temple-v1.png',
    sanctum: 'assets/sunken-sanctum-v1.png',
    idol: 'assets/frog-guardian-v1.png',
    gate: 'assets/frog-lintel-v1.png',
    boulder: 'assets/jade-boulder-v1.png',
  };
  for (const [key, path] of Object.entries(paths)) {
    const image = new Image(); image.src = path; images[key] = image;
  }
  const ready = key => images[key]?.complete && images[key].naturalWidth > 0;
  function polygon(ctx, points, fill) {
    ctx.fillStyle = fill; ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));
    ctx.closePath(); ctx.fill();
  }
  function prop(ctx, key, x, y, width, height, opacity = 1) {
    if (!ready(key)) return false;
    ctx.save(); ctx.globalAlpha = opacity;
    ctx.drawImage(images[key], x - width / 2, y - height, width, height);
    ctx.restore(); return true;
  }
  function backdrop(ctx,key,w,h,opacity=1){
    if(ready(key)){
      const image=images[key];ctx.save();ctx.globalAlpha=opacity;
      const bend=window.TempleTurns?.diagnostics().visualBend||0;
      // Shift the vanishing point while keeping the runner's feet anchored.
      const shear=-bend*w*.20/h;
      ctx.transform(1,0,shear,1,-shear*h*.92,0);
      if(w/h<1.15){
        // Portrait framing keeps the central frog shrine and undistorted stonework.
        const sourceWidth=image.naturalHeight*w/h;
        ctx.drawImage(image,(image.naturalWidth-sourceWidth)/2,0,sourceWidth,image.naturalHeight,-w*.12,0,w*1.24,h);
      }else ctx.drawImage(image,-w*.12,0,w*1.24,h);
      ctx.restore();
    }
  }
  function draw(ctx, w, h, distance, time, project,skyOnly=false) {
    ctx.fillStyle='#173b2c';ctx.fillRect(0,0,w,h);
    backdrop(ctx,'background',w,h);
    const blend=Math.max(0,Math.min(1,(distance-480)/60));
    if(blend>0)backdrop(ctx,'sanctum',w,h,blend);
    if(distance>980){ctx.fillStyle=`rgba(8,15,39,${Math.min(.3,(distance-980)/400)})`;ctx.fillRect(0,0,w,h);}
    const veil = ctx.createLinearGradient(0, 0, 0, h);
    veil.addColorStop(0, '#041b1744'); veil.addColorStop(.4, '#082d1c05'); veil.addColorStop(1, '#041c1644');
    ctx.fillStyle = veil; ctx.fillRect(0, 0, w, h);
    if(skyOnly)return;
    // Keep the generated stone causeway visible beneath moving tile joints.
    polygon(ctx, [[w*.46,h*.43],[w*.54,h*.43],[w*.89,h],[w*.11,h]], '#14352727');
    for (let i = 0; i < 18; i++) {
      const z = (i*9 - distance%9 + 153)%153;
      const p = project(1,z), q = project(1,Math.min(150,z+9));
      if (z>150) continue;
      const near=w*.74*p.s, far=w*.74*q.s;
      polygon(ctx, [[w/2-far/2,q.y],[w/2+far/2,q.y],[w/2+near/2,p.y],[w/2-near/2,p.y]], i%2?'#b8c09108':'#09231815');
      ctx.strokeStyle='#152b2499';ctx.lineWidth=Math.max(.5,2*p.s);
      ctx.beginPath();ctx.moveTo(w/2-near/2,p.y);ctx.lineTo(w/2+near/2,p.y);ctx.stroke();
      for (const l of [.5,1.5]) {
        const a=project(l,z),b=project(l,Math.min(150,z+7));
        ctx.strokeStyle=`rgba(229,214,139,${.13+.22*p.s})`;ctx.lineWidth=Math.max(1,2.5*p.s);
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
    }
    // Scenery travels toward the camera with the same world distance as hazards.
    for(let i=0;i<5;i++){
      const z=(i*32-distance%32+160)%160;
      if(z>150||z<7)continue;
      for(const side of [-1,1]){
        const p=project(1+side*1.85,z),s=p.s;
        prop(ctx,'idol',p.x,p.y,Math.min(w*.28,260)*s,Math.min(w*.28,260)*s,.4+.6*s);
        const halo=ctx.createRadialGradient(p.x,p.y-65*s,0,p.x,p.y-65*s,27*s);
        halo.addColorStop(0,'#d3ffd77a');halo.addColorStop(1,'#91ffe000');
        ctx.fillStyle=halo;ctx.fillRect(p.x-30*s,p.y-95*s,60*s,60*s);
      }
    }
    // Waterfall mist drifts only around the outer edges, leaving the lanes clear.
    for(const side of [0,1]){
      const mist=ctx.createRadialGradient(w*side,h*.68,0,w*side,h*.68,w*.24);
      mist.addColorStop(0,`rgba(197,230,207,${.06+.025*Math.sin(time*.6+side)})`);mist.addColorStop(1,'#d1e8cc00');
      ctx.fillStyle=mist;ctx.fillRect(0,0,w,h);
    }
  }
  function boulder(ctx,x,y,size,phase){
    if(!ready('boulder'))return;
    ctx.save();ctx.fillStyle='#031b1999';ctx.beginPath();ctx.ellipse(x,y,size*.48,size*.09,0,0,Math.PI*2);ctx.fill();
    ctx.translate(x,y-size*.49);ctx.rotate(-phase);
    ctx.drawImage(images.boulder,-size/2,-size/2,size,size);ctx.restore();
  }
  window.TempleEnvironment={draw,drawSky:(ctx,w,h,distance,time)=>draw(ctx,w,h,distance,time,null,true),prop,boulder,sceneAt:distance=>distance<500?'jade':distance<1000?'sanctum':'abyss',diagnostics:()=>Object.fromEntries(Object.keys(paths).map(k=>[k,ready(k)]))};
})();
