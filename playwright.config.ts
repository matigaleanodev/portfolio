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
        command: process.env['PORTFOLIO_E2E_BUILD'] === 'true'
          ? 'python3 -m http.server 4200 --bind 127.0.0.1 --directory dist/portfolio/browser'
          : 'npm start -- --host 0.0.0.0',
        url: 'http://localhost:4200',
        reuseExistingServer: !process.env['CI'],
        timeout: 120000,
      },
});
