import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const wcag = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

test.beforeEach(async ({ page }) => {
  await page.route('**/googletagmanager.com/**', (route) => route.abort());
  await page.route('**/api/chat/starters', (route) =>
    route.fulfill({
      json: { suggestedQuestions: ['¿Qué tecnologías usás?', '¿Qué proyecto destacás?'] },
    }),
  );
});

async function openChat(page: Page) {
  const launcher = page.getByRole('button', { name: 'Abrir chatbot asistente' });
  await launcher.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#chat-input')).toBeFocused();
  await page.locator('#chat-widget').evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
  return launcher;
}

/** Describe el control enfocado: si está en el chat y si algo de él se ve en pantalla. */
const focusState = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const box = el.getBoundingClientRect();
    const xs = [box.left + 2, box.left + box.width / 2, box.right - 2];
    const ys = [box.top + 2, box.top + box.height / 2, box.bottom - 2];
    const visible = xs.some((x) =>
      ys.some((y) => {
        const hit = document.elementFromPoint(x, y);
        return !!hit && (el === hit || el.contains(hit));
      }),
    );
    return {
      name: `${el.tagName} ${el.id} ${el.textContent?.trim().slice(0, 30)}`,
      isBody: el === document.body,
      inChat: !!el.closest('#chat-widget'),
      visible,
      outline: getComputedStyle(el).outlineStyle,
      accessibleName:
        el.getAttribute('aria-label') ||
        el.textContent?.trim() ||
        (el as HTMLInputElement).labels?.[0]?.textContent,
    };
  });

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [320, 400],
  [390, 360],
] as const) {
  test(`chat modal con teclado a ${width} × ${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const launcher = await openChat(page);
    await expect(page.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('.app-shell')).toHaveAttribute('inert', '');
    await expect(page.locator('.skip-link')).toHaveAttribute('inert', '');
    await page.locator('#chat-input').fill('Hola');

    for (const key of ['Tab', 'Shift+Tab']) {
      for (let step = 0; step < 12; step++) {
        await page.keyboard.press(key);
        await expect
          .poll(async () => await focusState(page), { message: `${key} ${step}` })
          .toMatchObject({ inChat: true, visible: true, outline: 'solid' });
        expect((await focusState(page)).accessibleName).toBeTruthy();
      }
    }

    // La conversación conserva un alto utilizable aun con poca altura.
    expect((await page.locator('.chat-messages').boundingBox())!.height).toBeGreaterThanOrEqual(80);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.keyboard.press('Escape');
    await expect(launcher).toBeFocused();
    await expect(page.locator('.app-shell')).not.toHaveAttribute('inert', '');
  });
}

test('el botón de cierre devuelve el foco y el lanzador oculto no es enfocable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const launcher = await openChat(page);
  expect(
    await page.locator('.chat-fab').evaluate((el: HTMLElement) => {
      el.focus();
      return document.activeElement === el;
    }),
  ).toBe(false);
  await page.getByRole('button', { name: 'Cerrar chat' }).press('Enter');
  await expect(launcher).toBeFocused();
});

test('el foco no se pierde al enviar, usar sugerencias ni recibir respuesta', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/api/chat', async (route) => {
    await gate;
    await route.fulfill({ json: { answer: 'Respuesta', source: 'faq', suggestedQuestions: [] } });
  });
  await page.goto('/');
  await openChat(page);
  await page.getByRole('button', { name: '¿Qué tecnologías usás?' }).press('Enter');
  await expect(page.locator('#chat-input')).toBeFocused();
  release();
  await expect(page.locator('.chat-bubble').last()).toContainText('Respuesta');
  await expect(page.locator('#chat-input')).toBeFocused();
  await page.locator('#chat-input').fill('Otra');
  await page.getByRole('button', { name: 'Enviar', exact: true }).press('Enter');
  await expect(page.locator('#chat-input')).toBeFocused();
});

for (const [width, height] of [
  [768, 300],
  [1024, 700],
  [1440, 900],
] as const) {
  test(`panel no modal sin foco tapado a ${width} × ${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/blog');
    await expect(page.locator('.blog-card').first()).toBeVisible();
    await openChat(page);
    await expect(page.getByRole('dialog')).not.toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('.app-shell')).not.toHaveAttribute('inert', '');

    // Hacia atrás desde el panel se recorre la página completa, incluido el pie.
    let outside = 0;
    for (let step = 0; step < 90; step++) {
      await page.keyboard.press('Shift+Tab');
      const state = await focusState(page);
      if (state.isBody) continue;
      if (!state.inChat) outside++;
      await expect
        .poll(async () => (await focusState(page)).visible, { message: state.name })
        .toBe(true);
    }
    expect(outside).toBeGreaterThan(10);
  });
}

