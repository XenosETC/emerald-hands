import {RELEASE} from './release-spec.js';
import {stats} from './systems.js';
import {canRelease} from './core.js';
export function releaseInfo(s){
 const st=stats(s),unlocked=canRelease(s),remaining=s.player.release;
 return {unlocked,remaining,duration:st.releaseDuration,bonus:RELEASE.attackBonus+st.releaseAttack,cost:RELEASE.cost,cooldown:RELEASE.cooldown,
  text:!unlocked?'Reach level 3 and recover a seal to awaken your blade.':remaining>0?`Awakened · ${remaining.toFixed(1)}s remaining · Cuts deal +${RELEASE.attackBonus+st.releaseAttack} damage.`:`R · Awaken for ${st.releaseDuration} seconds · ${RELEASE.cost} Spirit · +${RELEASE.attackBonus+st.releaseAttack} damage per cut.`};
}
