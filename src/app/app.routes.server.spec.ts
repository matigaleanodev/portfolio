import { describe, expect, it } from 'vitest';
import { RenderMode } from '@angular/ssr';

import { serverRoutes } from './app.routes.server';

interface PrerenderRouteLike {
  getPrerenderParams?: () => Promise<{ slug: string }[]>;
}

describe('serverRoutes', () => {
  it('deberia prerenderizar home, blog, baja, detalle y fallback', () => {
    expect(
      serverRoutes.map((route) => ({
        path: route.path,
        renderMode: route.renderMode,
      })),
    ).toEqual([
      { path: '', renderMode: RenderMode.Prerender },
      { path: 'blog', renderMode: RenderMode.Prerender },
      { path: 'blog/unsubscribe', renderMode: RenderMode.Prerender },
      { path: 'blog/:slug', renderMode: RenderMode.Prerender },
      { path: '**', renderMode: RenderMode.Prerender },
    ]);
  });

  it('deberia resolver slugs prerenderizables desde el indice del blog', async () => {
    const postRoute = serverRoutes.find((route) => route.path === 'blog/:slug') as
      | (typeof serverRoutes)[number]
      | undefined;
    const prerenderRoute = postRoute as (typeof postRoute & PrerenderRouteLike) | undefined;

    expect(prerenderRoute?.getPrerenderParams).toBeTypeOf('function');

    const params = await prerenderRoute!.getPrerenderParams!();

    expect(params).toEqual([
      { slug: 'arquitectura-modo-playa' },
      { slug: 'arquitectura-angular-real' },
      { slug: 'desplegar-apis-docker-ec2' },
    ]);
  });
});
