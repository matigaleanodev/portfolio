import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { JSDOM } from 'jsdom';

import type { BlogPost, BlogPostSummary } from '../src/app/models/blog.model';

/**
 * Contrato del HTML que reciben los buscadores y quien navega sin JavaScript.
 * Se lee la respuesta tal como llega, sin ejecutar la aplicación.
 */
test.skip(process.env['PORTFOLIO_E2E_BUILD'] !== 'true', 'Requiere el build de producción.');

test.skip(process.env['PORTFOLIO_E2E_BUILD'] !== 'true', 'Requiere el build de producción.');

const site = 'https://matiasgaleano.dev';

const asset = <T>(...segments: string[]) =>
  JSON.parse(readFileSync(join(process.cwd(), 'src', 'assets', ...segments), 'utf8')) as T;

const posts = asset<BlogPostSummary[]>('blog', 'posts.json');
const text = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
const hrefs = (root: ParentNode) =>
  Array.from(root.querySelectorAll('a[href]'), (link) => link.getAttribute('href'));

function parse(html: string) {
  const { document } = new JSDOM(html).window;
  const meta = (selector: string) =>
    document.head.querySelector(`meta[${selector}]`)?.getAttribute('content') ?? null;
  const canonical = document.head.querySelector('link[rel="canonical"]')?.getAttribute('href');
  return { document, meta, canonical };
}

test('el listado llega completo en el HTML inicial', async ({ request }) => {
  const response = await request.get('/blog/');
  const { document, meta, canonical } = parse(await response.text());

  expect(posts.length).toBeGreaterThan(0);
  expect(document.body.textContent).not.toContain('Cargando posts');
  expect(
    Array.from(document.querySelectorAll('.blog-card__link'), (link) => [
      text(link.textContent),
      link.getAttribute('href'),
    ]).sort(),
  ).toEqual(posts.map((post) => [text(post.title), `/blog/${post.slug}`]).sort());
  expect(Array.from(document.querySelectorAll('.blog-card__excerpt'))).toHaveLength(posts.length);
  expect(canonical).toBe(`${site}/blog`);
  expect(meta('name="robots"')).toBe('index, follow');
});

for (const { slug } of posts) {
  test(`${slug} llega completo en el HTML inicial`, async ({ request }) => {
    const post = asset<BlogPost>('blog', 'posts', `${slug}.json`);
    const response = await request.get(`/blog/${slug}/`);
    const { document, meta, canonical } = parse(await response.text());
    const expected = new JSDOM(post.contentHtml).window.document.body;

    expect(document.querySelector('.blog-post-loading')).toBeNull();
    expect(text(document.querySelector('h1')?.textContent)).toBe(text(post.title));

    // La barra de copia se agrega sobre el contenido editorial: se compara sin ella.
    const body = document.querySelector('.blog-post__content')!;
    body.querySelectorAll('.code-toolbar').forEach((toolbar) => toolbar.remove());
    const compact = (value: string | null) => (value ?? '').replace(/\s+/g, '');
    expect(compact(body.textContent)).toBe(compact(expected.textContent));
    expect(hrefs(body)).toEqual(hrefs(expected));

    expect(document.title).toBe(post.seo.title);
    expect(canonical).toBe(post.seo.canonicalUrl);
    expect(meta('name="description"')).toBe(post.seo.description);
    expect(meta('property="og:title"')).toBe(post.seo.title);
    expect(meta('property="og:url"')).toBe(post.seo.canonicalUrl);
    expect(meta('property="og:type"')).toBe('article');
    expect(meta('property="og:image"')).toContain(post.seo.ogImage);
    expect(meta('property="article:published_time"')).toBe(`${post.date}T00:00:00.000Z`);
    expect(meta('name="robots"')).toBe('index, follow');
  });
}
