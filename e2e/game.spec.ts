import { type Browser, type Page, expect, test } from '@playwright/test';
import { SAFE_BLUFFS } from './bluffs';

async function phone(browser: Browser, name: string): Promise<Page> {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', (err) => {
    throw new Error(`${name}: ${err.message}`);
  });
  return page;
}

async function createRoom(page: Page, name: string, plays = true): Promise<string> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Raum eröffnen' }).click();
  await page.getByLabel('Dein Spitzname').fill(name);
  if (!plays) await page.getByText('Ich spiele mit').click();
  await page.getByRole('radiogroup', { name: 'Runden' }).getByRole('radio', { name: '4', exact: true }).click();
  await page.getByRole('button', { name: 'Raum eröffnen' }).click();
  await page.waitForURL(/\/r\/[A-Z]+\d+$/);
  return page.url().split('/r/')[1];
}

async function join(page: Page, code: string, name: string) {
  await page.goto(`/r/${code}`);
  await page.getByLabel('Dein Spitzname').fill(name);
  await page.getByRole('button', { name: 'Beitreten' }).click();
  await expect(page.getByText('Gleich geht’s los')).toBeVisible();
}

/** Abstimmen – bei Lückentext-Runden mit eigener Überschrift */
const VOTE_TITLE = /Welche Antwort stimmt\?|Was gehört in die Lücke\?/;
/** Eingabefeld für den Bluff – bei Lückentext-Runden mit eigener Beschriftung */
const BLUFF_FIELD = /Deine erfundene Antwort|Was gehört in die Lücke/;

async function hostAction(host: Page, label: string | RegExp) {
  await host.locator('.topbar-menu').click();
  await host.locator('.sheet').getByRole('button', { name: label }).click();
  await expect(host.locator('.sheet')).toHaveCount(0);
}

