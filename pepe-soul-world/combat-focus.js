// Keep the guardian's committed warning readable through nearby enemy crowds.
export function combatFocus(enemies,player,world){
 const nearby=enemies.filter(e=>!e.dead&&e.world===world&&world!=='academy'&&Math.abs(e.x-player.x)<430);
 const distance=e=>Math.abs(e.x-player.x);
 nearby.sort((a,b)=>Number(b.boss)-Number(a.boss)||distance(a)-distance(b));
 return {foe:nearby[0]||null,others:Math.max(0,nearby.length-1)};
}
