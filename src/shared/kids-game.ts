import { KIDS_SHOW_QUESTIONS, type KidsShowQuestion, type KidsGroup } from './kids-show-questions';
import { KIDS_SCENE_MS } from './kids-scenes';
import { professorInterjectionForRound, type ProfessorInterjectionId } from './professor-interjections';
import { kidsIntroPosition, type KidsIntroVideo } from './kids-intro';

export const KIDS_SECONDS = 30;
/** Antwortzeit je Aufgabe in Millisekunden. */
export const KIDS_ANSWER_MS = KIDS_SECONDS * 1000;
/** Punkte für Professor Bluff je gewerteter regulärer Aufgabe. */
export const KIDS_PROFESSOR_POINTS = 7;
export type KidsPhase = 'welcome' | 'chapter' | 'superbluff' | 'reading' | 'scene' | 'moving' | 'paused' | 'locked' | 'returning' | 'judging' | 'revealed' | 'finished';
/** participated bleibt als gespeicherter Protokollwert erhalten: mindestens ein Kind richtig, ohne Mehrheit. */
export type KidsResult = 'correct' | 'participated' | 'none';
/** Reguläre Aufgaben: 10/5/0. Im gemeinsamen Finale zählen Kinderpunkte doppelt. */
export function kidsResultPoints(result: KidsResult | null, index = 0): number {
  return (result === 'correct' ? 10 : result === 'participated' ? 5 : 0) * (index === 9 ? 2 : 1);
}
export interface KidsRound { question: KidsShowQuestion; answers: string[]; correctIndex: number }
export interface KidsGame {
  rounds: KidsRound[]; index: number; phase: KidsPhase; remainingMs: number; deadline: number | null;
  results: (KidsResult | null)[]; cueSeq: number;
  voiceSeq?: number; voicePlaying?: boolean; voiceCue?: string|null; voiceKind?: 'quote'|'question'|'answers'|'interjection'; voiceClip?: ProfessorInterjectionId|null;
  /** Nur in der Begrüßung der Show mit Antwortfeldern. Der Ton läuft ausschließlich am Beamer. */
  introVideo?: KidsIntroVideo;
}
export type KidsAction = 'play-intro' | 'pause-intro' | 'restart-intro' | 'stop-intro' | 'start' | 'pause' | 'resume' | 'skip-countdown' | 'back' | 'tick' | 'return' | 'ready' | 'correct' | 'participated' | 'none' | 'next' | 'scene' | 'end-scene' | 'finish' | 'jump-final' | 'speak' | 'stop-speech' | 'read-question' | 'read-answers' | 'correct-last' | 'participated-last' | 'none-last' | `interjection:${ProfessorInterjectionId}`;

export function kidsCanJumpToFinal(game: KidsGame): boolean {
  const final = game.rounds.length - 1;
  return game.results[final] === null && (game.index < final || game.phase === 'finished');
}

/** Nur die Spielleitung kann die Antwortzeit vorzeitig beenden; die Auflösung bleibt verborgen. */
export function kidsCanSkipCountdown(game: Pick<KidsGame, 'phase'>): boolean {
  return game.phase === 'reading' || game.phase === 'moving' || game.phase === 'paused';
}

/** Gewertet wird erst, wenn alle Kinder zurück sind. */
export function kidsCanScore(game: KidsGame): boolean {
  return game.results[game.index] === null && game.phase === 'judging';
}

export function kidsLastScoredIndex(game: KidsGame): number {
  for (let i = game.results.length - 1; i >= 0; i--) if (game.results[i] !== null) return i;
  return -1;
}

/**
 * Der Schritt vor dem aktuellen, falls die Spielleitung zu schnell weitergeklickt hat; null bei der Begrüßung.
 * Ein laufender oder abgelaufener Countdown springt zurück vors Vorlesen, eine zurückgenommene Auflösung verliert ihre Wertung.
 */
