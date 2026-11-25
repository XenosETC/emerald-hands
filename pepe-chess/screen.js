/* Supporting match controls stay accessible without displacing the board. */
(function(){
  const dialog=document.createElement('dialog');dialog.id='match-options-dialog';dialog.setAttribute('aria-labelledby','screen-options-title');
  dialog.innerHTML='<div class="screen-dialog-heading"><h2 id="screen-options-title">Match options</h2><button type="button" id="close-match-options">Done</button></div><div class="screen-dialog-content"></div>';
  const content=dialog.querySelector('.screen-dialog-content');
  const trigger=document.createElement('button');trigger.type='button';trigger.id='match-options';trigger.textContent='Match options';trigger.setAttribute('aria-haspopup','dialog');
  document.body.append(dialog);dialog.addEventListener('keydown',event=>event.stopPropagation());
  const open=()=>dialog.showModal();trigger.addEventListener('click',open);dialog.querySelector('#close-match-options').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>trigger.focus({preventScroll:true}));
  const main=document.querySelector('main'),header=main.querySelector('header'),heading=document.createElement('div');heading.className='screen-heading';
  heading.append(main.querySelector('.back'),header.querySelector('h1'),trigger);main.prepend(heading);
  const panel=document.querySelector('.match-panel');document.querySelector('.play-area').prepend(document.querySelector('#match-status'));
  content.append(header,panel);

  const surface=document.querySelector('.play-area');let fitFrame;
  function fitBoard(){
    const landscape=innerHeight<=520&&innerWidth>=600;
    const rows=[...surface.children].filter(node=>!node.hidden&&!node.matches('.board')&&getComputedStyle(node).display!=='none');
    const reserve=landscape?12:rows.reduce((height,node)=>height+node.getBoundingClientRect().height,0)+Math.max(0,rows.length)*6+12;
    const firstColumn=parseFloat(getComputedStyle(surface).gridTemplateColumns)||surface.clientWidth;
    const size=Math.max(120,Math.min(600,surface.clientHeight-reserve,(landscape?firstColumn:surface.clientWidth)-12));
    const value=`${Math.floor(size)}px`;if(surface.style.getPropertyValue('--board-size')!==value)surface.style.setProperty('--board-size',value);
  }
  const observer=new ResizeObserver(()=>{cancelAnimationFrame(fitFrame);fitFrame=requestAnimationFrame(fitBoard);});
  observer.observe(surface);for(const node of surface.children)if(!node.matches('.board'))observer.observe(node);
  window.addEventListener('resize',fitBoard);requestAnimationFrame(fitBoard);
})();
