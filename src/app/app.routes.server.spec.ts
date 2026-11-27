import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RenderMode } from '@angular/ssr';

import { routes } from './app.routes';
import { serverRoutes } from './app.routes.server';

interface PrerenderRouteLike {
  getPrerenderParams?: () => Promise<{ slug: string }[]>;
}

interface BlogIndexEntry {
  slug: string;
}

describe('serverRoutes', () => {
  it('deberia prerenderizar home, proyectos, blog, baja y fallback', () => {
    expect(
      serverRoutes.map((route) => ({
        path: route.path,
        renderMode: route.renderMode,
      })),
    ).toEqual([
      { path: '', renderMode: RenderMode.Prerender },
      { path: 'projects/:slug', renderMode: RenderMode.Prerender },
      { path: 'blog', renderMode: RenderMode.Prerender },
      { path: 'blog/unsubscribe', renderMode: RenderMode.Prerender },
      { path: 'blog/:slug', renderMode: RenderMode.Prerender },
      { path: '404', renderMode: RenderMode.Prerender },
      { path: '**', renderMode: RenderMode.Prerender },
    ]);
  });

  it('deberia declarar la 404 antes del comodin para generar su HTML', () => {
    const paths = routes.map((route) => route.path);

    expect(paths.indexOf('404')).toBeGreaterThan(-1);
    expect(paths.indexOf('404')).toBeLessThan(paths.indexOf('**'));
  });

  it('deberia resolver slugs prerenderizables desde el indice del blog', async () => {
    const postRoute = serverRoutes.find((route) => route.path === 'blog/:slug') as
      (typeof serverRoutes)[number] | undefined;
    const prerenderRoute = postRoute as (typeof postRoute & PrerenderRouteLike) | undefined;

    expect(prerenderRoute?.getPrerenderParams).toBeTypeOf('function');

    const params = await prerenderRoute!.getPrerenderParams!();
    const rawIndex = await readFile(
      join(process.cwd(), 'src', 'assets', 'blog', 'posts.json'),
      'utf8',
    );
    const expectedParams = (JSON.parse(rawIndex) as BlogIndexEntry[]).map((post) => ({
      slug: post.slug,
    }));

    expect(params).toEqual(expectedParams);
  });
});
