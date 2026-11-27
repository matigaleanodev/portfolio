import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/googletagmanager.com/**', (route) => route.abort());
  await page.route('**/api/chat/starters', (route) =>
    route.fulfill({ json: { suggestedQuestions: ['¿Qué tecnologías usás?'] } }),
  );
});

test('con movimiento reducido el progreso del chat se ve como texto', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir chatbot asistente' }).click();
  await expect(page.locator('#chat-status')).toHaveCSS('clip-path', 'none');
  await expect(page.locator('#chat-status')).toHaveCSS('position', 'static');
});

for (const width of [768, 1024, 1280]) {
  test(`el lanzador no tapa la última acción del pie a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
    const back = (await page
      .getByRole('button', { name: 'Volver al inicio de la página' })
      .boundingBox())!;
    const launcher = (await page.locator('.chat-fab').boundingBox())!;
    const overlaps =
      back.x < launcher.x + launcher.width &&
      back.x + back.width > launcher.x &&
      back.y < launcher.y + launcher.height &&
      back.y + back.height > launcher.y;
    expect(overlaps).toBe(false);
  });
}

test('en el blog con tema oscuro la selección sigue legible', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/blog');
  const background = await page
    .locator('.blog-page h1')
    .evaluate((el) => getComputedStyle(el, '::selection').backgroundColor);
  expect(background).toBe('rgb(46, 49, 82)');
});

test('con poca altura y 320px el campo del chat ocupa todo el ancho', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 400 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir chatbot asistente' }).click();
  expect((await page.locator('#chat-input').boundingBox())!.width).toBeGreaterThan(260);
  expect((await page.locator('.chat-messages').boundingBox())!.height).toBeGreaterThanOrEqual(80);
  await expect(page.locator('.chat-submit')).toBeInViewport({ ratio: 1 });
  await expect(page.locator('#chat-counter')).toBeInViewport({ ratio: 1 });
});

test('el header y el hero completan el primer pantallazo en escritorio', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const projects = page.locator('#projects');
  await expect.poll(async () => (await projects.boundingBox())!.y).toBeCloseTo(900, 0);
  await expect(page.locator('.hero-art')).toBeVisible();
  await expect(page.locator('#projects-title')).not.toBeInViewport();

  await page.locator('app-header').evaluate((header) => {
    header.style.paddingBottom = '18px';
  });
  await expect.poll(async () => (await projects.boundingBox())!.y).toBeCloseTo(900, 0);

  await page.getByRole('link', { name: 'Desplazarse a proyectos' }).click();
  await expect(projects).toBeFocused();
  await expect(page.locator('#projects-title')).toBeInViewport();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.hero-art')).toBeHidden();
});

test('Modo Playa comparte la grilla de proyectos y abre su ficha', async ({ page }) => {
  await page.goto('/');
  const projects = page.locator('#projects');
  await expect(projects.getByRole('heading', { name: 'Proyectos', exact: true })).toBeVisible();
  const card = projects.locator('.project-card').filter({ hasText: 'Modo Playa' });
  await expect(card).toHaveCount(1);
  await expect(card.getByRole('link')).toHaveCount(1);
  await expect(card.getByText('Decisión principal')).toHaveCount(0);
  await card.getByRole('link').click();
  await expect(page).toHaveURL(/\/projects\/modo-playa$/);
  await expect(page.getByRole('heading', { name: 'Modo Playa', level: 1 })).toBeFocused();
  await page.getByRole('link', { name: 'Volver a proyectos' }).click();
  await expect(page).toHaveURL(/#projects-title$/);
  await expect(page.locator('#projects')).not.toBeFocused();
});

test('con poca altura las sugerencias empiezan contraídas y se abren con teclado', async ({
  page,
}) => {
  await page.route('**/api/chat/starters', (route) =>
    route.fulfill({
      json: { suggestedQuestions: ['¿Qué tecnologías usás?', '¿Qué proyecto destacás?'] },
    }),
  );
  await page.setViewportSize({ width: 320, height: 400 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir chatbot asistente' }).click();
  const toggle = page.getByRole('button', { name: 'Sugerencias', exact: true });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.chat-chip')).toHaveCount(0);
  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.chat-chip')).toHaveCount(2);
  await expect(page.locator('.chat-submit')).toBeInViewport({ ratio: 1 });
});

for (const [width, height] of [
  [320, 400],
  [390, 360],
  [768, 300],
  [1440, 900],
] as const) {
  test(`el compositor mantiene el foco y Enviar visible a ${width} × ${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir chatbot asistente' }).click();
    await page.locator('#chat-widget').evaluate(async (element) => {
      await Promise.all(element.getAnimations().map((animation) => animation.finished));
    });
    const composer = page.locator('.chat-composer');
    await expect(composer).toHaveCSS('outline-width', '2px');
    const counter = (await composer.locator('#chat-counter').boundingBox())!;
    const send = (await composer.getByRole('button', { name: 'Enviar' }).boundingBox())!;
    expect(counter.x + counter.width).toBeLessThan(send.x);
    expect(counter.y + counter.height).toBeCloseTo(send.y + send.height, 0);
    expect((await page.locator('.chat-messages').boundingBox())!.height).toBeGreaterThanOrEqual(80);
    await expect(page.locator('.chat-submit')).toBeInViewport({ ratio: 1 });
  });
}

for (const width of [390, 1440]) {
  test(`la home se recorre con teclado y foco visible a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.locator('.project-card').first().waitFor();
    const total = await page.evaluate(
      () =>
        [
          ...document.querySelectorAll<HTMLElement>('a[href], button, input, textarea, summary'),
        ].filter((el) => el.tabIndex >= 0 && el.checkVisibility({ visibilityProperty: true }))
          .length,
    );
    const seen: string[] = [];
    for (let step = 0; step < total; step++) {
      await page.keyboard.press('Tab');
      await page.waitForFunction(() => {
        const el = document.activeElement!;
        const box = el.getBoundingClientRect();
        return box.bottom > 0 && box.top < innerHeight;
      });
      const state = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        el.dataset['visited'] ??= String(document.querySelectorAll('[data-visited]').length);
        const box = el.getBoundingClientRect();
        const hit = [0.1, 0.5, 0.9].some((f) => {
          const top = document.elementFromPoint(box.left + box.width * f, box.top + box.height / 2);
          return !!top && (el === top || el.contains(top));
        });
        return {
          id: el.dataset['visited']!,
          name: el.getAttribute('aria-label') || el.textContent?.trim() || el.id,
          hit,
          outline: getComputedStyle(el).outlineStyle,
        };
      });
      expect(state, `paso ${step}: ${state.name}`).toMatchObject({ hit: true, outline: 'solid' });
      seen.push(state.id);
    }
    // Cada control recibe el foco una vez: no hay trampas ni saltos.
    expect(new Set(seen).size).toBe(total);
  });
}

test('los mensajes del chat conservan los saltos de línea', async ({ page }) => {
  await page.route('**/api/chat', (route) =>
    route.fulfill({ json: { answer: 'Uno\n\nDos', source: 'faq', suggestedQuestions: [] } }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir chatbot asistente' }).click();
  await page.locator('#chat-input').fill('Hola');
  await page.getByRole('button', { name: 'Enviar', exact: true }).click();
  const text = page.locator('.chat-bubble__text').last();
  await expect(text).toContainText('Dos');
  expect(await text.evaluate((el: HTMLElement) => el.innerText)).toBe('Uno\n\nDos');
});
