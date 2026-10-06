import {templeTelegraph} from './temple-combat.js';
export function appendTempleMeter(container,enemy){
 const tell=templeTelegraph(enemy);if(!tell)return;
 const meter=document.createElement('div');meter.className='enemy-timing';meter.dataset.phase=tell.phase;meter.classList.toggle('urgent',tell.urgent);
 const label=document.createElement('span');label.textContent=tell.label+(tell.phase==='strike'?'':' · '+tell.remaining.toFixed(1)+'s');
 const progress=document.createElement('progress');progress.max=1;progress.value=tell.progress;progress.setAttribute('aria-label',tell.phase==='recover'?'Enemy counterattack window remaining':'Enemy attack windup');
 meter.append(label,progress);container.append(meter);
}
