import { expect, test, type Page } from '@playwright/test';

const withDiagram = 'arquitectura-angular-real';
const site = 'https://matiasgaleano.dev';

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

const resolved = (page: Page, variable: string) =>
  page.evaluate((name) => {
    const probe = document.body.appendChild(document.createElement('i'));
    probe.style.color = `var(${name})`;
    const { color } = getComputedStyle(probe);
    probe.remove();
    return color;
  }, variable);

/** Los bordes tienen transición: se lee el estilo recién cuando terminan. */
const settled = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate(async (element) => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await Promise.all(element.getAnimations().map((animation) => animation.finished));
      return getComputedStyle(element).borderTopColor;
    });

async function press(page: Page, selector: string) {
  const target = page.locator(selector).first();
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
}

const afterStyle = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((element) => {
      const style = getComputedStyle(element, '::after');
      return { content: style.content, width: style.borderTopWidth };
    });

for (const width of [390, 1440]) {
  test(`la imagen enlazada muestra el foco de teclado a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/blog/${withDiagram}`);
    await page.waitForLoadState('networkidle');
    const link = page.locator('.blog-post__content a:has(> img)').first();
    await link.scrollIntoViewIfNeeded();
    await link.locator('img').evaluate((image: HTMLImageElement) => image.decode());
    await link.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await link.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    const box = (await link.locator('img').boundingBox())!;
    const x = Math.max(0, box.x - 8);
    const clip = {
      x,
      y: box.y - 8,
      width: Math.min(box.width + 16, width - x),
      height: box.height + 16,
    };
    const focused = await page.screenshot({ clip });
    await link.evaluate((element: HTMLElement) => element.blur());

    expect((await page.screenshot({ clip })).equals(focused)).toBe(false);
  });

  test(`las imágenes del artículo reservan su alto antes de cargar a ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route('**/diagrams/*.png', async (route) => {
      await held;
      await route.continue();
    });
    await page.goto(`/blog/${withDiagram}`, { waitUntil: 'domcontentloaded' });
    const image = page.locator('.blog-post__content img').first();
    await expect(image).toHaveAttribute('width', /^\d+$/);
    await expect(image).toHaveAttribute('height', /^\d+$/);
    const following = page.locator('.blog-post__content p:has(> a > img) + p').first();
    const position = () =>
      following.evaluate((element) => element.getBoundingClientRect().top + scrollY);
    await page.evaluate(() => document.fonts.ready);
    const before = await position();

    release();
    await image.evaluate((element: HTMLImageElement) => element.decode());

    expect(Math.abs((await position()) - before)).toBeLessThan(1);
  });
}

for (const colorScheme of ['light', 'dark'] as const) {
  test(`la opción de orden seleccionada conserva el borde al presionarla (${colorScheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    await press(page, '.blog-sort label');

    expect(await settled(page, '.blog-sort label')).toBe(await resolved(page, '--color-accent'));
    await page.mouse.up();
  });

  test(`un campo conserva el borde de inválido y de foco bajo el puntero (${colorScheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/#contact');
    await page.waitForLoadState('networkidle');
    const email = page.locator('#contact-email');

    await email.fill('no-es-un-correo');
    await email.blur();
    await email.hover();
    expect(await settled(page, '#contact-email')).toBe(await resolved(page, '--color-danger'));

    const message = page.locator('#contact-message');
    await message.focus();
    await message.hover();
    expect(await settled(page, '#contact-message')).toBe(await resolved(page, '--color-accent'));
  });
}

test.describe('colores forzados', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  });

  test('marca la opción de orden presionada', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');

    for (const index of [1, 2]) {
      const segment = `.blog-sort .segment:nth-of-type(${index}) > label`;
      await press(page, segment);
      await expect
        .poll(() => afterStyle(page, segment), { message: `opción ${index}` })
        .toMatchObject({ content: '""', width: '3px' });
      await page.mouse.up();
    }
  });

  test('un botón en carga no dibuja el estado presionado', async ({ page }) => {
    await page.goto('/#contact');
    await page.waitForLoadState('networkidle');
    const submit = page.locator('.contact-submit');
    await submit.scrollIntoViewIfNeeded();
    await submit.evaluate((button) => button.setAttribute('aria-busy', 'true'));

    await press(page, '.contact-submit');

    expect((await afterStyle(page, '.contact-submit')).content).toBe('none');
  });

  test('el indicador de carga conserva un tramo abierto', async ({ page }) => {
    await page.route('**/api/contact', () => new Promise(() => undefined));
    await page.goto('/#contact');
    await page.waitForLoadState('networkidle');
    await page.locator('#contact-name').fill('Nombre de prueba');
    await page.locator('#contact-email').fill('lector@example.com');
    await page.locator('#contact-message').fill('Un mensaje de prueba suficiente.');
    await page.locator('.contact-submit').click();

    const colors = await page.locator('.contact-submit .btn__spinner').evaluate((spinner) => {
      const style = getComputedStyle(spinner);
      return [style.borderTopColor, style.borderLeftColor];
    });
    expect(colors[0]).not.toBe(colors[1]);
  });

  test('subraya la sección actual de la navegación', async ({ page }) => {
    await page.goto('/blog');

    await expect(page.locator('.header-nav a.is-active')).toHaveCSS(
      'text-decoration-line',
      'underline',
    );
  });

  test('muestra los puntos de escritura del chat sobre su burbuja', async ({ page }) => {
    await page.route('**/api/chat', () => new Promise(() => undefined));
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir chatbot asistente' }).click();
    await page.locator('#chat-input').fill('Hola');
    await page.locator('#chat-input').press('Enter');
    const dot = page.locator('.chat-typing span').first();
    await expect(dot).toBeVisible();

    const background = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(await background('.chat-typing span')).not.toBe(
      await background('.chat-bubble--assistant:has(.chat-typing)'),
    );
  });
});

test('una portada de proyecto que falla no desborda su tarjeta', async ({ page }) => {
  await page.route(/\/assets\/(modo_playa|foodly-notes|portfolio-platform|nora)\./, (route) =>
    route.abort(),
  );
  await page.goto('/');
  const image = page.locator('.project-card__image').first();
  await image.scrollIntoViewIfNeeded();
  await expect
    .poll(() => image.evaluate((element: HTMLImageElement) => element.complete))
    .toBe(true);

  expect(await image.evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBe(
    true,
  );
  await expect(image).toHaveAccessibleName(/^Ilustración del producto: /);
});

test('un artículo inexistente no hereda metadatos y se excluye del índice', async ({ page }) => {
  await page.goto(`/blog/${withDiagram}`);
  await page.waitForLoadState('networkidle');
  const meta = (selector: string) => page.locator(`head meta[${selector}]`);
  await expect(meta('property="og:image"')).toHaveAttribute(
    'content',
    `https://media.matiasgaleano.dev/og/${withDiagram}.png`,
  );
  const go = (path: string) =>
    page.evaluate((url) => {
      history.pushState({}, '', url);
      dispatchEvent(new PopStateEvent('popstate'));
    }, path);

  await go('/blog/no-existe');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(meta('name="robots"')).toHaveAttribute('content', 'noindex, follow');
  await expect(meta('property="og:image"')).toHaveAttribute(
    'content',
    `${site}/assets/icons/icon-512.webp`,
  );
  await expect(meta('property="og:image:width"')).toHaveAttribute('content', '512');
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(0);
  await expect(meta('property="og:url"')).toHaveCount(0);

  await go('/blog');
  await expect(meta('name="robots"')).toHaveAttribute('content', 'index, follow');
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', `${site}/blog`);
});

test('el HTML prerenderizado declara cada imagen social con sus dimensiones reales', async ({
  request,
}) => {
  const head = async (path: string) => (await request.get(path)).text();
  const property = (html: string, name: string) =>
    new RegExp(`<meta property="${name}" content="([^"]*)"`).exec(html)?.[1];

  const article = await head(`/blog/${withDiagram}/index.html`);
  expect(property(article, 'og:image')).toBe(
    `https://media.matiasgaleano.dev/og/${withDiagram}.png`,
  );
  expect(property(article, 'og:image:width')).toBe('1200');
  expect(property(article, 'og:image:height')).toBe('630');
  expect(article).toContain('<meta name="twitter:card" content="summary_large_image"');

  const home = await head('/index.html');
  expect(property(home, 'og:image:width')).toBe('512');
  expect(property(home, 'og:image:height')).toBe('512');

  const project = await head('/projects/modo-playa/index.html');
  expect(property(project, 'og:image')).toBe(`${site}/assets/modo_playa.webp`);
  expect(property(project, 'og:image:width')).toBeUndefined();
});
