import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) => route.fulfill({ json: { suggestedQuestions: [] } }));
});

test('diagrama real y separación de texto sin overflow', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  for (const route of ['/', '/blog', '/blog/cuando-docker-logs-dejo-de-ser-suficiente-en-produccion']) {
    await page.goto(route);
    await expect(page.locator('h1')).toBeVisible();
    if (route.includes('docker-logs')) {
      const preview = page.getByRole('img', { name: 'De los logs de Docker a Grafana' });
      await expect(preview).toBeVisible();
      await expect(preview.locator('..')).toHaveAttribute('href', '/diagrams/docker-observability.html');
    }
    await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('contenido y destinos editoriales disponibles sin JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/blog/jerarquia-visual-importa-mas-de-lo-que-parece');
  await expect(page.locator('.blog-post__content h2[id]').first()).toBeVisible();
  await page.getByText('En este artículo', { exact: true }).click();
  const link = page.locator('.blog-post-toc a').first();
  const href = await link.getAttribute('href');
  await link.click();
  expect(new URL(page.url()).hash).toBe('#' + href?.split('#')[1]);
  await page.goto('/');
  await page.getByRole('link', { name: 'Ver proyectos' }).hover();
  await page.locator('.project-card__architecture summary').first().click();
  await expect(page.locator('.project-card__architecture p').first()).toBeVisible();
  await context.close();
});

