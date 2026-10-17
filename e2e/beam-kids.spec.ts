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
  await expect(page.locator('.kids-compact-score')).toContainText('Unser Team');
  await expect(page.locator('.kids-compact-score')).toContainText('Professor Bluff');
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
  await expect(page.locator('.kids-active-group')).toContainText('Leuchtsterne');
  await expect(page.locator('.kids-clock')).toHaveAttribute('aria-label','30 Sekunden');
});
test('Kids: vollständige Show mit Bildern, ohne Joker und mit jederzeit möglichem Abschluss',async({page})=>{
  const requests:string[]=[]; page.on('request',r=>{if(r.url().includes('/api/'))requests.push(r.url());});
  await page.goto('/kids'); await begin(page); await page.clock.install();
  for(let i=0;i<10;i++) {
    await expect(page.getByRole('button',{name:/Familienjoker/})).toHaveCount(0);
    await expect(page.locator('.kids-answer > .kids-story-picture')).toHaveCount(3);
    const motifs=await page.locator('.kids-answer > .kids-story-picture').evaluateAll(els=>els.map(el=>el.getAttribute('data-motif')));
    expect(new Set(motifs).size).toBe(3);
    await resolve(page,'Mehrheit richtig · +10');
    await expect(page.locator('.kids-answer.is-correct')).toHaveCount(1);
    await page.getByRole('button',{name:i===9?'Zum Abschluss':i===8?'Zum Superbluff':i===2||i===5?'Nächstes Kapitel':'Nächste Aufgabe',exact:true}).click();
    if(i===2||i===5) await page.getByRole('button',{name:'Erste Aufgabe im Kapitel',exact:true}).click();
    if(i===8) { await expect(page.getByTestId('team-score')).toHaveText('90'); await expect(page.getByText('Knackt den Superbluff!',{exact:true})).toBeVisible(); await page.getByRole('button',{name:'Gemeinsam ins Finale',exact:true}).click(); }
  }
  await expect(page.getByRole('heading',{name:'Gemeinsam seid ihr stark!'})).toBeVisible();
  await expect(page.locator('.kids-treasure')).toHaveCount(0);
  await expect(page.locator('.kids-ending')).toBeVisible();
  await expect(page.getByTestId('team-score')).toHaveText('100'); await expect(page.getByTestId('prof-score')).toHaveText('73');
  await expect(page.getByText('Bei Jesus sind wir willkommen.',{exact:true})).toBeVisible();
  await expect(page.locator('.kids-ending-count')).toContainText('10 Aufgaben');
  await expect(page.getByRole('button',{name:/Revanche|Vorbereitung/})).toHaveCount(0);
  await expect(page.locator('.kids-finale-seal')).toHaveText('♥ ALLE GEHÖREN DAZU ♥');
  await expect(page.locator('.kids-ending-host .bluff-professor')).toHaveClass(/mood-kind/);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('team-score')).toHaveText('100');
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
  await expect(phone.locator('.kids-remote-answers .kids-story-picture')).toHaveCount(3);
  await expect(phone.getByRole('button',{name:/Familienjoker|Revanche/})).toHaveCount(0);
  await phone.getByRole('button',{name:'Szene am Beamer abspielen',exact:true}).click();
  await expect(page.locator('.kids-cinema')).toHaveAttribute('data-scene','ark');
  await expect(phone.locator('.kids-remote-phase strong')).toHaveText('Szene läuft');
  await expect(phone.getByRole('button',{name:'30 Sekunden starten',exact:true})).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.kids-cinema')).toBeVisible();
  await phone.getByRole('button',{name:'Zur Frage',exact:true}).click();
  await expect(page.locator('#kids-question')).toHaveText(question);
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
  await expect(page.locator('.kids-active-group')).toContainText('Leuchtsterne');
  await page.getByRole('button',{name:'Bedienung',exact:false}).click();
  await page.getByRole('button',{name:'Smartphone-Steuerung anzeigen',exact:true}).click();
  await page.getByRole('button',{name:'Smartphone-Verbindung trennen',exact:true}).click();
  await expect(phone.getByRole('status')).toContainText('beendet');
  await expect(page.getByRole('button',{name:'30 Sekunden starten',exact:true})).toBeEnabled();
  await context.close();
});
test('Kids: alle Showfragen passen bei 800×600, 4:3, 720p, Full HD und 1440p',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;}); await page.goto('/kids'); await begin(page); await page.clock.install();
  const viewports=[{width:800,height:600},{width:1024,height:768},{width:1280,height:720},{width:1920,height:1080},{width:2560,height:1440}];
  async function check() {
    const issues=await page.evaluate(()=>{
      const problems:string[]=[];
      for(const selector of ['#kids-question','.kids-answer-text','.is-revealed .kids-discovery p','#kids-regroup-title','.kids-regroup-instruction','#kids-reveal-title','.kids-reaction-quote','.kids-reveal-points','.kids-farewell','#kids-ending-title','.kids-ending-host blockquote','.kids-ending-count','.kids-ending-results strong','.kids-ending footer > p']) document.querySelectorAll<HTMLElement>(selector).forEach(el=>{
        const range=document.createRange();range.selectNodeContents(el);const text=range.getBoundingClientRect(),box=(selector.includes('discovery')?el.closest('.kids-discovery')!:el).getBoundingClientRect();
        if(text.left<box.left-1||text.right>box.right+1||text.top<box.top-1||text.bottom>box.bottom+1) problems.push(`${innerWidth}×${innerHeight} ${selector}: ${el.textContent}; Text ${JSON.stringify({left:text.left,right:text.right,top:text.top,bottom:text.bottom})}; Box ${JSON.stringify({left:box.left,right:box.right,top:box.top,bottom:box.bottom})}`);
      });
      for(const el of document.querySelectorAll('.kids-answer > .kids-story-picture,.kids-reveal-answer > .kids-story-picture,.kids-status,.kids-answers,.kids-bottom,.kids-show-story,.kids-show-host,.kids-regroup-content,.kids-regroup-operator,.kids-reveal-result,.kids-reaction,.kids-reveal-footer,.kids-ending > header,.kids-ending-host,.kids-ending-results,.kids-ending > footer')) {const box=el.getBoundingClientRect();if(el.matches('.kids-story-picture') && box.height<45)problems.push(`Bild zu klein: ${el.getAttribute('data-motif')}`);if(box.bottom>innerHeight+1||box.left<0||box.right>innerWidth+1)problems.push(`Außerhalb: ${el.className}`);}
      if(document.documentElement.scrollWidth>innerWidth)problems.push('Breite');return problems;
    });expect(issues).toEqual([]);
  }
  for(let i=0;i<10;i++) {
    const answers=await page.locator('.kids-answer-text').allTextContents();
    const motifs=await page.locator('.kids-answer > .kids-story-picture').evaluateAll(els=>els.map(el=>el.getAttribute('data-motif')));
    for(const viewport of viewports){await page.setViewportSize(viewport);await check();}
    await resolve(page,'Mindestens ein Kind richtig · +5',async()=>{for(const viewport of viewports){await page.setViewportSize(viewport);await check();const professor=await page.locator('.kids-regroup-professor .bluff-professor').boundingBox();expect(professor!.width).toBeGreaterThan(160);}});
    for(const viewport of viewports){await page.setViewportSize(viewport);await check();const field=Number(await page.locator('.kids-reveal .kids-number').innerText());expect(await page.locator('.kids-reveal .kids-answer-text').innerText()).toBe(answers[field-1]);await expect(page.locator('.kids-reveal .kids-story-picture')).toHaveAttribute('data-motif',motifs[field-1]!);}
    await page.getByRole('button',{name:i===9?'Zum Abschluss':i===8?'Zum Superbluff':i===2||i===5?'Nächstes Kapitel':'Nächste Aufgabe',exact:true}).click();
    if(i===2||i===5||i===8) {
      for(const viewport of viewports){await page.setViewportSize(viewport);await check();}
      await page.getByRole('button',{name:i===8?'Gemeinsam ins Finale':'Erste Aufgabe im Kapitel',exact:true}).click();
    }
  }
  for(const viewport of viewports){await page.setViewportSize(viewport);await check();}
  await expect(page.getByRole('heading',{name:'Gemeinsam seid ihr stark!'})).toBeVisible();
});