export function kidsPreviousStep(game: KidsGame): KidsGame | null {
  const { phase, index } = game;
  const to = (target: number, targetPhase: KidsPhase, results = game.results): KidsGame => ({
    ...game, index: target, phase: targetPhase, results, deadline: null,
    remainingMs: ['locked', 'returning', 'judging', 'revealed'].includes(targetPhase) ? 0 : KIDS_ANSWER_MS,
    voiceSeq: (game.voiceSeq ?? 0) + 1, voicePlaying: false, voiceCue: null,
  });
  // Vor einem Kapitel oder dem Finale liegt die zuletzt gewertete Auflösung, ganz am Anfang die Begrüßung.
  const beforeTask = () => {
    const last = kidsLastScoredIndex({ ...game, results: game.results.slice(0, index) });
    return last >= 0 ? to(last, 'revealed') : to(0, 'welcome');
  };
  if (phase === 'welcome') return null;
  if (phase === 'chapter' || phase === 'superbluff') return beforeTask();
  if (phase === 'reading') return index === 9 ? to(9, 'superbluff') : index % 3 === 0 ? to(index, 'chapter') : beforeTask();
  if (phase === 'scene' || phase === 'moving' || phase === 'paused' || phase === 'locked') return to(index, 'reading');
  if (phase === 'returning') return to(index, 'locked');
  if (phase === 'judging') return to(index, 'returning');
  if (phase === 'revealed') return to(index, 'judging', game.results.map((r, i) => i === index ? null : r));
  return game.results[index] !== null ? to(index, 'revealed') : to(index, 'reading');
}

/** Feste Zuordnung je Frage: Feld 1 gelb, Feld 2 türkis, Feld 3 rosa.
 * Die neun regulären Antworten sind gleichmäßig auf die drei Felder verteilt.
 * Die Kennung statt der Rundenposition verhindert Änderungen durch eine neue Fragenreihenfolge. */
