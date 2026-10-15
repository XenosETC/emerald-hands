(function(root){
 'use strict';
 const KEY='pepe-temple-run-v1',RECOVERY=KEY+':recovery';
 const valid=value=>Number.isSafeInteger(value)&&value>=0;
 const parse=raw=>{try{if(typeof raw!=='string'||raw.length>250_000)return null;const value=JSON.parse(raw);return value&&!Array.isArray(value)&&valid(value.best)?value:null;}catch{return null;}};
 function create(storage){
  let best=0;
  function read(){
   try{
    const target=storage(),raw=target.getItem(KEY),recoveryRaw=target.getItem(RECOVERY);
    const data=raw===null?{best:0}:parse(raw),recovery=parse(recoveryRaw);
    if(data)return {ok:true,target,key:KEY,data:{...data,best:Math.max(data.best,recovery?.best||0)},recovery:false};
    if(recovery)return {ok:true,target,key:RECOVERY,data:recovery,recovery:true};
    return {ok:false,target,canRecover:recoveryRaw===null,message:recoveryRaw===null?'Saved record is unreadable and was preserved. New records stay in this session.':'Saved and recovery records are unreadable. Both were preserved for review.'};
   }catch{return {ok:false,canRecover:false,message:'Record storage is unavailable. New records stay in this session.'};}
  }
  function load(){
   const current=read();if(current.ok)best=Math.max(best,current.data.best);
   return {best,ok:current.ok,canRecover:!!current.canRecover,recovery:!!current.recovery,message:current.ok?(current.recovery?'Protected recovery record active. Original data preserved.':'Best run saves on this device.'):current.message};
  }
  function save(candidate){
   const current=read();if(current.ok)best=Math.max(best,current.data.best);
   const previousBest=best;
   if(!valid(candidate))return {best,previousBest,ok:false,message:'Invalid run distance was not saved.'};
   best=Math.max(best,candidate);
   if(!current.ok)return {best,previousBest,ok:false,canRecover:!!current.canRecover,message:current.message};
   try{current.target.setItem(current.key,JSON.stringify({...current.data,best}));return {best,previousBest,ok:true,recovery:!!current.recovery,message:current.recovery?'Recovery record saved. Original data preserved.':'Best run saved on this device.'};}
   catch{return {best,previousBest,ok:false,message:'Record could not be saved. Your best stays in this session.'};}
  }
  function enableRecovery(){
   const current=read();
   if(current.ok)return save(best);
   if(!current.canRecover)return load();
   try{current.target.setItem(RECOVERY,JSON.stringify({best}));return load();}
   catch{return {best,ok:false,canRecover:true,message:'Recovery could not be saved. Original data preserved.'};}
  }
  return {load,save,enableRecovery};
 }
 root.TempleRecords={create,recoveryKey:RECOVERY};
 if(typeof module!=='undefined'&&module.exports)module.exports={create,recoveryKey:RECOVERY};
})(typeof window!=='undefined'?window:globalThis);
