import { expect, test, type Page, type Request, type Route } from '@playwright/test';

const path = '/blog/unsubscribe';
const privateMarker = 'unsubscribe-fixture-m76';
const fixtureEmail = `${privateMarker.toUpperCase()}+QA@example.test`;
const normalizedEmail = fixtureEmail.toLowerCase();
const legacyLink = `${path}?email=${encodeURIComponent(fixtureEmail)}`;
const unsubscribed = { message: 'Unsubscribed successfully', email: normalizedEmail };

// Exercise GA's default URL for automatic/config and history page views, plus custom events.
const analyticsStub = `
  const queue = window.dataLayer = window.dataLayer || [];
  function collect(event, params = {}) {
    const payload = new URLSearchParams({
      en: event,
      dl: params.page_location ?? location.href,
      dr: params.page_referrer ?? document.referrer,
      params: JSON.stringify(params),
    });
    navigator.sendBeacon('https://analytics.example.test/collect', payload);
  }
  function processEntry(entry) {
    const [command, name, params] = Array.from(entry);
    if (command === 'config' && params?.send_page_view !== false) collect('page_view', params);
    if (command === 'event') collect(name, params);
  }
  queue.forEach(processEntry);
  const push = queue.push.bind(queue);
  queue.push = (...entries) => {
    for (const entry of entries) processEntry(entry);
    return push(...entries);
  };
  for (const method of ['pushState', 'replaceState']) {
    const change = history[method].bind(history);
    history[method] = (...args) => {
      change(...args);
      collect('page_view');
    };
  }
  addEventListener('popstate', () => collect('page_view'));
`;

test.use({ serviceWorkers: 'block' });

async function isolateRequests(
  page: Page,
  baseURL: string | undefined,
  unsubscribe: (route: Route) => Promise<void>,
) {
  if (!baseURL) throw new Error('Se requiere la URL del servidor local.');
  const origin = new URL(baseURL).origin;
  if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname)) {
    throw new Error('Las pruebas de baja requieren un servidor local.');
  }
  // Prevent Vite live reload and keep websockets inside the browser test.
  await page.routeWebSocket('**/*', () => {});
  await page.route('**/*', (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/subscriptions') {
      return unsubscribe(route);
    }
    if (url.pathname.startsWith('/api/')) {
      return route.fulfill({ json: { suggestedQuestions: [] } });
    }
    return url.origin === origin ? route.continue() : route.abort();
  });
}

function requestContract(request: Request) {
  const url = new URL(request.url());
  return {
    method: request.method(),
    path: url.pathname + url.search,
    contentType: request.headers()['content-type'],
    body: request.postDataJSON(),
  };
}

const expectedRequest = {
  method: 'DELETE',
  path: '/api/subscriptions',
  contentType: 'application/json',
  body: { email: normalizedEmail },
};

test('el enlace heredado requiere confirmación y el click envía un DELETE', async ({
  page,
  baseURL,
}) => {
  const requests: Request[] = [];
  await isolateRequests(page, baseURL, (route) => {
    requests.push(route.request());
    return route.fulfill({ json: unsubscribed });
  });

  await page.goto(legacyLink);
  await expect(page.getByLabel('Email')).toHaveValue(normalizedEmail);
  expect(requests).toHaveLength(0);
  await page.getByRole('button', { name: 'Confirmar baja' }).click();
  await expect.poll(() => requests.length, { timeout: 3000 }).toBe(1);
  expect(requests.map(requestContract)).toEqual([expectedRequest]);
  const heading = page.getByRole('heading', { name: 'Tu suscripción fue dada de baja.' });
  await expect(heading).toBeFocused();
  await expect(page.getByText('Unsubscribed successfully')).toHaveCount(0);
});

test('Enter confirma la baja y anuncia cuando el email ya estaba dado de baja', async ({
  page,
  baseURL,
}) => {
  const requests: Request[] = [];
  await isolateRequests(page, baseURL, (route) => {
    requests.push(route.request());
    return route.fulfill({ json: { message: 'Already unsubscribed' } });
  });
  await page.goto(path);
  const email = page.getByLabel('Email');
  await email.fill(fixtureEmail);
  await email.press('Enter');
  await expect(page.getByRole('heading', { name: 'Tu email ya estaba dado de baja.' })).toBeFocused();
  expect(requests.map(requestContract)).toEqual([expectedRequest]);
  await expect(page).toHaveURL(/\/blog\/unsubscribe\/?$/);
});

