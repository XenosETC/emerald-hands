// Each pointer owns its held control until release/cancel; keyboard state stays separate.
export class PointerControls{
 constructor(){this.pointers=new Map();}
 hold(id,key){this.pointers.set(id,key);}
 release(id){this.pointers.delete(id);}
 has(key){return [...this.pointers.values()].includes(key);}
 clear(){this.pointers.clear();}
}
