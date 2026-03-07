import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BlogContentService } from './blog-content.service';

describe('BlogContentService', () => {
  let service: BlogContentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(BlogContentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deberia crearse', () => {
    expect(service).toBeTruthy();
  });

  it('getPosts deberia leer el indice estatico del blog', () => {
    service.getPosts().subscribe((posts) => {
      expect(posts[0]?.slug).toBe('arquitectura-angular-real');
    });

    const req = httpMock.expectOne('/assets/blog/posts.json');
    expect(req.request.method).toBe('GET');

    req.flush([
      {
        slug: 'arquitectura-angular-real',
        title: 'Como estructuro mis proyectos Angular (arquitectura real)',
        excerpt: 'Framework personal',
        date: '2026-03-07',
        tags: ['angular'],
        coverImage: '/assets/blog/arquitectura-angular-real/cover.webp',
        readingTimeMinutes: 5,
      },
    ]);
  });

  it('getPostBySlug deberia leer el artifact del post', () => {
    service.getPostBySlug('arquitectura-modo-playa').subscribe((post) => {
      expect(post.slug).toBe('arquitectura-modo-playa');
      expect(post.contentHtml).toContain('Modo Playa');
    });

    const req = httpMock.expectOne('/assets/blog/posts/arquitectura-modo-playa.json');
    expect(req.request.method).toBe('GET');

    req.flush({
      slug: 'arquitectura-modo-playa',
      title: 'Como disene la arquitectura de Modo Playa',
      excerpt: 'Multi-tenant real',
      date: '2026-03-07',
      tags: ['nestjs'],
      coverImage: '/assets/blog/arquitectura-modo-playa/cover.webp',
      readingTimeMinutes: 4,
      contentHtml: '<p>Modo Playa</p>',
      seo: {
        title: 'Como disene la arquitectura de Modo Playa | Matias Galeano',
        description: 'Multi-tenant real',
        canonicalUrl: 'https://matiasgaleano.dev/blog/arquitectura-modo-playa',
        ogImage: '/assets/blog/arquitectura-modo-playa/og.webp',
      },
    });
  });
});
