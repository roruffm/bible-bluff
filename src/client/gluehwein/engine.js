import { REGULAR_GUESTS } from './guest-roster.js';

export const ROUND_SECONDS = 60;
export const MAX_LIGHTS = 18;
export const LANES = 3;
export const MAX_MISSES = 3;
export const CHARGE_SECONDS = 1.4;
export const TAP_SECONDS = .22;
export const PERFECT_BONUS = 25;
export const PERFECT_WINDOW = 18;
export const FEVER_STREAK = 5;
export const FEVER_SECONDS = 8;
export const SPECIAL_GUESTS = ['santa', 'snowman', 'grump'];
export const SLIDE_FRICTION = 700;
export const slideDistance = power => 45 + 855 * Math.max(0, Math.min(1, power));

// One seed lets the server replay exactly the same round before ranking it.
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ state >>> 15, 1 | state);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export class GameEngine {
  constructor({ random = Math.random, onEvent = () => {}, record = false, orders = false } = {}) {
    this.random = random;
    this.record = record;
    this.orders = orders;
    this.onEvent = onEvent;
    this.nextId = 0;
    this.appearanceOffset = 0;
    this.reset();
  }

  reset() {
    this.history = [];
    this.state = 'ready';
    this.remaining = ROUND_SECONDS;
    this.elapsed = 0;
    this.score = 0;
    this.served = 0;
    this.missed = 0;
    this.lostCustomers = 0;
    this.endReason = null;
    this.combo = 0;
    this.bestCombo = 0;
    this.perfectServed = 0;
    this.specialServed = 0;
    this.feverRemaining = 0;
    this.feverCount = 0;
    this.spawnCount = 0;
    this.lights = 0;
    this.cups = [];
    this.charge = null;
    this.guests = [];
    this.cooldowns = [0, 0, 0];
    this.selectedDrinks = ['wine', 'wine', 'wine'];
    this.spawnIn = 1.2;
    for (let lane = 0; lane < LANES; lane++) this.spawn(lane, 730 + lane * 55);
  }

  start(seed) {
    if (Number.isInteger(seed)) {
      this.random = seededRandom(seed);
      this.appearanceOffset = (seed >>> 0) % REGULAR_GUESTS.length;
    }
    this.reset();
    this.state = 'playing';
  }
  pause() { if (this.state === 'playing') { this.cancelCharge(); this.state = 'paused'; } }
  resume() { if (this.state === 'paused') this.state = 'playing'; }
  emit(type, data = {}) { this.onEvent({ type, ...data }); }

  finish(reason) {
    if (this.state !== 'playing') return;
    this.cancelCharge();
    this.state = 'finished';
    this.feverRemaining = 0;
    this.endReason = reason;
    this.emit('finish', { reason, score: this.score, served: this.served, lights: this.lights, lostCustomers: this.lostCustomers });
  }

  spawn(lane, x = 930) {
    const ordinal = this.spawnCount++;
    // One in four arrivals is a festive visitor. The cycle guarantees variety
    // without changing anyone's speed or the timing of the three service lanes.
    const kind = ordinal % 4 === 3 ? SPECIAL_GUESTS[Math.floor(ordinal / 4) % SPECIAL_GUESTS.length] : 'regular';
    const regularOrdinal = ordinal - Math.floor(ordinal / 4);
    const appearance = (this.appearanceOffset + regularOrdinal) % REGULAR_GUESTS.length;
    const guest = { id: this.nextId++, lane, x, kind, appearance, speed: 21 + this.random() * 12 + this.elapsed * .16,
      color: Math.floor(this.random() * 6), skin: Math.floor(this.random() * 4), hat: this.random() > .4,
      phase: this.random() * Math.PI * 2, served: false, leaveIn: 0 };
    if (this.orders) {
      // The first three guests introduce both drinks; later orders vary.
      guest.drink = ordinal === 1 || (ordinal > 2 && this.random() < .35) ? 'punch' : 'wine';
      guest.rejection = 0;
    }
    this.guests.push(guest);
    return guest;
  }

  beginCharge(lane) {
    if (this.state !== 'playing' || this.charge || !Number.isInteger(lane) || lane < 0 || lane >= LANES || this.cooldowns[lane] > 0) return false;
    this.charge = { lane, elapsed: 0, power: 0 };
    if (this.record) this.history.push(['b', lane]);
    return true;
  }

  cancelCharge() { if (this.record && this.charge) this.history.push(['c']); this.charge = null; }

  releaseCharge() {
    if (!this.charge) return false;
    if (this.record) this.history.push(['r']);
    const { lane, power, elapsed } = this.charge;
    this.charge = null;
    if (this.orders && elapsed < TAP_SECONDS) {
      this.selectedDrinks[lane] = this.selectedDrinks[lane] === 'wine' ? 'punch' : 'wine';
      this.emit('drink-change', { lane, drink: this.selectedDrinks[lane] });
      return true;
    }
    return this.fire(lane, power);
  }

  fire(lane, power = .5) {
    if (this.state !== 'playing' || !Number.isInteger(lane) || lane < 0 || lane >= LANES) return false;
    if (this.cooldowns[lane] > 0) return false;
    const strength = Number.isFinite(power) ? Math.max(0, Math.min(1, power)) : .5;
    this.cups.push({ id: this.nextId++, lane, x: 140, vx: Math.sqrt(2 * SLIDE_FRICTION * slideDistance(strength)), age: 0, stopped: 0, tooFast: false, drink: this.selectedDrinks[lane] });
    this.cooldowns[lane] = .28;
    this.emit('throw', { lane });
    return true;
  }

  catchCup(cup, guest) {
    // Predict the physical stop, including the guest's movement until that
    // instant. A fast cup passing a guest cannot earn a precision bonus.
    const stoppingTime = cup.vx / SLIDE_FRICTION;
    const stopX = cup.x + cup.vx * stoppingTime / 2;
    const guestStopX = guest.x - guest.speed * stoppingTime;
    const perfect = Number.isFinite(stopX) && Number.isFinite(guestStopX) && Math.abs(stopX - guestStopX) <= PERFECT_WINDOW;
    guest.served = true;
    guest.perfect = perfect;
    guest.leaveIn = .88;
    this.served++;
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    if (perfect) this.perfectServed++;
    if (SPECIAL_GUESTS.includes(guest.kind)) this.specialServed++;
    const startFever = this.combo % FEVER_STREAK === 0 && this.feverRemaining <= 0;
    if (startFever) { this.feverRemaining = FEVER_SECONDS; this.feverCount++; }
    const basePoints = 10 + Math.min(20, Math.floor(this.combo / 3) * 2);
    const multiplier = this.feverRemaining > 0 ? 2 : 1;
    const points = (basePoints + (perfect ? PERFECT_BONUS : 0)) * multiplier;
    this.score += points;
    this.lights = Math.min(MAX_LIGHTS, this.served);
    this.emit('catch', { lane: guest.lane, x: guest.x, points, combo: this.combo, perfect,
      guestKind: guest.kind || 'regular', multiplier });
    if (startFever) this.emit('fever-start', { duration: FEVER_SECONDS });
    if (this.served === MAX_LIGHTS) this.emit('all-lit');
  }

  update(rawDt) {
    if (this.state !== 'playing' || !Number.isFinite(rawDt) || rawDt <= 0) return;
    const dt = Math.min(rawDt, .1, this.remaining);
    if (this.record) this.history.push(dt);
    this.remaining = Math.max(0, this.remaining - dt);
    this.elapsed = ROUND_SECONDS - this.remaining;
    if (this.feverRemaining > 0) {
      this.feverRemaining = Math.max(0, this.feverRemaining - dt);
      if (this.feverRemaining < 1e-7) { this.feverRemaining = 0; this.emit('fever-end'); }
    }
    if (this.charge) {
      this.charge.elapsed += dt;
      this.charge.power = Math.min(1, this.charge.elapsed / CHARGE_SECONDS);
    }
    for (let i = 0; i < 3; i++) this.cooldowns[i] = Math.max(0, this.cooldowns[i] - dt);
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      const open = [0, 1, 2].filter(l => !this.guests.some(g => g.lane === l && !g.served && g.x > 820));
      if (open.length) {
        open.sort((a, b) => this.guests.filter(g => g.lane === a && !g.served).length - this.guests.filter(g => g.lane === b && !g.served).length);
        this.spawn(open[0]);
      }
      this.spawnIn = Math.max(.78, 1.45 - this.elapsed * .008) + this.random() * .45;
    }
    for (const guest of this.guests) {
      if (guest.rejection > 0) guest.rejection = Math.max(0, guest.rejection - dt);
      if (guest.served) guest.leaveIn -= dt;
      else guest.x -= guest.speed * dt;
    }
    for (const cup of this.cups) {
      const previousX = cup.x;
      const movingTime = Math.min(dt, cup.vx / SLIDE_FRICTION);
      cup.x += cup.vx * movingTime - .5 * SLIDE_FRICTION * movingTime * movingTime;
      cup.vx = Math.max(0, cup.vx - SLIDE_FRICTION * dt);
      cup.age += dt;
      if (cup.vx === 0) cup.stopped += dt;
      const crossed = this.guests.filter(g => !g.served && g.lane === cup.lane && previousX <= g.x + 30 && cup.x >= g.x - 30)
        .sort((a, b) => a.x - b.x)[0];
      const guest = crossed && cup.vx <= 430 ? crossed : null;
      if (crossed && !guest) cup.tooFast = true;
      if (guest) {
        cup.done = true;
        if (this.orders && cup.drink !== guest.drink) {
          this.combo = 0;
          this.missed++;
          guest.rejection = 1.2;
          this.emit('wrong-drink', { lane: guest.lane, drink: guest.drink });
        } else {
          this.catchCup(cup, guest);
        }
      } else if (cup.x > 1015 || cup.stopped > .55 || cup.age > 4) {
        cup.done = true;
        this.combo = 0;
        this.missed++;
        this.emit('spill', { lane: cup.lane, x: cup.x, reason: cup.tooFast || cup.x > 1015 ? 'strong' : 'short' });
      }
    }
    this.cups = this.cups.filter(c => !c.done);
    this.guests = this.guests.filter(g => {
      if (g.served) return g.leaveIn > 0;
      if (g.x < 225) {
        this.combo = 0;
        if (this.lostCustomers < MAX_MISSES) {
          this.lostCustomers++;
          this.emit('missed-guest', { lane: g.lane, remainingLives: MAX_MISSES - this.lostCustomers });
        }
        return false;
      }
      return true;
    });
    if (this.lostCustomers >= MAX_MISSES) {
      this.finish('customers');
    } else if (this.remaining < 1e-7) {
      this.remaining = 0;
      this.finish('time');
    }
  }
}
