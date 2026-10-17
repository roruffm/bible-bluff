import { expect, test } from '@playwright/test';

test.use({ isMobile: false });
test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

test('Kids: Inhalte bleiben bei schmalen und flachen Fenstern erreichbar', async ({ page }) => {
  const sizes = [{ width: 844, height: 390 }, { width: 1024, height: 500 }, { width: 768, height: 1024 }, { width: 390, height: 844 }];
  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.goto('/kids');
    await page.getByRole('button', { name: 'Show vorbereiten', exact: false }).click();
    await page.getByRole('button', { name: 'Mission starten', exact: true }).click();
    await page.getByRole('button', { name: 'Erste Aufgabe im Kapitel', exact: true }).click();
    const inspect = async (stage: string) => {
      const problems = await page.evaluate(() => {
        const root = document.querySelector('.kids-page')!;
        const boundary = root.getBoundingClientRect();
        const errors: string[] = [];
        for (const selector of ['.kids-playing-bar > *', '.kids-top-actions > *', '#kids-question', '.kids-status', '.kids-answer-text', '.kids-operator-actions', '.kids-ending > header', '.kids-ending-host', '.kids-ending-results', '.kids-ending > footer']) {
          for (const el of document.querySelectorAll(selector)) {
            const box = el.getBoundingClientRect();
            if (!box.width || !box.height) continue;
            if (box.left < -1 || box.right > innerWidth + 1 || box.top < -1 || box.bottom > boundary.bottom + 1) errors.push(`${selector} outside ${JSON.stringify(box.toJSON())}`);
            if (!el.matches('.kids-logo') && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2)) errors.push(`${selector} overflow ${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight}`);
          }
        }
        return errors;
      });
      expect.soft(problems, `${size.width}x${size.height} ${stage}`).toEqual([]);
    };
    await inspect('Frage');
    await page.getByRole('button', { name: 'Spiel mit Punktestand abschließen', exact: true }).click();
    await page.getByRole('button', { name: 'Jetzt mit Punktestand abschließen', exact: true }).click();
    await inspect('Abschluss');
  }
});


test('Kids: question is centered and synchronized timers sit in both bottom corners', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/kids');
  await page.getByRole('button', { name: 'Show vorbereiten', exact: false }).click();
  await page.getByRole('button', { name: 'Mission starten', exact: true }).click();
  await page.getByRole('button', { name: 'Erste Aufgabe im Kapitel', exact: true }).click();

  const inspect = async () => {
    const layout = await page.evaluate(() => {
      const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      const question = rect('#kids-question');
      const whitePanel = rect('.kids-show-question');
      const left = rect('.kids-bottom .kids-clock-left');
      const right = rect('.kids-bottom .kids-clock-right');
      const center = (r: DOMRect) => ({ x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 });
      return {
        count: document.querySelectorAll('.kids-bottom .kids-corner-clock').length,
        xOffset: Math.abs(center(question).x - center(whitePanel).x),
        yOffset: Math.abs(center(question).y - center(whitePanel).y),
        leftX: left.left, rightX: right.right,
        bottomOffset: Math.abs(left.bottom - right.bottom),
        bottomMargin: innerHeight - left.bottom,
        clockNumbers: [...document.querySelectorAll('.kids-bottom .kids-corner-clock b')].map(el => el.textContent),
        visible: [left, right].every(r => r.width > 0 && r.height > 0),
      };
    });
    expect(layout.count).toBe(2);
    expect(layout.xOffset).toBeLessThan(3);
    expect(layout.yOffset).toBeLessThan(20);
    expect(layout.leftX).toBeLessThan(85);
    expect(layout.rightX).toBeGreaterThan(1355);
    expect(layout.bottomOffset).toBeLessThan(2);
    expect(layout.bottomMargin).toBeGreaterThanOrEqual(0);
    expect(layout.bottomMargin).toBeLessThan(60);
    expect(layout.clockNumbers[0]).toBe(layout.clockNumbers[1]);
    expect(layout.visible).toBe(true);
  };

  await inspect();
  await page.getByRole('button', { name: 'Bedienung', exact: true }).click();
  await page.getByRole('button', { name: 'Nur Spiel anzeigen', exact: true }).click();
  await inspect();
});
