import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const diagrams = JSON.parse(readFileSync('public/diagrams/index.json', 'utf8')) as {
  slug: string; title: string; preview: string;
}[];

test('los enlaces editoriales llevan a diagramas estáticos sin JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();

  await page.goto('/');
  for (const [name, slug] of [
    ['Portfolio', 'portfolio-ecosystem'],
    ['Modo Playa', 'modo-playa-ecosystem'],
    ['Foodly Notes', 'foodly-notes-ecosystem'],
  ]) {
    await expect(page.getByRole('link', { name: `Explorar arquitectura de ${name}`, exact: true }))
      .toHaveAttribute('href', `/diagrams/${slug}.html`);
  }

  await page.goto('/blog/cuando-docker-logs-dejo-de-ser-suficiente-en-produccion');
  await expect(page.getByRole('link', { name: 'Explorar el diagrama interactivo del stack de logs' }))
    .toHaveAttribute('href', '/diagrams/docker-observability.html');
  const logsPreview = page.getByRole('img', { name: 'De los logs de Docker a Grafana' });
  await expect(logsPreview).toBeVisible();
  await expect(logsPreview.locator('..')).toHaveAttribute('href', '/diagrams/docker-observability.html');
  await expect(page.locator('.blog-post__content .language-mermaid, .mermaid-diagram')).toHaveCount(0);

  await page.goto('/blog/arquitectura-angular-real');
  const preview = page.locator('.blog-post__content img[src^="/diagrams/"]');
  await expect(preview).toBeVisible();
  await expect(preview.locator('..')).toHaveAttribute('href', '/diagrams/angular-resource-layers.html');

  for (const { slug, title, preview: previewName } of diagrams) {
    expect((await page.request.get(`/diagrams/${previewName}`)).status()).toBe(200);
    const response = await page.goto(`/diagrams/${slug}.html`);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(`${title} · Diagrama`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('svg').first()).toBeVisible();
  }

  await context.close();
});

for (const { slug, title } of diagrams) {
  test(`${title}: visor disponible en escritorio y móvil`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/diagrams/${slug}.html`);
      await expect(page).toHaveTitle(`${title} · Diagrama`);
      await expect(page.locator('svg').first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}
