import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SeoService } from './seo.service';

const articlePayload = {
  title: 'Post | Matias Galeano',
  description: 'Detalle del post.',
  canonicalUrl: 'https://matiasgaleano.dev/blog/post',
  image: {
    url: 'https://media.matiasgaleano.dev/og/post.png',
    alt: 'Portada social del post Post',
    width: 1200,
    height: 630,
  },
  type: 'article' as const,
};

describe('SeoService', () => {
  let service: SeoService;
  let documentRef: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    service = TestBed.inject(SeoService);
    documentRef = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    documentRef.head.querySelector("link[rel='canonical']")?.remove();
  });

  it('deberia actualizar title, description, canonical y og tags', () => {
    service.setPageSeo({
      title: 'Blog técnico en español | Matias Galeano',
      description: 'Posts técnicos escritos desde proyectos reales.',
      canonicalUrl: 'https://matiasgaleano.dev/blog',
      type: 'website',
    });

    expect(documentRef.title).toBe('Blog técnico en español | Matias Galeano');
    expect(expectMeta('name', 'description')).toBe(
      'Posts técnicos escritos desde proyectos reales.',
    );
    expect(expectMeta('property', 'og:title')).toBe('Blog técnico en español | Matias Galeano');
    expect(expectMeta('property', 'og:url')).toBe('https://matiasgaleano.dev/blog');
    expect(expectMeta('name', 'twitter:image')).toBe(
      'https://matiasgaleano.dev/assets/icons/icon-512.webp',
    );
    expect(documentRef.head.querySelector<HTMLLinkElement>("link[rel='canonical']")?.href).toBe(
      'https://matiasgaleano.dev/blog',
    );
  });

  it('deberia sincronizar metadata de article y limpiarla al volver a website', () => {
    service.setPageSeo({
      title: 'Post | Matias Galeano',
      description: 'Detalle del post.',
      canonicalUrl: 'https://matiasgaleano.dev/blog/post',
      type: 'article',
      publishedTime: '2026-03-07T00:00:00.000Z',
      modifiedTime: '2026-03-08T00:00:00.000Z',
    });

    expect(expectMeta('property', 'article:published_time')).toBe('2026-03-07T00:00:00.000Z');
    expect(expectMeta('property', 'article:modified_time')).toBe('2026-03-08T00:00:00.000Z');

    service.setPageSeo({
      title: 'Home | Matias Galeano',
      description: 'Landing',
      canonicalUrl: 'https://matiasgaleano.dev/',
      type: 'website',
    });

    expect(documentRef.head.querySelector("meta[property='article:published_time']")).toBeNull();
    expect(documentRef.head.querySelector("meta[property='article:modified_time']")).toBeNull();
  });

  it('declara la imagen predeterminada con sus dimensiones y alt reales', () => {
    service.setPageSeo(articlePayload);
    service.setPageSeo({
      title: 'Blog | Matias Galeano',
      description: 'Listado.',
      canonicalUrl: 'https://matiasgaleano.dev/blog',
    });

    for (const [attribute, prefix] of [
      ['property', 'og'],
      ['name', 'twitter'],
    ] as const) {
      expect(expectMeta(attribute, `${prefix}:image`)).toBe(
        'https://matiasgaleano.dev/assets/icons/icon-512.webp',
      );
      expect(expectMeta(attribute, `${prefix}:image:alt`)).toBe('Logo de Matias Galeano');
    }
    expect(expectMeta('property', 'og:image:width')).toBe('512');
    expect(expectMeta('property', 'og:image:height')).toBe('512');
  });

  it('no declara dimensiones cuando no conoce las de la imagen', () => {
    service.setPageSeo(articlePayload);
    service.setPageSeo({
      title: 'Proyecto | Matias Galeano',
      description: 'Detalle.',
      canonicalUrl: 'https://matiasgaleano.dev/projects/proyecto',
      image: { url: 'https://matiasgaleano.dev/assets/nora.png', alt: 'Imagen del proyecto' },
    });

    expect(expectMeta('property', 'og:image')).toBe('https://matiasgaleano.dev/assets/nora.png');
    expect(expectMeta('property', 'og:image:width')).toBeNull();
    expect(expectMeta('property', 'og:image:height')).toBeNull();
  });

  it('excluye del indice una vista sin canonica y restaura la indexacion despues', () => {
    service.setPageSeo(articlePayload);
    service.setPageSeo({
      title: 'Artículo no encontrado | Matias Galeano',
      description: 'No existe.',
      noIndex: true,
    });

    expect(expectMeta('name', 'robots')).toBe('noindex, follow');
    expect(documentRef.head.querySelector("link[rel='canonical']")).toBeNull();
    expect(documentRef.head.querySelector("meta[property='og:url']")).toBeNull();

    service.setPageSeo(articlePayload);

    expect(expectMeta('name', 'robots')).toBe('index, follow');
    expect(documentRef.head.querySelector<HTMLLinkElement>("link[rel='canonical']")?.href).toBe(
      articlePayload.canonicalUrl,
    );
  });

  function expectMeta(attribute: 'name' | 'property', value: string): string | null {
    return (
      documentRef.head.querySelector<HTMLMetaElement>(`meta[${attribute}='${value}']`)?.content ??
      null
    );
  }
});
