import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BlogPost } from '../../models/blog.model';
import { AnalyticsService } from '../../services/analytics.service';
import { BlogContentService } from '../../services/blog-content.service';
import { SeoService } from '../../services/seo.service';
import { BlogPostPage } from './blog-post.page';

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
  const trackEventMock = vi.fn();
  const setPageSeoMock = vi.fn();

  beforeEach(async () => {
    getPostBySlugMock.mockReset();
    getPostBySlugMock.mockReturnValue(of(postMock));
    trackEventMock.mockReset();
    setPageSeoMock.mockReset();

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
            paramMap: of(convertToParamMap({ slug: 'arquitectura-modo-playa' })),
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
});
