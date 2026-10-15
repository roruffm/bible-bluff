import { afterEach, describe, expect, it, vi } from 'vitest';
import { playDeviceQuestion } from '../src/client/lib/kids-device-speech';

class Utterance {
  voice:SpeechSynthesisVoice|null=null;
  lang='';rate=1;
  onend:(()=>void)|null=null;
  onerror:(()=>void)|null=null;
  constructor(public text:string){}
}

afterEach(()=>vi.unstubAllGlobals());

function device(languages:string[]) {
  const synth={getVoices:()=>languages.map(lang=>({lang})),cancel:vi.fn(),speak:vi.fn((_utterance:Utterance)=>{})};
  vi.stubGlobal('speechSynthesis',synth);vi.stubGlobal('SpeechSynthesisUtterance',Utterance);
  return synth;
}

describe('Vorläufige Gerätestimme der Finalfrage',()=>{
  it('liest den sichtbaren Text auf Deutsch und meldet das Ende',async()=>{
    const synth=device(['en-US','de-DE']), ended=vi.fn();
    const playback=playDeviceQuestion('Welche Geschichte spielen die Eltern?',new AbortController().signal,ended);
    const utterance=synth.speak.mock.calls[0][0] as Utterance;
    expect(utterance).toMatchObject({text:'Welche Geschichte spielen die Eltern?',lang:'de-DE',rate:.9,voice:{lang:'de-DE'}});
    expect(ended).not.toHaveBeenCalled();
    utterance.onend!();await playback;expect(ended).toHaveBeenCalledOnce();
  });
  it('bricht beim Stoppen ab und startet nach einem veralteten Befehl nicht',async()=>{
    const synth=device(['de-DE']), controller=new AbortController(), ended=vi.fn();
    const playback=playDeviceQuestion('Finalfrage',controller.signal,ended);
    controller.abort();await playback;
    expect(synth.cancel).toHaveBeenCalledTimes(2);expect(ended).not.toHaveBeenCalled();
    await playDeviceQuestion('Veraltete Frage',controller.signal,ended);
    expect(synth.speak).toHaveBeenCalledOnce();
  });
  it('fordert ohne deutsche Gerätestimme zum manuellen Vorlesen auf',async()=>{
    const synth=device(['en-US']);
    await expect(playDeviceQuestion('Finalfrage',new AbortController().signal,vi.fn())).rejects.toThrow('Bitte die Finalfrage selbst vorlesen.');
    expect(synth.speak).not.toHaveBeenCalled();
  });
});
