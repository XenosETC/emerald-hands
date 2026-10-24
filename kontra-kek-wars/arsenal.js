(function(root){
  'use strict';
  const weapons={RIFLE:{cadence:.13,speed:820,damage:1,pierce:1,angles:[0]},SPREAD:{cadence:.16,speed:820,damage:1,pierce:1,angles:[-.2,0,.2]},PULSE:{cadence:.2,speed:1000,damage:3,pierce:2,angles:[0]}};
  function snapshot(s){return {weapons:[...new Set([...(s.weapons||['RIFLE']),s.player.weapon])],upgrades:[...(s.upgrades||[])],weapon:s.player.weapon,weaponMods:[...(s.weaponMods||[])],completedEvents:[...(s.completedEvents||[])]};}
  function restore(s,kit){s.weapons=[...(kit?.weapons||['RIFLE'])];s.upgrades=[...(kit?.upgrades||[])];s.player.weapon=kit?.weapon||'RIFLE';s.weaponMods=[...(kit?.weaponMods||[])];s.completedEvents=[...(kit?.completedEvents||[])];}
  function unlock(s,name){if(!weapons[name])return;s.weapons??=['RIFLE'];if(!s.weapons.includes(name))s.weapons.push(name);s.player.weapon=name;}
  function swap(s){if(s.mode!=='playing'||s.weapons.length<2)return;s.player.weapon=s.weapons[(s.weapons.indexOf(s.player.weapon)+1)%s.weapons.length];s.player.cool=Math.max(0,s.player.cool);}
  function reward(s,choice){
    if(s.mode!=='won'||s.rewardClaimed||!['pulse','coil'].includes(choice))return false;
    if(choice==='coil'&&s.upgrades.includes('coil'))return false;
    if(choice==='pulse'&&s.weapons.includes('PULSE'))return false;
    if(choice==='pulse')unlock(s,'PULSE');else s.upgrades.push('coil');
    s.rewardClaimed=choice;return true;
  }
  function tuned(s){const gun=weapons[s.player.weapon]||weapons.RIFLE;return {...gun,cadence:gun.cadence/(s.weaponMods.includes('overclock')?1.2:1),pierce:gun.pierce+(s.weaponMods.includes('rails')?1:0)};}
  const api={tuned,definition:name=>weapons[name]||weapons.RIFLE,snapshot,restore,unlock,swap,reward};
  if(typeof module!=='undefined')module.exports=api;else root.KekArsenal=api;
})(globalThis);
