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
            if (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) errors.push(`${selector} overflow ${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight}`);
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
