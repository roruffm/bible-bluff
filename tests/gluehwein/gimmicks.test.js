import { test } from 'vitest';
import assert from 'node:assert/strict';
import { GameEngine, SLIDE_FRICTION, slideDistance } from '../../src/client/gluehwein/engine.js';

function gameWithEvents() {
  const events = [], game = new GameEngine({random:()=>.5,onEvent:e=>events.push(e)});
  game.start(); game.guests=[]; game.spawnIn=999;
  return {game,events};
}
function advance(game, seconds) { for(let i=0;i<Math.ceil(seconds*60);i++) game.update(1/60); }
function serve(game, power=.55, speed=0, kind='regular') {
  const guest=game.spawn(0,600); guest.speed=speed; guest.kind=kind;
  const previous=game.served;
  assert.equal(game.fire(0,power),true);
  for(let i=0;i<150 && game.served===previous;i++)game.update(1/60);
  assert.equal(game.served,previous+1,'the simulated cup reaches its customer');
  return guest;
}

test('A physical point landing earns 25 extra points; a normal catch still works',()=>{
  const a=gameWithEvents(), b=gameWithEvents();
  const precise=serve(a.game,.5), ordinary=serve(b.game,.55);
  assert.equal(precise.perfect,true); assert.equal(ordinary.perfect,false);
  assert.equal(a.game.score-b.game.score,25);
  assert.equal(a.game.perfectServed,1); assert.equal(b.game.perfectServed,0);
  assert.equal(a.events.find(e=>e.type==='catch').perfect,true);
});

test('Precision measures the stopping point, including the customer’s movement',()=>{
  const {game}=gameWithEvents(), speed=30;
  const stoppingTime=(-speed+Math.sqrt(speed*speed+2*SLIDE_FRICTION*460))/SLIDE_FRICTION;
  const distance=.5*SLIDE_FRICTION*stoppingTime*stoppingTime;
  const power=(distance-slideDistance(0))/(slideDistance(1)-slideDistance(0));
  assert.equal(serve(game,power,speed).perfect,true);
  assert.equal(game.perfectServed,1);
});

test('The precision window separates a near landing from a fast ordinary catch',()=>{
  const a=gameWithEvents(),b=gameWithEvents();
  const powerForStop=x=>(x-140-45)/855;
  assert.equal(serve(a.game,powerForStop(617)).perfect,true);
  assert.equal(serve(b.game,powerForStop(619)).perfect,false);
});

test('The fifth consecutive catch starts eight seconds of double points',()=>{
  const {game,events}=gameWithEvents();
  for(let i=0;i<4;i++)serve(game);
  assert.equal(game.feverRemaining,0); const previous=game.score;
  serve(game);
  assert.equal(game.combo,5); assert.equal(game.bestCombo,5);
  assert.equal(game.score-previous,24); assert.equal(game.feverRemaining,8);
  assert.equal(events.filter(e=>e.type==='fever-start').length,1);
  assert.equal(events.filter(e=>e.type==='catch').at(-1).multiplier,2);
  advance(game,8.1);
  assert.equal(game.feverRemaining,0); assert.equal(events.filter(e=>e.type==='fever-end').length,1);
  advance(game,1); assert.equal(events.filter(e=>e.type==='fever-end').length,1);
  serve(game); assert.equal(events.filter(e=>e.type==='catch').at(-1).multiplier,1);
});

test('Double points include the precision bonus',()=>{
  const {game,events}=gameWithEvents();for(let i=0;i<4;i++)serve(game);
  const previous=game.score;serve(game,.5);
  assert.equal(game.score-previous,(12+25)*2);
  const hit=events.filter(e=>e.type==='catch').at(-1);
  assert.equal(hit.perfect,true);assert.equal(hit.multiplier,2);assert.equal(hit.points,74);
});

test('Pause freezes both the charge and the fever countdown',()=>{
  const {game}=gameWithEvents();for(let i=0;i<5;i++)serve(game);
  game.beginCharge(1);advance(game,.25);game.pause();
  const left=game.feverRemaining, time=game.remaining;
  advance(game,15);assert.equal(game.feverRemaining,left);assert.equal(game.remaining,time);assert.equal(game.charge,null);
  game.resume();advance(game,1);assert.ok(Math.abs(game.feverRemaining-(left-1))<.02);
});

test('Further streaks do not extend an active fever indefinitely',()=>{
  const {game,events}=gameWithEvents();for(let i=0;i<5;i++)serve(game);
  for(let i=0;i<5;i++)serve(game);
  assert.equal(game.combo,10);assert.equal(game.feverCount,1);assert.ok(game.feverRemaining<8);
  assert.equal(events.filter(e=>e.type==='fever-start').length,1);
  advance(game,9);for(let i=0;i<5;i++)serve(game);
  assert.equal(game.combo,15);assert.equal(game.feverCount,2);assert.equal(game.feverRemaining,8);
});

test('A missed cup breaks the streak while keeping the earned timed bonus',()=>{
  const {game}=gameWithEvents();for(let i=0;i<5;i++)serve(game);
  game.fire(2,0);advance(game,1.5);
  assert.equal(game.combo,0);assert.equal(game.bestCombo,5);assert.ok(game.feverRemaining>0);
  assert.equal(game.lostCustomers,0);
});

test('Festive guests appear in a rotating mix without changing walking speed',()=>{
  const game=new GameEngine({random:()=>.5});game.start();
  for(let i=0;i<13;i++)game.spawn(i%3);
  const special=game.guests.filter(g=>g.kind!=='regular');
  assert.deepEqual(special.map(g=>g.kind),['santa','snowman','grump','santa']);
  assert.ok(game.guests.every(g=>g.speed===27));
  const {game:scoring,events}=gameWithEvents();serve(scoring,.55,0,'snowman');
  assert.equal(scoring.specialServed,1);assert.equal(events.find(e=>e.type==='catch').guestKind,'snowman');
});

test('A fresh round clears bonuses and restores the festive guest rotation',()=>{
  const {game}=gameWithEvents();for(let i=0;i<5;i++)serve(game,.5,0,'santa');
  assert.ok(game.feverRemaining>0);game.finish('time');assert.equal(game.feverRemaining,0);
  game.start();
  for(const key of ['perfectServed','specialServed','bestCombo','feverRemaining','feverCount','combo'])assert.equal(game[key],0);
  assert.ok(game.guests.every(g=>g.kind==='regular'));assert.equal(game.spawn(0).kind,'santa');
});
