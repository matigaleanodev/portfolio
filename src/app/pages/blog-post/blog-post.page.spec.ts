import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BlogPost } from '../../models/blog.model';
import { AnalyticsService } from '../../services/analytics.service';
import { BlogContentService } from '../../services/blog-content.service';
import { BlogPostPage } from './blog-post.page';

describe('BlogPostPage', () => {
  let fixture: ComponentFixture<BlogPostPage>;

  const postMock: BlogPost = {
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
  };

  const getPostBySlugMock = vi.fn(() => of(postMock));
  const trackEventMock = vi.fn();

  beforeEach(async () => {
    getPostBySlugMock.mockReset();
    getPostBySlugMock.mockReturnValue(of(postMock));
    trackEventMock.mockReset();

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
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ slug: 'arquitectura-modo-playa' })),
          },
        },
      ],
    }).compileComponents();
  });

  it('deberia cargar el post y trackear su vista', () => {
    fixture = TestBed.createComponent(BlogPostPage);

    expect(getPostBySlugMock).toHaveBeenCalledWith('arquitectura-modo-playa');
    expect(trackEventMock).toHaveBeenCalledWith('view_blog_post', {
      post_slug: 'arquitectura-modo-playa',
      post_title: 'Como disene la arquitectura de Modo Playa',
      reading_time_minutes: 4,
    });
  });
});
