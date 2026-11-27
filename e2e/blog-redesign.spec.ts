import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const withTables = 'del-pedido-de-negocio-a-la-review';
const withCode = 'errores-estables-dos-apis-reales';
const withoutImage = 'jerarquia-visual-importa-mas-de-lo-que-parece';
const withQuote = 'que-necesita-una-buena-tarjetita-de-jira';
const widths = [320, 390, 640, 768, 960, 1280, 1440];
const pages = [
  '/blog',
  '/blog/unsubscribe',
  ...[withTables, withCode, withoutImage, withQuote].map((slug) => `/blog/${slug}`),
];

test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page, baseURL }) => {
  const localHost = new URL(baseURL!).hostname;
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/api/')) {
      return route.fulfill({ json: { suggestedQuestions: [] } });
    }
    return url.hostname === localHost ? route.continue() : route.abort();
  });
});

const cards = (page: Page) => page.locator('.blog-card');
const search = (page: Page) => page.getByLabel('Buscar posts');
const noOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test('búsqueda y orden sobreviven al regreso desde un artículo', async ({ page }) => {
  await page.goto('/blog');
  await page.waitForLoadState('networkidle');
  await search(page).fill('angular');
  await page.getByRole('radio', { name: 'Más viejos' }).check();
  const titles = await page.locator('.blog-card__title').allInnerTexts();
  expect(titles.length).toBeGreaterThan(1);

  for (const back of ['historial', 'enlace'] as const) {
    await page.locator('.blog-card__link').first().click();
    await expect(page.locator('.blog-post__title')).toBeVisible();
    if (back === 'historial') await page.goBack();
    else await page.getByRole('link', { name: 'Volver al listado del blog' }).click();
    await expect(search(page)).toHaveValue('angular');
    await expect(page.getByRole('radio', { name: 'Más viejos' })).toBeChecked();
    await expect(page.locator('.blog-card__title')).toHaveText(titles);
  }
});

test('cero, uno y varios resultados, con salida desde el estado vacío', async ({ page }) => {
  await page.goto('/blog');
  await page.waitForLoadState('networkidle');
  const total = await cards(page).count();
  const results = page.locator('.blog-toolbar__results');

  await search(page).fill('zzzz sin coincidencias');
  await expect(cards(page)).toHaveCount(0);
  await expect(results).toContainText('Sin resultados');
  await page.getByRole('button', { name: 'Limpiar búsqueda' }).click();
  await expect(search(page)).toBeFocused();
  await expect(cards(page)).toHaveCount(total);

  const title = await page.locator('.blog-card__title').first().innerText();
  await search(page).fill(title);
  await expect(cards(page)).toHaveCount(1);
  await expect(results).toContainText('1 ');
});

test('toda la tarjeta navega con un solo enlace', async ({ page }) => {
  await page.goto('/blog');
  await page.waitForLoadState('networkidle');
  const card = cards(page).first();
  await expect(card.getByRole('link')).toHaveCount(1);
  const href = await card.getByRole('link').getAttribute('href');
  await card.locator('.blog-card__excerpt').click({ force: true });
  await expect(page).toHaveURL(new RegExp(`${href}$`));
});

test('el error del listado ofrece reintentar y recupera sin recargar', async ({ page }) => {
  let attempts = 0;
  await page.route('**/assets/blog/posts.json', (route) =>
    ++attempts === 1 ? route.abort() : route.continue(),
  );
  await page.goto(`/blog/${withoutImage}`);
  await page.waitForLoadState('networkidle');
  await page.getByRole('link', { name: 'Volver al listado del blog' }).click();
  await expect(page.getByRole('alert')).toContainText('No pudimos cargar los posts');
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(cards(page).first()).toBeVisible();
  await expect(page.locator('.blog-toolbar__results')).toBeFocused();
});

