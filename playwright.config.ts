import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 4317);

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Pixel 7'],
    locale: 'de-DE',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run build && PORT=${PORT} npx tsx scripts/serve.ts`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
