import { TestBed } from '@angular/core/testing';
import { ApplicationRef, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BlogPost } from '../models/blog.model';
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

  it('deberia guardar el post en TransferState cuando corre en SSR', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    service = TestBed.inject(BlogContentService);
    httpMock = TestBed.inject(HttpTestingController);
    vi.spyOn(
      service as unknown as BlogContentServicePrivateApi,
      'readContentFile',
    ).mockResolvedValueOnce(postMock('a'));

    await new Promise((resolve) => service.getPostBySlug('a').subscribe(resolve));

    expect(TestBed.inject(TransferState).get(stateKey('a'), null)).toEqual(postMock('a'));
  });

  describe('estabilidad del prerender', () => {
    const configureServer = () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
      service = TestBed.inject(BlogContentService);
      httpMock = TestBed.inject(HttpTestingController);
    };
    const pendingRead = () => {
      let resolve!: (value: unknown) => void;
      let reject!: (error: unknown) => void;
      const promise = new Promise<unknown>((done, fail) => {
        resolve = done;
        reject = fail;
      });
      vi.spyOn(
        service as unknown as BlogContentServicePrivateApi,
        'readContentFile',
      ).mockReturnValueOnce(promise);
      return { resolve, reject };
    };
    const watchStability = () => {
      const state = { stable: false, done: Promise.resolve() };
      state.done = TestBed.inject(ApplicationRef)
        .whenStable()
        .then(() => {
          state.stable = true;
        });
      return state;
    };
    const nextTask = () => new Promise((resolve) => setTimeout(resolve, 20));
    const reads = [
      ['el indice', () => service.getPosts(), 'blog-posts', postsMock()],
      ['el articulo', () => service.getPostBySlug('a'), 'blog-post:a', postMock('a')],
    ] as const;

    for (const [name, read, key, content] of reads) {
      it(`no declara estable la aplicacion mientras lee ${name}`, async () => {
        configureServer();
        const file = pendingRead();
        let received: unknown;
        (read() as Observable<unknown>).subscribe((value) => (received = value));
        const stability = watchStability();

        await nextTask();
        expect(stability.stable).toBe(false);

        file.resolve(content);
        await stability.done;
        // Al quedar estable, el contenido ya llego a la vista y al estado transferido.
        expect(received).toEqual(content);
        expect(TestBed.inject(TransferState).get(makeStateKey<unknown>(key), null)).toEqual(
          content,
        );
      });
    }

    it('libera la tarea y propaga el error si la lectura falla', async () => {
      configureServer();
      const file = pendingRead();
      let failure: unknown;
      service.getPostBySlug('a').subscribe({ error: (error: unknown) => (failure = error) });
      const stability = watchStability();

      await nextTask();
      expect(stability.stable).toBe(false);

      file.reject(new Error('ENOENT'));
      await stability.done;
      expect((failure as Error).message).toBe('ENOENT');
      expect(TestBed.inject(TransferState).hasKey(stateKey('a'))).toBe(false);
    });

    it('libera la tarea si se cancela la lectura', async () => {
      configureServer();
      pendingRead();
      const subscription = service.getPostBySlug('a').subscribe();
      const stability = watchStability();

      await nextTask();
      expect(stability.stable).toBe(false);

      subscription.unsubscribe();
      await stability.done;
    });
  });

  it('deberia emitir el estado transferido en forma sincrona, sin request, y borrarlo', () => {
    const state = TestBed.inject(TransferState);
    state.set(stateKey('a'), postMock('a'));
    const received: BlogPost[] = [];

    service.getPostBySlug('a').subscribe((post) => received.push(post));

    expect(received).toEqual([postMock('a')]);
    expect(state.hasKey(stateKey('a'))).toBe(false);
    httpMock.expectNone('/assets/blog/posts/a.json');
  });

  it('deberia conservar el estado transferido hasta la suscripcion', () => {
    const state = TestBed.inject(TransferState);
    state.set(stateKey('a'), postMock('a'));

    service.getPostBySlug('a');

    expect(state.hasKey(stateKey('a'))).toBe(true);
  });

  it('deberia pedir el post por HTTP en la segunda lectura', () => {
    TestBed.inject(TransferState).set(stateKey('a'), postMock('a'));
    service.getPostBySlug('a').subscribe();

    service.getPostBySlug('a').subscribe();

    httpMock.expectOne('/assets/blog/posts/a.json').flush(postMock('a'));
  });

  it('deberia ignorar y conservar el estado de otro slug', () => {
    const state = TestBed.inject(TransferState);
    state.set(stateKey('a'), postMock('a'));
    const received: BlogPost[] = [];

    service.getPostBySlug('b').subscribe((post) => received.push(post));
    httpMock.expectOne('/assets/blog/posts/b.json').flush(postMock('b'));

    expect(received).toEqual([postMock('b')]);
    expect(state.hasKey(stateKey('a'))).toBe(true);
  });

  it('deberia transferir el indice del blog y usarlo una sola vez sin request', () => {
    const state = TestBed.inject(TransferState);
    state.set(makeStateKey<ReturnType<typeof postsMock>>('blog-posts'), postsMock());
    const received: unknown[] = [];

    service.getPosts().subscribe((posts) => received.push(posts));

    expect(received).toEqual([postsMock()]);
    httpMock.expectNone('/assets/blog/posts.json');
    service.getPosts().subscribe();
    httpMock.expectOne('/assets/blog/posts.json').flush(postsMock());
  });

});

function stateKey(slug: string) {
  return makeStateKey<BlogPost>(`blog-post:${slug}`);
}

function postMock(slug: string): BlogPost {
  return {
    slug,
    title: `Post ${slug}`,
    excerpt: 'Extracto',
    date: '2026-03-07',
    tags: ['angular'],
    coverImage: `/assets/blog/${slug}/cover.webp`,
    readingTimeMinutes: 4,
    contentHtml: '<p>Contenido</p>',
    seo: {
      title: `Post ${slug} | Matias Galeano`,
      description: 'Extracto',
      canonicalUrl: `https://matiasgaleano.dev/blog/${slug}`,
      ogImage: `/assets/blog/${slug}/og.webp`,
    },
  };
}

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