test('eine komplette Partie auf drei Handys und der Leinwand', async ({ browser }) => {
  const host = await phone(browser, 'host');
  const code = await createRoom(host, 'Rahel');
  await expect(host.locator('.room-code')).toHaveText(code);
  await expect(host.locator('svg.qr')).toBeVisible();

  const jonas = await phone(browser, 'jonas');
  const mirjam = await phone(browser, 'mirjam');
  await join(jonas, code, 'Jonas');
  await join(mirjam, code, 'Mirjam');
  // Neues für alle: Die Lobby zeigt, wie viele Fragen hier noch niemand kennt
  await expect(host.locator('.fresh-note')).toContainText('Für alle neu');

  const tvContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const tv = await tvContext.newPage();
  await tv.goto(`/tv/${code}`);
  await expect(tv.locator('.player')).toHaveCount(3);

  await host.getByRole('button', { name: 'Partie starten' }).click();
  for (const p of [host, jonas, mirjam, tv]) await expect(p.getByText('Runde 1 von 4')).toBeVisible();

  // Bluffs schreiben – Jonas lässt sich einen Vorschlag geben
  await host.getByLabel('Deine erfundene Antwort').fill(SAFE_BLUFFS.host);
  await host.getByRole('button', { name: 'Bluff abgeben' }).click();
  await expect(host.getByText('Dein Bluff ist drin')).toBeVisible();
  await jonas.getByRole('button', { name: /Vorschlag/ }).click();
  await expect(jonas.getByLabel('Deine erfundene Antwort')).not.toHaveValue('');
  // Nur ein Vorschlag pro Runde: Der Knopf verschwindet
  await expect(jonas.getByRole('button', { name: /Vorschlag/ })).toHaveCount(0);
  await expect(jonas.getByText('Den Vorschlag für diese Runde hast du schon bekommen.')).toBeVisible();
  await jonas.getByRole('button', { name: 'Bluff abgeben' }).click();
  await expect(jonas.getByText('Dein Bluff ist drin')).toBeVisible();
  await mirjam.getByLabel('Deine erfundene Antwort').fill(SAFE_BLUFFS.mirjam);
  await mirjam.getByRole('button', { name: 'Bluff abgeben' }).click();

  // Abstimmung beginnt, sobald alle abgegeben haben
  for (const p of [host, jonas, mirjam]) await expect(p.getByText('Welche Antwort stimmt?')).toBeVisible();
  await expect(host.locator('.option.is-mine')).toHaveCount(1);
  await expect(host.locator('.option.is-mine')).toContainText(SAFE_BLUFFS.host);
  await expect(tv.locator('.option')).toHaveCount(await host.locator('.option').count());

  // Jonas und Mirjam fallen auf Rahels Bluff herein, Rahel wählt irgendeine andere Antwort
  await jonas.locator('.option', { hasText: SAFE_BLUFFS.host }).click();
  await mirjam.locator('.option', { hasText: SAFE_BLUFFS.host }).click();
  await host.locator('button.option:not([disabled])').first().click();

  // Aufdeckung – synchron auf allen Geräten
  for (const p of [host, jonas, tv]) await expect(p.getByText('Aufdeckung').first()).toBeVisible();
  await expect(jonas.locator('.reveal-text', { hasText: SAFE_BLUFFS.host })).toBeVisible({ timeout: 30_000 });
  await expect(jonas.getByText('Du bist darauf hereingefallen')).toBeVisible({ timeout: 10_000 });
  await expect(host.getByText(/Dein Bluff! 2 Personen reingelegt/)).toBeVisible({ timeout: 10_000 });
  await expect(tv.locator('.stamp-bluff')).toBeVisible();
  await expect(jonas.locator('.stamp-truth')).toBeVisible({ timeout: 30_000 });

  // Punkte und Entdeckung
  await expect(host.getByText('Punktestand')).toBeVisible({ timeout: 30_000 });
  await expect(host.locator('.merksatz')).toBeVisible();
  const row = (page: Page, name: string) =>
    page.locator('.score-row').filter({ has: page.locator('.score-name', { hasText: new RegExp(`^${name}$`) }) });
  const rahelRow = row(host, 'Rahel');
  await expect(rahelRow.locator('.score-total')).toHaveText(/^[2-4]$/);
  await expect(rahelRow.locator('.delta.is-bluff')).toHaveText('Bluff +2');

  // Lieblingsbluff: Jonas schenkt Rahels Bluff ein Herz, das bringt Rahel einen Extrapunkt
  await expect(host.locator('.fav.is-mine')).toContainText(SAFE_BLUFFS.host);
  await expect(host.locator('.fav.is-mine')).toBeDisabled();
  await jonas.locator('.fav', { hasText: SAFE_BLUFFS.host }).click();
  await expect(jonas.locator('.fav.is-liked')).toContainText(SAFE_BLUFFS.host);
  await expect(rahelRow.locator('.delta.is-favorite')).toHaveText('♥ +1');
  await expect(tv.locator('.fav.is-leading')).toContainText(SAFE_BLUFFS.host);

  // Spickzettel: nur die Leitung sieht Hintergrund, Gesprächsfrage und Querverweis
  await expect(host.locator('.talk-notes')).toContainText('Spickzettel für die Leitung');
  await expect(host.locator('.talk-notes dt').first()).toHaveText('Hintergrund');
  await expect(jonas.locator('.talk-notes')).toHaveCount(0);
  await expect(tv.locator('.talk-notes')).toHaveCount(0);

  // Liebe deinen Nächsten: Rahel schenkt Mirjam einen ihrer Punkte
  await host.getByRole('button', { name: /Liebe deinen Nächsten/ }).click();
  await host.locator('.gift-person', { hasText: 'Mirjam' }).click();
  await expect(host.locator('.gift.is-done')).toContainText('Du hast Mirjam einen Punkt geschenkt');
  await expect(row(host, 'Mirjam').locator('.delta.is-gift')).toHaveText('+1 von Rahel');
  await expect(rahelRow.locator('.delta.is-given')).toHaveText('−1 an Mirjam');
  await expect(mirjam.locator('.toast')).toContainText('Rahel hat dir einen Punkt geschenkt');

  // Restliche Runden zügig über die Spielleitung durchschalten
  await host.getByRole('button', { name: 'Nächste Runde' }).click();
  for (let round = 2; round <= 4; round++) {
    await expect(host.getByText(`Runde ${round} von 4`)).toBeVisible();
    if (round === 2) {
      // Ruhige Minute: Mirjam setzt diese Runde aus, um zu beten – niemand wartet auf sie
      await mirjam.getByRole('button', { name: 'Ruhige Minute' }).click();
      await expect(mirjam.getByRole('heading', { name: 'Zeit für ein Gebet' })).toBeVisible();
      await expect(tv.locator('.progress-person.is-quiet')).toHaveCount(1);
    }
    if (round === 3) await expect(mirjam.getByLabel(BLUFF_FIELD)).toBeVisible();
    await hostAction(host, 'Schreibzeit jetzt beenden');
    await expect(host.getByText(VOTE_TITLE)).toBeVisible();
    if (round === 2) await expect(mirjam.getByRole('heading', { name: 'Zeit für ein Gebet' })).toBeVisible();
    await hostAction(host, 'Abstimmung jetzt beenden');
    await hostAction(host, 'Aufdeckung überspringen');
    await expect(host.getByText('Punktestand')).toBeVisible();
    if (round === 2) await expect(row(host, 'Mirjam').locator('.delta.is-quiet')).toBeVisible();
    await host.getByRole('button', { name: round === 4 ? 'Zum Endstand' : 'Nächste Runde' }).click();
  }

  for (const p of [host, jonas, mirjam, tv]) await expect(p.getByRole('heading', { name: 'Endstand' })).toBeVisible();
  // Weitersagen: Mitspielende werden eingeladen, selbst eine Runde zu leiten – Leitung und Leinwand nicht
  await expect(jonas.getByRole('heading', { name: 'Leite selbst eine Runde' })).toBeVisible();
  await expect(jonas.getByRole('button', { name: 'Link an deine Gruppe schicken' })).toBeVisible();
  await expect(host.locator('.spread-card')).toHaveCount(0);
  await expect(tv.locator('.spread-card')).toHaveCount(0);
  await jonas.getByRole('button', { name: 'Eigenen Raum eröffnen' }).click();
  await jonas.waitForURL('**/neu');
  await expect(jonas.getByLabel('Dein Spitzname')).toHaveValue('Jonas');
  await jonas.goBack();
  await expect(jonas.getByRole('heading', { name: 'Endstand' })).toBeVisible();
  await expect(host.locator('.podium-place')).toHaveCount(3);
  await expect(host.locator('.discoveries li')).toHaveCount(4);
  await expect(host.getByText('Bluff-Meister')).toBeVisible();
  await expect(host.locator('.award-favorite')).toContainText(SAFE_BLUFFS.host);
  await expect(host.locator('.award-neighbor')).toContainText('Rahel');

  // Vom Spiel ins Gespräch: Die Leitung führt, alle Geräte gehen mit
  await host.getByRole('button', { name: 'Weiter ins Gespräch' }).click();
  for (const p of [host, jonas, mirjam, tv]) await expect(p.getByRole('heading', { name: 'Lesen' })).toBeVisible();
  await expect(tv.locator('.talk-step.is-current')).toContainText('Schlagt');
  await host.getByRole('button', { name: 'Weiter', exact: true }).click();
  for (const p of [jonas, tv]) await expect(p.getByRole('heading', { name: 'Entdecken' })).toBeVisible();
  await expect(tv.locator('.talk-extra')).toContainText('Zum Hintergrund');
  await host.getByRole('button', { name: 'Zurück zum Endstand' }).click();
  for (const p of [host, jonas, mirjam, tv]) await expect(p.getByRole('heading', { name: 'Endstand' })).toBeVisible();

  // Entdeckungen zum Mitnehmen: QR-Code auf der Leinwand, eigene Seite ohne Namen
  await expect(tv.locator('.recap-share svg.qr')).toBeVisible({ timeout: 10_000 });
  await mirjam.getByRole('button', { name: 'Ansehen' }).click();
  await mirjam.waitForURL(/\/e\/[a-z2-9]{10}$/);
  await expect(mirjam.getByRole('heading', { name: 'Unsere Entdeckungen' })).toBeVisible();
  await expect(mirjam.locator('.recap-item')).toHaveCount(4);
  await expect(mirjam.locator('.recap-fav').first()).toContainText(SAFE_BLUFFS.host);
  await expect(mirjam.locator('main')).not.toContainText('Rahel');
  const recapLink = mirjam.url();
  await mirjam.reload();
  await expect(mirjam.locator('.recap-item')).toHaveCount(4);
  expect(mirjam.url()).toBe(recapLink);

  // Neue Partie mit denselben Leuten
  await host.getByRole('button', { name: 'Neue Partie mit allen' }).click();
  await expect(host.getByRole('button', { name: 'Partie starten' })).toBeVisible();
  await expect(jonas.getByText('Gleich geht’s los')).toBeVisible();
});

