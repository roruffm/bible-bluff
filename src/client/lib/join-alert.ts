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

/** Browser spielen Töne erst nach einer Berührung ab – darum bei jeder Berührung freischalten */
function unlockAudio() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audio ??= new Ctx();
    if (audio.state !== 'running') void audio.resume();
  } catch {
    // ohne Ton geht es auch
  }
}

function chime() {
  if (!audio || audio.state !== 'running') return;
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
  const vibrated = typeof navigator.vibrate === 'function' && navigator.vibrate([120, 80, 120]);
  if (!vibrated) chime();
}

/** Für die Leitung: meldet neue Mitspielende, solange der Raum öffentlich ist */
export function useJoinAlert(view: RoomView, onJoin: (message: string) => void) {
  const isHost = Boolean(view.me?.isHost);
  const known = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!isHost) return;
    document.addEventListener('pointerdown', unlockAudio);
    return () => document.removeEventListener('pointerdown', unlockAudio);
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
