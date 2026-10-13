import test from 'node:test';import assert from 'node:assert/strict';
import {createState,snapshot} from '../core.js';import {checkpointFile,parseCheckpointFile,checkpointSummary,MAX_BACKUP_SIZE} from '../checkpoint-file.js';
test('file backup roundtrip preserves earned receipts, inventory and pending loot without changing the run',()=>{
 const s=createState({version:2,oath:true,training:3,world:'frozen',approachCleared:[1],pendingLoot:[{id:1,x:800}],xp:150,seals:['crimson'],fragments:25});
 const before=snapshot(s);assert.deepEqual(parseCheckpointFile(checkpointFile(s)),before);assert.deepEqual(snapshot(s),before);assert.match(checkpointSummary(before),/Level 3 · Frozen District · 1\/3 seals · 25 fragments/);
});
test('foreign, malformed, oversized and unsupported backup formats are rejected',()=>{
 for(const text of ['{','null','[]','{}',JSON.stringify({game:'other',format:1,checkpoint:{version:2}}),JSON.stringify({game:'pepe-soul-world',format:2,checkpoint:{version:2}}),JSON.stringify({game:'pepe-soul-world',format:1,checkpoint:{version:99}}),'x'.repeat(MAX_BACKUP_SIZE+1)])assert.throws(()=>parseCheckpointFile(text));
});
