import type { Page } from '@playwright/test';

export interface ProfessorAudio { starts: number; stops: number; played: string[] }

/** Zählt, welche Professor-Aufnahmen am Beamer starten und stoppen. Die Show lädt alle Aufnahmen vorab,
 * darum verrät der Netzwerkverkehr nicht mehr, was gerade erklingt. Erzeugte Showklänge zählen nicht mit. */
export async function trackProfessorAudio(page: Page) {
  await page.addInitScript(() => {
    const audio = { starts: 0, stops: 0, played: [] as string[] };
    Object.assign(window, { professorAudio: audio });
    const fetched = new WeakMap<ArrayBuffer, string>(), decoded = new WeakMap<AudioBuffer, string>();
    const arrayBuffer = Response.prototype.arrayBuffer;
    Response.prototype.arrayBuffer = async function () {
      const bytes = await arrayBuffer.call(this);
      const clip = /\/professor-bluff\/([\w-]+)\.mp3$/.exec(new URL(this.url, location.href).pathname)?.[1];
      if (clip) fetched.set(bytes, clip);
      return bytes;
    };
    const decode = BaseAudioContext.prototype.decodeAudioData;
    BaseAudioContext.prototype.decodeAudioData = function (this: BaseAudioContext, bytes: ArrayBuffer) {
      const clip = fetched.get(bytes);
      return decode.call(this, bytes).then((buffer) => { if (clip) decoded.set(buffer, clip); return buffer; });
    } as typeof decode;
    const create = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      const source = create.call(this), start = source.start.bind(source), stop = source.stop.bind(source);
      const clip = () => source.buffer ? decoded.get(source.buffer) : undefined;
      source.start = (...args) => { const name = clip(); if (name) { audio.starts++; audio.played.push(name); } return start(...args); };
      source.stop = (...args) => { if (clip()) audio.stops++; return stop(...args); };
      return source;
    };
  });
}

export function professorAudio(page: Page): Promise<ProfessorAudio> {
  return page.evaluate(() => (window as unknown as { professorAudio: ProfessorAudio }).professorAudio);
}
