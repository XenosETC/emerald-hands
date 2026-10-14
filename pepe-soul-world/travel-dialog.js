export function createTravelDialog(opened,closed){
 const dialog=document.createElement('dialog');dialog.className='travel-dialog';
 dialog.setAttribute('aria-labelledby','travel-title');dialog.setAttribute('aria-describedby','travel-copy');
 const title=document.createElement('h2');title.id='travel-title';title.textContent='Leave rewards behind?';
 const copy=document.createElement('p');copy.id='travel-copy';
 const cancel=document.createElement('button');cancel.textContent='Keep exploring';cancel.autofocus=true;
 const leave=document.createElement('button');leave.textContent='Leave rewards behind';
 let pending=null;
 cancel.onclick=()=>dialog.close();
 leave.onclick=()=>{const travel=pending;pending=null;dialog.close();travel?.();};
 dialog.addEventListener('close',()=>{pending=null;closed();});
 dialog.append(title,copy,cancel,leave);document.body.append(dialog);
 return {open(text,travel){pending=travel;copy.textContent=text;opened();dialog.showModal();cancel.focus();}};
}
