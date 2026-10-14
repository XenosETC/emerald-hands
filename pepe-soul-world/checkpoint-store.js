// Storage boundary only: gameplay snapshots and save keys remain owned by the game.
export function createStorageAccess(resolve){
 return {getItem:key=>resolve().getItem(key),setItem:(key,value)=>resolve().setItem(key,value)};
}
export function createCheckpointStore(storage,key,accept){
 const backupKey=key+':backup',archiveKey=key+':recovery-original';
 let recovery=false,observed=false,expectedRaw=null,status={ok:true,message:'Local save ready'};
 const validRaw=raw=>{try{return raw!==null&&accept(JSON.parse(raw));}catch{return false;}};
 const unreadable=()=>{recovery=true;status={ok:false,recovery:true,message:'Unreadable save kept · temporary session. Restore a valid save and reload.'};return null;};
 function read(){
  let raw;
  try{raw=storage.getItem(key);}catch{
   recovery=true;status={ok:false,recovery:false,message:'Storage unavailable · temporary session. Reload after enabling storage; progress in this tab will not be saved.'};return null;
  }
  if(!observed){observed=true;expectedRaw=raw;}
  else if(!recovery&&raw!==expectedRaw){
   recovery=true;status={ok:false,recovery:false,message:'Checkpoint changed outside this session · saving stopped. Download this run in Journal → Save before reloading to load the saved checkpoint.'};return null;
  }
  if(raw===null)return null;
  try{const value=JSON.parse(raw);if(!accept(value))return unreadable();return value;}catch{return unreadable();}
 }
 return {
  load:read,
  check(){read();return {...status};},
  get status(){return {...status};},
  get backupAvailable(){try{return validRaw(storage.getItem(backupKey));}catch{return false;}},
  importCheckpoint(value){
   try{
    if(!accept(value))return {ok:false,message:'Backup rejected. Current progress was kept.'};
    const original=storage.getItem(key);
    if(validRaw(original))storage.setItem(backupKey,original);
    else if(original!==null){
     const archive=storage.getItem(archiveKey);
     if(archive!==null&&archive!==original)return {ok:false,message:'A different damaged save is already preserved. Import cancelled to keep both saves.'};
     storage.setItem(archiveKey,original);
    }
    storage.setItem(key,JSON.stringify(value));
    // pagehide still tries to save the old running session during reload.
    recovery=true;status={ok:false,recovery:false,message:'Backup restored · reload to continue.'};
    return {ok:true,message:'Backup restored. Reload to continue.'};
   }catch{return {ok:false,message:'Backup could not be saved. Your current session stays open.'};}
  },
  restoreBackup(){
   try{
    const backup=storage.getItem(backupKey),original=storage.getItem(key);
    if(!validRaw(backup))return {ok:false,message:'No readable previous checkpoint is available.'};
    if(validRaw(original))return {ok:false,message:'Your current checkpoint is readable. Recovery was cancelled.'};
    if(original!==null){
     const archive=storage.getItem(archiveKey);
     if(archive!==null&&archive!==original)return {ok:false,message:'A different damaged save is already preserved. Recovery was cancelled to keep both saves.'};
     storage.setItem(archiveKey,original);
    }
    storage.setItem(key,backup);
    recovery=true;status={ok:false,recovery:false,message:'Previous checkpoint restored · reload to continue.'};
    return {ok:true,message:'Previous checkpoint restored. Reload to continue.'};
   }catch{return {ok:false,message:'Recovery could not write to storage. Your session remains open.'};}
  },
  write(value){
   read();
   if(recovery)return {...status};
   if(!accept(value)){status={ok:false,message:'Checkpoint rejected · progress remains in this tab.'};return {...status};}
   try{
    const raw=JSON.stringify(value),previous=storage.getItem(key);
    if(previous!==raw){
     if(validRaw(previous))storage.setItem(backupKey,previous);
     storage.setItem(key,raw);
    }
    expectedRaw=raw;
    status={ok:true,message:'Progress saved on this device'};
   }
   catch{status={ok:false,message:'Session only · storage unavailable. Reloading can lose progress.'};}
   return {...status};
  }
 };
}