test('en escritorio Escape actúa solo desde el panel', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/blog');
  const launcher = await openChat(page);
  const search = page.locator('main input').first();
  await search.focus();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(search).toBeFocused();
  await page.locator('#chat-input').focus();
  await page.keyboard.press('Escape');
  await expect(launcher).toBeFocused();
});

test('al achicar el viewport el panel pasa a modal y recupera el foco', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/blog');
  await openChat(page);
  await page.locator('main input').first().focus();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  await expect(page.locator('#chat-input')).toBeFocused();
});

/** Razón WCAG entre un color CSS del elemento y el fondo compuesto de sus ancestros. */
const contrast = (
  page: Page,
  selector: string,
  kind: 'text' | 'placeholder' | 'border' | 'outline',
) =>
  page
    .locator(selector)
    .first()
    .evaluate((element, kind) => {
      const canvas = document
        .createElement('canvas')
        .getContext('2d', { willReadFrequently: true })!;
      const rgba = (color: string) => {
        canvas.clearRect(0, 0, 1, 1);
        canvas.fillStyle = color;
        canvas.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = canvas.getImageData(0, 0, 1, 1).data;
        return [r, g, b, a / 255];
      };
      const over = (top: number[], base: number[], alpha = top[3]) =>
        [0, 1, 2].map((i) => top[i] * alpha + base[i] * (1 - alpha));
      const chain: Element[] = [];
      for (let node: Element | null = element; node; node = node.parentElement) chain.unshift(node);
      // El borde y el contorno se comparan con el fondo que rodea al control.
      if (kind === 'outline' || kind === 'border') chain.pop();
      // El panel usa un degradado: se toma su extremo más oscuro, el fondo del sitio.
      let background = rgba(getComputedStyle(document.body).backgroundColor).slice(0, 3);
      for (const node of chain) {
        const style = getComputedStyle(node);
        if (node.id === 'chat-widget') background = rgba('#e5e7eb').slice(0, 3);
        else background = over(rgba(style.backgroundColor), background);
      }
      const style = getComputedStyle(element, kind === 'placeholder' ? '::placeholder' : null);
      const raw = rgba(
        kind === 'border'
          ? style.borderTopColor
          : kind === 'outline'
            ? style.outlineColor
            : style.color,
      );
      let opacity = 1;
      for (let node: Element | null = element; node; node = node.parentElement)
        opacity *= Number(getComputedStyle(node).opacity);
      const foreground = over(raw, background, raw[3] * opacity);
      const luminance = (c: number[]) => {
        const [r, g, b] = c.map((v) => {
          const s = v / 255;
          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const [hi, lo] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
    }, kind);

test('contraste del chat y axe con error visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/chat', (route) => route.fulfill({ status: 503, json: {} }));
  await page.goto('/');
  await openChat(page);
  const results: Record<string, number> = {};
  const measure = async (
    name: string,
    selector: string,
    kind: Parameters<typeof contrast>[2],
    min: number,
  ) => {
    results[name] = await contrast(page, selector, kind);
    expect.soft(results[name], name).toBeGreaterThanOrEqual(min);
  };
  await measure('placeholder', '#chat-input', 'placeholder', 4.5);
  await measure('contador vacío', '#chat-counter', 'text', 4.5);
  await measure('borde del campo', '#chat-input', 'border', 3);
  await measure('foco del campo', '#chat-input', 'outline', 3);
  await page.locator('#chat-input').fill('Hola');
  await measure('contador activo', '#chat-counter', 'text', 4.5);
  await measure('borde con texto', '#chat-input', 'border', 3);
  await measure('Enviar', '.chat-submit', 'text', 4.5);
  await measure('sugerencia', 'button.chat-chip', 'text', 4.5);
  await page.keyboard.press('Enter');
  await expect(page.locator('#chat-error')).toBeVisible();
  await measure('error', '#chat-error', 'text', 4.5);
  await measure('rol', '.chat-bubble__role', 'text', 4.5);
  await measure('etiqueta de fuente', '.chat-badge', 'text', 4.5);
  console.log(JSON.stringify(results));
  expect(
    (await new AxeBuilder({ page }).include('#chat-widget').withTags(wcag).analyze()).violations,
  ).toEqual([]);
});

const feedback = '#blog-subscription-feedback';
const email = '#blog-subscription-email';

for (const [width, height] of [
  [320, 400],
  [390, 844],
] as const) {
  for (const scenario of [
    { status: 200, message: 'Subscribed successfully', expected: 'Ya estás suscripto', kept: '' },
    { status: 200, message: 'Already subscribed', expected: 'ya estaba suscripto', kept: '' },
    { status: 429, message: 'x', expected: 'demasiados intentos' },
    { status: 502, message: 'x', expected: 'No pudimos guardar' },
    { status: 503, message: 'x', expected: 'no está disponible' },
    { status: 0, message: 'x', expected: 'No pudimos conectarnos' },
  ]) {
    test(`alta ${scenario.status} ${scenario.message} a ${width} × ${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      const bodies: unknown[] = [];
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      await page.route('**/api/subscriptions', async (route) => {
        bodies.push(route.request().postDataJSON());
        await gate;
        if (scenario.status === 0) return route.abort();
        return route.fulfill({ status: scenario.status, json: { message: scenario.message } });
      });
      await page.goto('/blog');
      await expect(page.locator('.blog-card').first()).toBeVisible();
      await expect(page.locator(feedback)).toHaveAttribute('role', 'status');
      await page.locator(email).fill('Local@Example.com');
      await page.keyboard.press('Tab');
      const button = page.locator('.blog-toolbar__subscribe-button');
      await expect(button).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.locator(feedback)).toContainText('Enviando tu suscripción');
      await expect(button).toHaveAttribute('aria-disabled', 'true');
      await expect(button).toBeFocused();
      await expect(page.locator(email)).toHaveAttribute('readonly', '');
      await page.keyboard.press('Enter');
      await button.click({ force: true });
      release();
      await expect(page.locator(feedback)).toContainText(scenario.expected);
      await expect(page.locator(email)).toHaveValue(scenario.kept ?? 'Local@Example.com');
      await expect(page.locator(email)).toHaveAttribute('aria-invalid', 'false');
      await expect(button).toBeFocused();
      await expect(
        page.locator(
          '.blog-toolbar__subscribe-form [role], .blog-toolbar__subscribe-form [aria-live]',
        ),
      ).toHaveCount(1);
      expect(bodies).toEqual([{ email: 'local@example.com' }]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (
          await new AxeBuilder({ page })
            .include('.blog-toolbar__subscribe')
            .withTags(wcag)
            .analyze()
        ).violations,
      ).toEqual([]);
    });
  }
}

test('alta inválida, recuperación y contraste sobre fondo oscuro', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/subscriptions', (route) => {
    requests++;
    return route.fulfill({ status: 400, json: { message: ['email must be an email'] } });
  });
  await page.goto('/blog');
  await expect(page.locator('.blog-card').first()).toBeVisible();
  await page.locator(email).fill('incorrecto');
  await page.keyboard.press('Enter');
  await expect(page.locator(feedback)).toContainText('email válido');
  await expect(page.locator(email)).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator(email)).toHaveAttribute(
    'aria-describedby',
    'blog-subscription-feedback',
  );
  await expect(page.locator(email)).toHaveValue('incorrecto');
  expect(requests).toBe(0);
  expect.soft(await contrast(page, feedback, 'text'), 'error').toBeGreaterThanOrEqual(4.5);
  expect.soft(await contrast(page, email, 'border'), 'borde').toBeGreaterThanOrEqual(3);
  expect
    .soft(await contrast(page, email, 'placeholder'), 'placeholder')
    .toBeGreaterThanOrEqual(4.5);
  expect.soft(await contrast(page, email, 'outline'), 'foco campo').toBeGreaterThanOrEqual(3);
  await page.keyboard.press('Tab');
  expect
    .soft(await contrast(page, '.blog-toolbar__subscribe-button', 'outline'), 'foco botón')
    .toBeGreaterThanOrEqual(3);
  await page.locator(email).fill('local@example.com');
  await expect(page.locator(email)).toHaveAttribute('aria-invalid', 'false');
  await page.keyboard.press('Enter');
  await expect(page.locator(feedback)).toContainText('email válido');
  await expect(page.locator(email)).toHaveAttribute('aria-invalid', 'true');
  expect(requests).toBe(1);
});

test('al ceder no desplaza la página ni pierde solicitud, mensajes o borrador', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/api/chat', async (route) => {
    await gate;
    await route.fulfill({
      json: { answer: 'Respuesta tardía', source: 'faq', suggestedQuestions: [] },
    });
  });
  await page.goto('/blog');
  await expect(page.locator('.blog-card').first()).toBeVisible();
  await openChat(page);
  await page.locator('#chat-input').fill('Pregunta en curso');
  await page.keyboard.press('Enter');
  await expect(page.locator('.chat-typing')).toBeVisible();
  // Un control a mitad de página, justo debajo del panel.
  const before = await page.evaluate(() => {
    document.body.style.minHeight = '4000px';
    window.scrollTo({ top: 600, behavior: 'instant' });
    const panel = document.querySelector('#chat-widget')!.getBoundingClientRect();
    const button = document.createElement('button');
    button.id = 'tapado';
    button.textContent = 'Control';
    button.style.cssText = `position:absolute;z-index:1;left:${panel.left + 40}px;top:${scrollY + panel.bottom - 80}px`;
    document.body.appendChild(button);
    button.style.zIndex = 'auto';
    const y = scrollY;
    button.focus({ preventScroll: true });
    return y;
  });
  await expect(page.locator('#chat-widget')).toHaveCount(0);
  await expect(page.locator('#tapado')).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(before);
  expect((await focusState(page)).visible).toBe(true);
  release();
  await page.getByRole('button', { name: 'Abrir chatbot asistente' }).click();
  await expect(page.locator('.chat-bubble').last()).toContainText('Respuesta tardía');
  await expect(page.getByRole('log')).toContainText('Pregunta en curso');
  await page.locator('#chat-input').fill('borrador');
  await page.getByRole('button', { name: 'Cerrar chat' }).click();
  await page.getByRole('button', { name: 'Abrir chatbot asistente' }).click();
  await expect(page.locator('#chat-input')).toHaveValue('borrador');
});

test('reenviar el mismo email inválido vuelve a mutar la región de estado', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.locator('.blog-card').first()).toBeVisible();
  await page.locator(email).fill('incorrecto');
  await page.keyboard.press('Enter');
  await expect(page.locator(feedback)).toContainText('email válido');
  await page.locator(feedback).evaluate((region) => {
    const seen: string[] = [];
    (window as unknown as { seen: string[] }).seen = seen;
    new MutationObserver(() => seen.push(region.textContent!.trim())).observe(region, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  });
  await page.keyboard.press('Enter');
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { seen: string[] }).seen))
    .toEqual(['', 'Ingresá un email válido para suscribirte.']);
  await expect(page.locator(email)).toBeFocused();
});
