undefined
const professorVoiceCache = new Map<string, Promise<AudioBuffer>>();
/** Play permanent, locally hosted ElevenLabs recordings through the display audio output. */
export async function playProfessorVoice(id: string): Promise<() => void> {
  if (!/^[a-z0-9-]{1,32}$/.test(id) || !context || context.state !== 'running') throw new Error('Professor-Stimme nicht aktiviert');
  const ctx = context;
  let audio = professorVoiceCache.get(id);
  if (!audio) {
    audio = fetch(`/professor-bluff/${id}.mp3`).then(r => { if (!r.ok) throw new Error('Professor-Aufnahme fehlt'); return r.arrayBuffer(); }).then(b => ctx.decodeAudioData(b));
    professorVoiceCache.set(id, audio);
    audio.catch(() => { if (professorVoiceCache.get(id) === audio) professorVoiceCache.delete(id); });
  }
  const source = ctx.createBufferSource(); source.buffer = await audio;
  const gain = ctx.createGain(); gain.gain.value = .94; source.connect(gain).connect(ctx.destination); source.start();
  source.onended = () => { source.disconnect(); gain.disconnect(); };
  return () => { try { source.stop(); } catch { /* finished */ } };
}