test('de una ruta inexistente a un artículo válido, con metadatos, sin recargar', async ({
  page,
}) => {
  // Reproduce el rewrite de Hosting: un slug ausente recibe el HTML de la aplicación.
  const shell = readFileSync(join(process.cwd(), 'dist/portfolio/browser/index.html'), 'utf8');
  await page.route(/\/(blog|assets\/blog\/posts)\/no-existe(\.json)?$/, (route) =>
    route.fulfill({ contentType: 'text/html', body: shell }),
  );
  await page.goto('/blog/no-existe');
  await expect(page.locator('h1')).toHaveText('No encontramos este artículo');
  await expect(page).toHaveTitle('Artículo no encontrado | Matias Galeano');
  await page.evaluate(() => Object.assign(window, { sinRecarga: true }));

  await page.locator('#main-content').getByRole('link', { name: 'Volver al blog' }).click();
  for (let index = 0; index < 2; index++) {
    const link = page.locator('.blog-card__link').nth(index);
    const title = await link.innerText();
    const href = await link.getAttribute('href');
    await link.click();
    await expect(page.locator('h1')).toHaveText(title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://matiasgaleano.dev${href}`,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      new RegExp(title.slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    await page.getByRole('link', { name: 'Volver al listado del blog' }).click();
  }
  expect(await page.evaluate(() => 'sinRecarga' in window)).toBe(true);
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('listado y artículo llegan prerenderizados', async ({ page }) => {
    await page.goto('/blog/');
    expect(await cards(page).count()).toBeGreaterThan(10);
    await page.goto(`/blog/${withCode}/`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.code-toolbar').first()).toBeVisible();
    await expect(page.locator('.code-copy').first()).toBeHidden();
    await expect(page.getByRole('region', { name: /^Código / }).first()).toBeVisible();
    await page.goto(`/blog/${withTables}/`);
    await expect(page.getByRole('region', { name: /^Tabla del artículo/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Volver al listado del blog' })).toHaveAttribute(
      'href',
      '/blog',
    );
  });

  test('la barra de código ocupa lo mismo antes y después de hidratar', async ({
    page,
    browser,
    baseURL,
  }) => {
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/blog/${withCode}/`);
      const prerendered = (await page.locator('.code-toolbar').first().boundingBox())!.height;
      const context = await browser.newContext({
        baseURL,
        viewport: { width, height: 900 },
        javaScriptEnabled: true,
      });
      const hydrated = await context.newPage();
      await hydrated.goto(`/blog/${withCode}/`);
      await expect(hydrated.locator('.code-copy').first()).toBeVisible();
      const height = (await hydrated.locator('.code-toolbar').first().boundingBox())!.height;
      await context.close();
      expect(height, `${width}px`).toBe(prerendered);
    }
  });
});

test('la copia no mueve el contenido y conserva el foco', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/blog/${withCode}`);
    await page.waitForLoadState('networkidle');
    const block = page.locator('.code-block').first();
    const button = block.locator('.code-copy');
    const before = await block.boundingBox();
    await button.focus();
    await button.press('Enter');
    await expect(block.getByRole('status')).toHaveText('Código copiado.');
    await expect(button).toBeFocused();
    expect((await block.boundingBox())!.height).toBe(before!.height);
    await page.evaluate(() =>
      Object.defineProperty(navigator.clipboard, 'writeText', {
        configurable: true,
        value: () => Promise.reject(new Error('denegado')),
      }),
    );
    await button.press('Enter');
    await expect(block.getByRole('status')).toContainText('No se pudo copiar');
    await expect(button).toBeFocused();
    expect(await noOverflow(page)).toBe(true);
    // El mensaje más largo también cabe en el espacio reservado.
    expect((await block.boundingBox())!.height, `${width}px`).toBe(before!.height);
  }
});

test('el cuerpo y los bloques anchos del artículo comparten el eje de lectura', async ({
  page,
}) => {
  await page.setViewportSize({ width: 2560, height: 900 });
  await page.goto('/blog/desplegar-apis-docker-ec2');
  const content = page.locator('.blog-post__content');
  const text = content.locator(':scope > p').first();
  const code = content.locator('.code-block').first();
  const diagram = content.locator('p:has(> a[href^="/diagrams/"] > img)').first();
  await expect(text).toHaveCSS('width', '800px');
  await expect(text).toHaveCSS('font-size', '18px');
  await expect(text).toHaveCSS('line-height', '30.6px');
  await expect(code).toHaveCSS('width', '960px');
  await expect(diagram).toHaveCSS('width', '960px');
  const center = async (locator: typeof text) => {
    const box = (await locator.boundingBox())!;
    return box.x + box.width / 2;
  };
  expect(await center(code)).toBe(await center(text));
  expect(await center(diagram)).toBe(await center(text));

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(text).toHaveCSS('font-size', '17px');
  expect(await noOverflow(page)).toBe(true);
});

for (const scheme of ['light', 'dark'] as const) {
  test(`axe AA y sin desborde de 320 a 1440 en tema ${scheme}`, async ({ page }) => {
    test.setTimeout(150_000);
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    for (const path of pages) {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      for (const width of widths) {
        await page.setViewportSize({ width, height: 800 });
        expect(await noOverflow(page), `${path} ${width}px`).toBe(true);
        if (width === 390 || width === 1440) {
          const result = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze();
          expect(
            result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' ')}`),
            `${path} ${width}px`,
          ).toEqual([]);
        }
      }
    }
  });
}

for (const width of [320, 390]) {
  test(`el lanzador no tapa el foco al recorrer con teclado a ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 700 });
    for (const path of ['/blog', `/blog/${withCode}`, '/blog/unsubscribe']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const covered: string[] = [];
      for (let step = 0; step < 90; step++) {
        await page.keyboard.press('Tab');
        const overlap = await page.evaluate(() => {
          const target = document.activeElement as HTMLElement;
          const fab = document.querySelector('.chat-fab');
          if (!fab || !target || target === document.body || target === fab) return null;
          // En las tarjetas el área activa es toda la tarjeta; se mide el título enfocado.
          const a = target.getBoundingClientRect();
          const b = fab.getBoundingClientRect();
          const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (x <= 0 || y <= 0) return null;
          const share = (x * y) / (a.width * a.height);
          return `${target.tagName}.${target.className} ${target.textContent?.trim().slice(0, 30)} ${Math.round(share * 100)}%`;
        });
        if (overlap) covered.push(overlap);
      }
      console.log(`foco ${width}px ${path}: ${JSON.stringify(covered)}`);
      // Criterio 2.4.11: ningún elemento enfocado queda totalmente oculto.
      expect(covered.filter((entry) => entry.endsWith(' 100%'))).toEqual([]);
    }
  });
}

for (const width of [390, 1440]) {
  test(`navegar con el JSON demorado no desplaza el contenido a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.route(/\/assets\/blog\/(posts|posts\/[^/]+)\.json$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await page.addInitScript(() => {
      const state = window as unknown as { shift: number };
      state.shift = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        })[]) {
          if (!entry.hadRecentInput) state.shift += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    const shift = () => page.evaluate(() => (window as unknown as { shift: number }).shift);
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    await page.locator(`.blog-card__link[href="/blog/${withoutImage}"]`).click();
    await expect(page.locator('.blog-post__content > p').first()).toBeVisible();
    await page.waitForTimeout(300);
    expect(await shift(), 'listado a artículo').toBeLessThanOrEqual(0.1);

    const before = await shift();
    await page.getByRole('link', { name: 'Volver al listado del blog' }).click();
    await expect(cards(page).first()).toBeVisible();
    await page.waitForTimeout(300);
    expect((await shift()) - before, 'artículo a listado').toBeLessThanOrEqual(0.1);
  });
}

test('un botón en Loading conserva sus colores con puntero encima y presionado', async ({
  page,
}) => {
  await page.goto(`/blog/${withCode}`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() =>
    Object.defineProperty(navigator.clipboard, 'writeText', {
      configurable: true,
      value: () => new Promise(() => {}),
    }),
  );
  const colors = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.backgroundColor, style.borderColor, style.color].join(' | ');
      });
  const button = page.locator('.code-copy').first();
  await button.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const idle = await colors('.code-copy');
  await button.click();
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await button.hover();
  await expect.poll(() => colors('.code-copy')).toBe(idle);
  await page.mouse.down();
  await expect.poll(() => colors('.code-copy')).toBe(idle);
  await page.mouse.up();

  // Secundario: mismo contrato, con el atributo aplicado sobre el reintento del listado.
  await page.route('**/assets/blog/posts.json', (route) => route.abort());
  await page.getByRole('link', { name: 'Volver al listado del blog' }).click();
  const retry = page.getByRole('button', { name: 'Reintentar' });
  await page.mouse.move(0, 0);
  const rest = await colors('.blog-load-error .btn');
  await retry.evaluate((element) => element.setAttribute('aria-busy', 'true'));
  await retry.hover();
  await page.waitForTimeout(300);
  expect(await colors('.blog-load-error .btn')).toBe(rest);
  await page.mouse.down();
  await page.waitForTimeout(300);
  expect(await colors('.blog-load-error .btn')).toBe(rest);
});

test('los títulos de nivel 2 del listado usan peso 600', async ({ page }) => {
  await page.goto('/blog');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Buscar posts').fill('zzzz');
  for (const selector of ['.blog-empty-state h2', '.blog-toolbar__subscribe-copy h2']) {
    await expect(page.locator(selector)).toHaveCSS('font-weight', '600');
  }
});