test('el chat funciona cuando el navegador bloquea el almacenamiento', async ({ page }) => {
  await page.addInitScript(() => {
    for (const method of ['getItem', 'setItem'] as const) {
      Storage.prototype[method] = () => { throw new DOMException('Storage bloqueado', 'SecurityError'); };
    }
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.locator('.chat-fab').click();
  await expect(page.locator('.chat-widget')).toBeVisible();
  await page.route('**/api/chat', (route) => route.fulfill({
    json: { answer: 'Respuesta sin almacenamiento', suggestedQuestions: [], source: 'ai' },
  }));
  await page.locator('#chat-input').fill('¿Qué hace Modo Playa?');
  await page.locator('#chat-input').press('Enter');
  await expect(page.getByText('Respuesta sin almacenamiento', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

const routes = [
  '/',
  '/blog',
  '/blog/arquitectura-modo-playa',
  '/blog/desplegar-apis-docker-ec2',
  '/blog/jerarquia-visual-importa-mas-de-lo-que-parece',
];
for (const [width, height] of [
  [2560, 1440],
  [1920, 1080],
  [1366, 768],
  [768, 1024],
  [390, 844],
  [360, 800],
]) {
  test(`navegación y reflow a ${width} × ${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('h1')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(700);
      await page.keyboard.press('Tab');
      const skip = page.getByRole('link', { name: 'Saltar al contenido principal' });
      await expect(skip).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.locator('#main-content')).toBeFocused();
      expect(new URL(page.url()).pathname.replace(/\/$/, '')).toBe(route.replace(/\/$/, ''));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight / 2));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.getByRole('button', { name: 'Volver al inicio de la página' }).click();
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await page.reload();
      await expect(page.locator('h1')).toBeVisible();
    }
  });
}

test('búsqueda normalizada, orden exclusivo y estado vacío', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.locator('.blog-card').first()).toBeVisible();
  const initialCount = await page.locator('.blog-card').count();
  const search = page.getByLabel('Buscar posts');
  await search.fill('  DOCKER  ');
  await expect(page.locator('.blog-card')).toHaveCount(2);
  await search.fill('jerarquia');
  await expect(page.locator('.blog-card')).toHaveCount(1);
  await search.fill('JERARQUÍA');
  await expect(page.locator('.blog-card')).toHaveCount(1);
  await search.fill('tema inexistente xyz');
  await expect(page.getByText('No encontré posts para esa búsqueda.')).toBeVisible();
  await page.screenshot({ path: '.generated/design-review/states/blog-empty.png' });
  await search.fill('');
  await expect(page.locator('.blog-card')).toHaveCount(initialCount);
  const dates = () =>
    page
      .locator('.blog-card time')
      .evaluateAll((elements) => elements.map((e) => e.getAttribute('datetime')));
  const newest = await dates();
  await page.getByRole('radio', { name: 'Más viejos' }).check();
  await expect.poll(dates).toEqual([...newest].reverse());
  await expect(page.getByRole('radio', { name: 'Más nuevos' })).not.toBeChecked();
  await page.locator('.blog-card__link').first().click();
  await expect(page.locator('.blog-post__content')).toBeVisible();
  await page.getByRole('link', { name: 'Volver al listado del blog' }).click();
  await expect(search).toBeVisible();
});

test('contacto y suscripción con errores asociados sin efectos externos', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/contact', (route) => {
    requests++;
    return route.fulfill({ status: 500, json: { message: 'Error simulado' } });
  });
  await page.goto('/');
  await page.locator('#contact-name').fill('A');
  await page.locator('#contact-email').fill('incorrecto');
  await page.locator('#contact-email').blur();
  await expect(page.locator('#contact-email')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#contact-email')).toHaveAttribute(
    'aria-describedby',
    'contact-email-error',
  );
  await page.locator('#contact-name').fill('Prueba local');
  await page.locator('#contact-email').fill('local@example.com');
  await page
    .locator('#contact-message')
    .fill('Mensaje simulado para verificar el estado de error del formulario.');
  await page.locator('.contact-submit').click();
  await expect.poll(() => requests).toBe(1);
  await expect(page.getByRole('alert').first()).toBeVisible();
  await page.screenshot({ path: '.generated/design-review/states/contact-error.png' });
  await page.goto('/blog');
  await page.getByRole('button', { name: 'Suscribirme' }).click();
  await expect(page.locator('#blog-subscription-email')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#blog-subscription-error')).toBeVisible();
});

test('chat no modal, teclado, loading, respuesta extensa y error simulados', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const launcher = page.getByRole('button', { name: 'Abrir chatbot asistente' });
  await launcher.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).not.toHaveAttribute('aria-modal', 'true');
  await expect(page.locator('#chat-input')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(launcher).toBeFocused();
  await launcher.click();
  await page.getByRole('dialog').evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
  await page.route('**/api/chat', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.fulfill({
      json: {
        answer: 'Respuesta simulada extensa. '.repeat(100),
        source: 'ai',
        suggestedQuestions: [],
      },
    });
  });
  await page.locator('#chat-input').fill('Pregunta de prueba');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status', { name: 'Escribiendo' })).toBeVisible();
  await page.screenshot({ path: '.generated/design-review/states/chat-loading.png' });
  await expect(page.locator('.chat-bubble').last()).toContainText('Respuesta simulada');
  await page.screenshot({ path: '.generated/design-review/states/chat-long-answer.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.route('**/api/chat', (route) => route.fulfill({ status: 500, json: {} }));
  await page.locator('#chat-input').fill('Otra pregunta');
  await page.keyboard.press('Enter');
  await expect(page.locator('#chat-error')).toBeVisible();
  await expect(page.locator('.chat-bubble').last()).toBeInViewport();
  await expect
    .poll(() =>
      page
        .locator('.chat-messages')
        .evaluate((element) => element.scrollHeight - element.scrollTop - element.clientHeight),
    )
    .toBeLessThanOrEqual(1);
  await page.screenshot({ path: '.generated/design-review/states/chat-error.png' });
  await page.getByRole('button', { name: 'Cerrar chat' }).click();
  await expect(launcher).toBeFocused();
});

test('índice, listas, copiar código y fixtures editoriales sin overflow', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/blog/desplegar-apis-docker-ec2');
  await expect(page.locator('.code-copy').first()).toBeVisible();
  await page.locator('.code-copy').first().click();
  await expect(page.getByRole('status')).toContainText('Código copiado');
  await page.evaluate(() =>
    Object.defineProperty(navigator.clipboard, 'writeText', {
      configurable: true,
      value: () => Promise.reject(new Error('denegado')),
    }),
  );
  await page.locator('.code-copy').first().click();
  await expect(page.getByRole('status')).toContainText('No se pudo copiar');
  await page.goto('/blog/jerarquia-visual-importa-mas-de-lo-que-parece');
  await page.getByText('En este artículo', { exact: true }).click();
  const tocLink = page.locator('.blog-post-toc a').first();
  const target = await tocLink.getAttribute('href');
  await tocLink.click();
  await expect(page.locator(`#${target?.split('#')[1]}`)).toBeFocused();
  await page.setViewportSize({ width: 360, height: 800 });
  await page.locator('.blog-post__content').evaluate((element) => {
    element.insertAdjacentHTML(
      'beforeend',
      `<h4>Encabezado con <code>${'codigo_'.repeat(25)}</code></h4><ul><li>Primero<ol><li>Paso anidado</li></ol></li></ul><blockquote><p>Cita editorial</p></blockquote><p><a href="https://example.com">${'https://example.com/'.repeat(25)}</a></p><figure><img src="/assets/foodly-notes.webp" alt="Fixture local"><figcaption>Imagen local de prueba</figcaption></figure><div class="table-scroll" tabindex="0" role="region" aria-label="Tabla de prueba"><table><thead><tr><th>Columna</th></tr></thead><tbody><tr><td>${'dato'.repeat(150)}</td></tr></tbody></table></div><pre tabindex="0"><code>${'largo'.repeat(150)}</code></pre>`,
    );
  });
  expect(
    await page
      .locator('.blog-post__content ul')
      .first()
      .evaluate((e) => getComputedStyle(e).listStyleType),
  ).toBe('disc');
  expect(
    await page
      .locator('.blog-post__content ol')
      .first()
      .evaluate((e) => getComputedStyle(e).listStyleType),
  ).toBe('decimal');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('axe AA en rutas, foco y reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of routes.slice(0, 4)) {
    await page.goto(route);
    await expect(page.locator('h1')).toBeVisible();
    await page.waitForTimeout(300);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  }
  await page.goto('/');
  await page.locator('#contact-email').focus();
  expect(
    await page.locator('#contact-email').evaluate((e) => getComputedStyle(e).outlineStyle),
  ).toBe('solid');
  await page.getByRole('link', { name: 'Ver proyectos' }).click();
  await expect(page.locator('#projects')).toBeFocused();
  await page.getByRole('button', { name: 'Abrir chatbot asistente' }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});
