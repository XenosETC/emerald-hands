import {test} from 'node:test';
import assert from 'node:assert/strict';

test('real runtime enables flight controls, pauses, recovers and pays only its own save',async()=>{
  // Headless DOM/canvas adapter: exercises the actual event orchestration module,
  // not browser rendering, image quality or audio playback.
  const names=['document','window','Image','localStorage','matchMedia','devicePixelRatio','requestAnimationFrame'];
  const originals=new Map(names.map(n=>[n,Object.getOwnPropertyDescriptor(globalThis,n)]));
  const elements=new Map(),storage=new Map([['other-game-v1','untouched']]);
  const gradient={addColorStop(){}};
  const context=new Proxy({globalAlpha:1,createLinearGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});
  function element(id=''){
    return {id,hidden:false,disabled:false,innerHTML:'',textContent:'',value:0,style:{},dataset:{},
      classList:{add(){},remove(){},toggle(){}},setAttribute(){},setPointerCapture(){},replaceChildren(...children){this.children=children;},
      getBoundingClientRect:()=>({width:1280,height:800,left:0,right:1280}),getContext:()=>context};
  }
  const get=id=>{if(!elements.has(id))elements.set(id,element(id));return elements.get(id);};
  let animation,ms=0;
  const advance=seconds=>{for(let i=0;i<Math.ceil(seconds*60);i++){ms+=1000/60;animation(ms);}};
  try{
    globalThis.document={hidden:false,getElementById:get,querySelector:s=>get(s),querySelectorAll:()=>[],createElement:tag=>element(tag),addEventListener(){}};
    globalThis.window={addEventListener(){}};
    globalThis.Image=class{decode(){return Promise.reject(new Error('No image rendering in headless orchestration test'));}};
    globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
    globalThis.matchMedia=()=>({matches:false});globalThis.devicePixelRatio=1;
    globalThis.requestAnimationFrame=callback=>{animation=callback;};
    await import('./main.mjs?orchestration-test=1');
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(get('launch').disabled,false);
    get('launch').onclick();advance(2.6);
    assert.equal(get('stage').dataset.phase,'flight');
    assert.equal(get('boost').disabled,false);assert.equal(get('left').disabled,false);assert.equal(get('hangarToggle').disabled,true);
    get('pause').onclick();const altitude=get('alt').innerHTML;advance(2);assert.equal(get('alt').innerHTML,altitude);
    get('resume').onclick();
    get('boost').onpointerdown({pointerId:1});advance(5);
    assert.equal(get('stage').dataset.phase,'boom');
    const paid=JSON.parse(storage.get('pepe-one-more-launch-v1'));assert.equal(paid.flights,1);assert.ok(paid.cash>0);
    advance(10);assert.equal(get('stage').dataset.phase,'pad');assert.equal(get('launch').hidden,false);assert.equal(get('hangarToggle').disabled,false);
    assert.deepEqual(JSON.parse(storage.get('pepe-one-more-launch-v1')),paid);assert.equal(storage.get('other-game-v1'),'untouched');
  }finally{
    for(const [name,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}
  }
});
