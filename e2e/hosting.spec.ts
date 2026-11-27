import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type APIResponse } from '@playwright/test';
import { JSDOM } from 'jsdom';

/**
 * Contrato de Firebase Hosting, comprobado contra su emulador y sin ejecutar la aplicación:
 * estados HTTP, redirecciones, cabeceras y descubrimiento editorial.
 */
test.skip(
  process.env['PORTFOLIO_E2E_BUILD'] !== 'true',
  'Requiere el build servido por el emulador de Hosting.',
);

const site = 'https://matiasgaleano.dev';
const asset = (...segments: string[]) =>
  JSON.parse(readFileSync(join(process.cwd(), 'src', 'assets', ...segments), 'utf8')) as {
    slug: string;
  }[];
const posts = asset('blog', 'posts.json').map(({ slug }) => slug);
const projects = asset('projects.json').map(({ slug }) => slug);

async function parse(response: APIResponse) {
  const { document } = new JSDOM(await response.text()).window;
  return {
    document,
    heading: document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim(),
    robots: document.head.querySelector('meta[name="robots"]')?.getAttribute('content'),
    canonical: document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
    ogUrl: document.head.querySelector('meta[property="og:url"]')?.getAttribute('content') ?? null,
  };
}

const valid = [
  '/',
  '/blog',
  ...posts.map((slug) => `/blog/${slug}`),
  ...projects.map((slug) => `/projects/${slug}`),
];

for (const path of valid) {
  for (const requested of new Set([path, `${path.replace(/\/$/, '')}/`])) {
    test(`${requested} responde 200 con su propio HTML`, async ({ request }) => {
      const response = await request.get(requested);

      expect(response.status()).toBe(200);
      const page = await parse(response);
      expect(page.canonical).toBe(`${site}${path}`);
      expect(page.robots).toBe('index, follow');
    });
  }
}

const missing = [
  '/ruta-inexistente',
  '/ruta-inexistente/',
  '/ruta-inexistente?origen=correo',
  '/ruta-inexistente.html',
  '/a/b/c/d',
  '/projects',
  '/projects/no-existe',
  `/projects/${projects[0]}/extra`,
  '/blog/no-existe',
  `/blog/${posts[0]}/extra`,
  '/blog/unsubscribe/extra',
  '/blog/Unsubscribe',
  '/chunk-INEXISTENTE.js',
  '/assets/blog/posts/no-existe.json',
];

for (const path of missing) {
  test(`${path} responde 404 con el estado de error desde el primer byte`, async ({ request }) => {
    const response = await request.get(path);

    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('text/html');
    const page = await parse(response);
    expect(page.heading).toBe('No encontramos esta página');
    expect(page.document.querySelectorAll('h1')).toHaveLength(1);
    expect(page.document.title).toBe('Página no encontrada | Matias Galeano');
    expect(page.robots).toBe('noindex, follow');
    expect(page.canonical).toBeNull();
    expect(page.ogUrl).toBeNull();
    expect(page.document.querySelector('app-home-page, app-hero')).toBeNull();
    // La privacidad del enlace de baja depende de este bloque también en la 404.
    expect(page.document.querySelector('meta[name="referrer"]')?.getAttribute('content')).toBe(
      'strict-origin',
    );
  });
}

const unsubscribe = [
  '/blog/unsubscribe',
  '/blog/unsubscribe/',
  '/blog/unsubscribe/index.html',
  '/blog/unsubscribe?email=lector%40example.test',
  '/blog/unsubscribe/?email=lector%40example.test',
  '/blog/unsubscribe/index.html?email=lector%40example.test',
  '/blog/unsubscribe;email=lector%40example.test',
];

for (const path of unsubscribe) {
  test(`${path} llega a la confirmación de baja sin perder parámetros`, async ({ request }) => {
    const response = await request.get(path);

    expect(response.status()).toBe(200);
    expect((await parse(response)).heading).toBe('Confirmá la baja de la suscripción.');
    if (path.includes('email=')) expect(response.url()).toContain('email=lector%40example.test');
    if (!path.includes(';')) expect(response.headers()['referrer-policy']).toBe('strict-origin');
  });
}

test('las redirecciones de cleanUrls conservan la consulta', async ({ request }) => {
  const response = await request.get('/blog/unsubscribe/index.html?email=lector%40example.test', {
    maxRedirects: 0,
  });

  expect(response.status()).toBe(301);
  expect(response.headers()['location']).toContain('email=lector%40example.test');
});

for (const path of ['/rss.xml', '/sitemap.xml', '/sitemap-blog.xml']) {
  test(`${path} se sirve sin caché prolongada`, async ({ request }) => {
    const response = await request.get(path);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('xml');
    expect(response.headers()['cache-control']).toContain('no-cache');
  });
}

test('el RSS se puede descubrir desde cualquier página', async ({ request }) => {
  for (const path of ['/', '/blog/', `/blog/${posts[0]}/`]) {
    const { document } = await parse(await request.get(path));
    const feed = document.head.querySelector('link[rel="alternate"][type="application/rss+xml"]');

    expect(feed?.getAttribute('href')).toBe(`${site}/rss.xml`);
    expect(feed?.getAttribute('title')).toBeTruthy();
  }
});

test('robots.txt declara los dos sitemaps', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();

  expect(robots).toContain(`Sitemap: ${site}/sitemap.xml`);
  expect(robots).toContain(`Sitemap: ${site}/sitemap-blog.xml`);
});
