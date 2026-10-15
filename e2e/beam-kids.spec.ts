import { expect, test, type Page } from '@playwright/test';
test.use({ viewport: { width: 1280, height: 800 }, isMobile: false });
test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });
async function begin(page: Page) {
  await page.getByRole('button',{name:'Show vorbereiten',exact:false}).click();
  await page.getByRole('button',{name:'Mission starten',exact:true}).click();
  await page.getByRole('button',{name:'Erste Aufgabe im Kapitel',exact:true}).click();
}
async function resolve(page: Page, result='Mehrheit richtig · +10', checkTransition?:()=>Promise<void>) {
  await page.getByRole('button',{name:'30 Sekunden starten',exact:true}).click();
  await page.clock.fastForward(30000);
  await expect(page.locator('.kids-correct-mark')).toHaveCount(0);
  await page.getByRole('button',{name:'Zurück in die Gruppen',exact:true}).click();
  await expect(page.getByText('Alle zurück zu eurer Gruppe!',{exact:true})).toBeVisible();
  if(checkTransition) await checkTransition();
  await expect(page.locator('.kids-correct-mark')).toHaveCount(0);
  await page.getByRole('button',{name:'Alle sind zurück',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Alle sind zurück!',exact:true})).toBeVisible();
  if(checkTransition) await checkTransition();
  await page.getByRole('button',{name:result,exact:true}).click();
}
test('Kids: Startseitenlogo, 30 Sekunden, Pause, Rückweg und gemeinsame Wertung',async({page})=>{
  await page.goto('/');
  await page.getByRole('link',{name:'BibleBluff Kids – Beamer-Spiel für Kinder'}).click();
  await expect(page).toHaveURL(/\/kids$/); await begin(page);
  await expect(page.locator('.kids-answer')).toHaveCount(3);
  await expect(page.locator('.professor-lane').getByRole('img',{name:'Professor Bluffs Kopf'})).toBeVisible();
  await expect(page.locator('.professor-lane')).not.toHaveText('B');
  await expect(page.locator('.kids-answer > .kids-story-picture')).toHaveCount(3);
  await page.clock.install();
  await page.getByRole('button',{name:'30 Sekunden starten',exact:true}).click();
  await page.clock.runFor(10000); await page.keyboard.press('p');
  await page.clock.runFor(40000);
  await expect(page.locator('.kids-clock')).toHaveAttribute('aria-label','20 Sekunden');
  await page.keyboard.press('ArrowRight'); await page.clock.runFor(20000);
  await expect(page.getByText('Stopp! Helfer prüfen die Felder.',{exact:true})).toBeVisible();
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.kids-answer')).toHaveCount(0);
  expect(await page.locator('.kids-regroup-walker').first().evaluate(el=>getComputedStyle(el).animationName)).toBe('kids-walk-home');
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await page.locator('.kids-regroup-walker').first().evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('heading',{name:'Alle sind zurück!',exact:true})).toBeVisible();
  await page.keyboard.press('1');
  await expect(page.locator('.kids-answer.is-correct')).toHaveCount(1);
  await expect(page.getByTestId('team-score')).toHaveText('10');
  await expect(page.getByTestId('prof-score')).toHaveText('7');
  await expect(page.locator('.kids-celebration')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.kids-round-counter')).toContainText('Mittis');
  await expect(page.locator('.kids-clock')).toHaveAttribute('aria-label','30 Sekunden');
});
test('Kids: vollständige Show, Familienjoker, Superbluff und gemeinsamer Schatz',async({page})=>{
  const requests:string[]=[]; page.on('request',r=>{if(r.url().includes('/api/'))requests.push(r.url());});
  await page.goto('/kids'); await begin(page); await page.clock.install();
  for(let i=0;i<10;i++) {
    if(i===3) { await page.getByRole('button',{name:'Familienjoker',exact:true}).click(); await expect(page.locator('.kids-discovery')).toContainText('Familienjoker:'); }
    if(i===4) await expect(page.getByRole('button',{name:'Familienjoker',exact:true})).toHaveCount(0);
    await resolve(page,'Mehrheit richtig · +10');
    await expect(page.locator('.kids-answer.is-correct')).toHaveCount(1);
    await page.getByRole('button',{name:i===9?'Schatz öffnen':i===8?'Zum Superbluff':i===2||i===5?'Nächstes Kapitel':'Nächste Aufgabe',exact:true}).click();
    if(i===2||i===5) await page.getByRole('button',{name:'Erste Aufgabe im Kapitel',exact:true}).click();
    if(i===8) { await expect(page.getByTestId('team-score')).toHaveText('?'); await expect(page.getByText('ALARM! Der Superbluff!',{exact:true})).toBeVisible(); await page.getByRole('button',{name:'Gemeinsam ins Finale',exact:true}).click(); }
  }
  await expect(page.getByRole('heading',{name:'Ihr habt den Bluff geknackt!'})).toBeVisible();
  await expect(page.locator('.kids-show-story').getByRole('img',{name:'Eine goldene Krone, umringt von zwölf fröhlichen Kindern'})).toBeVisible();
  await expect(page.getByTestId('team-score')).toHaveText('100'); await expect(page.getByTestId('prof-score')).toHaveText('73');
  await expect(page.getByText('Bei Jesus sind wir willkommen.',{exact:true})).toBeVisible();
  await expect(page.locator('.kids-show-story .kids-treasure-tiles .is-found')).toHaveCount(9);
  await page.getByRole('button',{name:'Revanche!',exact:false}).click();
  await expect(page.getByTestId('team-score')).toHaveText('0');
  expect(requests).toEqual([]);
});
test('Kids: reine Beameransicht ist über Maus und Tastatur bedienbar',async({page})=>{
  await page.goto('/kids'); await begin(page);
  await page.getByRole('button',{name:'Maussteuerung ausblenden',exact:true}).click();
  await expect(page.getByRole('button',{name:'30 Sekunden starten',exact:true})).toBeHidden();
  await page.getByRole('button',{name:'Maussteuerung einblenden',exact:true}).click();
  await page.getByRole('button',{name:'30 Sekunden starten',exact:true}).click();
  await page.getByRole('button',{name:'Ⅱ Pause',exact:true}).click();
  await expect(page.getByText('Kurze Pause. Bleibt, wo ihr seid!',{exact:true})).toBeVisible();
  await page.keyboard.press('h'); await page.keyboard.press('ArrowRight');
  await expect(page.getByText('1, 2 oder 3? Ab in euer Feld!',{exact:true})).toBeVisible();
});
test('Kids: Smartphone synchronisiert Maus, Wertung, Neuladen und Netzabbruch',async({page,browser})=>{
  await page.goto('/kids'); await begin(page);
  const question=await page.locator('#kids-question').innerText();
  await page.getByRole('button',{name:'Bedienung',exact:false}).click();
  await page.getByRole('button',{name:'Smartphone verbinden',exact:true}).click();
  await expect(page.getByRole('img',{name:'QR-Code zur Smartphone-Fernbedienung'})).toBeVisible();
  const url=await page.getByRole('link',{name:'Fernbedienung öffnen',exact:false}).getAttribute('href');
  await page.getByRole('button',{name:'Zur Partie',exact:true}).click();
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'de-DE'}), phone=await context.newPage();
  await phone.addInitScript(()=>{const now=Date.now;Date.now=()=>now()+3600000;});
  await phone.goto(url!);
  await expect(phone.getByText('Mit der Beamer-Partie verbunden',{exact:true})).toBeVisible();
  await expect(phone.getByRole('heading',{name:question})).toBeVisible();
  await phone.getByRole('button',{name:'30 Sekunden starten',exact:true}).click();
  await expect(page.getByText('1, 2 oder 3? Ab in euer Feld!',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Ⅱ Pause',exact:true}).click();
  await expect(phone.locator('.kids-remote-phase strong')).toHaveText('Pause');
  await page.reload(); await expect(page.locator('#kids-question')).toHaveText(question);
  await context.setOffline(true);
  await expect(phone.getByRole('status')).toContainText('Verbindung unterbrochen');
  await context.setOffline(false); await expect(phone.getByText('Mit der Beamer-Partie verbunden',{exact:true})).toBeVisible({timeout:15000});
  await phone.getByRole('button',{name:'Weiter geht’s',exact:true}).click();
  await expect(page.getByText('Stopp! Helfer prüfen die Felder.',{exact:true})).toBeVisible({timeout:35000});
  await phone.getByRole('button',{name:'Zurück in die Gruppen',exact:true}).click();
  await expect(page.getByText('Alle zurück zu eurer Gruppe!',{exact:true})).toBeVisible();
  await phone.getByRole('button',{name:'Alle sind zurück',exact:true}).click();
  await phone.getByRole('button',{name:'Mehrheit richtig · +10',exact:true}).click();
  await expect(page.getByTestId('team-score')).toHaveText('10');
  await phone.getByRole('button',{name:'Nächste Aufgabe',exact:true}).click();
  await expect(page.locator('.kids-round-counter')).toContainText('Mittis');
  await page.getByRole('button',{name:'Bedienung',exact:false}).click();
  await page.getByRole('button',{name:'Smartphone-Steuerung anzeigen',exact:true}).click();
  await page.getByRole('button',{name:'Smartphone-Verbindung trennen',exact:true}).click();
  await expect(phone.getByRole('status')).toContainText('beendet');
  await expect(page.getByRole('button',{name:'30 Sekunden starten',exact:true})).toBeEnabled();
  await context.close();
});
test('Kids: alle Showfragen passen bei 800×600, 4:3, 720p und Full HD',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;}); await page.goto('/kids'); await begin(page); await page.clock.install();
  const viewports=[{width:800,height:600},{width:1024,height:768},{width:1280,height:720},{width:1920,height:1080}];
  async function check() {
    const issues=await page.evaluate(()=>{
      const problems:string[]=[];
      for(const selector of ['#kids-question','.kids-answer-text','.is-revealed .kids-discovery p','#kids-regroup-title','.kids-regroup-instruction']) document.querySelectorAll<HTMLElement>(selector).forEach(el=>{
        const range=document.createRange();range.selectNodeContents(el);const text=range.getBoundingClientRect(),box=(selector.includes('discovery')?el.closest('.kids-bottom')!:el).getBoundingClientRect();
        if(text.left<box.left-1||text.right>box.right+1||text.top<box.top-1||text.bottom>box.bottom+1) problems.push(`${selector}: ${el.textContent}`);
      });
      for(const el of document.querySelectorAll('.kids-status,.kids-answers,.kids-bottom,.kids-show-story,.kids-regroup-content')) {const box=el.getBoundingClientRect();if(box.bottom>innerHeight+1||box.left<0||box.right>innerWidth+1)problems.push(`Außerhalb: ${el.className}`);}
      if(document.documentElement.scrollWidth>innerWidth)problems.push('Breite');return problems;
    });expect(issues).toEqual([]);
  }
  for(let i=0;i<10;i++) {
    const ys:Record<number,number[]>={};
    for(const viewport of viewports){await page.setViewportSize(viewport);await check();ys[viewport.width]=await page.locator('.kids-answer').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().y));}
    await resolve(page,'Mindestens ein Kind richtig · +5',async()=>{for(const viewport of viewports){await page.setViewportSize(viewport);await check();const professor=await page.locator('.kids-regroup-professor .bluff-professor').boundingBox();expect(professor!.width).toBeGreaterThan(160);}});
    for(const viewport of viewports){await page.setViewportSize(viewport);await check();expect(await page.locator('.kids-answer').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().y))).toEqual(ys[viewport.width]);}
    await page.getByRole('button',{name:i===9?'Schatz öffnen':i===8?'Zum Superbluff':i===2||i===5?'Nächstes Kapitel':'Nächste Aufgabe',exact:true}).click();
    if(i===2||i===5||i===8) {
      for(const viewport of viewports){await page.setViewportSize(viewport);await check();}
      await page.getByRole('button',{name:i===8?'Gemeinsam ins Finale':'Erste Aufgabe im Kapitel',exact:true}).click();
    }
  }
  for(const viewport of viewports){await page.setViewportSize(viewport);await check();}
  await expect(page.getByRole('heading',{name:'Euer Teamgeist ist der Schatz!'})).toBeVisible();
});
