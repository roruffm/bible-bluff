// Bescheid für die Leitung eines öffentlichen Raums, wenn jemand Neues beitritt:
// kurz vibrieren (Android) oder – wo Webseiten nicht vibrieren dürfen, etwa auf dem iPhone –
// ein leiser Zweiklang. Funktioniert nur, solange der Raum auf dem Handy offen ist.

import { useEffect, useRef } from 'preact/hooks';
import type { RoomView } from '../../shared/types';

/** Namen der Personen, die seit dem letzten Stand neu sind (ohne mich); beim ersten Stand keine */
export function newcomers(known: ReadonlySet<string> | null, players: { id: string; name: string }[], meId: string | null): string[] {
  if (!known) return [];
  return players.filter((p) => p.id !== meId && !known.has(p.id)).map((p) => p.name);
}

export function joinMessage(names: string[]): string {
  if (names.length === 1) return `${names[0]} ist beigetreten`;
  return `${names.slice(0, -1).join(', ')} und ${names[names.length - 1]} sind beigetreten`;
}

let audio: AudioContext | null = null;

/**
 * Browser spielen Töne erst ab, wenn die Person getippt hat – und zwar erst beim Loslassen des
 * Fingers (pointerup/touchend/click), nicht schon beim Aufsetzen. Darum bei jedem dieser
 * Ereignisse freischalten; nach dem Zurückkehren in den Raum braucht iOS das erneut.
 */
const UNLOCK_EVENTS = ['pointerup', 'touchend', 'click', 'keydown'] as const;

function unlockAudio() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audio ??= new Ctx();
    if (audio.state === 'running') return;
    void audio.resume();
    // Ein stiller Ton innerhalb der Berührung schaltet iOS endgültig frei
    const silent = audio.createBufferSource();
    silent.buffer = audio.createBuffer(1, 1, 22050);
    silent.connect(audio.destination);
    silent.start(0);
  } catch {
    // ohne Ton geht es auch
  }
}

function chime() {
  if (!audio) return;
  if (audio.state !== 'running') {
    // Klappt nur, wenn schon einmal getippt wurde – sonst bleibt es still
    void audio.resume().then(() => audio?.state === 'running' && chime(), () => {});
    return;
  }
  const start = audio.currentTime;
  [660, 880].forEach((freq, i) => {
    const t = start + i * 0.14;
    const osc = audio!.createOscillator();
    const gain = audio!.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(gain).connect(audio!.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

function signal() {
  const vibrated = typeof navigator.vibrate === 'function' && navigator.vibrate([200, 100, 200]);
  if (!vibrated) chime();
}

/** Für die Leitung: meldet neue Mitspielende, solange der Raum öffentlich ist */
export function useJoinAlert(view: RoomView, onJoin: (message: string) => void) {
  const isHost = Boolean(view.me?.isHost);
  const known = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!isHost) return;
    for (const type of UNLOCK_EVENTS) document.addEventListener(type, unlockAudio, { capture: true, passive: true });
    return () => {
      for (const type of UNLOCK_EVENTS) document.removeEventListener(type, unlockAudio, { capture: true });
    };
  }, [isHost]);

  const ids = view.players.map((p) => p.id).join(',');
  useEffect(() => {
    // Immer mitzählen, damit beim Einschalten nicht alle schon Anwesenden gemeldet werden
    const names = newcomers(known.current, view.players, view.me?.id ?? null);
    known.current = new Set(view.players.map((p) => p.id));
    if (!isHost || !view.listed || names.length === 0) return;
    signal();
    onJoin(joinMessage(names));
  }, [ids]);
}
