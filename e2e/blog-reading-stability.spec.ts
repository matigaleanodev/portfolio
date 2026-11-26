import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page, type Route } from '@playwright/test';

const slugs = ['arquitectura-modo-playa', 'desplegar-apis-docker-ec2'] as const;
const [first, second] = slugs;

function readPost(slug: string) {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'src', 'assets', 'blog', 'posts', `${slug}.json`), 'utf8'),
  ) as { title: string; seo: { title: string; canonicalUrl: string } };
}

const postJson = (slug: string) => `**/assets/blog/posts/${slug}.json`;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const delayed = (ms: number) => async (route: Route) => {
  await sleep(ms);
  await route.continue();
};

test.use({ serviceWorkers: 'block' });

// Aísla la red externa y la API; cada prueba puede sobrescribir rutas puntuales.
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

// El evento se emite cuando el cliente ya recibió el post.
async function waitForClientPost(page: Page, slug: string) {
  await page.waitForFunction((expected) => {
    const layer = (window as unknown as { dataLayer?: IArguments[] }).dataLayer ?? [];
    return layer.some(
      (entry) =>
        entry[1] === 'view_blog_post' &&
        (entry[2] as { post_slug?: string }).post_slug === expected,
    );
  }, slug);
}

async function expectPost(page: Page, slug: string) {
  const post = readPost(slug);
  await expect(page.locator('h1')).toHaveText(post.title);
  await expect(page.locator('.blog-post__content')).not.toBeEmpty();
  await expect(page).toHaveTitle(post.seo.title);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    post.seo.canonicalUrl,
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    post.seo.title,
  );
}

for (const slug of slugs) {
  test(`carga directa de ${slug} conserva el prerender sin pedir el JSON`, async ({ page }) => {
    const jsonRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().endsWith(`/posts/${slug}.json`)) jsonRequests.push(request.url());
    });
    await page.route(postJson(slug), delayed(1500));
    await page.addInitScript(() => {
      const state = window as unknown as { sawLoading: boolean; firstTitle: Element | null };
      state.sawLoading = false;
      state.firstTitle = null;
      new MutationObserver(() => {
        state.sawLoading ||= !!document.querySelector('.blog-post-loading');
        state.firstTitle ??= document.querySelector('h1.blog-post__title');
      }).observe(document, { childList: true, subtree: true });
    });

    await page.goto(`/blog/${slug}`);
    await waitForClientPost(page, slug);

    expect(
      await page.evaluate(() => {
        const state = window as unknown as { sawLoading: boolean; firstTitle: Element | null };
        return { sawLoading: state.sawLoading, titleConnected: state.firstTitle?.isConnected };
      }),
    ).toEqual({ sawLoading: false, titleConnected: true });
    expect(jsonRequests).toEqual([]);
    await expectPost(page, slug);
  });

  test(`carga directa de ${slug} mantiene el artículo con el JSON caído`, async ({ page }) => {
    await page.route(postJson(slug), (route) => route.abort());
    await page.goto(`/blog/${slug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await expectPost(page, slug);
  });

  for (const fonts of ['bloqueadas', 'demoradas'] as const) {
    for (const [width, height] of [
      [390, 844],
      [1440, 900],
    ]) {
      test(`estabilidad de ${slug} con fuentes ${fonts} a ${width} × ${height}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height });
        await page.route(postJson(slug), delayed(500));
        let servedFonts = 0;
        if (fonts === 'bloqueadas') {
          await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
        } else {
          // Fuentes locales de reemplazo: fuerzan el swap sin depender de la red externa.
          // size-adjust acerca su ancho al de IBM Plex para que el swap sea representativo.
          // Los porcentajes son una calibración de laboratorio: la suma de shifts de este caso
          // no reemplaza la medición con las fuentes reales; la guarda del bug es el footer.
          await page.route(/\/blog\/[^/]+\/$|\.css$/, async (route) => {
            const response = await route.fetch();
            const body = (await response.text()).replace(
              /@font-face\{font-family:IBM Plex (Sans|Mono);/g,
              (rule, family: string) => `${rule}size-adjust:${family === 'Mono' ? 114.5 : 109}%;`,
            );
            await route.fulfill({ response, body });
          });
          await page.route('https://fonts.gstatic.com/**', async (route) => {
            await sleep(1500);
            const file = route.request().url().includes('ibmplexmono') ? 'Typewriter' : 'SansSerif';
            servedFonts++;
            await route.fulfill({
              contentType: 'font/woff2',
              headers: { 'access-control-allow-origin': '*' },
              path: join(
                process.cwd(),
                `node_modules/katex/dist/fonts/KaTeX_${file}-Regular.woff2`,
              ),
            });
          });
        }
        await page.addInitScript(() => {
          const state = window as unknown as { shifts: { value: number; footer: boolean }[] };
          state.shifts = [];
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as unknown as {
              value: number;
              sources: { node: Node | null }[];
            }[]) {
              state.shifts.push({
                value: entry.value,
                footer: entry.sources.some(({ node }) => {
                  const element = node instanceof Element ? node : node?.parentElement;
                  return !!element?.closest('app-footer');
                }),
              });
            }
          }).observe({ type: 'layout-shift', buffered: true });
        });

        await page.goto(`/blog/${slug}/`);
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(1000);

        if (fonts === 'demoradas') expect(servedFonts).toBeGreaterThan(0);
        const shifts = await page.evaluate(
          () => (window as unknown as { shifts: { value: number; footer: boolean }[] }).shifts,
        );
        expect(shifts.filter((shift) => shift.footer)).toEqual([]);
        expect(shifts.reduce((total, shift) => total + shift.value, 0)).toBeLessThanOrEqual(0.1);
      });
    }
  }

  test(`${slug} disponible sin JavaScript`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await context.newPage();
    await page.route(/^https:/, (route) => route.abort());
    await page.goto(`/blog/${slug}`);
    await expectPost(page, slug);
    await context.close();
  });
}

