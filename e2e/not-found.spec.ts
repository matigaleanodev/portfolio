import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const site = 'https://matiasgaleano.dev';
const defaultImage = `${site}/assets/icons/icon-512.webp`;
const article = 'arquitectura-angular-real';
const project = 'modo-playa';
const heading = 'No encontramos esta página';

const missing = [
  '/ruta-inexistente',
  '/projects',
  `/projects/${project}/extra`,
  `/blog/${article}/extra`,
  '/blog/unsubscribe/extra',
  '/a/b/c/d?origen=correo#seccion',
];

test.use({ serviceWorkers: 'block' });

/** Como el rewrite de Hosting: lo que no tiene archivo propio recibe el index con 200. */
async function emulateHosting(page: Page, baseURL: string) {
  const origin = new URL(baseURL).origin;
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/api/')) {
      return route.fulfill({ json: { suggestedQuestions: [] } });
    }
    if (url.origin !== origin) return route.abort();
    const response = await route.fetch();
    // El servidor local lista las carpetas sin index; Hosting aplica el rewrite.
    const isDocument = route.request().resourceType() === 'document';
    const hasFile =
      response.status() !== 404 &&
      !(isDocument && (await response.text()).includes('Directory listing for'));
    if (hasFile) return route.fulfill({ response });
    return route.fulfill({ response: await route.fetch({ url: `${origin}/index.html` }) });
  });
}

test.beforeEach(({ page, baseURL }) => emulateHosting(page, baseURL!));
// Los pedidos que sigan en vuelo al terminar no son parte de la prueba.
test.afterEach(({ page }) => page.unrouteAll({ behavior: 'ignoreErrors' }));

const meta = (page: Page, selector: string) => page.locator(`head meta[${selector}]`);
const canonical = (page: Page) => page.locator('head link[rel="canonical"]');

/** Navegación del router sin recargar el documento. */
const go = (page: Page, path: string) =>
  page.evaluate((url) => {
    history.pushState({}, '', url);
    dispatchEvent(new PopStateEvent('popstate'));
  }, path);

async function expectNotIndexed(page: Page) {
  await expect(meta(page, 'name="robots"')).toHaveAttribute('content', 'noindex, follow');
  await expect(canonical(page)).toHaveCount(0);
  await expect(meta(page, 'property="og:url"')).toHaveCount(0);
  await expect(meta(page, 'property="og:image"')).toHaveAttribute('content', defaultImage);
  await expect(meta(page, 'name="twitter:image"')).toHaveAttribute('content', defaultImage);
  await expect(meta(page, 'property="og:image:width"')).toHaveAttribute('content', '512');
  await expect(meta(page, 'property="og:type"')).toHaveAttribute('content', 'website');
  await expect(page.locator('head meta[property^="article:"]')).toHaveCount(0);
}

async function expectNotFoundPage(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page).toHaveTitle('Página no encontrada | Matias Galeano');
  await expect(meta(page, 'name="twitter:title"')).toHaveAttribute(
    'content',
    'Página no encontrada | Matias Galeano',
  );
  await expectNotIndexed(page);
}

async function expectIndexed(page: Page, path: string) {
  await expect(meta(page, 'name="robots"')).toHaveAttribute('content', 'index, follow');
  await expect(canonical(page)).toHaveAttribute('href', `${site}${path}`);
  await expect(meta(page, 'property="og:url"')).toHaveAttribute('content', `${site}${path}`);
}

for (const path of missing) {
  test(`acceso directo a ${path}: 404 en la URL solicitada`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      // Los orígenes externos están bloqueados a propósito.
      if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
        errors.push(message.text());
      }
    });

    const response = await page.goto(path);

    expect(response?.status()).toBe(200);
    await expectNotFoundPage(page);
    const url = new URL(page.url());
    expect(url.pathname + url.search + url.hash).toBe(path);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).not.toBeFocused();
    expect(errors).toEqual([]);
  });
}

const indexable = [
  ['la portada', '/', '/'],
  ['el blog', '/blog', '/blog'],
  ['un artículo', `/blog/${article}`, `/blog/${article}`],
  ['un proyecto', `/projects/${project}`, `/projects/${project}`],
] as const;

for (const [name, path, canonicalPath] of indexable) {
  test(`navegar entre ${name} y una ruta inexistente no deja metadatos residuales`, async ({
    page,
  }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expectIndexed(page, canonicalPath);
    const title = await page.title();
    await page.evaluate(() => Object.assign(window, { sinRecarga: true }));

    await go(page, '/ruta/inexistente');
    await expectNotFoundPage(page);
    await expect(page.locator('h1')).toBeFocused();
    await expect(page).toHaveURL(/\/ruta\/inexistente$/);

    await page.goBack();
    await expect(page).toHaveTitle(title);
    await expectIndexed(page, canonicalPath);

    await page.goForward();
    await expectNotFoundPage(page);
    expect(await page.evaluate(() => 'sinRecarga' in window)).toBe(true);
  });

  test(`desde una ruta inexistente abierta directo se llega a ${name}`, async ({ page }) => {
    await page.goto('/ruta-inexistente');
    await expectNotFoundPage(page);

    await go(page, path);

    await expectIndexed(page, canonicalPath);
    await expect(page.getByRole('heading', { name: heading })).toHaveCount(0);
  });
}

