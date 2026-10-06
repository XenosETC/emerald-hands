import {formationTarget, retreatTarget} from './formation.js';
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);

// Reconsider only when a target dies, leaves the order's limits, or another foe is
// substantially closer. This avoids two nearly equidistant targets causing jitter.
function chooseTarget(unit, enemies) {
  const nearest = enemies.reduce((best,enemy) => !best || distance(unit,enemy)<distance(unit,best) ? enemy : best, null);
  // Enemy aggression keeps its existing nearest-target rule. This pass changes
  // Crown's command discipline, not the difficulty through enemy focus fire.
  if(unit.team===1)return nearest;
  const previous = enemies.find(enemy => enemy.id === unit.enemyId);
  const target = previous && (!nearest || distance(unit,previous)<=distance(unit,nearest)+50) ? previous : nearest;
  unit.enemyId = target?.id ?? null;
  return target;
}

export function soldierIntent(b, unit) {
  let enemies = b.units.filter(enemy => enemy.team !== unit.team && enemy.hp > 0);
  if (unit.team === 1 || b.order === 'attack') return {target:chooseTarget(unit,enemies)};
  if (b.order === 'retreat') {unit.enemyId=null; return {post:retreatTarget(b,unit)};}
  const post = formationTarget(b,unit);
  const leash = b.order === 'hold' ? 35 : 180;
  if (distance(unit,post)>leash) {unit.enemyId=null; return {post};}
  enemies = enemies.filter(enemy => distance(enemy,post) <= (b.order === 'hold' ? unit.range+25 : 240));
  const target = chooseTarget(unit,enemies);
  return target ? {target} : {post};
}
