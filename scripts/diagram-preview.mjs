import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

export async function captureDiagramPreview(htmlPath, previewPath) {
  const browser = await chromium.launch({
    ...(process.env.ARCHIFY_CHROME ? { executablePath: process.env.ARCHIFY_CHROME } : { channel: 'chromium' }),
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
    await page.goto(pathToFileURL(htmlPath).href);
    await page.evaluate(() => document.fonts.ready);
    const preview = await page.locator('svg[aria-labelledby="archify-diagram-title archify-diagram-description"]')
      .screenshot({
        path: previewPath,
        animations: 'disabled',
        style: '.diagram-nav, .toolbar, .rail-controls { visibility: hidden !important; }',
      });
    return createHash('sha256').update(preview).digest('hex');
  } finally {
    await browser.close();
  }
}
