import { DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { routes } from './app.routes';
import { SeoService } from './services/seo.service';

const missing = [
  '/ruta-inexistente',
  '/projects',
  '/projects/nora/extra',
  '/blog/un-post/extra',
  '/blog/unsubscribe/extra',
  '/a/b/c/d?origen=correo#seccion',
];

describe('rutas inexistentes', () => {
  let documentRef: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    documentRef = TestBed.inject(DOCUMENT);
    // jsdom no implementa el desplazamiento.
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  const head = (selector: string) => documentRef.head.querySelector(selector);
  const content = (selector: string) => head(selector)?.getAttribute('content') ?? null;

  for (const url of missing) {
    it(`conserva ${url} y muestra la página 404`, async () => {
      const harness = await RouterTestingHarness.create(url);
      const page = harness.routeNativeElement!;

      expect(TestBed.inject(Router).url).toBe(url);
      expect(page.querySelectorAll('h1')).toHaveLength(1);
      expect(page.querySelector('h1')?.textContent?.trim()).toBe('No encontramos esta página');
      expect(page.querySelector('a[href="/"]')?.textContent?.trim()).toBe('Volver al inicio');
    });
  }

  it('excluye la 404 del índice sin heredar metadatos de un artículo', async () => {
    TestBed.inject(SeoService).setPageSeo({
      title: 'Post | Matias Galeano',
      description: 'Detalle del post.',
      canonicalUrl: 'https://matiasgaleano.dev/blog/post',
      image: {
        url: 'https://media.matiasgaleano.dev/og/post.png',
        alt: 'Post',
        width: 1200,
        height: 630,
      },
      type: 'article',
      publishedTime: '2026-03-07T00:00:00.000Z',
      modifiedTime: '2026-03-08T00:00:00.000Z',
    });

    await RouterTestingHarness.create('/ruta-inexistente');

    expect(documentRef.title).toBe('Página no encontrada | Matias Galeano');
    expect(content("meta[name='robots']")).toBe('noindex, follow');
    expect(content("meta[name='description']")).toBe(
      'La dirección no corresponde a ninguna página de matiasgaleano.dev.',
    );
    expect(content("meta[property='og:type']")).toBe('website');
    expect(content("meta[property='og:image']")).toBe(
      'https://matiasgaleano.dev/assets/icons/icon-512.webp',
    );
    expect(content("meta[property='og:image:width']")).toBe('512');
    expect(head("link[rel='canonical']")).toBeNull();
    expect(head("meta[property='og:url']")).toBeNull();
    expect(head("meta[property^='article:']")).toBeNull();
  });

  it('no confunde la baja con una ruta inexistente', async () => {
    const harness = await RouterTestingHarness.create('/blog/unsubscribe');

    expect(harness.routeNativeElement?.querySelector('input[type="email"]')).not.toBeNull();
  });

  it('no mueve el foco en el acceso directo y anuncia el mensaje', async () => {
    const harness = await RouterTestingHarness.create('/ruta-inexistente');
    await harness.fixture.whenStable();
    const page = harness.routeNativeElement!;

    expect(documentRef.activeElement).not.toBe(page.querySelector('h1'));
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'La dirección no corresponde a ninguna página',
    );
  });

  it('lleva el foco al título al llegar navegando desde otra página', async () => {
    const harness = await RouterTestingHarness.create('/blog/unsubscribe');
    document.body.appendChild(harness.fixture.nativeElement);

    await harness.navigateByUrl('/ruta-inexistente');
    await harness.fixture.whenStable();
    const page = harness.routeNativeElement!;

    expect(documentRef.activeElement).toBe(page.querySelector('h1'));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
    expect(page.querySelector('[role="alert"]')).toBeNull();
    harness.fixture.nativeElement.remove();
  });
});
