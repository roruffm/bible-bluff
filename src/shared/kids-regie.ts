import type { KidsAction, KidsGame } from './kids-game';
import { professorInterjectionForRound, type ProfessorInterjectionId } from './professor-interjections';

export const KIDS_REGIE_IDS = ['welcome', 'chapter', 'call', 'parents', 'invite', 'scene', 'question', 'answers', 'countdown', 'check', 'recall', 'back', 'result', 'announce', 'next', 'closing'] as const;
export type KidsRegieId = typeof KIDS_REGIE_IDS[number];
export type KidsRegieStatus = 'open' | 'done' | 'skipped';
export interface KidsRegieRound { index: number; steps: Partial<Record<KidsRegieId, KidsRegieStatus>>; selected?: KidsRegieId }
export interface KidsRegieProgress { rounds: KidsRegieRound[] }
export type KidsRegieAction = `regie:${'select' | 'skip' | 'do'}:${KidsRegieId}`;
export interface KidsRegieStep { id: KidsRegieId; short: string; title: string; description: string; label: string; action?: KidsAction; audio?: boolean; scene?: boolean; optional?: boolean }
const CLOSING = ['locked', 'returning', 'judging', 'revealed'];

export function kidsRegieAction(value: unknown): { kind: 'select' | 'skip' | 'do'; id: KidsRegieId } | null {
  const m = typeof value === 'string' ? /^regie:(select|skip|do):([a-z]+)$/.exec(value) : null;
  return m && KIDS_REGIE_IDS.includes(m[2] as KidsRegieId) ? { kind: m[1] as 'select' | 'skip' | 'do', id: m[2] as KidsRegieId } : null;
}
export function parseKidsRegie(value: unknown): KidsRegieProgress | null {
  if (!value || typeof value !== 'object' || !('rounds' in value) || !Array.isArray(value.rounds) || value.rounds.length > 10) return null;
  const rounds: KidsRegieRound[] = [];
  for (const raw of value.rounds) {
    if (!raw || typeof raw !== 'object' || !Number.isInteger(raw.index) || raw.index < 0 || raw.index > 9 || rounds.some(r => r.index === raw.index) || !raw.steps || typeof raw.steps !== 'object' || Array.isArray(raw.steps)) return null;
    const steps: KidsRegieRound['steps'] = {};
    for (const [id, status] of Object.entries(raw.steps)) {
      if (!KIDS_REGIE_IDS.includes(id as KidsRegieId) || !['open', 'done', 'skipped'].includes(status as string)) return null;
      steps[id as KidsRegieId] = status as KidsRegieStatus;
    }
    if (raw.selected !== undefined && !KIDS_REGIE_IDS.includes(raw.selected)) return null;
    rounds.push({ index: raw.index, steps, ...(raw.selected ? { selected: raw.selected } : {}) });
  }
  return { rounds };
}
const roundState = (game: KidsGame) => game.regie?.rounds.find(r => r.index === game.index);
function write(game: KidsGame, id: KidsRegieId, status?: KidsRegieStatus, selected?: KidsRegieId): KidsGame {
  const old = roundState(game) ?? { index: game.index, steps: {} };
  const round = { ...old, steps: { ...old.steps, ...(status ? { [id]: status } : {}) }, selected };
  return { ...game, regie: { rounds: [...(game.regie?.rounds.filter(r => r.index !== game.index) ?? []), round].sort((a, b) => a.index - b.index) } };
}
function prep(game: KidsGame): KidsRegieStep[] {
  const question = game.rounds[game.index].question;
  const group = `call-${question.group}` as ProfessorInterjectionId;
  return [
    { id: 'call', short: 'Aufruf', title: game.index === 9 ? 'Alle Teams aufrufen' : 'Die Gruppe aufrufen', description: 'Das Team kommt nach vorne.', label: professorInterjectionForRound(group, game.index)!.label, action: `interjection:${group}`, audio: true, optional: true },
    ...(game.index === 9 ? [{ id: 'parents', short: 'Eltern', title: 'Die Eltern-Pantomime erklären', description: 'Die Eltern machen sich für das Finale bereit.', label: 'Eltern-Pantomime erklären', action: 'interjection:finale-parents', audio: true, optional: true } as KidsRegieStep] : []),
    ...(question.group === 'minis' && question.scene ? [{ id: 'invite', short: 'Ansage', title: 'Die Szene ankündigen', description: 'Alle schauen zum Beamer.', label: 'Seht euch die Szene an', action: 'interjection:scene-invite', audio: true, optional: true } as KidsRegieStep] : []),
    ...(question.scene ? [{ id: 'scene', short: 'Szene', title: 'Die Szene zeigen', description: 'Die Kinder schauen die Szene gemeinsam an.', label: 'Szene am Beamer abspielen', action: 'scene', scene: true, optional: true } as KidsRegieStep] : []),
    { id: 'question', short: 'Frage', title: 'Die Frage vorlesen', description: question.prompt, label: 'Frage vorlesen', action: 'read-question', audio: true, optional: true },
    { id: 'answers', short: 'Antworten', title: 'Die Antworten vorlesen', description: 'Alle drei Antwortmöglichkeiten anhören.', label: 'Antworten vorlesen', action: 'read-answers', audio: true, optional: true },
    { id: 'countdown', short: 'Countdown', title: 'Die Antwortzeit starten', description: 'Die Kinder gehen zu ihrem Antwortfeld.', label: '30 Sekunden starten', action: 'start', optional: true },
  ];
}
export function kidsRegieSteps(game: KidsGame): KidsRegieStep[] {
  if (game.phase === 'welcome') return [
    { id: 'welcome', short: 'Begrüßung', title: 'Die Kinder begrüßen', description: 'Die Show beginnt gemeinsam.', label: 'Begrüßung am Beamer abspielen', action: 'speak', audio: true, optional: true },
    { id: 'chapter', short: 'Start', title: 'Die Mission starten', description: 'Antwortfelder, Helfer und Ton sind bereit.', label: 'Mission starten', action: 'next' },
  ];
  if (game.phase === 'chapter' || game.phase === 'superbluff') return [
    ...prep(game).filter(s => s.id === 'call' || s.id === 'parents'),
    { id: 'chapter', short: 'Aufgabe', title: game.index === 9 ? 'Gemeinsam ins Finale' : 'Die erste Aufgabe öffnen', description: 'Die nächste Aufgabe erscheint am Beamer.', label: game.index === 9 ? 'Gemeinsam ins Finale' : 'Erste Aufgabe im Kapitel', action: 'next' },
  ];
  if (['reading', 'scene', 'moving', 'paused'].includes(game.phase)) return prep(game);
  if (CLOSING.includes(game.phase)) return [
    { id: 'check', short: 'Prüfen', title: 'Die Felder prüfen lassen', description: 'Die Helfer zählen die Kinder. Noch nicht auflösen.', label: 'Helfer sind fertig' },
    { id: 'recall', short: 'Rückruf', title: 'Die Kinder zurückholen', description: 'Erst nach dem Zählen zurück zur Gruppe.', label: 'Zurück zur Gruppe', action: game.phase === 'locked' ? 'return' : 'interjection:return', audio: true, optional: true },
    { id: 'back', short: 'Zurück', title: 'Sind alle wieder da?', description: 'Kurz prüfen, ob alle bei ihrer Gruppe sind.', label: 'Alle sind zurück', action: 'ready' },
    { id: 'result', short: 'Ergebnis', title: 'Das Ergebnis eintragen', description: 'Wie hat die Gruppe abgeschnitten?', label: 'Ergebnis eintragen' },
    { id: 'announce', short: 'Ansage', title: 'Die Auflösung ansagen', description: 'Das eingetragene Ergebnis wird angesagt.', label: professorInterjectionForRound(`result-${game.results[game.index] ?? 'none'}`, game.index)!.label, action: `interjection:${professorInterjectionForRound(`result-${game.results[game.index] ?? 'none'}`, game.index)!.id}`, audio: true, optional: true },
  ];
  return [{ id: 'closing', short: 'Abschluss', title: 'Gemeinsam seid ihr stark!', description: 'Feiert alle Kinder. Der Endpunktestand bleibt am Beamer sichtbar.', label: 'Bei Jesus sind wir willkommen', action: 'interjection:closing-jesus', audio: true, optional: true }];
}
export function kidsRegieStatus(game: KidsGame, id: KidsRegieId): KidsRegieStatus {
  const stored = roundState(game)?.steps[id];
  if (stored) return stored;
  if (id === 'result' && game.results[game.index] !== null) return 'done';
  // Alte Spielstände haben keine Audiohistorie: verlassene Schritte werden nicht als abgespielt ausgegeben.
  if ((['moving', 'paused', ...CLOSING, 'finished'].includes(game.phase) && prep(game).some(s => s.id === id)) || (['returning', 'judging', 'revealed'].includes(game.phase) && id === 'check') || (['judging', 'revealed'].includes(game.phase) && ['recall', 'back'].includes(id))) return 'skipped';
  return 'open';
}
export function kidsRegieCanUse(game: KidsGame, id: KidsRegieId): boolean {
  if (game.introVideo) return false;
  if (game.phase === 'welcome') return ['welcome', 'chapter'].includes(id);
  if (game.phase === 'chapter' || game.phase === 'superbluff') return ['call', 'parents', 'chapter'].includes(id) && kidsRegieSteps(game).some(s => s.id === id);
  if (game.phase === 'reading') return prep(game).some(s => s.id === id);
  if (game.phase === 'scene') return id === 'scene';
  if (game.phase === 'locked') return id === 'check' || id === 'recall';
  if (game.phase === 'returning') return id === 'recall' || id === 'back';
  if (game.phase === 'judging') return id === 'result';
  if (game.phase === 'revealed') return id === 'announce' || id === 'next';
  return game.phase === 'finished' && id === 'closing';
}
export function kidsRegieCurrent(game: KidsGame): KidsRegieStep {
  const steps = kidsRegieSteps(game), selected = roundState(game)?.selected;
  const usable = steps.filter(s => kidsRegieCanUse(game, s.id));
  if (selected && usable.some(s => s.id === selected)) return usable.find(s => s.id === selected)!;
  if (game.phase === 'welcome') return steps.find(s => s.id === 'chapter')!;
  if (game.phase === 'scene' || game.phase === 'moving' || game.phase === 'paused') return steps.find(s => s.id === (game.phase === 'scene' ? 'scene' : 'countdown'))!;
  return usable.find(s => kidsRegieStatus(game, s.id) === 'open') ?? (game.phase === 'revealed' ? { id: 'next', short: 'Weiter', title: game.index === 9 ? 'Die Show abschließen' : 'Bereit für die nächste Aufgabe', description: 'Die Runde ist abgeschlossen.', label: game.index === 9 ? 'Zum Abschluss' : game.index === 8 ? 'Zum Superbluff' : (game.index + 1) % 3 === 0 ? 'Nächstes Kapitel' : 'Nächste Aufgabe', action: 'next' } : usable.at(-1) ?? steps[0]);
}
export function applyKidsRegieAction(game: KidsGame, action: KidsRegieAction, apply: (game: KidsGame, action: KidsAction) => KidsGame): KidsGame {
  const command = kidsRegieAction(action);
  if (!command || !kidsRegieCanUse(game, command.id)) return game;
  if (command.id === 'next') return command.kind === 'do' ? apply(game, 'next') : game;
  const step = kidsRegieSteps(game).find(s => s.id === command.id);
  if (!step) return game;
  if (command.kind === 'select') return roundState(game)?.selected === step.id ? game : write(game, step.id, undefined, step.id);
  if (command.kind === 'skip') {
    if (!step.optional || game.phase === 'scene') return game;
    const stopped = game.voicePlaying ? apply(game, 'stop-speech') : game;
    const advanced = step.id === 'countdown' ? apply(stopped, 'skip-countdown') : step.id === 'recall' && game.phase === 'locked' ? apply(stopped, 'return') : stopped;
    return write(advanced, step.id, kidsRegieStatus(game, step.id) === 'done' ? 'done' : 'skipped');
  }
  if (step.id === 'check') return write(game, step.id, 'done');
  if (!step.action) return game;
  let prepared = game;
  for (const earlier of kidsRegieSteps(game)) {
    if (earlier.id === step.id) break;
    if (earlier.optional && kidsRegieStatus(prepared, earlier.id) === 'open') prepared = write(prepared, earlier.id, 'skipped');
  }
  const next = apply(prepared, step.action);
  // Rückweg und Ansage starten mit einem Tastendruck, weitere Ansagen ausschließlich manuell.
  return step.id === 'recall' && game.phase === 'locked' && next !== game ? apply(next, 'interjection:return') : next;
}
function audioStep(game: KidsGame): KidsRegieId | null {
  if (game.voiceKind === 'question') return 'question';
  if (game.voiceKind === 'answers') return 'answers';
  if (game.voiceKind === 'quote') return game.phase === 'welcome' ? 'welcome' : null;
  if (game.voiceClip === `call-${game.rounds[game.index].question.group}`) return 'call';
  if (game.voiceClip === 'scene-invite' && game.rounds[game.index].question.group === 'minis' && game.rounds[game.index].question.scene) return 'invite';
  if (game.voiceClip === 'finale-parents' && game.index === 9) return 'parents';
  if (game.voiceClip === 'return' && game.phase === 'returning') return 'recall';
  if (game.voiceClip === 'closing-jesus') return 'closing';
  if (game.phase === 'revealed' && game.voiceClip === professorInterjectionForRound(`result-${game.results[game.index]}`, game.index)?.id) return 'announce';
  return null;
}
export function kidsRegieAfterAction(before: KidsGame, after: KidsGame, action: KidsAction): KidsGame {
  let next = after;
  if (before.index !== after.index) return next;
  const interrupted = audioStep(before);
  if (before.phase !== after.phase && before.voicePlaying && interrupted && kidsRegieStatus(before, interrupted) === 'open') next = write(next, interrupted, 'skipped');
  const audio = audioStep(after);
  if (after.voicePlaying && before.voiceSeq !== after.voiceSeq && audio) next = write(next, audio, roundState(before)?.steps[audio] ?? 'open', audio);
  if (action.startsWith('voice-status:') && after.voiceStatus?.state === 'ended' && before.voiceStatus?.sequence === before.voiceSeq && before.voiceStatus?.state === 'playing' && audio) next = write(next, audio, 'done');
  if (action === 'scene' && after.phase === 'scene') next = write(next, 'scene', 'open', 'scene');
  if (before.phase === 'scene' && action === 'tick' && after.phase === 'reading') next = write(next, 'scene', 'done');
  if (before.phase === 'scene' && action === 'end-scene') next = write(next, 'scene', 'skipped');
  if (action === 'start' && after.phase === 'moving') next = write(next, 'countdown', 'done');
  if (action === 'skip-countdown') next = write(next, 'countdown', 'skipped');
  if (action === 'return' && after.phase === 'returning') next = write(next, 'recall', 'open');
  if (action === 'ready' && after.phase === 'judging') next = write(next, 'back', 'done');
  if (['correct', 'participated', 'none'].includes(action) && after.phase === 'revealed') next = write(next, 'result', 'done');
  if (['correct-last', 'participated-last', 'none-last'].includes(action) && after.phase === 'revealed' && before.results[before.index] !== after.results[after.index]) next = write(next, 'announce', 'open', 'announce');
  if (action === 'back') {
    const id: KidsRegieId = after.phase === 'judging' ? 'result' : after.phase === 'returning' ? 'back' : after.phase === 'locked' ? 'recall' : 'countdown';
    next = write(next, id, 'open', id);
    if (after.phase === 'judging') next = write(next, 'announce', 'open', 'result');
  }
  return next;
}
