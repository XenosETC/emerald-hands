export const APPROACH_ART=Object.freeze(Object.fromEntries(['frozen','crimson','void'].map(world=>[world,{approach:`${world}-approach1-v1`,approach2:`${world}-approach2-v1`}] )));
export const PORTAL_ART='realm-portals-v1';
export const EXTRA_ART=[...Object.values(APPROACH_ART).flatMap(Object.values),PORTAL_ART,'jade-disciple-v1','jade-disciple-walk-v1','jade-abbot-walk-v1','temple-approach-v1','kek-rift-eruptions-v1','crown-rift-planted-v1'];
export function sceneArt(world,zone){return world==='temple'&&zone!=='arena'?'temple-approach-v1':APPROACH_ART[world]?.[zone]||world;}
export function sceneSurface(world,zone){if(world==='temple')return .717;return {frozen:{approach:.825,approach2:.74},crimson:{approach:.65,approach2:.63},void:{approach:.75,approach2:.70}}[world]?.[zone]??{academy:.712,frozen:.73,crimson:.717,void:.707}[world];}
export function portalCell(world){return world==='temple'?0:['academy','frozen','crimson','void'].indexOf(world);}
export function riftCamera(elapsed,reduced=false){
 if(reduced||elapsed==null)return {zoom:1,shade:0,flash:0};
 const charge=Math.min(1,elapsed/.16),age=Math.max(0,elapsed-.32),impact=elapsed<.32?0:Math.max(0,1-age/.3);
 return {zoom:1+.025*charge*Math.max(0,1-age/.3)+.018*impact,shade:elapsed<.32?.16*charge:.08*impact,flash:elapsed>=.32?Math.max(0,1-age/.065)*.22:0};
}
