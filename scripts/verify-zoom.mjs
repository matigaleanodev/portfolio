import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const output = '.generated/design-review/zoom';
const extension = path.resolve(`${output}/extension`);
await fs.mkdir(extension, { recursive: true });
await fs.writeFile(
  `${extension}/manifest.json`,
  JSON.stringify({
    manifest_version: 3,
    name: 'Local zoom verification',
    version: '1.0',
    permissions: ['tabs'],
    background: { service_worker: 'background.js' },
  }),
);
await fs.writeFile(
  `${extension}/background.js`,
  'chrome.runtime.onInstalled.addListener(() => {});',
);
const context = await chromium.launchPersistentContext('', {
  channel: 'chromium',
  headless: true,
  viewport: null,
  args: [
    '--window-size=1366,855',
    `--disable-extensions-except=${extension}`,
    `--load-extension=${extension}`,
  ],
});
const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
const page = await context.newPage();
await page.route('**/api/**', (r) => r.fulfill({ json: { suggestedQuestions: [] } }));
const measurements = [];
for (const zoom of [2, 4]) {
  for (const route of ['/', '/blog', '/blog/desplegar-apis-docker-ec2']) {
    await page.goto(`http://localhost:4200${route}`);
    await worker.evaluate(async (zoom) => {
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find((tab) => tab.url?.startsWith('http://localhost:4200'));
      await chrome.tabs.setZoom(tab.id, zoom);
    }, zoom);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000);
    const result = await page.evaluate(() => ({
      width: innerWidth,
      height: innerHeight,
      dpr: devicePixelRatio,
      outerWidth,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    measurements.push({ zoom, route, ...result });
    if (result.overflow || Math.abs(result.dpr - zoom) > 0.1)
      throw new Error(JSON.stringify(measurements.at(-1)));
    await page.screenshot({
      path: `${output}/${zoom}-${route === '/' ? 'home' : route.split('/').pop()}.png`,
    });
  }
}
await fs.writeFile(`${output}/measurements.json`, JSON.stringify(measurements, null, 2));
console.log(measurements);
await context.close();