test('Spielleitung am Beamer: Pause, Wiedereinstieg und Entfernen', async ({ browser }) => {
  const host = await phone(browser, 'host');
  const code = await createRoom(host, 'Leitung', false);
  const anna = await phone(browser, 'anna');
  const ben = await phone(browser, 'ben');
  await join(anna, code, 'Anna');
  await join(ben, code, 'Ben');

  await host.getByRole('button', { name: 'Partie starten' }).click();
  // Wer nur leitet, sieht die Frage, aber kein Eingabefeld
  await expect(host.locator('.question-card')).toBeVisible();
  await expect(host.getByLabel('Deine erfundene Antwort')).toHaveCount(0);
  await expect(anna.getByLabel('Deine erfundene Antwort')).toBeVisible();

  // Pause friert die Zeit für alle ein
  await hostAction(host, 'Pausieren');
  await expect(anna.getByRole('dialog', { name: 'Pause' })).toBeVisible();
  await host.getByRole('dialog', { name: 'Pause' }).getByRole('button', { name: 'Fortsetzen' }).click();
  await expect(anna.getByRole('dialog', { name: 'Pause' })).toHaveCount(0);

  // Neu laden kostet nichts: Anna ist sofort wieder im Spiel
  await anna.getByLabel('Deine erfundene Antwort').fill(SAFE_BLUFFS.anna);
  await anna.getByRole('button', { name: 'Bluff abgeben' }).click();
  await anna.reload();
  await expect(anna.getByText(`„${SAFE_BLUFFS.anna}“`)).toBeVisible();

  // Leere Eingaben lassen sich gar nicht erst abschicken
  await expect(ben.getByRole('button', { name: 'Bluff abgeben' })).toBeDisabled();

  // Entfernen
  await host.locator('.topbar-menu').click();
  const row = host.locator('.manage-list li').filter({ has: host.locator('.manage-name', { hasText: /^Ben/ }) });
  await row.getByRole('button', { name: 'Entfernen' }).click();
  await row.getByRole('button', { name: 'Entfernen?' }).click();
  await expect(ben.getByRole('heading', { name: 'Entfernt' })).toBeVisible();

  // Raum schließen
  await host.getByRole('button', { name: 'Raum schließen' }).click();
  await host.getByRole('button', { name: /Für alle schließen/ }).click();
  await expect(anna.getByRole('heading', { name: 'Raum geschlossen' })).toBeVisible();
});

