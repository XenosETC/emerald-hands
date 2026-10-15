(function(root){
 'use strict';
 const KEY='pepe-temple-run-v1';
 const valid=value=>Number.isSafeInteger(value)&&value>=0;
 function create(storage){
  let best=0;
  function read(){
   let target,raw;
   try{
    target=storage();raw=target.getItem(KEY);
   }catch{return {ok:false,message:'Record storage is unavailable. New records stay in this session.'};}
   try{
    if(raw===null)return {ok:true,target,data:{best:0}};
    const data=JSON.parse(raw);
    if(!data||Array.isArray(data)||!valid(data.best))return {ok:false,message:'Saved record is unreadable and was preserved. New records stay in this session.'};
    return {ok:true,target,data};
   }catch{return {ok:false,message:'Saved record is unreadable and was preserved. New records stay in this session.'};}
  }
  function load(){
   const current=read();if(current.ok)best=Math.max(best,current.data.best);
   return {best,ok:current.ok,message:current.ok?'Best run saves on this device.':current.message};
  }
  function save(candidate){
   const current=read();
   if(current.ok)best=Math.max(best,current.data.best);
   const previousBest=best;
   if(!valid(candidate))return {best,previousBest,ok:false,message:'Invalid run distance was not saved.'};
   best=Math.max(best,candidate);
   if(!current.ok)return {best,previousBest,ok:false,message:current.message};
   try{current.target.setItem(KEY,JSON.stringify({...current.data,best}));return {best,previousBest,ok:true,message:'Best run saved on this device.'};}
   catch{return {best,previousBest,ok:false,message:'Record could not be saved. Your best stays in this session.'};}
  }
  return {load,save};
 }
 root.TempleRecords={create};
 if(typeof module!=='undefined'&&module.exports)module.exports={create};
})(typeof window!=='undefined'?window:globalThis);
