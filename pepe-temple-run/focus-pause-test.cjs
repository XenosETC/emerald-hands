const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
// Unit proof of the actual registered source handlers; browser focus behavior is tested separately.
const source=fs.readFileSync(__dirname+'/game.js','utf8');
const handlers=source.split(/\r?\n/).filter(line=>line.includes("addEventListener('visibilitychange'")||line.includes("addEventListener('blur'"));assert.equal(handlers.length,2);
function fixture(state){const events={},context={state,calls:0,document:{hidden:false,addEventListener(name,handler){events[name]=handler;}},window:{addEventListener(name,handler){events[name]=handler;}}};context.pause=()=>{context.calls++;context.state=context.state==='running'?'paused':'running';};vm.createContext(context);vm.runInContext(handlers.join('\n'),context);return {context,events};}
for(const initial of ['running','paused','dead','ready']){
 const {context:c,events:e}=fixture(initial);c.document.hidden=true;e.visibilitychange();assert.equal(c.calls,initial==='running'?1:0);assert.equal(c.state,initial==='running'?'paused':initial);e.blur();e.visibilitychange();assert.equal(c.calls,initial==='running'?1:0,'Repeated focus loss toggles pause into resume');c.document.hidden=false;e.visibilitychange();assert.equal(c.calls,initial==='running'?1:0,'Visibility return automatically resumes');assert.equal(c.state,initial==='running'?'paused':initial);
}
{const {context:c,events:e}=fixture('running');e.visibilitychange();assert.equal(c.calls,0,'Visible tab pauses unnecessarily');e.blur();assert.equal(c.calls,1);assert.equal(c.state,'paused');e.blur();assert.equal(c.calls,1);}
console.log('FOCUS PAUSE UNIT PASS: actual registered source handlers, running-only pause once, repeated loss/return cannot auto-resume; no browser focus claim');
