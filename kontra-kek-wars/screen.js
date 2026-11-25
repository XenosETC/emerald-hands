(function(){
 const main=document.querySelector('body>main'),header=main.querySelector('header');const button=document.createElement('button');button.type='button';button.id='field-guide';button.textContent='Field guide';button.setAttribute('aria-haspopup','dialog');header.append(button);
 const dialog=document.createElement('dialog');dialog.id='field-guide-dialog';dialog.setAttribute('aria-labelledby','field-guide-title');dialog.innerHTML='<div class="guide-heading"><h2 id="field-guide-title">The Kek Wars</h2><button id="close-guide" type="button">Done</button></div><div class="guide-content"></div>';document.body.append(dialog);dialog.addEventListener('keydown',event=>event.stopPropagation());
 for(const selector of ['.mast','footer','.fine','.realm-route'])dialog.querySelector('.guide-content').append(main.querySelector(selector));
 button.addEventListener('click',()=>{if(!document.querySelector('#overlay:not([hidden])'))document.querySelector('#pause').click();dialog.showModal();});
 dialog.querySelector('#close-guide').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>button.focus({preventScroll:true}));
})();
