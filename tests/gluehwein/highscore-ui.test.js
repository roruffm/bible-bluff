import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Highscores } from '../../src/client/gluehwein/highscores.js';

let nodes, fetchMock;
function element() {
  return { textContent: '', value: '', hidden: false, disabled: false, children: [],
    addEventListener() {}, focus() {}, classList: { add() {} },
    append(child) { this.children.push(child); }, replaceChildren() { this.children = []; } };
}
beforeEach(() => {
  nodes = new Map(); fetchMock = vi.fn();
  vi.stubGlobal('document', { getElementById(id) { if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id); }, createElement: element });
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());
const reply = data => Promise.resolve({ ok: true, json: async () => data });

describe('Highscore-Eingabe', () => {
  it('veröffentlicht freiwillig, zeigt Fehler und erlaubt erneutes Senden', async () => {
    fetchMock.mockImplementationOnce(() => reply({ id: 'round', token: 'secret', seed: 12 }));
    const ui = new Highscores();
    expect(await ui.beginRound()).toBe(12);
    ui.finishRound({ score: 35, history: [.02, ['r']] });
    expect(fetchMock).toHaveBeenCalledTimes(1); // Finishing does not submit.
    expect(nodes.get('highscore-form').hidden).toBe(false);
    nodes.get('highscore-name').value = 'Anne';
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    await ui.submit();
    expect(nodes.get('highscore-status').textContent).toMatch(/Keine Verbindung/);
    expect(nodes.get('highscore-save').disabled).toBe(false);
    expect(nodes.get('highscore-form').hidden).toBe(false);
    fetchMock.mockImplementationOnce(() => reply({ entry: { id: 'round', name: 'Anne', score: 35 }, rank: 2, entries: [{ id: 'round', name: 'Anne', score: 35 }] }));
    await ui.submit();
    expect(nodes.get('highscore-status').textContent).toMatch(/Platz 2 mit 35 Punkten/);
    expect(nodes.get('highscore-form').hidden).toBe(true);
    const payload = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(payload).toMatchObject({ name: 'Anne', runId: 'round', token: 'secret' });
    expect(payload).not.toHaveProperty('score');
    expect(localStorage.setItem).toHaveBeenCalledWith('gluehwein-slide-name', 'Anne');
  });
  it('lässt offline spielen und zeigt bei null Punkten kein Eingabeformular', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    const ui = new Highscores();
    expect(await ui.beginRound()).toBeUndefined();
    ui.finishRound({ score: 35, history: [] });
    expect(nodes.get('highscore-status').textContent).toMatch(/Ohne Verbindung gespielt/);
    expect(nodes.get('highscore-form').hidden).toBe(true);
    fetchMock.mockImplementationOnce(() => reply({ id: 'new', token: 'secret', seed: 12 }));
    await ui.beginRound(); ui.finishRound({ score: 0, history: [] });
    expect(nodes.get('highscore-form').hidden).toBe(true);
    expect(nodes.get('highscore-status').textContent).toMatch(/Sammle Punkte/);
  });
  it('kann nach Ladefehler neu laden und rendert Namen als Text', async () => {
    const ui = new Highscores();
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    await ui.load();
    expect(nodes.get('leaderboard-status').textContent).toMatch(/Keine Verbindung/);
    expect(nodes.get('leaderboard-refresh').disabled).toBe(false);
    fetchMock.mockImplementationOnce(() => reply({ entries: [{ id: 'a', name: '<script>', score: 123 }] }));
    await ui.load();
    expect(nodes.get('leaderboard-table').hidden).toBe(false);
    expect(nodes.get('leaderboard-list').children[0].children[1].textContent).toBe('<script>');
    expect(nodes.get('leaderboard-list').children[0].children[1]).not.toHaveProperty('innerHTML');
  });
});
