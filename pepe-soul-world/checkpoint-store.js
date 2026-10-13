// Storage boundary only: gameplay snapshots and save keys remain owned by the game.
export function createCheckpointStore(storage,key,accept){
 let recovery=false,status={ok:true,message:'Local save ready'};
 const unreadable=()=>{recovery=true;status={ok:false,recovery:true,message:'Unreadable save kept · temporary session. Restore a valid save and reload.'};return null;};
 function read(){
  try{const raw=storage.getItem(key);if(raw===null)return null;const value=JSON.parse(raw);if(!accept(value))return unreadable();return value;}catch{return unreadable();}
 }
 return {
  load:read,
  get status(){return {...status};},
  write(value){
   read();
   if(recovery)return {...status};
   if(!accept(value)){status={ok:false,message:'Checkpoint rejected · progress remains in this tab.'};return {...status};}
   try{storage.setItem(key,JSON.stringify(value));status={ok:true,message:'Progress saved on this device'};}
   catch{status={ok:false,message:'Session only · storage unavailable. Reloading can lose progress.'};}
   return {...status};
  }
 };
}
