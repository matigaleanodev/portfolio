import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BlogContentService } from './blog-content.service';

interface BlogContentServicePrivateApi {
  readContentFile<T>(fileSegments: string[]): Promise<T>;
}

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
        title: 'Cómo estructuro mis proyectos Angular (arquitectura real)',
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
      title: 'Cómo diseñé la arquitectura de Modo Playa',
      excerpt: 'Multi-tenant real',
      date: '2026-03-07',
      tags: ['nestjs'],
      coverImage: '/assets/blog/arquitectura-modo-playa/cover.webp',
      readingTimeMinutes: 4,
      contentHtml: '<p>Modo Playa</p>',
      seo: {
        title: 'Cómo diseñé la arquitectura de Modo Playa | Matias Galeano',
        description: 'Multi-tenant real',
        canonicalUrl: 'https://matiasgaleano.dev/blog/arquitectura-modo-playa',
        ogImage: '/assets/blog/arquitectura-modo-playa/og.webp',
      },
    });
  });

  it('deberia leer el indice desde archivo cuando corre en SSR', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: PLATFORM_ID,
          useValue: 'server',
        },
      ],
    });

    service = TestBed.inject(BlogContentService);
    httpMock = TestBed.inject(HttpTestingController);

    const readContentFileSpy = vi.spyOn(
      service as unknown as BlogContentServicePrivateApi,
      'readContentFile',
    );
    readContentFileSpy.mockResolvedValueOnce(postsMock());

    const posts = await new Promise((resolve) => {
      service.getPosts().subscribe(resolve);
    });

    expect(posts).toEqual(postsMock());
    expect(readContentFileSpy).toHaveBeenCalledWith(['src', 'assets', 'blog', 'posts.json']);
    httpMock.expectNone('/assets/blog/posts.json');
  });

  it('deberia leer el post por slug desde archivo cuando corre en SSR', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: PLATFORM_ID,
          useValue: 'server',
        },
      ],
    });

    service = TestBed.inject(BlogContentService);
    httpMock = TestBed.inject(HttpTestingController);

    const post = {
      slug: 'arquitectura-modo-playa',
      title: 'Cómo diseñé la arquitectura de Modo Playa',
      excerpt: 'Multi-tenant real',
      date: '2026-03-07',
      tags: ['nestjs'],
      coverImage: '/assets/blog/arquitectura-modo-playa/cover.webp',
      readingTimeMinutes: 4,
      contentHtml: '<p>Modo Playa</p>',
      seo: {
        title: 'Cómo diseñé la arquitectura de Modo Playa | Matias Galeano',
        description: 'Multi-tenant real',
        canonicalUrl: 'https://matiasgaleano.dev/blog/arquitectura-modo-playa',
        ogImage: '/assets/blog/arquitectura-modo-playa/og.webp',
      },
    };

    const readContentFileSpy = vi.spyOn(
      service as unknown as BlogContentServicePrivateApi,
      'readContentFile',
    );
    readContentFileSpy.mockResolvedValueOnce(post);

    const result = await new Promise((resolve) => {
      service.getPostBySlug('arquitectura-modo-playa').subscribe(resolve);
    });

    expect(result).toEqual(post);
    expect(readContentFileSpy).toHaveBeenCalledWith([
      'src',
      'assets',
      'blog',
      'posts',
      'arquitectura-modo-playa.json',
    ]);
    httpMock.expectNone('/assets/blog/posts/arquitectura-modo-playa.json');
  });
});

function postsMock() {
  return [
    {
      slug: 'arquitectura-angular-real',
      title: 'Cómo estructuro mis proyectos Angular (arquitectura real)',
      excerpt: 'Framework personal',
      date: '2026-03-07',
      tags: ['angular'],
      coverImage: '/assets/blog/arquitectura-angular-real/cover.webp',
      readingTimeMinutes: 5,
    },
  ];
}