test('navegación entre artículos sin recargar ni contenido obsoleto', async ({ page }) => {
  await page.goto('/blog');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => ((window as unknown as { sameDocument: boolean }).sameDocument = true));
  const card = (slug: string) => page.locator(`.blog-card__link[href="/blog/${slug}"]`);
  const back = page.getByRole('link', { name: 'Volver al listado del blog' });

  await card(first).click();
  await expectPost(page, first);
  await back.click();
  await expect(card(second)).toBeVisible();

  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route(postJson(second), async (route) => {
    await gate;
    await route.continue();
  });
  await card(second).click();
  await expect(page.locator('.blog-post-loading')).toBeVisible();
  await expect(page.locator('.blog-post__content')).toHaveCount(0);
  await expect(page.getByText(readPost(first).title)).toHaveCount(0);
  release();
  await expectPost(page, second);

  await page.goBack();
  await expect(card(first)).toBeVisible();
  await expect(page.locator('.blog-post__content')).toHaveCount(0);
  await page.goBack();
  await expectPost(page, first);
  expect(
    await page.evaluate(() => (window as unknown as { sameDocument?: boolean }).sameDocument),
  ).toBe(true);
});

test('volver por historial a un artículo cargado en forma directa lo pide de nuevo', async ({
  page,
}) => {
  await page.goto(`/blog/${first}`);
  await waitForClientPost(page, first);
  await page.getByRole('link', { name: 'Volver al listado del blog' }).click();
  await expect(page.locator('.blog-card').first()).toBeVisible();
  const request = page.waitForRequest(postJson(first));
  await page.goBack();
  await request;
  await expectPost(page, first);
});

test('error de JSON en navegación de cliente muestra el error', async ({ page }) => {
  await page.route(postJson(first), (route) => route.abort());
  await page.goto('/blog');
  await page.waitForLoadState('networkidle');
  await page.locator(`.blog-card__link[href="/blog/${first}"]`).click();
  await expect(page.getByText('No se pudo cargar el post.')).toBeVisible();
  await expect(page.locator('.blog-post__content')).toHaveCount(0);
});

test('ng-state escapado y con el post solo en páginas de post', async ({ request }) => {
  for (const path of ['/', '/blog/', ...slugs.map((slug) => `/blog/${slug}/`)]) {
    const html = await (await request.get(path)).text();
    const state = html.match(/<script id="ng-state"[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? '';
    expect(state, path).not.toContain('<');
    const keys = Object.keys(JSON.parse(state || '{}')).filter((key) =>
      key.startsWith('blog-post:'),
    );
    const slug = slugs.find((candidate) => path === `/blog/${candidate}/`);
    expect(keys, path).toEqual(slug ? [`blog-post:${slug}`] : []);
  }
});
