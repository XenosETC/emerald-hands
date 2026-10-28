(function(root,factory){
  if(typeof module==="object"&&module.exports)module.exports=factory();
  else root.EmeraldTowerMaps=factory();
})(typeof window!=="undefined"?window:globalThis,function(){
  "use strict";
  const base="assets/pepe-tower-defense/";
  const tactics={
    courtyard:"Cover alternating bends with overlapping fire. Keep a finishing defender near the relic; save Nova for a dense pack or a major boss in range.",
    "floodgate-delta":"Use the central island to cover both causeways. Slow the early pack and keep rapid First fire at the final crossing while Ballista and acid focus bosses.",
    "sunscar-quarry":"Build between the switchbacks to cover several passes. Major bosses have 25% extra health here: prepare damage upgrades before waves 20, 35 and 50.",
    "twinroot-grove":"Share damage and control across both lanes. Warboss and Sovereign enter upper; Tyrant enters lower. The final two pads can catch either front.",
    "tideglass-harbor":"Eight pads make roles matter. Put Ballista and Alchemist on Strong for bosses; keep Sunwardens on First for guards and leaks. Reserve coverage for the lower-left relic.",
    "emerald-celestial-hall":"Overlap fire through the winding hall and keep a finishing defender at the upper-right relic. The central comet is scenery; protect the small relic at the road's end."
  };
  function define(id,name,art,roads,spots,goal,description,version=1,width=1672){
    const point=([x,y])=>({x:x/width*1280,y:y/941*720});
    const relic=point(goal), routes=roads.map(road=>[...road.map(point),relic]);
    return {id,name,version,art:base+art,baked:true,routes,pads:spots.map(point),relic,description,
      healthScale:id==="twinroot-grove"?.75:id==="tideglass-harbor"?.85:1,
      majorBossHealthScale:id==="sunscar-quarry"?1.25:1,tactics:tactics[id]};
  }
  const maps=[
    define("courtyard","Classic · Emerald Courtyard","emerald-vault-courtyard-v3-baked.png",
      [[[0,410],[165,410],[215,380],[215,235],[250,200],[510,200],[555,235],[555,530],[595,565],[935,565],[977,530],[977,315],[1010,280],[1265,280],[1300,315],[1300,455],[1340,495]]],
      [[333,300],[410,510],[675,345],[800,665],[895,450],[1100,175],[1170,395],[1410,375],[1430,600]],[1550,510],
      "The original alternating bends, rebuilt as a royal jade courtyard. Mix control and damage across the road.",2),
    define("floodgate-delta","01 · Floodgate Delta","map-concepts-v2/floodgate-delta-v1.png",
      [[[0,340],[150,350],[250,420],[350,540],[440,570],[500,550],[550,480],[700,465],[750,400],[800,305],[840,300],[885,330],[930,425],[990,470],[1090,490],[1190,560],[1260,585],[1330,550],[1390,500],[1510,500]]],
      [[350,385],[465,480],[270,560],[680,370],[840,210],[1005,375],[1200,625],[1330,420],[1455,600]],[1610,480],
      "Three islands and two causeways. Build early control, a central damage pocket and a final interception line."),
    define("sunscar-quarry","02 · Sunscar Quarry","map-concepts-v3/sunscar-quarry-v1.png",
      [[[135,170],[290,260],[1380,280],[1450,310],[1470,385],[1430,465],[1360,490],[430,490],[350,530],[330,600],[370,660],[440,710],[1500,720]]],
      [[625,190],[1040,190],[490,410],[715,410],[1010,410],[1240,410],[600,630],[900,630],[1250,630]],[1605,700],
      "Long quarry switchbacks. Towers between passes can cover more than one stretch of road."),
    define("twinroot-grove","03 · Twinroot Grove","map-concepts-v3/twinroot-grove-v1.png",
      [[[0,405],[250,405],[330,385],[440,330],[530,205],[700,170],[1010,170],[1110,215],[1180,350],[1300,435]],
       [[0,405],[250,405],[330,435],[450,580],[620,690],[1000,690],[1140,615],[1200,505],[1300,435]]],
      [[455,430],[680,245],[835,225],[990,245],[670,600],[835,630],[990,600],[1305,335],[1305,545]],[1590,435],
      "Two fronts around the ancient tree. Ordinary arrivals alternate lanes; each major boss and its guards stay together.",1,1671),
    define("tideglass-harbor","04 · Tideglass Harbor","map-concepts-v3/tideglass-harbor-v1.png",
      [[[0,130],[260,150],[420,195],[1150,195],[1235,210],[1280,260],[1300,320],[1300,640],[1280,690],[1190,750],[700,750],[540,735],[450,700],[340,700]]],
      [[500,125],[915,140],[1330,195],[1390,430],[1415,600],[620,700],[915,715],[1205,715]],[300,670],
      "Eight quay positions around a ship basin. Corner coverage and a lower-left relic reward deliberate placement."),
    define("emerald-celestial-hall","05 · Emerald Celestial Hall","emerald-celestial-hall-v2.png",
      [[[0,505],[170,505],[220,480],[255,430],[255,320],[290,270],[355,255],[500,285],[660,250],[730,245],[830,280],[920,260],[1010,245],[1070,280],[1120,330],[1120,600],[1140,650],[1200,660],[1310,660],[1360,620],[1380,570],[1380,340],[1410,275],[1460,250]]],
      [[455,400],[502,204],[835,203],[1158,204],[1006,420],[1230,355],[1255,535],[1075,720],[1265,754]],[1560,260],
      "Nine organized celestial positions. Protect the upper-right relic; the small central comet is a landmark, not a second objective.")
  ];
  const relic={x:1185,y:404};
  const legacy={id:"courtyard",name:"Classic · Legacy build",version:1,baked:false,art:base+"emerald-vault-courtyard-v2.png",relic,
    routes:[[{x:34,y:345},{x:170,y:345},{x:170,y:170},{x:440,y:170},{x:440,y:468},{x:755,y:468},{x:755,y:238},{x:1035,y:238},{x:1035,y:404},relic]],
    pads:[[230,260],[310,430],[515,285],[585,552],[720,366],[850,155],[910,334],[1085,314],[1120,500]].map(([x,y])=>({x,y})),
    description:"Your saved courtyard build keeps its original road and pad positions."};
  function get(id,version){return id==="courtyard"&&version===1?legacy:maps.find(map=>map.id===id&&(!version||map.version===version));}
  function remaining(enemy,route){
    if(enemy.pathIndex>=route.length)return 0;
    let length=Math.hypot(route[enemy.pathIndex].x-enemy.x,route[enemy.pathIndex].y-enemy.y);
    for(let i=enemy.pathIndex+1;i<route.length;i++)length+=Math.hypot(route[i].x-route[i-1].x,route[i].y-route[i-1].y);
    return length;
  }
  function routeFor(map,plan,index){
    if(map.routes.length<2)return 0;
    if(plan.majorBoss&&index>=plan.bossIndex&&index<=plan.bossIndex+plan.escort.length)return [20,35,50].indexOf(plan.wave)%2;
    return index%map.routes.length;
  }
  function key(map){return map.id==="courtyard"&&map.version===1?"pepe-tower-defense-build-checkpoint-v1":`pepe-tower-defense-map-${map.id}-v${map.version}`;}
  // Exact centerline length inside a circular range, clipped independently per lane.
  function coverage(map,point,radius){
    return map.routes.map(route=>{
      let covered=0,total=0;
      for(let i=1;i<route.length;i++){
        const a=route[i-1],b=route[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
        total+=length;if(!length||!Number.isFinite(radius)||radius<=0)continue;
        const px=a.x-point.x,py=a.y-point.y,projection=-(px*dx+py*dy)/(length*length);
        const perpendicular=Math.max(0,px*px+py*py-projection*projection*length*length);
        if(perpendicular>=radius*radius)continue;
        const half=Math.sqrt((radius*radius-perpendicular)/(length*length));
        covered+=Math.max(0,Math.min(1,projection+half)-Math.max(0,projection-half))*length;
      }
      return {covered,total,percent:total?Math.min(100,covered/total*100):0};
    });
  }
  return {maps,legacy,get,remaining,routeFor,key,coverage};
});