const KIDS_CORRECT_FIELDS: Readonly<Record<string, 0 | 1 | 2>> = {
  '1petr-arche': 1,
  'lt-jona': 2,
  'mt-muenze': 0,
  'lt-krippe': 2,
  'lt-taube': 0,
  '2petr-eselin': 1,
  'lt-loewengrube': 0,
  'joh-junge': 2,
  'joh-thomas': 1,
  'mk-kissen': 1,
};
export function createKidsGame(_random: () => number = Math.random): KidsGame {
  // _random bleibt für bestehende Aufrufer erhalten, beeinflusst aber keine Antwortposition mehr.
  const rounds = KIDS_SHOW_QUESTIONS.map((question) => {
    const correctIndex = KIDS_CORRECT_FIELDS[question.sourceId];
    if (correctIndex === undefined) throw new Error(`Keine feste Kids-Antwortposition für ${question.sourceId}`);
    const answers = [...question.distractors];
    answers.splice(correctIndex, 0, question.answer);
    return { question, answers, correctIndex };
  });
  return { rounds, index: 0, phase: 'welcome', remainingMs: KIDS_ANSWER_MS, deadline: null, results: rounds.map(() => null), cueSeq: 0 };
}
/** hiddenIndex blendet eine Wertung aus, etwa solange der Trommelwirbel die Auflösung noch zurückhält. */
export function kidsScores(game: KidsGame, hiddenIndex = -1) {
  const groups = { minis: 0, mittis: 0, maxis: 0 };
  let professor = 0; let bonus = 0; let playedRounds = 0;
  game.results.forEach((result, i) => {
    if (result === null || i === hiddenIndex) return;
    playedRounds++;
    if (i === 9) { bonus = kidsResultPoints(result, i); return; }
    const group = game.rounds[i].question.group as Exclude<KidsGroup, 'all'>;
    groups[group] += kidsResultPoints(result);
    professor += KIDS_PROFESSOR_POINTS;
  });
  return { groups, bonus, team: groups.minis + groups.mittis + groups.maxis + bonus, professor, playedRounds };
}
/** Ergebnisse der drei Aufgaben einer Altersgruppe in Spielreihenfolge, für die Leuchtpunkte am Beamer. */
export function kidsGroupResults(game: KidsGame, group: Exclude<KidsGroup, 'all'>, hiddenIndex = -1): (KidsResult | null)[] {
  return game.rounds.flatMap((round, i) => round.question.group === group ? [i === hiddenIndex ? null : game.results[i]] : []);
}
/** Das Kinderteam zieht mit der gerade aufgelösten Aufgabe an Professor Bluff vorbei. */
export function kidsOvertook(game: KidsGame): boolean {
  if (game.phase !== 'revealed' || game.results[game.index] === null) return false;
  const before = kidsScores(game, game.index), after = kidsScores(game);
  return before.team <= before.professor && after.team > after.professor;
}
/** Zeit und Punkte sind geräteunabhängig; doppelte oder unpassende Schritte ändern nichts. */
export function updateKidsGame(game: KidsGame, action: KidsAction, now: number): KidsGame {
  const phase = game.phase;
  if (['play-intro', 'pause-intro', 'restart-intro', 'stop-intro'].includes(action)) {
    if (phase !== 'welcome') return game;
    const video = game.introVideo;
    if (action === 'stop-intro') return video ? { ...game, introVideo: undefined } : game;
    if (action === 'pause-intro' && (!video || !video.playing)) return game;
    if (action === 'play-intro' && video?.playing) return game;
    return { ...game, voiceSeq: (game.voiceSeq ?? 0) + 1, voicePlaying: false, voiceCue: null,
      introVideo: { playing: action !== 'pause-intro', positionMs: action === 'restart-intro' || !video ? 0 : kidsIntroPosition(video, now),
        startedAt: action === 'pause-intro' ? null : now, sequence: (video?.sequence ?? 0) + 1, fromStart: action === 'restart-intro' || !video } };
  }
  // Erst das Video beenden; weder Tastatur noch Zusatzaudio dürfen die Erklärung unterbrechen.
  if (game.introVideo) {
    if (action === 'back') return { ...game, introVideo: undefined };
    if (action === 'finish' || action === 'jump-final') return updateKidsGame({ ...game, introVideo: undefined }, action, now);
    return game;
  }
  if (action === 'back') return kidsPreviousStep(game) ?? game;
  if (action === 'skip-countdown') {
    if (!kidsCanSkipCountdown(game)) return game;
    return { ...game, phase: 'locked', remainingMs: 0, deadline: null,
      voiceSeq: (game.voiceSeq ?? 0) + 1, voicePlaying: false, voiceCue: null };
  }
  if (action === 'jump-final') {
    if (!kidsCanJumpToFinal(game)) return game;
    return { ...game, index: game.rounds.length - 1, phase: 'superbluff', remainingMs: KIDS_ANSWER_MS, deadline: null,
      voiceSeq: (game.voiceSeq ?? 0) + 1, voicePlaying: false, voiceCue: null };
  }
  if (action === 'correct-last' || action === 'participated-last' || action === 'none-last') {
    const index = kidsLastScoredIndex(game), result = action.slice(0, -5) as KidsResult;
    if (index < 0 || game.results[index] === result) return game;
    const results = [...game.results]; results[index] = result;
    return { ...game, results, voiceSeq: (game.voiceSeq ?? 0) + 1, voicePlaying: false, voiceCue: null };
  }
  if (action.startsWith('interjection:')) {
    const clip = professorInterjectionForRound(action.slice('interjection:'.length), game.index);
    if (!clip) return game;
    return { ...game, voiceSeq: (game.voiceSeq ?? 0) + 1, voicePlaying: true, voiceCue: `${phase}:${game.index}`, voiceKind: 'interjection', voiceClip: clip.id };
  }
  if (action === 'speak' && !['scene','returning','judging'].includes(phase)) return { ...game, voiceSeq: (game.voiceSeq ?? 0) + 1, voicePlaying: true, voiceCue: `${phase}:${game.index}`, voiceKind:'quote' };
  if (action === 'read-question' && phase === 'reading') return { ...game, voiceSeq: (game.voiceSeq ?? 0) + 1, voicePlaying: true, voiceCue: `${phase}:${game.index}`, voiceKind:'question' };
  if (action === 'read-answers' && phase === 'reading') return { ...game, voiceSeq: (game.voiceSeq ?? 0) + 1, voicePlaying: true, voiceCue: `${phase}:${game.index}`, voiceKind:'answers', voiceClip: null };
  if (action === 'stop-speech') return { ...game, voiceSeq: (game.voiceSeq ?? 0) + 1, voicePlaying: false, voiceCue: null };
  if (action === 'finish' && phase !== 'finished') return { ...game, phase: 'finished', remainingMs: 0, deadline: null };
  if (phase === 'scene' && (action === 'end-scene' || (action === 'tick' && now >= (game.deadline ?? now)))) return { ...game, phase: 'reading', deadline: null };
  if (action === 'next') {
    if (phase === 'welcome') return { ...game, phase: 'chapter' };
    if (phase === 'chapter' || phase === 'superbluff') return { ...game, phase: 'reading' };
    if (phase === 'revealed') {
      if (game.index === 9) return updateKidsGame(game, 'finish', now);
      const index = game.index + 1;
      return { ...game, index, phase: index === 9 ? 'superbluff' : index % 3 === 0 ? 'chapter' : 'reading', remainingMs: KIDS_ANSWER_MS, deadline: null };
    }
  }
  // Den Start der Antwortzeit kündigt der Professor am Beamer gleich selbst an.
  if (action === 'start' && phase === 'reading') return { ...game, phase: 'moving', deadline: now + KIDS_ANSWER_MS,
    voiceSeq: (game.voiceSeq ?? 0) + 1, voicePlaying: true, voiceCue: `moving:${game.index}`, voiceKind: 'interjection', voiceClip: 'signal-go' };
  if ((action === 'tick' || action === 'pause') && phase === 'moving') {
    const remainingMs = Math.max(0, (game.deadline ?? now) - now);
    if (remainingMs === 0) return { ...game, phase: 'locked', remainingMs: 0, deadline: null };
    return { ...game, remainingMs, ...(action === 'pause' ? { phase: 'paused' as const, deadline: null, voicePlaying: false, voiceCue: null } : {}) };
  }
  if (action === 'resume' && phase === 'paused') return { ...game, phase: 'moving', deadline: now + game.remainingMs };
  if (action === 'return' && phase === 'locked') return { ...game, phase: 'returning' };
  if (action === 'ready' && phase === 'returning') return { ...game, phase: 'judging' };
  if (['correct', 'participated', 'none'].includes(action) && kidsCanScore(game)) {
    const results = [...game.results]; results[game.index] = action as KidsResult;
    return { ...game, results, phase: 'revealed' };
  }
  if (action === 'scene' && phase === 'reading' && game.rounds[game.index].question.scene) return { ...game, phase: 'scene', deadline: now + KIDS_SCENE_MS, cueSeq: game.cueSeq + 1 };
  return game;
}
/** Nach dem Neuladen wartet die Show auf die Spielleitung: Der Countdown steht, eine Szene ist vorbei, der Professor schweigt. */
export function kidsResumeGame(game: KidsGame, now: number): KidsGame {
  const waiting = game.phase === 'moving' ? updateKidsGame(game, 'pause', now) : game.phase === 'scene' ? { ...game, phase: 'reading' as const, deadline: null } : game;
  return { ...waiting, voicePlaying: false, voiceCue: null,
    ...(game.introVideo ? { introVideo: { ...game.introVideo, playing: false, positionMs: kidsIntroPosition(game.introVideo, now), startedAt: null } } : {}) };
}
export function kidsPrimaryAction(game: Pick<KidsGame, 'phase'>): Exclude<KidsAction, 'tick'> | null {
  return ({ welcome: 'next', chapter: 'next', superbluff: 'next', reading: 'start', scene: 'end-scene', paused: 'resume', locked: 'return', returning: 'ready', revealed: 'next' } as Partial<Record<KidsPhase, Exclude<KidsAction, 'tick'>>>)[game.phase] ?? null;
}
export function kidsActionLabel(game: KidsGame): string {
  if (game.phase === 'welcome') return 'Mission starten';
  if (game.phase === 'chapter') return 'Erste Aufgabe im Kapitel';
  if (game.phase === 'superbluff') return 'Gemeinsam ins Finale';
  if (game.phase === 'reading') return `${KIDS_SECONDS} Sekunden starten`;
  if (game.phase === 'scene') return 'Zur Frage';
  if (game.phase === 'paused') return 'Weiter geht’s';
  if (game.phase === 'locked') return 'Zurück in die Gruppen';
  if (game.phase === 'returning') return 'Alle sind zurück';
  if (game.index === 9) return 'Zum Abschluss';
  if (game.index === 8) return 'Zum Superbluff';
  return (game.index + 1) % 3 === 0 ? 'Nächstes Kapitel' : 'Nächste Aufgabe';
}
