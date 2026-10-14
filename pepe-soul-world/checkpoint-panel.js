import {checkpointFile,parseCheckpointFile,checkpointSummary,MAX_BACKUP_SIZE} from './checkpoint-file.js?v=6';
import {snapshot,createState} from './core.js?v=enemy-timing-20261014';
export function createCheckpointPanel(state,store,reload,practice){
 const panel=document.createElement('article');panel.className='checkpoint-panel';
 const title=document.createElement('h3');title.textContent='Protect your journey';
 const current=document.createElement('p'),scope=document.createElement('p');scope.textContent=practice?'Practice save. Your normal campaign stays separate.':'This campaign saves on this device. Keep a file backup before restoring or clearing browser data.';
 const download=document.createElement('button');download.textContent='Download backup';download.type='button';
 download.onclick=()=>{
  let url;
  try{url=URL.createObjectURL(new Blob([checkpointFile(state)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=practice?'pepe-soul-world-practice.json':'pepe-soul-world-backup.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  catch{if(url)URL.revokeObjectURL(url);notice.textContent='Download could not start. Your session is unchanged.';}
 };
 const label=document.createElement('label');label.textContent='Choose a Soul World backup';
 const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.setAttribute('aria-label','Choose a Soul World backup');label.append(input);
 const preview=document.createElement('p'),notice=document.createElement('p');notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
 const confirm=document.createElement('button');confirm.type='button';confirm.textContent='Restore this backup and reload';confirm.hidden=true;
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancel restore';cancel.hidden=true;
 let pending=null,pendingKind='file',revision=0;
 function clear(){revision++;pending=null;pendingKind='file';input.value='';preview.textContent='';confirm.hidden=true;confirm.disabled=false;confirm.textContent='Restore this backup and reload';cancel.hidden=true;cancel.textContent='Cancel restore';}
 input.onchange=async()=>{
  const request=++revision,file=input.files[0];pending=null;pendingKind='file';confirm.hidden=true;confirm.disabled=false;confirm.textContent='Restore this backup and reload';cancel.hidden=true;cancel.textContent='Cancel restore';notice.textContent='';preview.textContent='';if(!file)return;
  try{
   if(file.size>MAX_BACKUP_SIZE)throw Error('Choose a Soul World backup smaller than 250 KB.');
   const checkpoint=parseCheckpointFile(await file.text());if(request!==revision)return;
   pending=checkpoint;preview.textContent='Selected: '+checkpointSummary(checkpoint)+'. Restoring replaces this session and saved checkpoint. Your current readable checkpoint is kept as the previous save; later saves may replace it. Download first to keep a permanent copy of this run.';
   confirm.hidden=false;cancel.hidden=false;
  }catch(error){if(request===revision)notice.textContent=error.message;}
 };
 const fresh=document.createElement('button');fresh.type='button';fresh.textContent='Preview fresh practice';
 fresh.onclick=()=>{clear();pendingKind='fresh';pending=snapshot(createState());preview.textContent='Fresh practice: '+checkpointSummary(pending)+'. Starting replaces this practice session and checkpoint. Your current readable checkpoint becomes the rotating previous save; later saves may replace it. Download first to keep a permanent copy. Your normal campaign stays separate.';notice.textContent='';confirm.textContent='Start fresh practice and reload';cancel.textContent='Cancel fresh practice';confirm.hidden=false;cancel.hidden=false;confirm.focus();};
 cancel.onclick=()=>{const wasFresh=pendingKind==='fresh';clear();notice.textContent=wasFresh?'Fresh practice cancelled. Current progress is unchanged.':'Restore cancelled. Current progress is unchanged.';(wasFresh?fresh:input).focus();};
 confirm.onclick=()=>{if(!pending||confirm.disabled)return;confirm.disabled=true;const result=store.importCheckpoint(pending);notice.textContent=result.ok&&pendingKind==='fresh'?'Fresh practice saved. Reloading…':result.message;if(result.ok){pending=null;reload();}else confirm.disabled=false;};
 const campaign=document.createElement('a');campaign.href=practice?'index.html':'index.html?practice=1';campaign.textContent=practice?'Return to normal campaign →':'Open separate practice campaign →';
 const campaignHelp=document.createElement('p');campaignHelp.textContent=practice?'Return to your normal saved journey on this device.':'Practice has its own saved journey. Opening it resumes that journey if one exists.';
 panel.append(title,current,scope,download,label,preview,confirm,cancel,notice,campaignHelp,campaign);
 if(practice)panel.append(fresh);
 return ()=>{current.textContent='Current: '+checkpointSummary(snapshot(state));return panel;};
}