const missingContent = [
  {
    name: 'artículo',
    path: '/blog/no-existe',
    heading: 'No encontramos este artículo',
    title: 'Artículo no encontrado | Matias Galeano',
    back: 'Volver al blog',
    destination: /\/blog\/?$/,
  },
  {
    name: 'proyecto',
    path: '/projects/no-existe',
    heading: 'No encontramos este proyecto',
    title: 'Proyecto no encontrado | Matias Galeano',
    back: 'Volver a proyectos',
    destination: /\/#projects-title$/,
  },
];

for (const state of missingContent) {
  test(`un ${state.name} inexistente comparte el estado 404 y sus metadatos`, async ({ page }) => {
    await page.goto(state.path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(state.heading);
    await expect(page.getByText('Error 404', { exact: true })).toBeVisible();
    await expect(page).toHaveTitle(state.title);
    await expect(page).toHaveURL(new RegExp(`${state.path}$`));
    await expectNotIndexed(page);

    await go(page, '/ruta-inexistente');
    await expectNotFoundPage(page);
    await go(page, state.path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(state.heading);
    await expect(page.locator('h1')).toBeFocused();
    await expect(page).toHaveTitle(state.title);

    const back = page.locator('#main-content').getByRole('link', { name: state.back });
    await back.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(state.destination);
    await expect(meta(page, 'name="robots"')).toHaveAttribute('content', 'index, follow');
  });
}

test('con teclado se salta al contenido y se vuelve al inicio', async ({ page }) => {
  await page.goto('/ruta-inexistente');
  await expectNotFoundPage(page);

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido principal' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  await expect(page).toHaveURL(/\/ruta-inexistente/);
  await page.keyboard.press('Tab');
  const home = page.getByRole('link', { name: 'Volver al inicio', exact: true });
  await expect(home).toBeFocused();
  await expect(home).toHaveCSS('outline-style', 'solid');

  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/$/);
  await expectIndexed(page, '/');
});

for (const colorScheme of ['light', 'dark'] as const) {
  for (const path of ['/ruta-inexistente', '/blog/no-existe', '/projects/no-existe']) {
    test(`${path} cumple accesibilidad en tema ${colorScheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.goto(path);
      await expect(page.getByText('Error 404', { exact: true })).toBeVisible();
      await page.waitForLoadState('networkidle');

      const { violations } = await new AxeBuilder({ page }).analyze();

      expect(violations.map((violation) => violation.id)).toEqual([]);
      await expect(page.locator('body')).toHaveCSS(
        'background-color',
        colorScheme === 'light' ? 'rgb(243, 244, 247)' : 'rgb(20, 26, 36)',
      );
    });
  }

  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [768, 1024],
    [1440, 900],
  ]) {
    test(`la 404 se acomoda a ${width}px en tema ${colorScheme}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.goto('/una-direccion-inexistente-muy-larga-sin-espacios-para-cortar');
      await expectNotFoundPage(page);

      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(0);
      const home = page.getByRole('link', { name: 'Volver al inicio', exact: true });
      await expect(home).toBeInViewport({ ratio: 1 });
      expect((await home.boundingBox())!.height).toBeGreaterThanOrEqual(48);
    });
  }
}

for (const [kind, separator] of [
  ['nuevo', '#'],
  ['histórico', '?'],
]) {
  test(`la baja con enlace ${kind} no se indexa y el blog recupera sus metadatos`, async ({
    page,
  }) => {
    await page.goto(`/blog/unsubscribe${separator}email=lector%40example.test`);
    await expect(page.getByLabel('Email')).toHaveValue('lector@example.test');
    await expect(page).toHaveURL(/\/blog\/unsubscribe\/?$/);
    await expectNotIndexed(page);

    await page.getByRole('link', { name: 'Cancelar' }).click();
    await expectIndexed(page, '/blog');

    await page.goBack();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expectNotIndexed(page);

    await go(page, `/blog/${article}`);
    await expectIndexed(page, `/blog/${article}`);
    await expect(meta(page, 'property="og:type"')).toHaveAttribute('content', 'article');
  });
}

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('la baja prerenderizada declara noindex sin canónica', async ({ page }) => {
    await page.goto('/blog/unsubscribe/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Confirmá la baja de la suscripción.',
    );
    await expectNotIndexed(page);
  });

  for (const [name, path, canonicalPath] of indexable) {
    test(`${name} sigue indexable en el HTML prerenderizado`, async ({ page }) => {
      await page.goto(path === '/' ? '/' : `${path}/`);

      await expect(page.locator('h1')).toHaveCount(1);
      await expectIndexed(page, canonicalPath);
    });
  }
});
