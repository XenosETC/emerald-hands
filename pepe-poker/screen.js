(function(){
 const info=document.createElement('button');info.id='table-info';info.type='button';info.textContent='Table info';info.setAttribute('aria-haspopup','dialog');document.querySelector('body>header').append(info);
 const dialog=document.createElement('dialog');dialog.id='table-info-dialog';dialog.setAttribute('aria-labelledby','table-info-title');dialog.innerHTML='<div class="screen-dialog-heading"><h2 id="table-info-title">Table activity & records</h2><button type="button" id="close-table-info">Done</button></div><div class="screen-dialog-content"></div>';document.body.append(dialog);dialog.addEventListener('keydown',event=>event.stopPropagation());
 const content=dialog.querySelector('.screen-dialog-content');content.append(document.querySelector('main>aside'),document.querySelector('#live-pots'));
 const open=()=>{if(!dialog.open)dialog.showModal();};info.addEventListener('click',open);dialog.querySelector('#close-table-info').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>info.focus({preventScroll:true}));
 document.querySelector('#review-last').addEventListener('click',()=>setTimeout(open,0));
 document.querySelector('#back-to-table').addEventListener('click',()=>dialog.close());
 const emotes=document.querySelector('#emotes-dialog'),emoteButton=document.querySelector('#emotes'),tray=document.querySelector('#reaction-tray');
 document.querySelector('#emotes-content').append(tray);tray.open=true;
 emoteButton.addEventListener('click',()=>{if(!emotes.open&&!emoteButton.hidden)emotes.showModal();});
 document.querySelector('#close-emotes').addEventListener('click',()=>emotes.close());
 emotes.addEventListener('keydown',event=>event.stopPropagation());
 emotes.addEventListener('close',()=>{if(!emoteButton.hidden)emoteButton.focus({preventScroll:true});});
 const tables=document.querySelector('#tables-dialog'),tablesButton=document.querySelector('#tables');
 tablesButton.addEventListener('click',()=>{if(!tables.open)tables.showModal();});
 document.querySelector('#close-tables').addEventListener('click',()=>tables.close());
 tables.addEventListener('keydown',event=>event.stopPropagation());
 tables.addEventListener('close',()=>tablesButton.focus({preventScroll:true}));
})();
