const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/game.js','utf8'),helper=source.slice(source.indexOf('  function runResult('),source.indexOf('  function die(')),ctx={};vm.createContext(ctx);vm.runInContext(helper,ctx);
let r=ctx.runResult(101.9,12,100,'gap');assert.equal(r.best,101);assert.equal(r.overline,'NEW PERSONAL BEST');assert.equal(r.title,'Bridge missed.');assert.ok(r.message.includes('101 m escaped · 12 jade · Best 101 m.'));assert.ok(r.message.endsWith('Jump over broken bridges.'));
r=ctx.runResult(100.9,2,100,'gate');assert.equal(r.overline,'RUN ENDED','Tie incorrectly claims new best');assert.equal(r.best,100);assert.equal(r.title,'Low arch collision.');
r=ctx.runResult(450,37,600,'turn-left');assert.equal(r.best,600);assert.equal(r.title,'Missed the left corner.');assert.ok(r.message.endsWith('Press or swipe left in the final 28 m.'));
assert.equal(ctx.runResult(40,0,100,'boulder').title,'Rolling stone collision.');assert.equal(ctx.runResult(40,0,100,'idol').title,'Stone idol collision.');
r=ctx.runResult(500,7,400,'idol',18);assert.ok(r.message.includes('7 jade · 18 shards'));assert.equal(r.best,500);assert.equal(r.overline,'NEW PERSONAL BEST');assert.ok(ctx.runResult(200,7,400,'idol',0).message.includes('0 shards'),'Active realm with zero shards hides separate result');
console.log('RESULT SUMMARY PASS: floored strict new best, ties/older record, cause-specific title and original coaching');
