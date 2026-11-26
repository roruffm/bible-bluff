const $ = id => document.getElementById(id);
const NAME_KEY = 'gluehwein-slide-name';
const OFFLINE = 'Ohne Verbindung gespielt. Dein Rekord bleibt auf diesem Gerät. Versuche es für die Rangliste in der nächsten Runde noch einmal.';

async function request(path, data) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch('/api/gluehwein/' + path, {
      ...(data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
      signal: controller.signal,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || 'Die Rangliste ist gerade nicht erreichbar.');
    return result;
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof TypeError) throw new Error('Keine Verbindung zur Rangliste. Bitte versuche es erneut.');
    throw error;
  } finally { clearTimeout(timeout); }
}

export class Highscores {
  constructor() {
    this.run = null;
    this.round = null;
    this.busy = false;
    this.loading = 0;
    try { $('highscore-name').value = localStorage.getItem(NAME_KEY) || ''; } catch {}
    $('highscore-form').addEventListener('submit', event => { event.preventDefault(); this.submit(); });
    $('leaderboard-refresh').addEventListener('click', () => this.load());
  }

  async beginRound() {
    this.round = null; this.run = null;
    $('highscore-entry').hidden = true;
    $('highscore-form').hidden = false;
    $('highscore-status').textContent = '';
    $('highscore-save').disabled = false;
    try { this.run = await request('runs', { rulesVersion: 2 }); return this.run.seed; } catch { return undefined; }
  }

  finishRound({ score, history }) {
    // Copy before another game can reset the engine. Nothing is published here.
    this.round = this.run ? { ...this.run, history: history.slice() } : null;
    $('highscore-entry').hidden = false;
    $('highscore-form').hidden = !this.round || score <= 0;
    $('highscore-status').textContent = score <= 0 ? 'Sammle Punkte und sichere dir einen Platz in der Rangliste!' : this.round ? '' : OFFLINE;
  }

  async submit() {
    if (this.busy || !this.round) return;
    const round = this.round, name = $('highscore-name').value.trim();
    if ([...name].length < 2) { $('highscore-status').textContent = 'Bitte gib einen Spitznamen mit mindestens 2 Zeichen ein.'; $('highscore-name').focus(); return; }
    this.busy = true;
    $('highscore-save').disabled = true;
    $('highscore-save').textContent = 'Wird eingetragen …';
    $('highscore-status').textContent = '';
    try {
      const result = await request('highscores', { runId: round.id, token: round.token, name, history: round.history });
      try { localStorage.setItem(NAME_KEY, result.entry.name); } catch {}
      if (this.round !== round) return;
      this.ownId = result.entry.id;
      $('highscore-form').hidden = true;
      $('highscore-status').textContent = `Geschafft, ${result.entry.name}! Platz ${result.rank} mit ${result.entry.score} Punkten.`;
      this.render(result.entries);
    } catch (error) {
      if (this.round === round) $('highscore-status').textContent = error.message;
    } finally {
      this.busy = false;
      $('highscore-save').disabled = false;
      $('highscore-save').textContent = 'Eintragen';
    }
  }

  render(entries) {
    const list = $('leaderboard-list'); list.replaceChildren();
    $('leaderboard-table').hidden = entries.length === 0;
    $('leaderboard-status').textContent = entries.length ? '' : 'Hier ist noch Platz für deinen ersten Rekord. Spiel eine Runde!';
    entries.forEach((entry, index) => {
      const row = document.createElement('tr');
      if (entry.id === this.ownId) row.classList.add('your-score');
      for (const text of [String(index + 1).padStart(2, '0'), entry.name, String(entry.score)]) {
        const cell = document.createElement('td'); cell.textContent = text; row.append(cell);
      }
      list.append(row);
    });
  }

  async load() {
    const ticket = ++this.loading;
    $('leaderboard-status').textContent = 'Rangliste wird geladen …';
    $('leaderboard-table').hidden = true;
    $('leaderboard-refresh').disabled = true;
    try {
      const result = await request('highscores');
      if (ticket === this.loading) this.render(result.entries);
    } catch (error) {
      if (ticket === this.loading) $('leaderboard-status').textContent = error.message;
    } finally { if (ticket === this.loading) $('leaderboard-refresh').disabled = false; }
  }
}
