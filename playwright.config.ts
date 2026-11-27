import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: '.generated/playwright-results',
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: process.env['PORTFOLIO_BASE_URL'] ?? 'http://localhost:4200',
    browserName: 'chromium',
    channel: 'chromium',
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
  },
  webServer: process.env['PORTFOLIO_BASE_URL']
    ? undefined
    : {
        // El build se sirve con el emulador de Hosting para probar la misma configuración que se publica.
        command: process.env['PORTFOLIO_E2E_BUILD'] === 'true'
          ? 'npm run serve:hosting'
          : 'npm start -- --host 0.0.0.0',
        url: 'http://localhost:4200',
        reuseExistingServer: !process.env['CI'],
        timeout: 120000,
      },
});