test('la confirmación espera a Angular antes de habilitar el formulario prerenderizado', async ({
  page,
  baseURL,
}) => {
  const requests: Request[] = [];
  await isolateRequests(page, baseURL, (route) => {
    requests.push(route.request());
    return route.fulfill({ json: unsubscribed });
  });
  let releaseBundle: () => void = () => {};
  const pendingBundle = new Promise<void>((resolve) => {
    releaseBundle = resolve;
  });
  let bundleHeld = false;
  await page.route(/\/main(?:-[\w]+)?\.js(?:\?.*)?$/, async (route) => {
    bundleHeld = true;
    await pendingBundle;
    await route.continue();
  });

  const email = page.getByLabel('Email');
  const confirm = page.getByRole('button', { name: 'Confirmar baja' });
  try {
    await page.goto(legacyLink, { waitUntil: 'commit' });
    const documents: Request[] = [];
    page.on('request', (request) => {
      if (request.isNavigationRequest()) documents.push(request);
    });
    await expect.poll(() => bundleHeld).toBe(true);
    await expect(page.getByRole('heading', { name: 'Confirmá la baja de la suscripción.' })).toBeVisible();
    await expect(email).toBeDisabled({ timeout: 2000 });
    await expect(confirm).toBeDisabled();
    expect(await email.evaluate((input) => input.matches(':disabled'))).toBe(true);
    expect(await confirm.evaluate((button) => button.matches(':disabled'))).toBe(true);
    await email.focus();
    await page.keyboard.press('Enter');
    expect(requests).toHaveLength(0);
    expect(documents).toHaveLength(0);
  } finally {
    releaseBundle();
  }

  await expect(email).toHaveValue(normalizedEmail);
  await expect(email).toBeEnabled();
  await expect(confirm).toBeEnabled();
  await email.press('Enter');
  await expect(page.getByRole('heading', { name: 'Tu suscripción fue dada de baja.' })).toBeFocused();
  expect(requests.map(requestContract)).toEqual([expectedRequest]);
});

test('el email inválido conserva el campo y el documento sin enviar la baja', async ({
  page,
  baseURL,
}) => {
  const requests: Request[] = [];
  await isolateRequests(page, baseURL, (route) => {
    requests.push(route.request());
    return route.fulfill({ json: unsubscribed });
  });
  await page.goto(path);
  const documents: Request[] = [];
  page.on('request', (request) => {
    if (request.isNavigationRequest()) documents.push(request);
  });
  const email = page.getByLabel('Email');
  const confirm = page.getByRole('button', { name: 'Confirmar baja' });

  await confirm.click();
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toHaveAccessibleDescription(/Ingresá un email válido/);
  await email.fill('sin-arroba');
  await email.press('Enter');
  await expect(email).toHaveValue('sin-arroba');
  await expect(email).toBeFocused();
  await expect(page.getByRole('alert')).toHaveText('Ingresá un email válido para confirmar la baja.');
  await expect(page).toHaveURL(/\/blog\/unsubscribe\/?$/);
  expect(documents).toHaveLength(0);
  expect(requests).toHaveLength(0);
});

test('el doble click mantiene el foco y envía una sola baja mientras espera', async ({
  page,
  baseURL,
}) => {
  const requests: Request[] = [];
  let finishResponse: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    finishResponse = resolve;
  });
  await isolateRequests(page, baseURL, async (route) => {
    requests.push(route.request());
    await pending;
    await route.fulfill({ json: unsubscribed });
  });
  try {
    await page.goto(legacyLink);
    await expect(page.getByLabel('Email')).toHaveValue(normalizedEmail);
    const confirm = page.getByRole('button', { name: 'Confirmar baja' });
    await confirm.dblclick();
    await expect(page.locator('#main-content').getByRole('status')).toHaveText('Confirmando la baja…');
    await expect(confirm).toBeDisabled();
    await expect(confirm).toBeFocused();
    await confirm.press('Enter');
    await expect.poll(() => requests.length).toBe(1);
  } finally {
    finishResponse();
  }
  await expect(page.getByRole('heading', { name: 'Tu suscripción fue dada de baja.' })).toBeFocused();
  expect(requests.map(requestContract)).toEqual([expectedRequest]);
});

for (const [status, copy] of [
  [429, 'Hay demasiados intentos de baja. Probá de nuevo más tarde.'],
  [502, 'No se pudo procesar la baja en este momento. Probá de nuevo más tarde.'],
  [503, 'No se pudo procesar la baja en este momento. Probá de nuevo más tarde.'],
] as const) {
  test(`HTTP ${status} presenta un mensaje en español y conserva el campo para reintentar`, async ({
    page,
    baseURL,
  }) => {
    const requests: Request[] = [];
    await isolateRequests(page, baseURL, (route) => {
      requests.push(route.request());
      if (requests.length > 1) return route.fulfill({ json: unsubscribed });
      return status === 502
        ? route.fulfill({ status, json: { message: 'Diagnóstico simulado del upstream' } })
        : route.fulfill({ status });
    });
    await page.goto(legacyLink);
    const email = page.getByLabel('Email');
    const confirm = page.getByRole('button', { name: 'Confirmar baja' });
    await expect(email).toHaveValue(normalizedEmail);
    await confirm.click();
    const feedback = page.getByRole('alert');
    await expect(feedback).toHaveText(copy);
    await expect(feedback).toBeFocused();
    await expect(email).toHaveValue(normalizedEmail);
    await expect(email).not.toHaveAttribute('aria-invalid', 'true');
    await expect(confirm).toBeEnabled();
    expect(requests.map(requestContract)).toEqual([expectedRequest]);
    await confirm.click();
    await expect(page.getByRole('heading', { name: 'Tu suscripción fue dada de baja.' })).toBeFocused();
    expect(requests.map(requestContract)).toEqual([expectedRequest, expectedRequest]);
  });
}