test('Kids: Vollbild und Professor-Reaktion bei null, fünf und zehn Punkten',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/kids'); await begin(page);
  if(await page.evaluate(()=>document.fullscreenEnabled)) {
    await page.getByRole('button',{name:'Vollbild einschalten',exact:true}).click();
    await expect(page.locator('.kids-page')).toHaveClass(/is-fullscreen/);
    await page.getByRole('button',{name:'Vollbild ausschalten',exact:true}).click();
    await expect(page.locator('.kids-page')).not.toHaveClass(/is-fullscreen/);
  }
  await page.clock.install();
  let previous='';
  for(const [label,points,mood] of [['Keiner richtig · +0',0,'kind'],['Mindestens ein Kind richtig · +5',5,'startled'],['Mehrheit richtig · +10',10,'startled']] as const) {
    const teamBefore=await page.getByTestId('team-score').innerText();
    await resolve(page,label);
    // Trommelwirbel: zwei Bluff-Stempel, Wertung und Konfetti erst danach.
    await expect(page.locator('.kids-suspense')).toBeVisible();
    await expect(page.locator('.kids-suspense .kids-bluff-stamp')).toHaveCount(2);
    await expect(page.getByTestId('team-score')).toHaveText(teamBefore);
    await expect(page.locator('.kids-celebration')).toHaveCount(0);
    await page.clock.runFor(3700);
    await expect(page.locator('.kids-suspense')).toHaveCount(0);
    await expect(page.getByTestId('team-score')).toHaveText(String(Number(teamBefore)+points));
    await expect(page.locator('.kids-reveal')).toHaveAttribute('data-points',String(points));
    await expect(page.locator('.kids-reaction-art > .bluff-professor')).toHaveClass(new RegExp(`mood-${mood}`));
    const quote=await page.locator('.kids-reaction-quote').innerText(); expect(quote).not.toBe(previous); previous=quote;
    if(points===0) {
      await expect(page.getByRole('img',{name:'Professor Bluff macht euch Mut',exact:true})).toBeVisible();
      await expect(page.locator('.kids-celebration')).toHaveCount(0);
      expect(await page.locator('.kids-reaction-art .bluff-arm-left').evaluate(el=>getComputedStyle(el).animationName)).not.toBe('none');
    } else {
      await expect(page.getByRole('img',{name:'Professor Bluff erschrickt über eure Punkte',exact:true})).toBeVisible();
      await expect(page.locator('.kids-reveal-points')).toHaveText(`+${points} für euer Team!`);
      expect(await page.locator('.kids-reaction-art .bluff-performer').evaluate(el=>getComputedStyle(el).animationName)).not.toBe('none');
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    expect(await page.locator('.kids-reaction-art .bluff-body').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.getByRole('button',{name:points===10?'Nächstes Kapitel':'Nächste Aufgabe',exact:true}).click();
  }
});


test('Kids: vier große Szenen mit Handlung, Klang, Wiederholung und separatem Antwort-Countdown',async({page})=>{
  await page.addInitScript(()=>{
    const state=window as unknown as {sceneAudioStarts:number};state.sceneAudioStarts=0;
    const original=AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator=function(){state.sceneAudioStarts++;return original.call(this);};
  });
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/kids');await begin(page);await page.clock.install();
  const scenes=new Map([[0,'ark'],[3,'manger'],[6,'lion'],[9,'boat']]);
  for(let i=0;i<10;i++) {
    const scene=scenes.get(i);
    if(scene) {
      const answers=await page.locator('.kids-answer-text').allTextContents();
      await page.getByRole('button',{name:'Szene abspielen',exact:true}).click();
      await expect(page.locator('.kids-cinema')).toHaveAttribute('data-scene',scene);
      await expect(page.locator('.kids-cinema-art')).toHaveClass(/beat-0/);
      await expect(page.locator('.kids-answers')).toHaveCount(0);
      await expect(page.getByRole('button',{name:'30 Sekunden starten',exact:true})).toHaveCount(0);
      for(const viewport of [{width:800,height:600},{width:1024,height:768},{width:1280,height:720},{width:1920,height:1080},{width:2560,height:1440}]) {
        await page.setViewportSize(viewport);
        const issues=await page.locator('.kids-cinema').evaluate(el=>{
          const problems:string[]=[];
          for(const child of el.querySelectorAll('header,.kids-cinema-screen,.kids-cinema-caption,footer')){const box=child.getBoundingClientRect();if(box.left<0||box.right>innerWidth||box.bottom>innerHeight)problems.push(child.className);}
          return problems;
        });expect(issues).toEqual([]);
        const art=await page.locator('.kids-cinema-screen').boundingBox();expect(art!.height).toBeGreaterThan(viewport.height*.4);
      }
      await page.clock.runFor(3200);await expect(page.locator('.kids-cinema-art')).toHaveClass(/beat-1/);
      await page.clock.runFor(3500);await expect(page.locator('.kids-cinema-art')).toHaveClass(/beat-2/);
      if(i===0) {
        expect(await page.evaluate(()=>(window as unknown as {sceneAudioStarts:number}).sceneAudioStarts)).toBeGreaterThan(0);
        await page.locator('.kids-cinema').getByRole('button',{name:'Klang ausschalten',exact:true}).click();
      }
      await page.clock.runFor(3400);await expect(page.locator('.kids-cinema')).toHaveCount(0);
      await expect(page.locator('.kids-clock')).toHaveAttribute('aria-label','30 Sekunden');
      expect(await page.locator('.kids-answer-text').allTextContents()).toEqual(answers);
      await page.getByRole('button',{name:'Szene abspielen',exact:true}).click();
      await expect(page.locator('.kids-cinema-art')).toHaveClass(/beat-0/);
      await expect(page.locator('.kids-cinema').getByRole('button',{name:'Klang einschalten',exact:true})).toBeVisible();
      await page.emulateMedia({reducedMotion:'reduce'});
      const animation=await page.locator('.kids-cinema-art .scene-hammer-arm,.kids-cinema-art .scene-cradle,.kids-cinema-art .scene-lion-head,.kids-cinema-art .scene-boat-rock').first().evaluate(el=>getComputedStyle(el).animationName);
      expect(animation).toBe('none');
      await page.getByRole('button',{name:'Zur Frage',exact:false}).click();
      await page.emulateMedia({reducedMotion:'no-preference'});
      await expect(page.locator('.kids-clock')).toHaveAttribute('aria-label','30 Sekunden');
    }
    await resolve(page);
    await page.getByRole('button',{name:i===9?'Zum Abschluss':i===8?'Zum Superbluff':i===2||i===5?'Nächstes Kapitel':'Nächste Aufgabe',exact:true}).click();
    if(i===2||i===5||i===8)await page.getByRole('button',{name:i===8?'Gemeinsam ins Finale':'Erste Aufgabe im Kapitel',exact:true}).click();
  }
});


test('Kids: vorzeitiger Abschluss behält nur gewertete Punkte, stoppt die Zeit und entfernt das Schatzbild',async({page})=>{
  await page.goto('/kids');await begin(page);await page.clock.install();
  await resolve(page);await page.getByRole('button',{name:'Nächste Aufgabe',exact:true}).click();
  await resolve(page,'Mindestens ein Kind richtig · +5');await page.getByRole('button',{name:'Nächste Aufgabe',exact:true}).click();
  await page.getByRole('button',{name:'30 Sekunden starten',exact:true}).click();await page.clock.runFor(5000);
  await page.getByRole('button',{name:'Spiel mit Punktestand abschließen',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Spiel jetzt abschließen?'})).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.kids-clock')).toHaveAttribute('aria-label','25 Sekunden');
  await page.getByRole('button',{name:'Spiel mit Punktestand abschließen',exact:true}).click();
  await page.getByRole('button',{name:'Jetzt mit Punktestand abschließen',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Gemeinsam seid ihr stark!'})).toBeVisible();
  await expect(page.getByTestId('team-score')).toHaveText('15');await expect(page.getByTestId('prof-score')).toHaveText('14');
  await expect(page.locator('.kids-ending-count')).toHaveText('2 Aufgaben gemeinsam gespielt');
  await expect(page.locator('.kids-clock,.kids-treasure,.kids-treasure-tiles')).toHaveCount(0);
  await page.clock.runFor(120000);await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('team-score')).toHaveText('15');await expect(page.getByTestId('prof-score')).toHaveText('14');
  await expect(page.getByText('Bei Jesus sind wir willkommen.',{exact:true})).toBeVisible();
});

test('Kids: Abschluss vor der ersten Aufgabe und während einer Szene',async({page})=>{
  for(const phase of ['welcome','scene']) {
    await page.goto('/kids');await page.getByRole('button',{name:'Show vorbereiten',exact:false}).click();
    if(phase==='scene') {
      await page.getByRole('button',{name:'Mission starten',exact:true}).click();await page.getByRole('button',{name:'Erste Aufgabe im Kapitel',exact:true}).click();
      await page.getByRole('button',{name:'Szene abspielen',exact:true}).click();await expect(page.locator('.kids-cinema')).toBeVisible();
    }
    await page.getByRole('button',{name:'Spiel mit Punktestand abschließen',exact:true}).click();
    await page.getByRole('button',{name:'Jetzt mit Punktestand abschließen',exact:true}).click();
    await expect(page.locator('.kids-ending')).toBeVisible();await expect(page.getByTestId('team-score')).toHaveText('0');await expect(page.getByTestId('prof-score')).toHaveText('0');
    await expect(page.locator('.kids-cinema')).toHaveCount(0);await expect(page.getByRole('button',{name:/Revanche/})).toHaveCount(0);
  }
});

test('Kids: Smartphone beendet die Show mit Endstand, der nach Neuladen erhalten bleibt',async({page,browser})=>{
  await page.goto('/kids');await begin(page);await page.clock.install();
  await resolve(page);await page.getByRole('button',{name:'Nächste Aufgabe',exact:true}).click();
  await page.getByRole('button',{name:'Bedienung',exact:false}).click();await page.getByRole('button',{name:'Smartphone verbinden',exact:true}).click();
  const url=await page.getByRole('link',{name:'Fernbedienung öffnen',exact:false}).getAttribute('href');await page.getByRole('button',{name:'Zur Partie',exact:true}).click();
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'de-DE'}),phone=await context.newPage();
  await phone.goto(url!);await expect(phone.getByText('Mit der Beamer-Partie verbunden',{exact:true})).toBeVisible();
  await phone.getByRole('button',{name:'Spiel abschließen',exact:true}).click();await phone.getByRole('button',{name:'Weiterspielen',exact:true}).click();
  await expect(phone.getByRole('button',{name:'30 Sekunden starten',exact:true})).toBeVisible();
  await phone.getByRole('button',{name:'Spiel abschließen',exact:true}).click();await phone.getByRole('button',{name:'Jetzt mit Punktestand abschließen',exact:true}).click();
  await expect(phone.getByRole('heading',{name:'Gemeinsam seid ihr stark!'})).toBeVisible();
  await page.clock.runFor(2000);await expect(page.locator('.kids-ending')).toBeVisible();
  await expect(page.getByTestId('team-score')).toHaveText('10');await expect(page.getByTestId('prof-score')).toHaveText('7');
  await page.reload();await expect(page.locator('.kids-ending')).toBeVisible();await expect(page.getByTestId('team-score')).toHaveText('10');
  await phone.reload();await expect(phone.getByRole('heading',{name:'Gemeinsam seid ihr stark!'})).toBeVisible();
  await expect(phone.getByRole('button',{name:/30 Sekunden starten|Spiel abschließen|Revanche/})).toHaveCount(0);
  await expect(phone.locator('.kids-remote-question')).toHaveCount(0);await context.close();
});
