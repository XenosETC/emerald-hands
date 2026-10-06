export function drawItem(g,id){
 g.save();g.translate(32,37);g.lineWidth=2;g.strokeStyle='#79572d';
 if(id==='potion'){g.fillStyle='#8ab5b3';g.beginPath();g.moveTo(-7,-24);g.lineTo(7,-24);g.lineTo(7,-12);g.bezierCurveTo(23,-2,22,22,0,23);g.bezierCurveTo(-22,22,-23,-2,-7,-12);g.closePath();g.fill();g.stroke();g.fillStyle='#c9df83';g.beginPath();g.ellipse(0,11,16,10,0,0,7);g.fill();g.fillStyle='#906840';g.fillRect(-8,-28,16,7);g.strokeStyle='#f4f0c4';g.beginPath();g.moveTo(-10,0);g.lineTo(-11,10);g.stroke();}
 else if(id==='jade'){g.fillStyle='#4c9e76';g.beginPath();g.moveTo(0,-25);g.lineTo(20,-4);g.lineTo(12,22);g.lineTo(-13,22);g.lineTo(-21,-3);g.closePath();g.fill();g.stroke();g.strokeStyle='#c8edb2';g.beginPath();g.moveTo(0,-25);g.lineTo(-5,1);g.lineTo(12,22);g.moveTo(-5,1);g.lineTo(20,-4);g.stroke();}
 else {g.fillStyle='#a4b8b0';g.beginPath();g.moveTo(-21,-8);g.lineTo(11,-19);g.lineTo(23,-6);g.lineTo(20,14);g.lineTo(-13,25);g.lineTo(-23,11);g.closePath();g.fill();g.stroke();g.strokeStyle='#edf0ce';g.beginPath();g.moveTo(-21,-8);g.lineTo(-10,4);g.lineTo(23,-6);g.moveTo(-10,4);g.lineTo(-13,25);g.stroke();}
 g.restore();
}