test.describe('GET de un escáner de enlaces', () => {
  test.use({ javaScriptEnabled: false });

  test('abre la confirmación sin llamar al API de suscripciones', async ({ page, baseURL }) => {
    const requests: Request[] = [];
    const subscriptionRequests: Request[] = [];
    page.on('request', (request) => requests.push(request));
    await isolateRequests(page, baseURL, (route) => {
      subscriptionRequests.push(route.request());
      return route.fulfill({ json: unsubscribed });
    });
    const response = await page.goto(legacyLink);
    expect(response?.status()).toBe(200);
    expect(response?.request().method()).toBe('GET');
    await expect(page.getByRole('heading', { name: 'Confirmá la baja de la suscripción.' })).toBeVisible();
    expect(subscriptionRequests).toHaveLength(0);
    const subresources = requests.filter((request) => !request.isNavigationRequest());
    expect(
      subresources.some((request) => new URL(request.url()).origin === new URL(page.url()).origin),
    ).toBe(true);
    for (const request of subresources) {
      const referer = (await request.allHeaders())['referer'] ?? '';
      expect(referer.toLowerCase()).not.toContain(privateMarker);
    }
  });
});

test('el documento con el enlace heredado y su navegación no exponen el email a analytics', async ({
  page,
  baseURL,
}) => {
  const requests: Request[] = [];
  const telemetry: Request[] = [];
  const subscriptionRequests: Request[] = [];
  page.on('request', (request) => requests.push(request));
  await isolateRequests(page, baseURL, (route) => {
    subscriptionRequests.push(route.request());
    return route.fulfill({ json: unsubscribed });
  });
  await page.route('https://www.googletagmanager.com/gtag/js?*', (route) => {
    telemetry.push(route.request());
    return route.fulfill({ contentType: 'application/javascript', body: analyticsStub });
  });
  await page.route('https://analytics.example.test/collect', (route) => {
    telemetry.push(route.request());
    return route.fulfill({ status: 204 });
  });

  const entryResponse = await page.goto(legacyLink);
  await expect(page.getByLabel('Email')).toHaveValue(normalizedEmail);
  await page.waitForLoadState('networkidle');
  expect(subscriptionRequests).toHaveLength(0);
  expect(telemetry).toHaveLength(0);
  await expect(page).toHaveURL(/\/blog\/unsubscribe\/?$/);
  await page.getByRole('link', { name: 'Cancelar' }).click();
  await expect(page).toHaveURL(/\/blog\/?$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/blog\/unsubscribe\/?$/);
  await expect(page.getByLabel('Email')).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(telemetry).toHaveLength(0);
  expect(subscriptionRequests).toHaveLength(0);
  const queuedAnalytics = await page.evaluate(
    () => (window as Window & { dataLayer?: unknown[] }).dataLayer ?? [],
  );
  expect(JSON.stringify(queuedAnalytics).toLowerCase()).not.toContain(privateMarker);

  const originalEntry = new URL(legacyLink, baseURL);
  const referrerResponse = await page.goto('/blog/', { referer: originalEntry.href });
  const requestWithInjectedReferrer = referrerResponse?.request();
  expect(requestWithInjectedReferrer?.redirectedFrom()).toBeNull();
  expect((await requestWithInjectedReferrer?.allHeaders())?.['referer']).toBe(originalEntry.href);
  expect(await page.evaluate(() => document.referrer)).toBe(originalEntry.href);
  await page.waitForLoadState('networkidle');
  expect(telemetry).toHaveLength(0);

  await page.goto('/blog');
  await expect
    .poll(() =>
      telemetry.some(
        (request) =>
          new URL(request.url()).pathname === '/collect' &&
          new URLSearchParams(request.postData() ?? '').get('en') === 'page_view',
      ),
    )
    .toBe(true);

  const slashEntry = new URL(originalEntry);
  slashEntry.pathname += '/';
  const entryNavigations: Request[] = [];
  for (let entry = entryResponse?.request() ?? null; entry; entry = entry.redirectedFrom()) {
    expect(entry.isNavigationRequest()).toBe(true);
    expect(entry.method()).toBe('GET');
    expect([originalEntry.href, slashEntry.href]).toContain(entry.url());
    entryNavigations.push(entry);
  }
  expect(entryNavigations.at(-1)?.url()).toBe(originalEntry.href);
  const footprints = await Promise.all(
    requests.map(async (request) => {
      const headers = await request.allHeaders();
      // The preceding assertion checks the one incoming Referer supplied by the test.
      if (request === requestWithInjectedReferrer) delete headers['referer'];
      return {
        url: entryNavigations.includes(request) ? '' : request.url(),
        headers,
        body: request.postData(),
      };
    }),
  );
  expect(
    footprints.filter((footprint) => JSON.stringify(footprint).toLowerCase().includes(privateMarker)),
  ).toEqual([]);
});
