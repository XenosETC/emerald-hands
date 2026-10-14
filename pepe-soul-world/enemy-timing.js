import {eliteSpec} from './realm-enemies.js';
import {templeTelegraph} from './temple-combat.js';
const clamp=value=>Math.max(0,Math.min(1,value));
// Shared with the simulation: these are existing timings, not UI estimates.
export function realmAttackTiming(enemy){
 return {windup:eliteSpec(enemy)?0.9:enemy.boss?0.65:0.55,strike:0.18,recovery:enemy.boss?0.9:0.8};
}
export function enemyTelegraph(enemy){
 if(enemy.dead||enemy.world==='academy')return null;
 if(enemy.stun>0)return {phase:'stagger',label:'STAGGERED',remaining:enemy.stun,progress:null,urgent:false};
 if(enemy.world==='temple')return templeTelegraph(enemy);
 const timing=realmAttackTiming(enemy),remaining=Math.max(0,enemy.timer);
 if(enemy.mode==='windup')return {phase:'windup',label:'WINDUP',remaining,progress:clamp(1-remaining/(enemy.windupDuration||timing.windup)),urgent:remaining<=.3};
 if(enemy.mode==='strike')return {phase:'strike',label:'RELEASE',remaining,progress:1,urgent:true};
 if(enemy.mode==='recover')return {phase:'recover',label:'COUNTER WINDOW',remaining,progress:clamp(remaining/(enemy.recoveryDuration||timing.recovery)),urgent:false};
 return null;
}
