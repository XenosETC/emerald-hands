/* Supporting match controls stay accessible without displacing the board. */
(function(){
  const dialog=document.createElement('dialog');dialog.id='match-options-dialog';dialog.setAttribute('aria-labelledby','screen-options-title');
  dialog.innerHTML='<div class="screen-dialog-heading"><h2 id="screen-options-title">Match options</h2><button type="button" id="close-match-options">Done</button></div><div class="screen-dialog-content"></div>';
  const content=dialog.querySelector('.screen-dialog-content');
  const trigger=document.createElement('button');trigger.type='button';trigger.id='match-options';trigger.textContent='Match options';trigger.setAttribute('aria-haspopup','dialog');
  document.body.append(dialog);dialog.addEventListener('keydown',event=>event.stopPropagation());
  let returnFocus=trigger;
  const open=()=>{returnFocus=trigger;dialog.showModal();};trigger.addEventListener('click',open);dialog.querySelector('#close-match-options').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{const target=returnFocus?.isConnected?returnFocus:trigger;returnFocus=trigger;target.focus({preventScroll:true});});
  document.querySelector('body>header').append(trigger);
  content.append(document.querySelector('main>aside'));
  for(const selector of ['.board-key','#hint-panel','#match-result','#capture-panel'])content.append(document.querySelector(selector));
  const captureButton=document.querySelector('#show-capture-routes');
  const capturePanel=document.querySelector('#capture-panel');
  captureButton.addEventListener('click',()=>{
    returnFocus=captureButton;
    content.prepend(capturePanel);
    dialog.showModal();
    dialog.scrollTop=0;
    capturePanel.querySelector('button')?.focus({preventScroll:true});
  });
  document.querySelector('#board').addEventListener('checkers:route-preview',event=>{
    if(!dialog.open)return;
    returnFocus=document.querySelectorAll('#board>button')[event.detail.to]||captureButton;
    dialog.close();
  });
  document.querySelector('#hint').addEventListener('click',()=>setTimeout(()=>{if(!document.querySelector('#hint-panel').hidden&&!dialog.open)open();},0));

  const surface=document.querySelector('.game');let fitFrame;
  function fitBoard(){
    const landscape=innerHeight<=520&&innerWidth>=600;
    const rows=[...surface.children].filter(node=>!node.hidden&&!node.matches('.board-frame')&&getComputedStyle(node).display!=='none');
    const reserve=landscape?34:rows.reduce((height,node)=>height+node.getBoundingClientRect().height,0)+Math.max(0,rows.length)*6+34;
    const firstColumn=parseFloat(getComputedStyle(surface).gridTemplateColumns)||surface.clientWidth;
    const size=Math.max(120,Math.min(580,surface.clientHeight-reserve,(landscape?firstColumn:surface.clientWidth)-40));
    const value=`${Math.floor(size)}px`;if(surface.style.getPropertyValue('--board-size')!==value)surface.style.setProperty('--board-size',value);
  }
  const observer=new ResizeObserver(()=>{cancelAnimationFrame(fitFrame);fitFrame=requestAnimationFrame(fitBoard);});
  observer.observe(surface);for(const node of surface.children)if(!node.matches('.board-frame'))observer.observe(node);
  window.addEventListener('resize',fitBoard);requestAnimationFrame(fitBoard);
})();
