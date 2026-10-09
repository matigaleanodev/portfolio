import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';

const phase = process.argv[2] ?? 'after';
const baseURL = process.env['PORTFOLIO_BASE_URL'] ?? 'http://localhost:4200';
const output = `.generated/design-review/${phase}`;
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'chromium' });
const measurements = process.env['RESUME_REVIEW']
  ? JSON.parse(await fs.readFile(`${output}/measurements.json`, 'utf8'))
  : [];
const fontCache = new Map();
const viewports = [
  [2560, 1440],
  [1920, 1080],
  [1366, 768],
  [768, 1024],
  [390, 844],
  [360, 800],
];
const routes = [
  '/',
  '/blog',
  '/blog/arquitectura-modo-playa',
  '/blog/desplegar-apis-docker-ec2',
  '/blog/jerarquia-visual-importa-mas-de-lo-que-parece',
];
for (const [width, height] of viewports) {
  if (measurements.some((entry) => entry.width === width)) continue;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.route('**/api/**', (route) => route.fulfill({ json: { suggestedQuestions: [] } }));
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, async (route) => {
    const url = route.request().url();
    if (!fontCache.has(url)) {
      const response = await route.fetch();
      fontCache.set(url, {
        body: await response.body(),
        contentType: response.headers()['content-type'],
      });
    }
    await route.fulfill(fontCache.get(url));
  });
  for (const route of routes) {
    await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded' });
    await page.locator('h1').waitFor();
    await page.evaluate(async () => {
      await document.fonts.ready;
      document.querySelectorAll('img').forEach((image) => (image.loading = 'eager'));
      await Promise.race([
        Promise.all([...document.images].map((image) => image.decode().catch(() => {}))),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]);
    });
    await page.waitForTimeout(2400);
    const name = route === '/' ? 'home' : route.split('/').pop();
    measurements.push(
      await page.evaluate(
        ({ route, width, height }) => {
          const box = (selector) => {
            const element = document.querySelector(selector);
            if (!element) return null;
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return {
              width: rect.width,
              height: rect.height,
              top: rect.top + scrollY,
              fontSize: style.fontSize,
              lineHeight: style.lineHeight,
              lineCountEstimate: Math.round(rect.height / parseFloat(style.lineHeight)),
            };
          };
          return {
            route,
            width,
            height,
            dpr: devicePixelRatio,
            zoom: visualViewport.scale,
            fontLoaded: document.fonts.check('16px "IBM Plex Sans"'),
            overflow: document.documentElement.scrollWidth > innerWidth,
            hero: box('.blog-hero-surface'),
            card: box('.blog-card'),
            title: box('h1'),
            project: box('.project-card'),
            logo: box('.project-card__media'),
            paragraph: box('.blog-post__content > p'),
            content: box('.blog-post__content'),
          };
        },
        { route, width, height },
      ),
    );
    await page.screenshot({ path: `${output}/${width}-${name}-top.png` });
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight / 2));
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${output}/${width}-${name}-middle.png` });
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${output}/${width}-${name}-end.png` });
  }
  await fs.writeFile(`${output}/measurements.json`, JSON.stringify(measurements, null, 2));
  console.log(width);
  await page.close();
}
await fs.writeFile(`${output}/measurements.json`, JSON.stringify(measurements, null, 2));
await browser.close();
console.log(`Saved ${measurements.length} measurements to ${output}`);
