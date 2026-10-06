import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattle} from '../combat.js';
import {newCampaign} from '../campaign.js';
import {formationTarget} from '../formation.js';
test('hold slots separate troop roles, follow mirrors facing and bounds stay playable',()=>{
 const b=createBattle({...newCampaign(),army:['guard','spearman','spearman','archer'],armyXp:[0,0,0,0]},'hunt');b.order='hold';b.hold={x:600,y:400,facing:1};
 const [,guard,spear,spear2,archer]=b.units;
 assert.ok(formationTarget(b,guard).x>formationTarget(b,spear).x);assert.ok(formationTarget(b,archer).x<formationTarget(b,spear).x);assert.notEqual(formationTarget(b,spear).y,formationTarget(b,spear2).y);
 b.order='follow';b.hero.facing=-1;assert.ok(formationTarget(b,archer).x>b.hero.x);
 b.hero.x=1160;b.hero.y=595;for(const u of [guard,spear,spear2,archer]){const p=formationTarget(b,u);assert.ok(p.x>=40&&p.x<=1160&&p.y>=235&&p.y<=595);}
});

test('mixed knights and guardians receive distinct frontline slots',()=>{const b=createBattle({...newCampaign(),army:['guard','holyKnight','shadowKnight','frogGuardian','holyMage','shadowMage'],armyXp:[0,0,0,0,0,0]},'hunt');b.order='hold';b.hold={x:600,y:400,facing:1};const slots=b.units.filter(u=>u.team===0&&!u.hero).map(u=>formationTarget(b,u));assert.equal(new Set(slots.map(p=>p.x+','+p.y)).size,6);for(let i=0;i<4;i++)assert.ok(slots[i].x>slots[4].x);assert.ok(Math.abs(slots[0].y-slots[1].y)>=58);});

test('opening formation leaves Crown a readable personal space',()=>{const b=createBattle(newCampaign(),'hunt');for(const u of b.units.filter(u=>u.team===0&&!u.hero))assert.ok(Math.hypot(u.x-b.hero.x,u.y-b.hero.y)>=60);});
