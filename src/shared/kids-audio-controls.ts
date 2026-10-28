import type { KidsGame } from './kids-game';
import { professorInterjection, professorInterjectionForRound, type ProfessorInterjectionId } from './professor-interjections';
import { professorVoiceKey } from './professor-voice';

export const KIDS_AUDIO_SITUATIONS = [
  { id: 'quiet', label: 'Ruhe schaffen', clips: ['quiet', 'listen', 'walk', 'signal-pause', 'signal-stop', 'return', 'regroup-ready'] },
  { id: 'encourage', label: 'Mut machen', clips: ['cheer', 'support', 'together', 'try', 'applause', 'closing-jesus'] },
  { id: 'parents', label: 'Eltern einbeziehen', clips: ['parents-help', 'finale-parents'] },
  { id: 'groups', label: 'Gruppen aufrufen', clips: ['call-minis', 'call-mittis', 'call-maxis', 'call-all'] },
  { id: 'points', label: 'Punkte verkünden', clips: ['result-correct', 'result-participated', 'result-final-correct', 'result-final-participated', 'result-none'] },
  { id: 'play', label: 'Spiel begleiten', clips: ['scene-invite', 'tricky', 'think', 'nervous', 'signal-start', 'signal-go', 'signal-resume', 'signal-countdown'] },
] as const satisfies readonly { id: string; label: string; clips: readonly ProfessorInterjectionId[] }[];

export function kidsAudioAvailable(game: KidsGame, id: ProfessorInterjectionId): boolean {
  const question = game.rounds[game.index].question;
  if (id === 'scene-invite') return game.phase === 'reading' && question.group === 'minis' && !!question.scene;
  if (id === 'parents-help') return question.group === 'minis' && !['welcome', 'chapter', 'finished'].includes(game.phase);
  if (id === 'finale-parents') return game.index === 9;
  return professorInterjectionForRound(id, game.index)?.id === id;
}

export function kidsFavoriteId(id: ProfessorInterjectionId): ProfessorInterjectionId {
  return id === 'result-final-correct' ? 'result-correct' : id === 'result-final-participated' ? 'result-participated' : id;
}

/** Lokale Favoriten enthalten ausschließlich bekannte Ansage-IDs, höchstens drei und ohne Duplikate. */
export function parseKidsAudioFavorites(raw: string | null): ProfessorInterjectionId[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(value)) return [];
    return [...new Set(value.flatMap(id => {
      const clip = professorInterjection(id);
      return clip ? [kidsFavoriteId(clip.id)] : [];
    }))].slice(0, 3);
  } catch { return []; }
}

export type KidsAudioShortcut = ProfessorInterjectionId | 'read-question' | 'read-answers' | 'speak';
export function kidsContextAudio(game: KidsGame, sceneStep: 'scene' | 'question'): KidsAudioShortcut[] {
  const group = `call-${game.rounds[game.index].question.group}` as ProfessorInterjectionId;
  switch (game.phase) {
    case 'welcome': return ['speak', 'together'];
    case 'chapter': return [group, 'speak', 'listen'];
    case 'superbluff': return ['call-all', 'finale-parents', 'speak'];
    case 'reading':
      if (game.rounds[game.index].question.group === 'minis' && game.rounds[game.index].question.scene && sceneStep === 'scene') return [group, 'scene-invite'];
      return game.index === 9 ? ['read-question', 'read-answers', 'finale-parents'] : ['read-question', 'read-answers'];
    case 'scene': return ['support'];
    case 'moving': return ['signal-countdown', 'cheer'];
    case 'paused': return ['signal-pause', 'think'];
    case 'locked': return ['signal-stop'];
    case 'returning': return ['return'];
    case 'judging': return ['regroup-ready'];
    case 'revealed': return [`result-${game.results[game.index] ?? 'none'}` as ProfessorInterjectionId, 'speak', 'applause'];
    case 'finished': return ['speak', 'closing-jesus', 'applause'];
  }
}

export function kidsAudioLabel(game: KidsGame, shortcut: KidsAudioShortcut): string {
  if (shortcut === 'speak') return 'Spruch am Beamer abspielen';
  if (shortcut === 'read-question') return 'Frage am Beamer vorlesen';
  if (shortcut === 'read-answers') return 'Antworten vorlesen';
  if (shortcut === 'signal-countdown' && game.phase === 'moving') return 'Countdown für letzte 5 Sekunden vormerken';
  return professorInterjectionForRound(shortcut, game.index)!.label;
}

export function kidsAudioStatus(game: KidsGame): { label: string; state: 'idle' | 'loading' | 'playing' | 'scheduled' | 'failed' } {
  if (game.introVideo) return { label: game.introVideo.playing ? 'Läuft: Erklärvideo' : 'Erklärvideo pausiert', state: game.introVideo.playing ? 'playing' : 'idle' };
  if (game.phase === 'scene') return { label: 'Läuft: Szene am Beamer', state: 'playing' };
  const current = game.voiceCue === `${game.phase}:${game.index}`;
  const playback = game.voiceStatus && game.voiceStatus.sequence === game.voiceSeq ? game.voiceStatus.state : null;
  if (current && playback === 'failed') return { label: 'Audio nicht gestartet · Ton am Beamer prüfen', state: 'failed' };
  if (!current || !game.voicePlaying) return { label: 'Bereit für die nächste Ansage', state: 'idle' };
  const label = game.voiceKind === 'question' ? 'Frage vorlesen' : game.voiceKind === 'answers' ? 'Antworten vorlesen' : game.voiceKind === 'interjection' ? professorInterjection(game.voiceClip)?.label ?? 'Professor-Ansage' : professorVoiceKey(game) ? 'Professor-Spruch' : 'Professor-Ansage';
  const scheduled = game.phase === 'moving' && game.voiceClip === 'signal-countdown' && game.remainingMs > 5000;
  return scheduled ? { label: 'Vorgemerkt: Countdown für die letzten 5 Sekunden', state: 'scheduled' }
    : playback === 'playing' ? { label: `Läuft: ${label}`, state: 'playing' }
    : { label: `Wird am Beamer geladen: ${label}`, state: 'loading' };
}

