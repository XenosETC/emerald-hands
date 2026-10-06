// Conservative footprints around the shared service layout; 10px clearance for Crown.
export const TOWN_OBSTACLES=[{x:230,y:270,w:140,h:75},{x:800,y:270,w:140,h:85},{x:505,y:435,w:105,h:60}];
export function walkable(x,y){return x>=170&&x<=1040&&y>=270&&y<=555&&!TOWN_OBSTACLES.some(r=>x>r.x-10+.001&&x<r.x+r.w+10-.001&&y>r.y-10+.001&&y<r.y+r.h+10-.001);}
export function newTownHero(){return {x:650,y:390,facing:1,moving:false,target:null,path:[],distance:0};}
export function townTarget(p){return {x:Math.max(170,Math.min(1040,p.x)),y:Math.max(270,Math.min(555,p.y))};}
export function routeTown(h,point){
 const goal=townTarget(point),cells=[];for(let y=275;y<=555;y+=20)for(let x=170;x<=1030;x+=20)if(walkable(x,y))cells.push({x,y});
 const nearest=p=>cells.reduce((a,c)=>!a||Math.hypot(c.x-p.x,c.y-p.y)<Math.hypot(a.x-p.x,a.y-p.y)?c:a,null);
 const start=nearest(h),end=nearest(goal),key=p=>`${p.x},${p.y}`,lookup=new Map(cells.map(c=>[key(c),c])),parents=new Map([[key(start),null]]),queue=[start];
 for(let i=0;i<queue.length;i++){const p=queue[i];if(key(p)===key(end))break;for(const [dx,dy]of [[20,0],[-20,0],[0,20],[0,-20]]){const q=lookup.get(`${p.x+dx},${p.y+dy}`);if(q&&!parents.has(key(q))){parents.set(key(q),p);queue.push(q);}}}
 if(!parents.has(key(end)))return [];
 const path=[];for(let p=end;p;p=parents.get(key(p)))path.unshift({...p});
 if(walkable(goal.x,goal.y)&&Math.hypot(end.x-goal.x,end.y-goal.y)<25)path.push(goal);
 return path;
}
export function setTownDestination(h,p){h.path=routeTown(h,p);h.target=h.path.shift()??null;return !!h.target;}
export function stepTownHero(h,dt,keys={}){
 let dx=(keys.d?1:0)-(keys.a?1:0),dy=(keys.s?1:0)-(keys.w?1:0);h.moving=false;
 if(dx||dy){h.target=null;h.path=[];}
 else if(h.target){dx=h.target.x-h.x;dy=h.target.y-h.y;if(Math.hypot(dx,dy)<2){h.target=h.path.shift()??null;return;}}
 const d=Math.hypot(dx,dy);if(!d)return;
 const step=Math.min(135*dt,h.target?d:Infinity),oldX=h.x,oldY=h.y,next=townTarget({x:h.x+dx/d*step,y:h.y+dy/d*step});
 if(walkable(next.x,h.y))h.x=next.x;if(walkable(h.x,next.y))h.y=next.y;
 const moved=Math.hypot(h.x-oldX,h.y-oldY);h.distance+=moved;h.moving=moved>.01;if(Math.abs(dx)>.01)h.facing=dx>0?1:-1;
}
