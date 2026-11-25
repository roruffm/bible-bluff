import { test } from 'vitest';
import assert from 'node:assert/strict';
import { GameEngine, MAX_LIGHTS, slideDistance } from '../../src/client/gluehwein/engine.js';

function advance(game,seconds){for(let n=0;n<Math.ceil(seconds*60);n++)game.update(1/60);}
function emptyGame(onEvent=()=>{}){const game=new GameEngine({random:()=>.5,onEvent});game.start();game.guests=[];game.spawnIn=999;return game;}

test('60 seconds end exactly once; pausing consumes no time',()=>{
  const events=[],game=emptyGame(e=>events.push(e));
  advance(game,5);game.pause();const left=game.remaining;advance(game,20);assert.equal(game.remaining,left);
  game.resume();advance(game,56);assert.equal(game.state,'finished');assert.equal(game.remaining,0);
  advance(game,10);assert.equal(events.filter(e=>e.type==='finish').length,1);
});

test('Holding charges, releasing fires; a full bar waits for release',()=>{
  const game=emptyGame();assert.equal(game.beginCharge(0),true);advance(game,.7);
  assert.ok(Math.abs(game.charge.power-.5)<.001);assert.equal(game.cups.length,0);
  advance(game,2);assert.equal(game.charge.power,1);assert.equal(game.cups.length,0);
  assert.equal(game.releaseCharge(),true);assert.equal(game.charge,null);assert.equal(game.cups.length,1);
});

test('The physical stop distance follows the released charge',()=>{
  const distance=power=>{const events=[],game=emptyGame(e=>events.push(e));game.fire(0,power);advance(game,3);return events.find(e=>e.type==='spill').x-140;};
  const short=distance(.2),long=distance(.7);
  assert.ok(long>short*2);assert.ok(Math.abs(short-slideDistance(.2))<.01);assert.ok(Math.abs(long-slideDistance(.7))<.01);
});

test('Right strength serves a guest; excessive strength slides past',()=>{
  function attempt(power){const game=emptyGame();game.spawn(0,600);game.guests[0].speed=0;game.fire(0,power);advance(game,2);return game;}
  const hit=attempt(.5);assert.equal(hit.served,1);assert.equal(hit.score,10);assert.equal(hit.lights,1);
  const over=attempt(1);assert.equal(over.served,0);assert.equal(over.score,0);assert.ok(over.missed>0);
});

test('Cancel, pause and round end discard held input without firing',()=>{
  const game=emptyGame();game.beginCharge(0);advance(game,.4);game.cancelCharge();assert.equal(game.releaseCharge(),false);
  game.beginCharge(1);advance(game,.4);game.pause();assert.equal(game.charge,null);game.resume();assert.equal(game.releaseCharge(),false);
  game.beginCharge(2);advance(game,61);assert.equal(game.charge,null);assert.equal(game.cups.length,0);assert.equal(game.served,0);
});

test('No guests serve automatically; invalid or concurrent charge input is ignored',()=>{
  const game=new GameEngine();assert.equal(game.beginCharge(0),false);game.start();
  for(const lane of [-1,3,1.5,NaN])assert.equal(game.beginCharge(lane),false);
  game.beginCharge(0);assert.equal(game.beginCharge(1),false);game.cancelCharge();advance(game,61);
  assert.equal(game.served,0);assert.equal(game.score,0);assert.equal(game.lights,0);
});

test('Lights cap at 18; a new round clears score and active charge',()=>{
  const game=new GameEngine();game.start();
  for(let i=0;i<24;i++)game.catchCup({},game.guests[0]);
  assert.equal(game.lights,MAX_LIGHTS);assert.equal(game.served,24);assert.ok(game.score>240);
  game.beginCharge(0);game.start();assert.equal(game.score,0);assert.equal(game.charge,null);assert.equal(game.remaining,60);
});


test('Exactly the third unserved customer ends the round and cancels charging',()=>{
 const events=[],game=emptyGame(e=>events.push(e));
 for(let i=0;i<3;i++){
  game.spawn(i,224);game.beginCharge(i);advance(game,.02);
  assert.equal(game.lostCustomers,i+1);
  if(i<2){assert.equal(game.state,'playing');game.cancelCharge();}
 }
 assert.equal(game.state,'finished');assert.equal(game.endReason,'customers');assert.equal(game.charge,null);assert.ok(game.remaining>0);
 assert.equal(events.filter(e=>e.type==='finish').length,1);assert.equal(game.releaseCharge(),false);
 advance(game,5);assert.equal(events.filter(e=>e.type==='finish').length,1);
 game.start();assert.equal(game.lostCustomers,0);assert.equal(game.endReason,null);
});

test('Spilled cups and served departing guests do not cost a chance',()=>{
 const game=emptyGame();game.spawn(0,220);game.guests[0].served=true;game.guests[0].leaveIn=.5;
 game.fire(1,0);advance(game,2);assert.ok(game.missed>0);assert.equal(game.lostCustomers,0);assert.equal(game.state,'playing');
});

test('Simultaneous departures cap at three and produce one game over',()=>{
 const events=[],game=emptyGame(e=>events.push(e));for(let i=0;i<5;i++)game.spawn(i%3,224);
 game.update(.016);assert.equal(game.lostCustomers,3);assert.equal(events.filter(e=>e.type==='missed-guest').length,3);
 assert.equal(events.filter(e=>e.type==='finish').length,1);assert.equal(game.endReason,'customers');
});