test('Impressum und Datenschutz sind von der Startseite und im Raum erreichbar', async ({ browser }) => {
  const page = await phone(browser, 'gast');
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Rechtliches' }).getByRole('link', { name: 'Impressum' }).click();
  await expect(page).toHaveURL(/\/impressum$/);
  await expect(page.getByRole('heading', { name: 'Impressum', level: 1 })).toBeVisible();
  await expect(page.getByText('Steinlestr. 22')).toBeVisible();
  await page.getByRole('navigation', { name: 'Rechtliches' }).getByRole('link', { name: 'Datenschutz' }).click();
  await expect(page).toHaveURL(/\/datenschutz$/);
  await expect(page.getByRole('heading', { name: 'Hosting bei Cloudflare' })).toBeVisible();
  // Direkt aufrufbar (Single-Page-App)
  await page.goto('/impressum');
  await expect(page.getByRole('heading', { name: 'Impressum', level: 1 })).toBeVisible();

  // Im Raum öffnen die Links einen neuen Tab, damit niemand aus der Partie fällt
  await createRoom(page, 'Rahel');
  await page.locator('.topbar-menu').click();
  const link = page.locator('.sheet').getByRole('link', { name: 'Datenschutz' });
  await expect(link).toHaveAttribute('target', '_blank');
});

