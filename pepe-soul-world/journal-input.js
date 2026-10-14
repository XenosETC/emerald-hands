export function journalShortcut(code,s){
 if(!s.begun||!s.ready||s.paused||s.dead)return null;
 if(code==='Tab'&&(s.shiftKey||!s.canvasFocused||s.journalOpen))return null;
 return {Tab:'Map',KeyM:'Map',KeyQ:'Quests',KeyC:'Skills',KeyI:'Inventory',KeyG:'Gear'}[code]||null;
}
export function journalRequest(open,current,requested){return !open||current!==requested;}
