import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),layout=JSON.parse(readFileSync(new URL('docs/rime-warden-layout.json',root)));
test('dedicated Rime atlas has four complete cells with a common sole baseline',()=>{
 const png=readFileSync(new URL('assets/rime-warden-v1.png',root));assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1024);assert.equal(layout.length,4);
 for(const f of layout){assert.equal(f.baseline,504);const left=Math.round(256-(f.anchorX-f.source.minX)*f.scale),width=Math.round((f.source.maxX-f.source.minX+1)*f.scale);assert.ok(left>=0&&left+width<=512);assert.ok(504-Math.round((f.source.maxY-f.source.minY+1)*f.scale)>=0);}
});
test('Rime pose selection preserves clean guards, windup and active cut',()=>{assert.ok(layout[0].source.cy<512);assert.ok(layout[1].source.cy<512);assert.ok(layout[2].source.cy<512);assert.ok(layout[3].source.cy>512);assert.ok(layout[3].source.cx<512);});
