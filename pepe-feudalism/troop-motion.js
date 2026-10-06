// Atlas motion follows simulation time; no independently running animation clock.
export function drawTroopFrame(g,image,sx,sy,w,h,u,time,width,height,motion){
 const phase=motion?.phase??time*9+u.id,attack=u.swing>0?Math.sin((1-u.swing/.22)*Math.PI):0;
 const mage=u.type==='holyMage'||u.type==='shadowMage',spear=u.type==='spearman',bow=u.type==='archer',guardian=u.type==='frogGuardian';
 // Each role has a distinct release silhouette, anchored to the feet.
 g.translate(spear?attack*14:bow?-attack*5:attack*4,guardian?-attack*3:0);
 g.rotate(mage?-attack*.045:bow?-attack*.06:guardian?attack*.045:attack*.11);
 const cut=h*.8,top=height*.8,left=-width/2,y=-height+4;
 if(u.moving){const step=Math.sin(phase)*3;g.drawImage(image,sx,sy,w,cut,left,y,width,top);g.drawImage(image,sx,sy+cut,w/2,h-cut,left+step,y+top,width/2,height-top);g.drawImage(image,sx+w/2,sy+cut,w/2,h-cut,-step,y+top,width/2,height-top);}
 else g.drawImage(image,sx,sy,w,h,left,y,width,height);
 if(mage){g.save();g.globalAlpha=.25+attack*.55;g.strokeStyle=u.type==='holyMage'?'#fff0a0':'#be80ff';g.lineWidth=2;g.beginPath();g.ellipse(0,0,25+attack*8,9,0,0,Math.PI*2);g.stroke();if(attack>0){g.translate(25,-height*.58);g.rotate(attack*1.2);g.beginPath();for(let i=0;i<4;i++){const a=i*Math.PI/2;g.moveTo(Math.cos(a)*6,Math.sin(a)*6);g.lineTo(Math.cos(a)* (10+attack*10),Math.sin(a)*(10+attack*10));}g.stroke();}g.restore();}
 if(attack>0&&!mage&&!bow){g.save();g.globalAlpha=attack*.55;g.strokeStyle=u.type==='shadowKnight'?'#b98aff':u.type==='holyKnight'?'#fff0ad':guardian?'#8bf5b0':'#e2f1de';g.lineWidth=guardian?4:2;g.beginPath();if(spear){g.moveTo(30,-height*.48);g.lineTo(57+attack*18,-height*.48);}else g.arc(18,-height*.48,guardian?36:29,-.9,.65);g.stroke();g.restore();}
}
