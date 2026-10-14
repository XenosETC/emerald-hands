// Native keyboard/assistive clicks have no pointer click count. Pointerdown owns taps.
export function bindAccessibleAction(button,activate){
 button.addEventListener('click',event=>{if(event.detail===0)activate();});
}
