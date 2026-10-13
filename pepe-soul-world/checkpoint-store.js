// Storage boundary only: gameplay snapshots and save keys remain owned by the game.
export function createCheckpointStore(storage,key,accept){
 const backupKey=key+':backup',archiveKey=key+':recovery-original';
 let recovery=false,status={ok:true,message:'Local save ready'};
 const validRaw=raw=>{try{return raw!==null&&accept(JSON.parse(raw));}catch{return false;}};
 const unreadable=()=>{recovery=true;status={ok:false,recovery:true,message:'Unreadable save kept · temporary session. Restore a valid save and reload.'};return null;};
 function read(){
  try{const raw=storage.getItem(key);if(raw===null)return null;const value=JSON.parse(raw);if(!accept(value))return unreadable();return value;}catch{return unreadable();}
 }
 return {
  load:read,
  get status(){return {...status};},
  get backupAvailable(){try{return validRaw(storage.getItem(backupKey));}catch{return false;}},
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
    status={ok:true,message:'Progress saved on this device'};
   }
   catch{status={ok:false,message:'Session only · storage unavailable. Reloading can lose progress.'};}
   return {...status};
  }
 };
}
