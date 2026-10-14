const DIRECTIONS={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
export class MovementControls{
 constructor(keys,pointers){this.keys=keys;this.pointers=pointers;this.latched=null;}
 toggle(code){const direction=DIRECTIONS[code];if(direction)this.latched=this.latched===direction?null:direction;}
 takeOver(code){if(DIRECTIONS[code])this.reset();}
 reset(){this.latched=null;}
 get left(){return this.latched==='left'||['KeyA','ArrowLeft'].some(code=>this.keys.has(code)||this.pointers.has(code));}
 get right(){return this.latched==='right'||['KeyD','ArrowRight'].some(code=>this.keys.has(code)||this.pointers.has(code));}
}
