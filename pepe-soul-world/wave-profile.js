import {levelFor,stats} from './systems.js';

// Grounded Wave totals, distinct from the equipment/skill bonus alone.
export function waveProfile(state){
 const base=36+levelFor(state.xp).level*3,bonus=stats(state).wave;
 return {base,bonus,damage:base+bonus};
}
