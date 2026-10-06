import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('official-derived Domain poses are packed without clipping on a shared sole baseline',()=>{
 const png=readFileSync(new URL('../assets/crown-domain-official-v1.png',import.meta.url));assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1024);assert.equal(png[25],6);
 const layout=JSON.parse(readFileSync(new URL('../docs/crown-domain-official-layout.json',import.meta.url)));assert.equal(layout.length,4);
 for(const f of layout){assert.equal(f.baseline,504);const width=Math.round((f.source.maxX-f.source.minX+1)*f.scale),height=Math.round((f.source.maxY-f.source.minY+1)*f.scale),left=Math.round(256-(f.anchorX-f.source.minX)*f.scale);assert.ok(left>0);assert.ok(left+width<512);assert.ok(504-height>0);}
});
test('bent-knee recovery fits between pulse crouch and hands-opening pose',()=>{
 const key=JSON.parse(readFileSync(new URL('../docs/crown-domain-official-layout.json',import.meta.url))),between=JSON.parse(readFileSync(new URL('../docs/crown-domain-between-layout.json',import.meta.url))),rise=JSON.parse(readFileSync(new URL('../docs/crown-domain-rise-layout.json',import.meta.url)))[0];
 const height=f=>(f.source.maxY-f.source.minY+1)*f.scale;assert.ok(height(rise)>height(key[2]));assert.ok(height(rise)<height(between[1]));assert.equal(rise.baseline,504);assert.equal(rise.anchorX,(rise.soleMin+rise.soleMax)/2);
 const png=readFileSync(new URL('../assets/crown-domain-rise-v1.png',import.meta.url));assert.equal(png.readUInt32BE(16),512);assert.equal(png.readUInt32BE(20),512);
});
test('cast atlas anchors use the midpoint of the planted soles and transition height lies between key poses',()=>{
 const key=JSON.parse(readFileSync(new URL('../docs/crown-domain-official-layout.json',import.meta.url))),between=JSON.parse(readFileSync(new URL('../docs/crown-domain-between-layout.json',import.meta.url)));
 for(const f of [...key,...between]){assert.equal(f.anchorX,(f.soleMin+f.soleMax)/2);assert.equal(f.renderSize,300);}
 const height=f=>(f.source.maxY-f.source.minY+1)*f.scale;
 assert.ok(height(between[0])<height(key[0]));assert.ok(height(between[0])>height(key[1]));assert.ok(height(between[1])<height(key[3]));assert.ok(height(between[1])>height(key[2]));
});
test('two in-between silhouettes fit transparent cells with a common floor anchor',()=>{
 const png=readFileSync(new URL('../assets/crown-domain-between-v1.png',import.meta.url));assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),512);assert.equal(png[25],6);
 const layout=JSON.parse(readFileSync(new URL('../docs/crown-domain-between-layout.json',import.meta.url)));assert.equal(layout.length,2);for(const f of layout){assert.equal(f.baseline,504);const left=Math.round(256-(f.anchorX-f.source.minX)*f.scale);assert.ok(left>0);assert.ok(left+Math.round((f.source.maxX-f.source.minX+1)*f.scale)<512);assert.ok(504-Math.round((f.source.maxY-f.source.minY+1)*f.scale)>0);}
});
