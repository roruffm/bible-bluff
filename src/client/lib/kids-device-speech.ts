/** Vorläufige, ausdrücklich gekennzeichnete Gerätestimme für die noch fehlende Finalaufnahme. */
export async function playDeviceQuestion(text:string, signal:AbortSignal, onEnded:()=>void) {
  if(typeof speechSynthesis==='undefined') throw new Error('Die Finalfrage hat noch keine Professor-Aufnahme. Bitte selbst vorlesen.');
  const synth=speechSynthesis;
  let voices=synth.getVoices();
  if(!voices.length && !signal.aborted) voices=await new Promise<SpeechSynthesisVoice[]>(resolve=>{
    const finish=()=>{clearTimeout(timer);synth.removeEventListener('voiceschanged',finish);signal.removeEventListener('abort',finish);resolve(synth.getVoices());};
    const timer=window.setTimeout(finish,1500);
    synth.addEventListener('voiceschanged',finish);signal.addEventListener('abort',finish,{once:true});
  });
  if(signal.aborted)return;
  const voice=voices.find(voice=>voice.lang.toLowerCase().startsWith('de'));
  if(!voice)throw new Error('Keine deutsche Gerätestimme verfügbar. Bitte die Finalfrage selbst vorlesen.');
  await new Promise<void>((resolve,reject)=>{
    const utterance=new SpeechSynthesisUtterance(text);utterance.voice=voice;utterance.lang='de-DE';utterance.rate=.9;
    const cleanup=()=>{signal.removeEventListener('abort',stop);utterance.onend=null;utterance.onerror=null;};
    const stop=()=>{cleanup();synth.cancel();resolve();};
    utterance.onend=()=>{cleanup();onEnded();resolve();};
    utterance.onerror=()=>{cleanup();if(signal.aborted)resolve();else reject(new Error('Die Gerätestimme konnte nicht gestartet werden. Bitte die Finalfrage selbst vorlesen.'));};
    signal.addEventListener('abort',stop,{once:true});synth.cancel();synth.speak(utterance);
  });
}