/** Startseite öffnen und warten, bis sie die offenen Räume abgefragt hat */
async function homeWithOpenRooms(page: Page): Promise<string[]> {
  const response = page.waitForResponse((r) => new URL(r.url()).pathname === '/api/rooms' && r.request().method() === 'GET');
  await page.goto('/');
  const body = (await (await response).json()) as { rooms: { code: string }[] };
  return body.rooms.map((r) => r.code);
}

test('Öffentliche Räume stehen auf der Startseite, auch mitten in der Partie', async ({ browser }) => {
  const host = await phone(browser, 'host');
  // Vibrationen der Leitung mitschreiben
  await host.addInitScript(() => {
    const w = window as unknown as { vibrations: unknown[] };
    w.vibrations = [];
    navigator.vibrate = ((pattern: VibratePattern) => {
      w.vibrations.push(pattern);
      return true;
    }) as Navigator['vibrate'];
  });
  const vibrations = () => host.evaluate(() => (window as unknown as { vibrations: unknown[] }).vibrations.length);
  const code = await createRoom(host, 'Rahel');
  const visitor = await phone(browser, 'gast');
  // Privat ist der Normalfall: kein Bereich „Offene Räume“
  expect(await homeWithOpenRooms(visitor)).toEqual([]);
  await expect(visitor.locator('.open-rooms')).toHaveCount(0);

  await host.getByText('Öffentlich zeigen', { exact: true }).click();
  await expect(host.getByText('Der Raum steht auf der Startseite')).toBeVisible();
  const jonas = await phone(browser, 'jonas');
  await join(jonas, code, 'Jonas');
  await expect(jonas.getByText('Öffentlicher Raum')).toBeVisible();
  // Die Leitung bekommt Bescheid: Vibration und kurze Meldung
  await expect(host.getByRole('status').filter({ hasText: 'Jonas ist beigetreten' })).toBeVisible();
  expect(await vibrations()).toBe(1);
  await host.getByRole('button', { name: 'Partie starten' }).click();
  await expect(host.getByText('Runde 1 von 4')).toBeVisible();

  // Die Startseite fragt regelmäßig nach; neu laden geht schneller (der Server hält die Liste kurz vor)
  await expect(async () => {
    expect(await homeWithOpenRooms(visitor)).toEqual([code]);
  }).toPass({ timeout: 20_000 });
  const entry = visitor.locator('.open-room', { hasText: code });
  await expect(entry).toBeVisible();
  await expect(entry).toContainText('Runde 1 von 4 läuft');
  await expect(visitor.locator('.open-rooms')).not.toContainText('Rahel');

  await entry.click();
  await visitor.waitForURL(`**/r/${code}`);
  await visitor.getByLabel('Dein Spitzname').fill('Hanna');
  await visitor.getByRole('button', { name: 'Beitreten' }).click();
  await expect(visitor.getByText('Runde 1 von 4')).toBeVisible();
  await expect(host.getByRole('status').filter({ hasText: 'Hanna ist beigetreten' })).toBeVisible();
  expect(await vibrations()).toBe(2);

  // Die Leitung nimmt den Raum wieder von der Startseite
  await host.locator('.topbar-menu').click();
  await host.locator('.sheet').getByRole('button', { name: 'Nicht mehr öffentlich zeigen' }).click();
  await expect(host.locator('.sheet').getByRole('button', { name: 'Öffentlich auf der Startseite zeigen' })).toBeVisible();
  const later = await phone(browser, 'später');
  await expect(async () => {
    expect(await homeWithOpenRooms(later)).toEqual([]);
  }).toPass({ timeout: 20_000 });
  await expect(later.locator('.open-rooms')).toHaveCount(0);
});

