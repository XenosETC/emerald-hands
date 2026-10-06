import {ARMOR,SHIELDS} from './equipment.js';
import {WEAPONS} from './campaign.js';
export function heroStats(state){
 const weapon=WEAPONS[state.weapon??'sword'],a=state.attributes??{};
 return {armorReduction:ARMOR[state.armor]?.reduction??0,shieldHealth:SHIELDS[state.shield]?.health??0,max:260+state.level*20+(SHIELDS[state.shield]?.health??0)+(a.VIT??0)*12,damage:weapon.damage+state.upgrade*12+(a.STR??0)*3,range:weapon.range,speed:165+(a.DEX??0)*4,attackCooldown:weapon.cooldown*Math.max(.5,1-(a.DEX??0)*.02),sweep:65+(a.INT??0)*5,rally:45+(a.WIS??0)*4,sweepCooldown:5*Math.max(.5,1-(a.WIS??0)*.02),rallyCooldown:9*Math.max(.5,1-(a.WIS??0)*.02)};
}
