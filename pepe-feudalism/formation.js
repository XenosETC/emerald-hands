// Twelve persistent posts. Casualties leave vacancies instead of reindexing survivors.
const ROW_X = [85, -65, -150];
const LANES = [-34, 34, -102, 102];
const preference = type => ['guard','holyKnight','shadowKnight','frogGuardian'].includes(type) ? [0,1,2] : ['archer','holyMage','shadowMage'].includes(type) ? [2,1,0] : [1,0,2];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function assignFormationPosts(b) {
  const soldiers = b.units.filter(u => u.team === 0 && !u.hero && u.hp > 0);
  const occupied = new Set();
  for (const unit of soldiers) {
    if (Number.isInteger(unit.formationPost) && unit.formationPost >= 0 && unit.formationPost < 12 && !occupied.has(unit.formationPost)) occupied.add(unit.formationPost);
    else unit.formationPost = null;
  }
  const waiting = soldiers.filter(u => u.formationPost === null);
  const assign = (unit, rows) => {
    for (const row of rows) for (let lane = 0; lane < 4; lane++) {
      const post = row * 4 + lane;
      if (!occupied.has(post)) {unit.formationPost = post; occupied.add(post); return true;}
    }
    return false;
  };
  // Preserve a preferred row for each role before placing overflow soldiers.
  for (const unit of waiting) assign(unit, [preference(unit.type)[0]]);
  for (const unit of waiting.filter(u => u.formationPost === null)) assign(unit, preference(unit.type));
}

export function issueOrder(b, order) {
  if (!['hold','follow','attack','retreat'].includes(order) || b.result) return false;
  b.order = order;
  b.hold = {x:b.hero.x, y:b.hero.y, facing:b.hero.facing};
  b.follow = {facing:b.hero.facing, extremeX:b.hero.x};
  for (const unit of b.units) if (!unit.hero && unit.team === 0) unit.enemyId = null;
  return true;
}

export function updateFollowHeading(b) {
  if (b.order !== 'follow') return;
  b.follow ??= {facing:b.hero.facing ?? 1, extremeX:b.hero.x};
  const follow = b.follow;
  if ((b.hero.x - follow.extremeX) * follow.facing >= 0) follow.extremeX = b.hero.x;
  else if (Math.abs(b.hero.x - follow.extremeX) >= 45) {
    follow.facing *= -1; follow.extremeX = b.hero.x;
  }
}

export function formationTarget(b, u) {
  if (!Number.isInteger(u.formationPost)) assignFormationPosts(b);
  const post = u.formationPost ?? 4, row = Math.floor(post / 4), lane = post % 4;
  const origin = b.order === 'hold' ? b.hold : b.hero;
  const facing = b.order === 'hold' ? origin.facing ?? 1 : b.follow?.facing ?? b.hero.facing ?? 1;
  const offset = b.order === 'hold' ? 0 : 155;
  // Move the whole grid away from an edge; never collapse several posts onto it.
  const minOffset = Math.min(...ROW_X.map(x => (x-offset)*facing));
  const maxOffset = Math.max(...ROW_X.map(x => (x-offset)*facing));
  const centerX = clamp(origin.x, 65-minOffset, 1135-maxOffset);
  const centerY = clamp(origin.y, 337, 493);
  const postPosition = {x:centerX+(ROW_X[row]-offset)*facing, y:centerY+LANES[lane]};
  if(b.order==='follow'&&Math.hypot(postPosition.x-b.hero.x,postPosition.y-b.hero.y)<68){
    // At an edge the grid may sit beside Crown. Bend the nearest posts around him.
    const dx=Math.sqrt(68**2-(postPosition.y-b.hero.y)**2);
    const candidates=[b.hero.x-dx*facing,b.hero.x+dx*facing].filter(x=>x>=65&&x<=1135);
    const clearance=x=>Math.min(...ROW_X.filter((_,i)=>i!==row).map(offset=>Math.abs(x-(centerX+(offset-155)*facing))));
    candidates.sort((a,c)=>clearance(c)-clearance(a));
    if(candidates.length)postPosition.x=candidates[0];
  }
  return postPosition;
}

export function retreatTarget(b, u) {
  if (!Number.isInteger(u.formationPost)) assignFormationPosts(b);
  const post = u.formationPost ?? 4;
  return {x:65+Math.floor(post/4)*70, y:415+LANES[post%4]};
}