test('Ohne Vibration (wie auf dem iPhone) meldet ein Ton den Beitritt', async ({ browser }) => {
  const host = await phone(browser, 'host');
  // Kein navigator.vibrate wie auf dem iPhone; erzeugte Töne mitzählen
  await host.addInitScript(() => {
    const w = window as unknown as { tones: number };
    w.tones = 0;
    Object.defineProperty(Navigator.prototype, 'vibrate', { value: undefined, configurable: true });
    const original = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function (this: AudioContext) {
      w.tones++;
      return original.call(this);
    };
  });
  const code = await createRoom(host, 'Rahel');
  // Antippen (mit dem Finger, nicht der Maus) schaltet den Ton frei
  await host.getByText('Öffentlich zeigen', { exact: true }).tap();
  await expect(host.getByText('Der Raum steht auf der Startseite')).toBeVisible();

  const guest = await phone(browser, 'gast');
  await join(guest, code, 'Lea');
  await expect(host.getByRole('status').filter({ hasText: 'Lea ist beigetreten' })).toBeVisible();
  // Zweiklang: zwei Töne
  await expect.poll(() => host.evaluate(() => (window as unknown as { tones: number }).tones)).toBe(2);
});

test('Allein gegen Joseph: eigener Raum von der Startseite aus, danach weiter mit Freunden', async ({ browser }) => {
  const page = await phone(browser, 'gast');
  await page.goto('/');
  await page.getByRole('button', { name: 'Gegen Joseph spielen' }).click();
  await page.waitForURL('**/joseph');
  await page.getByLabel('Dein Spitzname').fill('Hanna');
  await page.getByRole('button', { name: 'Raum mit Joseph eröffnen' }).click();
  await page.waitForURL(/\/r\/[A-Z]+\d+$/);
  const code = page.url().split('/r/')[1];

  await expect(page.locator('.player', { hasText: 'Joseph' })).toContainText('Bot');
  // Der Raum ist privat: Er steht nicht unter „Offene Räume“
  const other = await phone(browser, 'andere');
  expect(await homeWithOpenRooms(other)).not.toContain(code);

  await page.getByRole('button', { name: 'Partie starten' }).click();
  await expect(page.getByText('Runde 1 von 6')).toBeVisible();

  // Sobald Hanna abgibt, zieht Joseph sofort nach – die Abstimmung beginnt
  await page.getByLabel('Deine erfundene Antwort').fill(SAFE_BLUFFS.host);
  await page.getByRole('button', { name: 'Bluff abgeben' }).click();
  await expect(page.getByText('Welche Antwort stimmt?')).toBeVisible();
  await page.locator('.option:not(.is-mine)').first().click();

  // Joseph stimmt ebenfalls sofort ab, also wird aufgedeckt; Hanna leitet und schaltet weiter
  await expect(page.locator('.reveal-head')).toContainText('Aufdeckung');
  const skip = page.getByRole('button', { name: 'Weiter ›' });
  await expect(async () => {
    if (await skip.isVisible()) await skip.click();
    await expect(page.getByRole('button', { name: 'Nächste Runde' })).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Nächste Runde' }).click();

  // Restliche Runden über das Leitungsmenü durchschalten
  for (let round = 2; round <= 6; round++) {
    await expect(page.getByText(`Runde ${round} von 6`)).toBeVisible();
    await hostAction(page, 'Schreibzeit jetzt beenden');
    await expect(page.getByText(VOTE_TITLE)).toBeVisible();
    await hostAction(page, 'Abstimmung jetzt beenden');
    await hostAction(page, 'Aufdeckung überspringen');
    await page.getByRole('button', { name: round === 6 ? 'Zum Endstand' : 'Nächste Runde' }).click();
  }

  // Am Ende lädt das Spiel ein, als Nächstes mit Freunden zu spielen
  await expect(page.getByRole('heading', { name: 'Endstand' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Jetzt mit Freunden spielen' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nochmal gegen Joseph' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Neue Partie mit allen' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Raum für Freunde eröffnen' }).click();
  await page.waitForURL('**/neu');
  await expect(page.getByRole('heading', { name: 'Raum eröffnen' })).toBeVisible();
  await expect(page.getByLabel('Dein Spitzname')).toHaveValue('Hanna');
});

test('Einladungslinks haben eine eigene Link-Vorschau', async ({ request }) => {
  const invite = await (await request.get('/r/lampe7')).text();
  expect(invite).toContain('<meta property="og:title" content="Du bist eingeladen – Raum LAMPE7"');
  expect(invite).toMatch(/<meta property="og:image" content="http:\/\/localhost:\d+\/og-invite\.jpg"/);
  // Die Startseite holt ihr Vorschaubild außerhalb von biblebluff.de von derselben Adresse
  const home = await (await request.get('/')).text();
  expect(home).toMatch(/<meta property="og:image" content="http:\/\/localhost:\d+\/og\.jpg"/);
  for (const [path, type] of [
    ['/og.jpg', 'image/jpeg'],
    ['/og-invite.jpg', 'image/jpeg'],
    ['/favicon.ico', 'image/x-icon'],
    ['/apple-touch-icon.png', 'image/png'],
  ]) {
    expect((await request.get(path)).headers()['content-type'], path).toBe(type);
  }
});

test('Lückentext aus gewählten Kategorien: Lücke, eingesetzte Antworten, Auflösung im Satz', async ({ browser }) => {
  const host = await phone(browser, 'host');
  await host.goto('/neu');
  await host.getByLabel('Dein Spitzname').fill('Rahel');
  await host.getByRole('radiogroup', { name: 'Runden' }).getByRole('radio', { name: '4', exact: true }).click();
  await host.getByRole('radiogroup', { name: 'Rundenart' }).getByRole('radio', { name: 'Lückentext' }).click();
  // Nur Evangelien und Altes Testament
  const chips = host.getByRole('group', { name: 'Kategorien' });
  for (const name of ['Apostelgeschichte', 'Paulusbriefe', 'Weitere Briefe', 'Offenbarung']) {
    await chips.getByRole('button', { name: new RegExp(name) }).click();
  }
  await expect(chips.locator('.cat-chip.is-on')).toHaveCount(2);
  await expect(host.locator('.field-hint', { hasText: 'passen zu deiner Auswahl' })).toContainText('22 Lückentexte');
  await host.getByRole('button', { name: 'Raum eröffnen' }).click();
  await host.waitForURL(/\/r\/[A-Z]+\d+$/);
  const code = host.url().split('/r/')[1];
  await expect(host.locator('.fresh-note')).toContainText('von 22 Lückentexten');

  const guest = await phone(browser, 'guest');
  await join(guest, code, 'Jonas');
  await host.getByRole('button', { name: 'Partie starten' }).click();

  // Die Frage ist ein Satz mit Lücke
  for (const p of [host, guest]) {
    await expect(p.locator('.question-card .kind-chip')).toHaveText('Lückentext');
    await expect(p.locator('.question-card .gap-blank')).toBeVisible();
    await expect(p.getByText('Lücke füllen')).toBeVisible();
  }
  const group = await host.locator('.question-card .book-chip').textContent();
  expect(['Matthäus', 'Markus', 'Lukas', 'Johannes', '1. Mose', '1. Samuel', 'Jona', 'Daniel', 'Richter', '1. Könige', 'Josua', '2. Mose']).toContain(group);

  // Mitten im Satz beginnt „Ein …“ klein – im eingereichten Satz zu sehen
  await host.getByLabel(BLUFF_FIELD).fill(SAFE_BLUFFS.host);
  await host.getByRole('button', { name: 'Bluff abgeben' }).click();
  await expect(host.locator('.submitted-text .gap-fill')).toHaveText(SAFE_BLUFFS.host.replace(/^Ein/, 'ein'));
  await guest.getByLabel(BLUFF_FIELD).fill(SAFE_BLUFFS.mirjam);
  await guest.getByRole('button', { name: 'Bluff abgeben' }).click();

  // Abstimmen: Jonas fällt auf Rahels Bluff herein
  await expect(guest.getByText('Was gehört in die Lücke?')).toBeVisible();
  await guest.locator('.option', { hasText: /Zylinderhut aus Quarzglas/ }).click();
  await host.locator('button.option:not([disabled])').first().click();

  // Aufdeckung: Jede Antwort steht eingesetzt im Satz
  await expect(guest.locator('.reveal-text.is-sentence .gap-fill').first()).toBeVisible({ timeout: 30_000 });
  await expect(guest.locator('.stamp-truth')).toBeVisible({ timeout: 40_000 });
  await expect(host.getByText('Punktestand')).toBeVisible({ timeout: 30_000 });
  await expect(host.locator('.discovery-question .gap-fill')).toBeVisible();
});
