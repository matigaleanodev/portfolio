import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import mermaid from 'mermaid';

import { BlogPost } from '../../models/blog.model';
import { AnalyticsService } from '../../services/analytics.service';
import { BlogContentService } from '../../services/blog-content.service';
import { SeoService } from '../../services/seo.service';
import { BlogPostPage } from './blog-post.page';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async () => ({
      svg: '<svg data-testid="mermaid-diagram"></svg>',
    })),
  },
}));

describe('BlogPostPage', () => {
  const postMock: BlogPost = {
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
      ogImage: 'https://media.matiasgaleano.dev/og/arquitectura-modo-playa.png',
    },
  };

  const getPostBySlugMock = vi.fn(() => of(postMock));
  const paramMap$ = new BehaviorSubject(convertToParamMap({ slug: postMock.slug }));
  const trackEventMock = vi.fn();
  const setPageSeoMock = vi.fn();

  beforeEach(async () => {
    getPostBySlugMock.mockReset();
    getPostBySlugMock.mockReturnValue(of(postMock));
    trackEventMock.mockReset();
    setPageSeoMock.mockReset();
    paramMap$.next(convertToParamMap({ slug: postMock.slug }));

    await TestBed.configureTestingModule({
      imports: [BlogPostPage],
      providers: [
        provideRouter([]),
        {
          provide: BlogContentService,
          useValue: {
            getPostBySlug: getPostBySlugMock,
          },
        },
        {
          provide: AnalyticsService,
          useValue: {
            trackEvent: trackEventMock,
          },
        },
        {
          provide: SeoService,
          useValue: {
            setPageSeo: setPageSeoMock,
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$,
          },
        },
      ],
    }).compileComponents();
  });

  it('deberia cargar el post y trackear su vista', () => {
    TestBed.createComponent(BlogPostPage);

    expect(getPostBySlugMock).toHaveBeenCalledWith('arquitectura-modo-playa');
    expect(setPageSeoMock).toHaveBeenCalledWith({
      title: 'Cómo diseñé la arquitectura de Modo Playa | Matias Galeano',
      description: 'Multi-tenant real',
      canonicalUrl: 'https://matiasgaleano.dev/blog/arquitectura-modo-playa',
      ogImage: 'https://media.matiasgaleano.dev/og/arquitectura-modo-playa.png',
      ogImageAlt: 'Portada social del post Cómo diseñé la arquitectura de Modo Playa',
      type: 'article',
      publishedTime: '2026-03-07T00:00:00.000Z',
      modifiedTime: undefined,
    });
    expect(trackEventMock).toHaveBeenCalledWith('view_blog_post', {
      post_slug: 'arquitectura-modo-playa',
      post_title: 'Cómo diseñé la arquitectura de Modo Playa',
      reading_time_minutes: 4,
    });
  });

  it('deberia mostrar el articulo en la primera deteccion si el servicio es sincrono', () => {
    const fixture = TestBed.createComponent(BlogPostPage);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('h1')?.textContent).toContain(postMock.title);
    expect(host.querySelector('.blog-post-loading')).toBeNull();
  });

  it('deberia mostrar la carga sin contenido anterior mientras llega otro post', () => {
    const fixture = TestBed.createComponent(BlogPostPage);
    fixture.detectChanges();
    getPostBySlugMock.mockReturnValue(new Subject<BlogPost>());

    paramMap$.next(convertToParamMap({ slug: 'otro-post' }));
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.blog-post-loading')).not.toBeNull();
    expect(host.querySelector('h1')).toBeNull();
    expect(host.textContent).not.toContain('Modo Playa');
  });

  it('deberia mostrar el error si falla la carga', () => {
    getPostBySlugMock.mockReturnValue(throwError(() => new Error('Fallo simulado')));

    const fixture = TestBed.createComponent(BlogPostPage);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('h1')?.textContent).toContain('No pudimos cargar el artículo');
    expect(host.textContent).not.toContain('Fallo simulado');
    expect(host.querySelector('a[href="/blog"]')?.textContent).toContain('Volver al blog');
    expect(host.querySelector('.blog-post-loading')).toBeNull();
  });

  it('deberia renderizar bloques mermaid dentro del contenido del post', async () => {
    getPostBySlugMock.mockReturnValue(
      of({
        ...postMock,
        slug: 'observability',
        contentHtml:
          '<pre><code class="language-mermaid">flowchart LR\nA[API] --> B[Loki]</code></pre>',
      }),
    );

    const fixture = TestBed.createComponent(BlogPostPage);
    fixture.detectChanges();
    const renderMermaidBlocks = Reflect.get(
      fixture.componentInstance as object,
      'renderMermaidBlocks',
    ) as ((slug: string) => Promise<void>) | undefined;

    expect(renderMermaidBlocks).toBeTypeOf('function');
    await renderMermaidBlocks?.call(fixture.componentInstance, 'observability');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.mermaid-diagram svg')).not.toBeNull();
    expect(host.querySelector('pre code.language-mermaid')).toBeNull();
    expect(mermaid.render).toHaveBeenCalled();
  });

  it('deberia recuperarse al navegar de una ruta inexistente a una valida', () => {
    getPostBySlugMock.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    const fixture = TestBed.createComponent(BlogPostPage);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('h1')?.textContent).toContain('No encontramos este artículo');
    expect(setPageSeoMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: 'Artículo no encontrado | Matias Galeano' }),
    );

    getPostBySlugMock.mockReturnValue(of(postMock));
    paramMap$.next(convertToParamMap({ slug: postMock.slug }));
    fixture.detectChanges();

    expect(host.querySelector('h1')?.textContent).toContain(postMock.title);
  });

  it('deberia llevar el foco al titulo si el reintento termina en no encontrado', async () => {
    getPostBySlugMock.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    const fixture = TestBed.createComponent(BlogPostPage);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const retry = host.querySelector<HTMLButtonElement>('.blog-post-state button')!;
    retry.focus();

    getPostBySlugMock.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    retry.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const title = host.querySelector('h1')!;
    expect(title.textContent).toContain('No encontramos este artículo');
    expect(document.activeElement).toBe(title);
  });

  describe('copiar codigo', () => {
    const withCode = {
      ...postMock,
      contentHtml: '<pre><code class="language-bash">ls -la</code></pre>',
    };
    let writeText: ReturnType<typeof vi.fn>;
    let settle: { resolve: () => void; reject: () => void };

    const setup = () => {
      writeText = vi.fn(
        () =>
          new Promise<void>((resolve, reject) => {
            settle = { resolve, reject: () => reject(new Error('denegado')) };
          }),
      );
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
      getPostBySlugMock.mockReturnValue(of(withCode));
      const fixture = TestBed.createComponent(BlogPostPage);
      document.body.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      return {
        host,
        button: host.querySelector<HTMLButtonElement>('.code-copy')!,
        status: host.querySelector<HTMLElement>('.code-toolbar [role="status"]')!,
      };
    };

    for (const outcome of ['resolve', 'reject'] as const) {
      it(`deberia mantener Loading y el foco hasta ${outcome}, sin duplicar`, async () => {
        const { host, button, status } = setup();
        button.focus();

        button.click();
        button.click();

        expect(writeText).toHaveBeenCalledTimes(1);
        expect(button.getAttribute('aria-busy')).toBe('true');
        expect(button.getAttribute('aria-disabled')).toBe('true');
        expect(button.disabled).toBe(false);
        expect(button.getAttribute('aria-label')).toContain('Copiando…');
        expect(status.textContent).toContain('Copiando…');

        settle[outcome]();
        await new Promise((done) => setTimeout(done));

        expect(button.hasAttribute('aria-busy')).toBe(false);
        expect(button.hasAttribute('aria-disabled')).toBe(false);
        expect(status.textContent).toContain(
          outcome === 'resolve' ? 'Código copiado.' : 'No se pudo copiar',
        );
        expect(status.dataset['result']).toBe(outcome === 'resolve' ? 'success' : 'error');
        expect(document.activeElement).toBe(button);
        host.remove();
      });
    }
  });
});
