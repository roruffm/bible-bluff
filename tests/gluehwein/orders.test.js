import { test } from 'vitest';
import assert from 'node:assert/strict';
import { GameEngine, TAP_SECONDS } from '../../src/client/gluehwein/engine.js';

function advance(game, seconds) {
  while (seconds > 1e-9) {
    const step = Math.min(seconds, .02);
    game.update(step);
    seconds -= step;
  }
}
function setup() {
  const events = [];
  const game = new GameEngine({ orders: true, record: true, onEvent: event => events.push(event) });
  game.start(42);
  game.guests = [];
  game.spawnIn = 999;
  return { game, events };
}
function tap(game, lane) {
  assert.equal(game.beginCharge(lane), true);
  advance(game, .08);
  assert.equal(game.releaseCharge(), true);
}

test('Both drinks appear in the first three orders and in later arrivals', () => {
  const game = new GameEngine({ orders: true }); game.start(42);
  assert.deepEqual(game.guests.map(guest => guest.drink), ['wine', 'punch', 'wine']);
  for (let i = 0; i < 30; i++) game.spawn(i % 3);
  assert.ok(game.guests.some(guest => guest.drink === 'wine'));
  assert.ok(game.guests.some(guest => guest.drink === 'punch'));
});

test('Short taps toggle only the chosen counter without firing or costing points', () => {
  const { game, events } = setup();
  tap(game, 1);
  assert.deepEqual(game.selectedDrinks, ['wine', 'punch', 'wine']);
  assert.equal(game.cups.length, 0);
  assert.equal(game.score, 0);
  assert.equal(game.missed, 0);
  assert.equal(game.cooldowns[1], 0);
  tap(game, 1);
  assert.deepEqual(game.selectedDrinks, ['wine', 'wine', 'wine']);
  assert.equal(events.filter(event => event.type === 'drink-change').length, 2);
});

test('Holding past the tap threshold launches the selected drink with the charged strength', () => {
  const { game } = setup(); tap(game, 2);
  game.beginCharge(2); advance(game, .7);
  assert.ok(Math.abs(game.charge.power - .5) < 1e-8);
  game.releaseCharge();
  assert.equal(game.cups.length, 1);
  assert.equal(game.cups[0].drink, 'punch');
  assert.equal(game.selectedDrinks[2], 'punch');
  assert.ok(game.cups[0].vx > 0);
});

test('Input just below the tap threshold switches, while a longer hold fires', () => {
  const { game } = setup();
  game.beginCharge(0); advance(game, TAP_SECONDS - .01); game.releaseCharge();
  assert.equal(game.cups.length, 0);
  game.beginCharge(0); advance(game, TAP_SECONDS + .01); game.releaseCharge();
  assert.equal(game.cups.length, 1);
  assert.equal(game.cups[0].drink, 'punch');
});

test('Cancel and pause never turn an unfinished tap into a drink change', () => {
  const { game } = setup();
  game.beginCharge(0); advance(game, .08); game.cancelCharge();
  assert.equal(game.releaseCharge(), false);
  game.beginCharge(1); advance(game, .08); game.pause(); game.resume();
  assert.equal(game.releaseCharge(), false);
  assert.deepEqual(game.selectedDrinks, ['wine', 'wine', 'wine']);
  assert.equal(game.cups.length, 0);
});

test('Changing the selection leaves cups already in flight unchanged', () => {
  const { game } = setup();
  game.beginCharge(0); advance(game, .8); game.releaseCharge();
  const cup = game.cups[0];
  advance(game, .3); tap(game, 0);
  assert.equal(game.selectedDrinks[0], 'punch');
  assert.equal(cup.drink, 'wine');
});

for (const drink of ['wine', 'punch']) test(`Only a matching ${drink} order serves a waiting guest`, () => {
  const { game, events } = setup();
  const guest = game.spawn(0, 600); guest.speed = 0; guest.drink = drink;
  const wrong = drink === 'wine' ? 'punch' : 'wine';
  game.selectedDrinks[0] = wrong; game.fire(0, .5); advance(game, 2);
  assert.equal(guest.served, false);
  assert.equal(game.served, 0);
  assert.equal(game.score, 0);
  assert.equal(game.lostCustomers, 0);
  assert.equal(game.missed, 1);
  assert.equal(events.filter(event => event.type === 'wrong-drink').length, 1);
  game.selectedDrinks[0] = drink; game.fire(0, .5); advance(game, 2);
  assert.equal(guest.served, true);
  assert.equal(game.served, 1);
  assert.ok(game.score > 0);
});

test('A new round restores all three counters to Glühwein', () => {
  const { game } = setup(); tap(game, 0); tap(game, 2);
  game.start(42);
  assert.deepEqual(game.selectedDrinks, ['wine', 'wine', 'wine']);
  assert.equal(game.cups.length, 0);
});

test('A recorded round replays with exactly the same orders, choices and score', () => {
  const original = new GameEngine({ orders: true, record: true }); original.start(42);
  tap(original, 1);
  original.beginCharge(1); advance(original, .9); original.releaseCharge();
  advance(original, 1.5);
  original.beginCharge(0); advance(original, .72); original.cancelCharge();
  while (original.state === 'playing') original.update(.0167);
  assert.ok(original.score > 0);
  const replay = new GameEngine({ orders: true }); replay.start(42);
  for (const step of original.history) {
    if (typeof step === 'number') replay.update(step);
    else if (step[0] === 'b') replay.beginCharge(step[1]);
    else if (step[0] === 'r') replay.releaseCharge();
    else replay.cancelCharge();
  }
  for (const property of ['score', 'served', 'missed', 'lostCustomers', 'state']) assert.equal(replay[property], original[property]);
  assert.deepEqual(replay.selectedDrinks, original.selectedDrinks);
});
