import {dropGuard} from './sword-guard.js';

const isGuardKey=code=>code==='KeyS'||code==='ArrowDown';

// Release immediately, even when release and the next attack arrive between ticks.
// Keyboard and pointers keep their own ownership; the click toggle is optional.
export class GuardControls{
 constructor(player,keys,pointers){this.player=player;this.keys=keys;this.pointers=pointers;this.latched=false;}
 get held(){return this.latched||['KeyS','ArrowDown'].some(code=>this.keys.has(code)||this.pointers.has(code));}
 takeOver(code){if(isGuardKey(code))this.latched=false;}
 sync(){if(!this.held){if(this.player.guarding)dropGuard(this.player,true);this.player.guardMustRelease=false;}}
 toggle(){this.latched=!this.latched;this.sync();}
 reset(){this.latched=false;dropGuard(this.player);this.player.guardMustRelease=false;}
}
