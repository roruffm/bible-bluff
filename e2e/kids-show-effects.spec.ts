import { expect, test, type Page } from '@playwright/test';
import { showKidsOperator } from './kids-operator';

test.use({viewport:{width:1280,height:800},isMobile:false});

async function begin(page: Page) {
  await page.goto('/kids');
  await page.getByRole('button',{name:'Show vorbereiten',exact:false}).click();
  await showKidsOperator(page);
  await page.getByRole('button',{name:'Mission starten',exact:true}).click();
  await page.getByRole('button',{name:'Erste Aufgabe im Kapitel',exact:true}).click();
}
async function judging(page: Page) {
  await page.getByRole('button',{name:'Bedienung',exact:false}).click();
  await page.getByRole('button',{name:'Countdown überspringen',exact:true}).click();
  await page.getByRole('button',{name:'Zurück in die Gruppen',exact:true}).click();
  await page.getByRole('button',{name:'Alle sind zurück',exact:true}).click();
}

async function expectMascotArrival(page: Page, group: 'minis' | 'mittis' | 'maxis') {
  const perch = page.locator(`.kids-active-group .kids-mascot-perch.is-${group}`);
  await expect(perch).toHaveClass(/is-flying/);
  await expect(perch.locator('.kids-mascot-orbit')).toHaveCount(2);
  await expect(perch.locator('.kids-mascot-stunt')).toHaveCSS('animation-name', 'kids-mascot-aerobatics');
  await expect(page.locator('.kids-mascot-star-trail')).toHaveCount(1);
  await expect(page.locator('.kids-mascot-star-trail')).toHaveCSS('pointer-events', 'none');
  await expect.poll(() => page.locator('.kids-mascot-star-trail').evaluate(el => {
    const canvas = el as HTMLCanvasElement;
    return canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0);
  }), {timeout: 2500}).toBe(true);
  const bounds = await perch.evaluate(el => {
    const sprite = el.querySelector('.kids-mascot-arrival')!;
    const animations = sprite.getAnimations({subtree:true}).filter(a => a.effect!.getTiming().iterations !== Infinity);
    for (const animation of animations) { animation.pause(); animation.currentTime = 1050; }
    const large = sprite.getBoundingClientRect().toJSON();
    const figure = sprite.querySelector('.kids-mascot')!.getBoundingClientRect().toJSON();
    const seat = el.getBoundingClientRect().toJSON();
    for (const animation of animations) animation.finish();
    const landed = sprite.getBoundingClientRect().toJSON();
    return { large, figure, seat, landed, width: innerWidth, height: innerHeight };
  });
  // Echter großer Bühnenauftritt, vollständig im Bild, danach exakt am Banner statt als zweites Overlay.
  expect(bounds.large.width).toBeGreaterThan(bounds.seat.width * 2);
  expect(bounds.large.left).toBeGreaterThanOrEqual(0);
  expect(bounds.large.right).toBeLessThanOrEqual(bounds.width);
  expect(bounds.large.top).toBeGreaterThanOrEqual(0);
  expect(bounds.large.bottom).toBeLessThanOrEqual(bounds.height);
  expect(bounds.figure.left).toBeGreaterThanOrEqual(0);
  expect(bounds.figure.right).toBeLessThanOrEqual(bounds.width);
  expect(bounds.figure.top).toBeGreaterThanOrEqual(0);
  expect(bounds.figure.bottom).toBeLessThanOrEqual(bounds.height);
  expect(bounds.landed.x).toBeCloseTo(bounds.seat.x, 0);
  expect(bounds.landed.y).toBeCloseTo(bounds.seat.y, 0);
  expect(bounds.landed.width).toBeCloseTo(bounds.seat.width, 0);
  await expect(page.locator('.kids-active-group .kids-mascot')).toHaveCount(1);
  await expect(perch).toHaveCSS('pointer-events', 'none');
  await expect(perch).not.toHaveClass(/is-flying/, {timeout: 5000});
  await expect(page.locator('.kids-mascot-star-trail')).toHaveCount(0);
  await expect(perch.locator('.kids-mascot')).toBeVisible();
}

test('Kids: Gruppenauftritt, Punkteflug nach dem Trommelwirbel und kein Wiederholen nach Neuladen', async ({page}) => {
  await begin(page);
  await expect(page.locator('.kids-active-group')).toHaveClass(/is-mascot-entering/);
  await expectMascotArrival(page, 'minis');
  await judging(page);
  await page.getByRole('button',{name:'Mehrheit richtig · +10',exact:true}).click();
  await expect(page.locator('.kids-suspense')).toBeVisible();
  await expect(page.locator('.kids-points-flight')).toHaveCount(0);
  await expect(page.locator('.kids-points-token')).toContainText('+10',{timeout:8000});
  await expect(page.locator('.kids-points-token [data-group="minis"]')).toHaveCount(1);
  await expect(page.locator('.kids-points-flight')).toHaveCSS('pointer-events','none');
  await expect(page.getByTestId('team-score')).toHaveText('10');

  await page.reload();
  await page.getByRole('button',{name:'Show fortsetzen',exact:true}).click();
  await showKidsOperator(page);
  await expect(page.locator('.kids-points-flight')).toHaveCount(0);
  await page.getByRole('button',{name:'Nächste Aufgabe',exact:true}).click();
  await expect(page.locator('.kids-active-group')).toHaveClass(/is-mascot-entering/);
  await expectMascotArrival(page, 'mittis');
  await judging(page);
  await page.getByRole('button',{name:'Keiner richtig · +0',exact:true}).click();
  await expect(page.locator('.kids-suspense')).toBeVisible();
  await expect(page.locator('.kids-suspense')).toHaveCount(0,{timeout:8000});
  await expect(page.locator('.kids-points-flight')).toHaveCount(0);
  await page.getByRole('button',{name:'Nächste Aufgabe',exact:true}).click();
  await expectMascotArrival(page, 'maxis');
});

