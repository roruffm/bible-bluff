import marketUrl from './assets/market.png';
import guestsUrl from './assets/guests.png';
import specialGuestsUrl from './assets/special-guests.png';

// Game positions remain in the engine's 1000-unit coordinate space. Only the
// renderer uses a deliberately low resolution, so sprites stay sharp on phones.
export const lanePosition = (height, lane) => height * (.43 + lane * .22);
export const spriteHeight = height => Math.max(125, Math.min(235, height * .185));

const INK = '#061128', GOLD = '#ffce4b', CREAM = '#fff0bd';
const PUNCH_STAR = ['0001000', '0001000', '1111111', '0111110', '0011100', '0110110', '1100011'];
function box(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function framed(c, x, y, w, h, color = '#112348', edge = GOLD, border = 4) {
  box(c, x, y, w, h, INK);
  box(c, x + border, y + border, w - border * 2, h - border * 2, edge);
  box(c, x + border * 2, y + border * 2, w - border * 4, h - border * 4, color);
}
function text(c, value, x, y, size, color = CREAM, align = 'center') {
  c.font = `700 ${size}px "Figtree", system-ui, sans-serif`;
  c.textAlign = align;
  c.fillStyle = INK;
  c.fillText(value, Math.round(x + 3), Math.round(y + 3));
  c.fillStyle = color;
  c.fillText(value, Math.round(x), Math.round(y));
}

export class PixelRenderer {
  constructor(canvas, { reducedMotion = false, orders = false, createCanvas = () => document.createElement('canvas') } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.reducedMotion = reducedMotion;
    this.orders = orders;
    this.orderScale = .45;
    this.width = 1000;
    this.height = 1000;
    this.background = createCanvas();
    this.market = this.load(marketUrl);
    this.guests = this.load(guestsUrl);
    this.specialGuests = this.load(specialGuestsUrl);
  }

  load(url) {
    if (typeof Image === 'undefined') return null;
    const image = new Image();
    image.onload = () => this.makeScenery();
    image.src = url;
    return image;
  }

  resize(width, height) {
    this.height = Math.max(1, height) / Math.max(1, width) * 1000;
    const bubbleWidth = Math.min(38, Math.max(26, height * .075));
    this.orderScale = bubbleWidth * 1000 / (86 * Math.max(1, width));
    this.canvas.width = width < 650 ? 400 : 640;
    this.canvas.height = Math.round(this.height * this.canvas.width / 1000);
    this.scale = this.canvas.width / 1000;
    this.makeScenery();
  }

  laneY(lane) { return lanePosition(this.height, lane); }
  personHeight() {
    if (!this.orders) return spriteHeight(this.height);
    return Math.max(50, Math.min(spriteHeight(this.height), this.height * .22 - 94 * this.orderScale));
  }
  personScale() { return this.personHeight() / 160; }

  makeScenery() {
    const { background, canvas, height: h } = this;
    background.width = canvas.width;
    background.height = canvas.height;
    const c = background.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.setTransform(this.scale || 1, 0, 0, this.scale || 1, 0, 0);
    box(c, 0, 0, 1000, h, '#081733');
    // Cached brickwork is visible between the independently moving game rows.
    for (let row = 0; row < Math.ceil(h / 28); row++) {
      for (let col = -1; col < 19; col++) {
        const x = col * 58 + (row % 2 ? 29 : 0);
        box(c, x, row * 28, 54, 23, row % 3 ? '#10244a' : '#132b51');
        box(c, x + 4, row * 28 + 3, 38, 3, '#19365c');
      }
    }
    const scenicHeight = Math.max(h * .365, Math.min(h * .48, 210));
    if (this.market?.complete && this.market.naturalWidth) {
      // Cover the top panorama without stretching its buildings or tree.
      const iw = this.market.naturalWidth, ih = this.market.naturalHeight;
      const sourceHeight = Math.min(ih, iw * scenicHeight / 1000);
      const sourceWidth = Math.min(iw, ih * 1000 / scenicHeight);
      c.drawImage(this.market, (iw - sourceWidth) / 2, 0, sourceWidth, sourceHeight, 0, 0, 1000, scenicHeight);
    } else {
      // Immediate lightweight scenery while the local image finishes loading.
      box(c, 0, 0, 1000, scenicHeight, '#061938');
      for (let i = 0; i < 70; i++) box(c, i * 137 % 1000, i * 43 % scenicHeight, 3, 3, '#ccecff');
    }
    for (let i = 0; i < 40; i++) {
      const x = i * 25, y = scenicHeight - 3 + (i % 3) * 3;
      box(c, x, y, 27, 6, '#effaff');
      if (i % 5 === 0) box(c, x + 9, y + 4, 6, 12, '#89bdf1');
    }
  }

  counter(c, lane, selected) {
    const y = this.laneY(lane), height = Math.max(29, Math.min(55, this.height * .046));
    box(c, 12, y + 9, 975, height + 11, INK);
    box(c, 16, y + 4, 968, height, '#542630');
    box(c, 16, y + 4, 968, 10, '#d1794d');
    box(c, 20, y + 8, 960, 4, selected ? '#ffe48b' : '#edac63');
    box(c, 21, y + 16, 958, height - 17, '#a33c36');
    for (let i = 0; i < 8; i++) {
      box(c, 31 + i * 122, y + 22 + (i % 3) * 5, 71, 3, '#c35141');
      box(c, 47 + i * 122, y + 33, 51, 3, '#76303a');
    }
    // Pixel snow on the far edge; highlights never cover the active mug.
    for (let i = 0; i < 26; i++) {
      box(c, 18 + i * 37, y - 2 - (i % 4 === 0 ? 4 : 0), 30, 6, '#eaf8ff');
      if (i % 5 === 0) box(c, 22 + i * 37, y + 4, 5, 9, '#a9d9ff');
    }
  }

  mug(c, x, y, size = 1, selected = false, time = 0, drink = 'wine') {
    const punch = drink === 'punch';
    c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(size, size);
    // Shadow, hard outline, handle and the selected enamel colour.
    box(c, -25, 0, 58, 8, '#031027');
    if (selected) {
      box(c, -32, 7, 70, 4, GOLD);
      box(c, -36, -3, 4, 10, GOLD);
      box(c, 38, -3, 4, 10, GOLD);
    }
    box(c, 18, -39, 20, 30, INK);
    box(c, 23, -34, 10, 19, punch ? '#a8f09e' : '#f16960');
    box(c, 25, -29, 7, 10, INK);
    box(c, -25, -48, 49, 50, INK);
    box(c, -21, -43, 41, 42, punch ? '#288c54' : '#be2039');
    box(c, -19, -40, 6, 35, punch ? '#a8f09e' : '#ff6e64');
    box(c, 12, -38, 6, 34, punch ? '#115431' : '#810d2d');
    box(c, -22, -48, 43, 6, CREAM);
    box(c, -16, -44, 32, 4, '#371633');
    box(c, -16, -3, 32, 4, punch ? '#83d889' : '#f75e57');
    // Distinct emblems make orders readable without relying on colour alone.
    if (punch) {
      for (let row = 0; row < PUNCH_STAR.length; row++) {
        for (let col = 0; col < PUNCH_STAR[row].length; col++) {
          if (PUNCH_STAR[row][col] === '1') box(c, -11 + col * 3, -33 + row * 3, 3, 3, '#fff6d7');
        }
      }
    } else {
      box(c, -3, -34, 5, 23, '#fff6d7');
      box(c, -12, -25, 23, 5, '#fff6d7');
      for (const [px, py] of [[-10,-32],[6,-32],[-10,-16],[6,-16]]) box(c, px, py, 5, 5, '#fff6d7');
    }
    const steam = Math.floor(time * 3) % 3;
    for (let i = 0; i < 3; i++) {
      box(c, -9 + (i % 2) * 8 + steam * 2, -57 - i * 8, 6, 9, '#dcecff');
    }
    c.restore();
  }

  person(c, guest, time) {
    const h = this.personHeight(), w = h * .84, y = this.laneY(guest.lane);
    const bob = this.reducedMotion ? 0 : Math.floor(Math.sin(time * 3 + guest.phase) * 2);
    c.save();
    if (guest.served) c.globalAlpha = Math.min(1, guest.leaveIn * 2);
    const specialIndex = { santa: 0, snowman: 1, grump: 2 }[guest.kind];
    const specialReady = specialIndex !== undefined && this.specialGuests?.complete && this.specialGuests.naturalWidth;
    const image = specialReady ? this.specialGuests : this.guests;
    if (image?.complete && image.naturalWidth) {
      const iw = image.naturalWidth, ih = image.naturalHeight, cell = iw / (specialReady ? 3 : 4);
      const index = specialReady ? specialIndex : guest.id % 4;
      c.drawImage(image, index * cell, ih * .13, cell, ih * .8,
        Math.round(guest.x - w / 2), Math.round(y - h + bob + 10), Math.round(w), Math.round(h));
    } else {
      box(c, guest.x - w * .4, y - h * .58, w * .8, h * .6, '#354c67');
      box(c, guest.x - w * .29, y - h * .9, w * .58, h * .45, '#efb58b');
      box(c, guest.x - w * .33, y - h, w * .66, h * .2, '#c73745');
      box(c, guest.x - 14, y - h * .72, 6, 6, INK);
      box(c, guest.x + 8, y - h * .72, 6, 6, INK);
    }
    if (guest.served) {
      const reaction = { santa: 'HO HO HO!', snowman: 'SCHÖN WARM!', grump: 'NA GUT.' }[guest.kind];
      text(c, reaction || 'TOP!', guest.x, y - h - 8, 29, GOLD);
      this.mug(c, guest.x + w * .2, y - h * .12, .6 * this.personScale(), false, time, guest.drink);
    }
    c.restore();
  }

  orderBubble(c, guest) {
    const size = this.orderScale;
    const x = guest.x;
    const y = this.laneY(guest.lane) - this.personHeight() - 88 * size;
    c.save();
    c.translate(Math.round(x), Math.round(y));
    c.scale(size, size);
    const edge = guest.rejection > 0 ? '#f65c65' : INK;
    box(c, -43, 0, 86, 76, edge);
    box(c, -39, 4, 78, 68, CREAM);
    box(c, -11, 76, 18, 7, edge);
    box(c, -7, 72, 10, 7, CREAM);
    box(c, -7, 83, 10, 5, edge);
    this.mug(c, -5, 65, .78, false, 0, guest.drink);
    c.restore();
  }

  gauge(c, lane, power, active, time) {
    const y = this.laneY(lane), barWidth = 106, barY = y + 23;
    framed(c, 22, y - 54, 69, 52, '#14264b', '#d89a40', 3);
    text(c, String(lane + 1), 57, y - 15, 43);
    framed(c, 23, barY, barWidth, 25, '#0b1834', active ? GOLD : '#8e7954', 3);
    for (let i = 0; i < 7; i++) box(c, 31 + i * 13, barY + 8, 10, 10,
      i < Math.ceil(power * 7) ? (i > 5 ? '#ff884b' : GOLD) : '#394461');
    if (active) {
      const mugY = y - 63 * this.personScale();
      framed(c, 101, mugY - 47, 120, 39, '#0b1834', GOLD, 3);
      text(c, `${Math.round(power * 100)}%`, 160, mugY - 17, 31, '#fff6b7');
      if (!this.reducedMotion && Math.floor(time * 7) % 2 === 0) {
        box(c, 102, y - 50, 5, 13, GOLD); box(c, 187, y - 49, 5, 13, GOLD);
      }
    }
  }

  draw(engine, time, particles = [], ripples = []) {
    const c = this.ctx, { canvas, height: h, scale } = this;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.drawImage(this.background, 0, 0);
    c.setTransform(scale, 0, 0, scale, 0, 0);
    const fever = engine.feverRemaining > 0;
    const bulbY = Math.max(20, h * .033);
    for (let i = 0; i < 18; i++) {
      const x = 20 + i * 56.3, y = bulbY + Math.round(Math.sin(i / 17 * Math.PI) * 21);
      box(c, x, y - 6, 5, 10, '#3b4d58');
      box(c, x - 3, y + 3, 11, 12, fever ? [GOLD, '#ff788b', '#7ce5d8'][i % 3] : i < engine.lights ? GOLD : '#5b7393');
      if (fever || i < engine.lights) box(c, x, y + 5, 5, 6, '#fff8c1');
    }
    for (let lane = 0; lane < 3; lane++) {
      const active = engine.charge?.lane === lane, y = this.laneY(lane);
      for (const guest of engine.guests.filter(g => g.lane === lane).sort((a,b) => a.x - b.x)) this.person(c, guest, time);
      this.counter(c, lane, active || fever);
      this.mug(c, 148, y, this.personScale() * .94, active, time, engine.selectedDrinks[lane]);
      for (const cup of engine.cups.filter(p => p.lane === lane)) {
        // Square speed streaks carry the motion without blurring the sprites.
        if (!this.reducedMotion && cup.vx > 200) {
          box(c, cup.x - 58, y - 24, 30, 4, '#ffb875');
          box(c, cup.x - 76, y - 13, 44, 3, '#e87552');
        }
        this.mug(c, cup.x, y, this.personScale() * .94, false, time, cup.drink);
      }
      this.gauge(c, lane, active ? engine.charge.power : 0, active, time);
    }
    if (this.orders) {
      for (const guest of engine.guests) {
        if (!guest.served) this.orderBubble(c, guest);
      }
    }
    for (const p of particles) {
      c.globalAlpha = Math.max(0, Math.min(1, p.life));
      if (p.kind === 'text') text(c, p.text, p.x, p.y, 43 * this.personScale(), GOLD);
      else box(c, p.x, p.y, p.size + 2, p.size + 2, p.color);
    }
    for (const r of ripples) {
      c.globalAlpha = Math.max(0, r.life);
      const d = (1 - r.life) * 45;
      box(c, r.x - d, this.laneY(r.lane) - 40, 5, 12, GOLD);
      box(c, r.x + d, this.laneY(r.lane) - 40, 5, 12, GOLD);
    }
    c.globalAlpha = 1;
    if (fever) {
      box(c, 0, 0, 5, h, GOLD);
      box(c, 995, 0, 5, h, GOLD);
    }
    if (!this.reducedMotion) for (let i = 0; i < 42; i++) {
      const x = (i * 197.3 + Math.sin(time + i) * 8) % 1000;
      const y = (i * 113 + time * (11 + i % 6 * 2)) % (h + 15);
      box(c, x, y, i % 4 ? 3 : 5, i % 4 ? 3 : 5, '#cfeaff88');
    }
  }
}
