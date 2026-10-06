export const ELITES=Object.freeze({
 frozen:{melee:{name:'Rime Spearman',row:0,cue:'ICE LUNGE',range:200,speed:95},caster:{name:'Frost Hexer',row:1,cue:'FROST ERUPTION',range:400,speed:65}},
 crimson:{melee:{name:'Cinder Reaver',row:2,cue:'HEAVY CLEAVE',range:150,speed:80},caster:{name:'Ash Lantern',row:3,cue:'EMBER SHOT',range:400,speed:65}},
 void:{melee:{name:'Veil Stalker',row:4,cue:'VEIL LUNGE',range:200,speed:120},caster:{name:'Hollow Bellkeeper',row:5,cue:'BELL WAVE',range:400,speed:60}}
});
export function eliteSpec(e){return e.elite?ELITES[e.world]?.[e.elite]:null;}
