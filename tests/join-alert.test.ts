import { describe, expect, it } from 'vitest';
import { joinMessage, newcomers } from '../src/client/lib/join-alert';

describe('Bescheid für die Leitung', () => {
  const players = [
    { id: 'host', name: 'Rahel' },
    { id: 'a', name: 'Jonas' },
    { id: 'b', name: 'Hanna' },
  ];

  it('meldet nur wirklich Neue – nicht beim ersten Stand und nie sich selbst', () => {
    expect(newcomers(null, players, 'host')).toEqual([]);
    expect(newcomers(new Set(['host', 'a']), players, 'host')).toEqual(['Hanna']);
    expect(newcomers(new Set(['a', 'b']), players, 'host')).toEqual([]);
    expect(newcomers(new Set(['host', 'a', 'b']), players, 'host')).toEqual([]);
  });

  it('formuliert die Meldung für eine oder mehrere Personen', () => {
    expect(joinMessage(['Hanna'])).toBe('Hanna ist beigetreten');
    expect(joinMessage(['Hanna', 'Lea'])).toBe('Hanna und Lea sind beigetreten');
    expect(joinMessage(['Hanna', 'Lea', 'Tim'])).toBe('Hanna, Lea und Tim sind beigetreten');
  });
});
