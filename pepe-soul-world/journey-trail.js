import {academyTrail} from './quest-guidance.js?v=6';
import {groundRewards} from './ground-rewards.js?v=1';
// Reuse normal walking only after combat; never cross a gate or grant loot here.
export function journeyTrail(s){
 if(s.world==='academy')return academyTrail(s);
 if(s.dead||s.player.hurt>0||s.enemies.some(e=>!e.dead)||s.projectiles.some(q=>!q.friendly&&q.life>0)||!['approach','approach2','arena'].includes(s.zone))return null;
 if(s.zone==='arena'&&!s.guardianDefeated)return null;
 const reward=groundRewards(s)[0];
 if(reward)return {x:reward.x,label:'the nearest ground reward'};
 if(s.zone!=='arena'&&!s.discoveries.includes(s.world))return Math.abs(s.player.x-1360)<170?null:{x:1360,label:'the unattuned echo shrine'};
 return {x:2250,label:s.zone==='arena'?'the return portal':s.zone==='approach2'||s.world==='temple'?'the guardian passage':'the next passage'};
}
