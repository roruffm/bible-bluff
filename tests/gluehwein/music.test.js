import { test } from 'vitest';
import assert from 'node:assert/strict';
import { WinterMusic } from '../../src/client/gluehwein/music.js';

function rig() {
  const sources = [], timers = new Map(); let nextId = 0;
  const parameter = () => ({ value: 0, setValueAtTime(value,time) { assert.ok(Number.isFinite(value)); assert.ok(time>=0); }, exponentialRampToValueAtTime(value,time) { assert.ok(value>0); assert.ok(time>=0); } });
  const node = () => ({ connect() {}, disconnect() {}, gain: parameter(), frequency: parameter(),
    start(time) { assert.ok(time>=0); this.started=true; }, stop() { this.stopped=true; } });
  const context = { currentTime: 0, state: 'running', sampleRate: 44100, destination: {},
    createGain: node, createBiquadFilter: node,
    createBuffer: (channels,length) => ({getChannelData:()=>new Float32Array(length)}),
    createOscillator() { const n=node();sources.push(n);return n; },
    createBufferSource() { const n=node();sources.push(n);return n; }, resume:()=>Promise.resolve() };
  const music = new WinterMusic({createContext:()=>context,every:fn=>{const id=++nextId;timers.set(id,fn);return id;},cancel:id=>timers.delete(id)});
  return { music, context, sources, timers, advance(seconds) {for(let i=0;i<Math.ceil(seconds/.025);i++){context.currentTime+=.025;for(const tick of timers.values())tick();}} };
}

test('Christmas arrangement loops and never creates duplicate scheduler timers',()=>{
  const r=rig();assert.equal(r.music.start(),true);r.music.start();assert.equal(r.timers.size,1);
  r.advance(36);assert.ok(r.sources.length>150);assert.ok(r.sources.every(n=>n.started));
  r.music.stop();assert.equal(r.timers.size,0);assert.equal(r.music.playing,false);assert.ok(r.sources.every(n=>n.stopped));
});

test('Mute stops all active music; enabling and resuming starts one loop',()=>{
  const r=rig();r.music.start();r.advance(.5);r.music.setEnabled(false);
  assert.equal(r.music.start(),false);assert.equal(r.timers.size,0);assert.ok(r.sources.every(n=>n.stopped));
  r.music.setEnabled(true);r.music.start();assert.equal(r.music.playing,true);assert.equal(r.timers.size,1);
  r.music.stop();r.music.start({restart:true});assert.equal(r.timers.size,1);
});

test('End-of-round sound is independent of the stopped music loop',()=>{
  const r=rig();r.music.start();r.music.stop();r.music.effect(262,.2,'sine',.04,.14);
  assert.equal(r.music.playing,false);assert.equal(r.timers.size,0);assert.equal(r.sources.at(-1).started,true);
});

test('Missing audio support leaves gameplay usable',()=>{
  const music=new WinterMusic({createContext:()=>{throw new Error('Audio unavailable');}});
  assert.equal(music.start(),false);assert.doesNotThrow(()=>music.effect(440,.1));assert.doesNotThrow(()=>music.stop());
});
