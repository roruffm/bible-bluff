import { test } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { PixelRenderer } from '../../src/client/gluehwein/pixel-renderer.js';
import { GameEngine, ROUND_SECONDS, MAX_LIGHTS, MAX_MISSES } from '../../src/client/gluehwein/engine.js';

// Exercise actual application handlers against a small DOM, without a browser.
// Canvas calls are stubbed: these checks do not make claims about rendered layout.
function app(width,height){
  let active,raf,clipboard='',time=0,music,engine;
  class MusicStub{constructor(){music=this;this.enabled=true;this.playing=false;}start(){this.playing=this.enabled;}stop(){this.playing=false;}setEnabled(v){this.enabled=v;if(!v)this.stop();}effect(){}}
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},
    {get:(target,key)=>key in target?target[key]:()=>{},set:(target,key,value)=>(target[key]=value,true)});
  class Element{
    constructor(tag='div',attrs={}){this.tagName=tag.toUpperCase();this.attrs=attrs;this.id=attrs.id;this.children=[];this.style={setProperty(k,v){this[k]=v;}};this.handlers={};this.hidden='hidden'in attrs;this.disabled='disabled'in attrs;this.textContent='';this.dataset={};for(const k in attrs)if(k.startsWith('data-'))this.dataset[k.slice(5)]=attrs[k];this.classes=new Set((attrs.class||'').split(' '));this.classList={add:(...x)=>x.forEach(s=>this.classes.add(s)),remove:(...x)=>x.forEach(s=>this.classes.delete(s)),toggle:(x,on)=>on?this.classes.add(x):this.classes.delete(x)};}
    append(el){this.children.push(el);el.parentElement=this;}
    matches(s){return s.startsWith('.')?this.classes.has(s.slice(1)):s.startsWith('#')?this.id===s.slice(1):s.startsWith('[')?s.slice(1,-1)in this.attrs:this.tagName.toLowerCase()===s;}
    querySelectorAll(s){return this.children.flatMap(c=>[...(c.matches(s)?[c]:[]),...c.querySelectorAll(s)]);}
    querySelector(s){return this.querySelectorAll(s)[0]||null;}
    addEventListener(type,fn){(this.handlers[type]??=[]).push(fn);}
    dispatchEvent(e){return Promise.all((this.handlers[e.type]||[]).map(fn=>fn({...e,target:e.target||this,preventDefault(){}})));}
    click(){if(this.disabled)return;this.focus();return this.dispatchEvent({type:'click'});}
    focus(){active=this;}
    setAttribute(k,v){this.attrs[k]=v;}
    getBoundingClientRect(){return {width,height,left:0,top:0,right:width,bottom:height};}
    getContext(){return ctx;}
    setPointerCapture(){}
    showModal(){this.open=true;}
    close(){this.open=false;this.dispatchEvent({type:'close'});}
  }
  const doc=new Element('document'),stack=[doc],html=fs.readFileSync(new URL('../../src/client/gluehwein/index.html',import.meta.url),'utf8');
  const voids=new Set(['meta','link','br','input','img']);
  for(const m of html.matchAll(/<(\/?)([\w-]+)([^>]*)>/g)){
    const [,closing,tag,tail]=m;
    if(closing){const i=stack.findLastIndex(el=>el.tagName.toLowerCase()===tag.toLowerCase());if(i>0)stack.length=i;continue;}
    const attrs={};for(const a of tail.matchAll(/([\w-]+)(?:="([^"]*)")?/g))attrs[a[1]]=a[2]??'';
    const el=new Element(tag,attrs);stack.at(-1).append(el);if(!voids.has(tag)&&!tail.endsWith('/'))stack.push(el);
  }
  doc.getElementById=id=>doc.querySelector('#'+id);doc.createElement=tag=>new Element(tag);
  Object.defineProperty(doc,'activeElement',{get:()=>active});
  const storage=new Map();const sandbox={PixelRenderer:class extends PixelRenderer{constructor(canvas,options){super(canvas,{...options,createCanvas:()=>doc.createElement('canvas')});}},GameEngine:class extends GameEngine{constructor(options){super({...options,random:()=>.5});engine=this;}},ROUND_SECONDS,MAX_LIGHTS,MAX_MISSES,WinterMusic:MusicStub,document:doc,devicePixelRatio:1,
    requestAnimationFrame:fn=>raf=fn,ResizeObserver:class{constructor(cb){this.cb=cb}observe(){this.cb()}},
    matchMedia:()=>({matches:true}),localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
    navigator:{clipboard:{writeText:async value=>clipboard=value}},location:{href:'https://example.test/gluehwein/'},
    URL,Math,console,setTimeout:()=>{},window:{prompt(){}},Promise};
  const code=fs.readFileSync(new URL('../../src/client/gluehwein/app.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/gm,'');
  vm.runInNewContext(code,sandbox,{filename:'app.js'});
  return {doc,engine:()=>engine,get:id=>doc.getElementById(id),clipboard:()=>clipboard,music:()=>music,
    step(seconds,hz=60){for(let i=0;i<Math.ceil(seconds*hz);i++){time+=1000/hz;raf(time);}}};
}

for(const [width,height] of [[390,480],[1100,600]])test(`Hold, release, cancellation, keyboard, pause and replay (${width}px)`,async()=>{
  const a=app(width,height),get=a.get;
  assert.equal(get('intro').hidden,false);await get('start').click();assert.equal(get('intro').hidden,true);assert.equal(a.music().playing,true);assert.equal(get('lives').textContent,3);
  assert.equal(a.doc.querySelectorAll('[data-lane]')[0].disabled,false);
  assert.equal(get('family'),null);
  const y=height*.43;
  await get('game').dispatchEvent({type:'pointerdown',pointerId:1,clientX:width*.14,clientY:y});
  a.step(.9);assert.ok(Number.parseInt(get('charge-value').textContent)>55,'holding fills the meter');
  assert.equal(get('score').textContent,0,'holding alone does not fire');
  await get('game').dispatchEvent({type:'pointerup',pointerId:1,clientX:width*.14,clientY:y});
  assert.equal(get('charge-value').textContent,'0 %');
  a.step(1.3);assert.ok(Number(get('score').textContent)>0,'a charged cup serves a guest');
  const button=a.doc.querySelectorAll('[data-lane]')[1];
  await button.dispatchEvent({type:'pointerdown',pointerId:2});a.step(.5);
  assert.ok(Number.parseInt(get('charge-value').textContent)>25);
  await button.dispatchEvent({type:'pointercancel',pointerId:2});assert.equal(get('charge-value').textContent,'0 %');
  await a.doc.dispatchEvent({type:'keydown',key:'3',code:'Digit3',repeat:false});a.step(.5);
  assert.ok(Number.parseInt(get('charge-value').textContent)>25,'number keys also charge');
  await get('pause').click();assert.equal(get('pause-overlay').hidden,false);assert.equal(a.music().playing,false);assert.equal(get('charge-value').textContent,'0 %');
  const left=get('time').textContent;a.step(5);assert.equal(get('time').textContent,left);
  await get('resume').click();await a.doc.dispatchEvent({type:'keyup',key:'3',code:'Digit3'});
  assert.equal(get('pause-overlay').hidden,true);assert.equal(a.music().playing,true);assert.equal(get('charge-value').textContent,'0 %');
  a.step(61);assert.equal(get('results').hidden,false);assert.ok(get('time').textContent>0);assert.equal(get('lives').textContent,0);assert.equal(a.music().playing,false);assert.match(get('result-title').innerHTML,/Game Over/);
  await get('share').click();assert.match(a.clipboard(),/https:\/\/example.test\/gluehwein\//);
  await get('again').click();assert.equal(get('results').hidden,true);assert.equal(get('time').textContent,60);assert.equal(get('score').textContent,0);assert.equal(get('lives').textContent,3);
  await get('sound').click();assert.equal(a.music().playing,false);assert.equal(get('sound-label').textContent,'Musik aus');
  await get('sound').click();assert.equal(a.music().playing,true);assert.equal(get('sound-label').textContent,'Musik an');
});

test('Slow animation frames still advance the round at real-time speed',async()=>{
 const a=app(390,480);await a.get('start').click();a.step(.1);
 a.step(5,2);assert.equal(a.get('time').textContent,55);
});

for(const [width,height] of [[390,480],[1100,600]])test(`Optional story preserves start and finished-round state (${width}px)`,async()=>{
 const a=app(width,height),get=a.get;
 assert.equal(a.doc.querySelectorAll('.story-open').length,2);
 await get('story-start').click();assert.equal(get('story').open,true);assert.equal(a.music().playing,false);
 a.step(3);assert.equal(get('time').textContent,60);assert.equal(get('intro').hidden,false);
 await get('story-return').click();assert.equal(get('story').open,false);assert.equal(a.doc.activeElement,get('story-start'));
 a.step(1);assert.equal(get('time').textContent,60);
 const link=new URL(get('story-contact').attrs.href);assert.equal(link.hostname,'wa.me');
 assert.match(link.searchParams.get('text'),/^Hallo Anne,/);assert.doesNotMatch(link.searchParams.get('text'),/Ronja/);
 await get('start').click();a.step(61);assert.equal(get('results').hidden,false);
 const score=get('score').textContent,time=get('time').textContent;
 await get('story-result').click();assert.equal(get('story').open,true);a.step(2);
 assert.equal(get('score').textContent,score);assert.equal(get('time').textContent,time);assert.equal(a.music().playing,false);
 await get('story-close').click();assert.equal(get('story').open,false);assert.equal(get('results').hidden,false);
 assert.equal(a.doc.activeElement,get('story-result'));assert.equal(a.music().playing,false);
});


test('Five real keyboard throws update the fever HUD and freeze its countdown during pause',async()=>{
  const a=app(390,480);await a.get('start').click();
  const game=a.engine();game.guests=[];game.spawnIn=999;
  for(let i=0;i<5;i++){
    const guest=game.spawn(0,600);guest.speed=0;guest.kind='regular';
    await a.doc.dispatchEvent({type:'keydown',key:'1',code:'Digit1',repeat:false});a.step(.77);
    await a.doc.dispatchEvent({type:'keyup',key:'1',code:'Digit1'});a.step(1.2);
  }
  assert.equal(game.served,5);assert.equal(game.bestCombo,5);
  assert.match(a.get('arcade-status').textContent,/LICHTERFIEBER ×2/);
  assert.equal(a.get('arcade-status').hidden,false);assert.equal(a.get('stage').classes.has('fever'),true);
  await a.get('pause').click();const left=a.get('arcade-status').textContent;
  a.step(4);assert.equal(a.get('arcade-status').textContent,left);
  await a.get('resume').click();a.step(9);
  assert.doesNotMatch(a.get('arcade-status').textContent,/LICHTERFIEBER/);
  assert.equal(a.get('stage').classes.has('fever'),false);
  a.step(61);assert.equal(a.get('arcade-status').hidden,true);
  assert.match(a.get('result-bonus').textContent,/Beste Serie: 5/);
  await a.get('again').click();assert.match(a.get('arcade-status').textContent,/5 Treffer in Folge/);
});

test('A precise throw shows the bonus and includes it in the round result',async()=>{
  const a=app(390,480);await a.get('start').click();
  const game=a.engine();game.guests=[];game.spawnIn=999;
  const guest=game.spawn(0,600);guest.speed=0;guest.kind='santa';
  await a.doc.dispatchEvent({type:'keydown',key:'1',code:'Digit1',repeat:false});a.step(.67);
  await a.doc.dispatchEvent({type:'keyup',key:'1',code:'Digit1'});a.step(1.2);
  assert.match(a.get('toast').textContent,/Perfekte Punktlandung/);assert.equal(game.perfectServed,1);
  assert.equal(game.specialServed,1);a.step(61);
  assert.match(a.get('result-bonus').textContent,/1 Punktlandung/);
  assert.match(a.get('result-bonus').textContent,/1 besonderer Gast/);
});
