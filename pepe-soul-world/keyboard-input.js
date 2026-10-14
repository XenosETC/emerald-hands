const PLAY_KEYS=new Set(['Space','KeyW','ArrowUp','KeyJ','KeyK','KeyL','KeyE','KeyR','KeyF','KeyA','KeyD','ArrowLeft','ArrowRight','KeyS','ArrowDown']);
import {journalShortcut} from './journal-input.js?v=1';
// Browser commands and held-key repeats must never become discrete game actions.
export function keyboardIntent(event,session){
 if(event.isComposing||event.ctrlKey||event.altKey||event.metaKey)return null;
 const code=event.code;
 if(session.inputFocused&&code!=='Escape')return null;
 if(event.repeat)return session.begun&&session.ready&&!session.paused&&!session.dead&&!session.journalOpen&&PLAY_KEYS.has(code)&&!(session.buttonFocused&&code==='Space')?{type:'held'}:null;
 if(code==='Escape')return session.begun?{type:'escape'}:null;
 if(!session.begun||!session.ready||session.paused||session.dead)return null;
 const tab=journalShortcut(code,{...session,shiftKey:event.shiftKey});
 if(tab)return {type:'journal',tab};
 if(session.journalOpen)return null;
 if(code==='Digit1'||code==='Digit2')return {type:'item',id:code==='Digit1'?'healthFlask':'spiritFlask'};
 if(session.buttonFocused&&(code==='Space'||code==='Enter'))return null;
 if(PLAY_KEYS.has(code))return {type:'play',code};
 return null;
}
