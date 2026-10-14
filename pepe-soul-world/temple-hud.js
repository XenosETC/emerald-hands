import {enemyTelegraph} from './enemy-timing.js?v=1';
export function appendEnemyMeter(container,enemy){
 const tell=enemyTelegraph(enemy);if(!tell)return;
 const meter=document.createElement('div');meter.className='enemy-timing';meter.dataset.phase=tell.phase;meter.classList.toggle('urgent',tell.urgent);
 const label=document.createElement('span');label.textContent=tell.label+(tell.phase==='strike'?'':' · '+tell.remaining.toFixed(1)+'s');
 meter.append(label);
 if(tell.progress!==null){const progress=document.createElement('progress');progress.max=1;progress.value=tell.progress;progress.setAttribute('aria-label',tell.phase==='recover'?'Enemy counterattack window remaining':tell.phase==='strike'?'Enemy attack released':'Enemy attack windup');meter.append(progress);}
 container.append(meter);
}
export const appendTempleMeter=appendEnemyMeter;