test('Kids: Reduzierte Bewegung zeigt die Wertung sofort und verzichtet auf Auftritte und Punkteflug', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await begin(page);
  await expect(page.locator('.kids-active-group')).not.toHaveClass(/is-mascot-entering/);
  await expect(page.locator('.kids-mascot-perch.is-flying')).toHaveCount(0);
  await expect(page.locator('.kids-mascot-star-trail')).toHaveCount(0);
  await expect(page.locator('.kids-active-group .kids-mascot')).toBeVisible();
  await judging(page);
  await page.getByRole('button',{name:'Mehrheit richtig · +10',exact:true}).click();
  await expect(page.getByTestId('team-score')).toHaveText('10');
  await expect(page.locator('.kids-points-flight')).toHaveCount(0);
  await expect(page.locator('.kids-suspense')).toHaveCount(0);
  await page.getByRole('button',{name:'Direkt ins Finale',exact:true}).click();
  await page.getByRole('button',{name:'Gemeinsam ins Finale',exact:true}).click();
  await expect(page.locator('.kids-active-group .kids-mascot')).toHaveCount(3);
  await expect(page.locator('.kids-active-group')).not.toHaveClass(/is-mascot-entering/);
  await expect(page.locator('.kids-mascot-perch.is-flying, .kids-mascot-star-trail')).toHaveCount(0);
});

for (const viewport of [{width:1280,height:800}, {width:390,height:844}]) {
  test(`Kids: Drei Maskottchen fliegen gemeinsam aufs Finalschild (${viewport.width}px)`, async ({page}) => {
    await page.setViewportSize(viewport);
    await begin(page);
    await page.getByRole('button',{name:'Direkt ins Finale',exact:true}).click();
    await page.getByRole('button',{name:'Gemeinsam ins Finale',exact:true}).click();
    const banner = page.locator('.kids-active-group.is-finale-team');
    await expect(banner.locator('.kids-mascot-perch.is-flying')).toHaveCount(3);
    await expect(banner.locator('.kids-mascot-orbit')).toHaveCount(6);
    await expect(page.locator('.kids-mascot-star-trail')).toHaveCount(3);
    const formation = await banner.evaluate(el => {
      const perches = Array.from(el.querySelectorAll('.kids-mascot-perch'));
      const animations = perches.flatMap(perch => perch.getAnimations({subtree:true}))
        .filter(animation => animation.effect!.getTiming().iterations !== Infinity);
      for (const animation of animations) { animation.pause(); animation.currentTime = 1050; }
      const flight = perches.map(perch => ({
        path: getComputedStyle(perch).getPropertyValue('--arrival-path'),
        large: perch.querySelector('.kids-mascot-arrival')!.getBoundingClientRect().toJSON(),
        seat: perch.getBoundingClientRect().toJSON(),
      }));
      for (const animation of animations) animation.finish();
      return {flight, landed:perches.map(perch => perch.querySelector('.kids-mascot-arrival')!.getBoundingClientRect().toJSON()),
        label:el.querySelector('.kids-group-name')!.getBoundingClientRect().toJSON(),
        banner:el.getBoundingClientRect().toJSON(), width:innerWidth, height:innerHeight};
    });
    expect(new Set(formation.flight.map(mascot => mascot.path)).size).toBe(3);
    formation.flight.forEach(({large,seat}, index) => {
      expect(large.width).toBeGreaterThan(seat.width * 1.5);
      expect(large.left).toBeGreaterThanOrEqual(0);
      expect(large.right).toBeLessThanOrEqual(formation.width);
      expect(large.top).toBeGreaterThanOrEqual(0);
      expect(large.bottom).toBeLessThanOrEqual(formation.height);
      expect(formation.landed[index].x).toBeCloseTo(seat.x, 0);
      expect(formation.landed[index].y).toBeCloseTo(seat.y, 0);
      expect(formation.landed[index].width).toBeCloseTo(seat.width, 0);
      if (index) expect(seat.left).toBeGreaterThan(formation.flight[index - 1].seat.right);
      expect(seat.right <= formation.label.left || seat.bottom <= formation.label.top).toBe(true);
    });
    expect(formation.banner.left).toBeGreaterThanOrEqual(0);
    expect(formation.banner.right).toBeLessThanOrEqual(formation.width);
    await expect(banner.locator('.kids-mascot-perch.is-flying')).toHaveCount(0, {timeout:5000});
    await expect(page.locator('.kids-mascot-star-trail')).toHaveCount(0);
    await expect(banner.locator('.kids-mascot')).toHaveCount(3);
    await page.reload();
    await page.getByRole('button',{name:'Show fortsetzen',exact:true}).click();
    await expect(page.locator('.kids-active-group .kids-mascot')).toHaveCount(3);
    await expect(page.locator('.kids-mascot-perch.is-flying, .kids-mascot-star-trail')).toHaveCount(0);
  });
}
