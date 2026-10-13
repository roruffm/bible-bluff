import type { TopicPackId } from './types';

/** Nur die Auswahltexte sind öffentlich; die enthaltenen Fragen bleiben auf dem Server. */
export const TOPIC_PACKS: { id: TopicPackId; label: string; hint: string }[] = [
  { id: 'kaum', label: 'Kaum zu glauben', hint: 'Schräge Details und überraschende Wendungen.' },
  { id: 'tiere', label: 'Tiere der Bibel', hint: 'Von sprechenden Eseln bis zu gefräßigen Fischen.' },
  { id: 'essen', label: 'Essen und Wunder', hint: 'Brot, Wein und erstaunliche Mahlzeiten.' },
  { id: 'neulinge', label: 'Für Bibelneulinge', hint: 'Leichte Fragen, große Geschichten. Einfach mitraten!' },
];
