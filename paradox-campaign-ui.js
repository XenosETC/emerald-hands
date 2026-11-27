(function(root){
  root.createParadoxJourneyUI=function(api,callbacks){
    const map=document.querySelector('#journeyMap'),base=document.querySelector('#journeyBase');
    const mapButton=document.querySelector('#journeyMapButton');
    const close=dialog=>{dialog.close();callbacks.resume();};
    for(const dialog of [map,base]){
      dialog.querySelector('[data-close]').addEventListener('click',()=>close(dialog));
      dialog.addEventListener('cancel',()=>callbacks.resume());
    }
    function showMap(){
      callbacks.pause();const save=callbacks.getSave(),route=map.querySelector('.journey-route');route.replaceChildren();
      api.levels.forEach(level=>{const section=document.createElement('section');section.className='journey-region';
        const heading=document.createElement('h3');heading.textContent=`${level.id}. ${level.name}${level.planned?' · Planned':''}`;section.append(heading);
        api.stages.filter(s=>s.level===level.id).forEach(stage=>{const button=document.createElement('button');
          const cleared=save.completed.includes(stage.id),available=api.unlocked(save,stage);
          const status=stage.planned?'Planned':cleared?'Cleared':available?'Ready':'Locked';
          button.dataset.stage=stage.id;button.dataset.status=status.toLowerCase();button.disabled=!available;
          button.innerHTML=`<span>${stage.base?'⌂':stage.stage}</span><strong></strong><small></small>`;
          button.querySelector('strong').textContent=stage.name;button.querySelector('small').textContent=`${stage.id} · ${stage.base?'Base · ':''}${status}`;
          button.addEventListener('click',()=>{map.close();callbacks.select(stage);});section.append(button);
        });route.append(section);
      });map.showModal();
    }
    function showBase(stage){
      callbacks.pause();const save=callbacks.getSave();base.querySelector('h2').textContent=stage.name;
      base.querySelector('.journey-purse').textContent=`${save.shards} journey shards · saved independently from Arcade Shards`;
      const shop=base.querySelector('.journey-shop');shop.replaceChildren();
      api.upgrades.forEach(item=>{const owned=save.owned.includes(item.id),locked=item.base>stage.level;
        const card=document.createElement('article');card.innerHTML=`<div class="journey-item-art art-${item.art}" role="img" aria-label="${item.name}"></div><h3>${item.name}</h3><p>${item.benefit}</p><button type="button"></button>`;
        const button=card.querySelector('button');button.dataset.upgrade=item.id;button.disabled=owned||locked||save.shards<item.cost;
        button.textContent=owned?'Equipped':locked?'Unlocks at Lantern Refuge':`${item.cost} journey shards`;
        button.addEventListener('click',()=>{callbacks.buy(item.id,stage.level);showBaseContents(stage);});shop.append(card);
      });
      const onward=base.querySelector('[data-onward]');onward.textContent=stage.level===2?'Finish this chapter':'Set out for Corrupt Marsh';
      onward.onclick=()=>{base.close();callbacks.onward(stage);};
      if(!base.open)base.showModal();
    }
    function showBaseContents(stage){showBase(stage);}
    mapButton.addEventListener('click',showMap);
    return {showMap,showBase,isOpen:()=>map.open||base.open};
  };
})(window);
