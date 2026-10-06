// Ambient traffic is presentation only: it never spends gold or changes quests.
export function caravanPosition(a,b,time,offset=0){
 const length=Math.hypot(b.x-a.x,b.y-a.y),cycle=(time*48/length+offset)%2,t=cycle<=1?cycle:2-cycle;
 return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,facing:(b.x>=a.x?1:-1)*(cycle<=1?1:-1)};
}
export function drawWorldLife(g,nodes,time){
 const journeys=[['home','mossford',.2],['sunspire','outpost',.7],['pearlport','greenmere',.5],['jadeforest','cinderford',1.3]];
 for(const [from,to,offset]of journeys){const a=nodes.find(n=>n.id===from),b=nodes.find(n=>n.id===to);if(!a||!b)continue;const p=caravanPosition(a,b,time,offset);
  g.save();g.translate(p.x,p.y);g.scale(p.facing,1);g.fillStyle='#16352b55';g.beginPath();g.ellipse(0,12,31,9,0,0,7);g.fill();
  g.strokeStyle='#563c25';g.lineWidth=3;g.fillStyle='#947044';g.fillRect(-18,-9,36,20);g.strokeRect(-18,-9,36,20);
  g.fillStyle='#e0c394';g.beginPath();g.moveTo(-20,-8);g.quadraticCurveTo(-18,-38,0,-37);g.quadraticCurveTo(18,-38,20,-8);g.closePath();g.fill();g.stroke();
  g.strokeStyle='#a48c63';g.lineWidth=1;for(const x of [-12,0,12]){g.beginPath();g.moveTo(x,-8);g.lineTo(x*.75,-32);g.stroke();}
  for(const x of [-13,13]){g.fillStyle='#3b3024';g.beginPath();g.arc(x,12,7,0,0,7);g.fill();g.strokeStyle='#d2ae6f';g.lineWidth=2;g.beginPath();g.moveTo(x-5*Math.cos(time*3),12-5*Math.sin(time*3));g.lineTo(x+5*Math.cos(time*3),12+5*Math.sin(time*3));g.stroke();}
  g.fillStyle='#6d914f';g.beginPath();g.ellipse(24,-3,7,9,0,0,7);g.fill();g.fillStyle='#c4db8d';g.fillRect(24,-10,3,3);g.fillStyle='#796044';g.fillRect(20,5,9,8);g.strokeStyle='#6a4a2d';g.lineWidth=2;g.beginPath();g.moveTo(18,4);g.lineTo(25,7);g.stroke();g.restore();
 }
}
