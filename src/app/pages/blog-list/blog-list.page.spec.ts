import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BlogPostSummary } from '../../models/blog.model';
import { AnalyticsService } from '../../services/analytics.service';
import { BlogContentService } from '../../services/blog-content.service';
import { SeoService } from '../../services/seo.service';
import { BlogListPage } from './blog-list.page';

describe('BlogListPage', () => {
  let fixture: ComponentFixture<BlogListPage>;

  const postsMock: BlogPostSummary[] = [
    {
      slug: 'arquitectura-angular-real',
      title: 'Cómo estructuro mis proyectos Angular (arquitectura real)',
      excerpt: 'Framework personal',
      date: '2026-03-05',
      tags: ['angular'],
      coverImage: '/assets/blog/arquitectura-angular-real/cover.webp',
      readingTimeMinutes: 5,
    },
  ];

  const getPostsMock = vi.fn(() => of(postsMock));
  const trackEventMock = vi.fn();
  const setPageSeoMock = vi.fn();

  beforeEach(async () => {
    getPostsMock.mockReset();
    getPostsMock.mockReturnValue(of(postsMock));
    trackEventMock.mockReset();
    setPageSeoMock.mockReset();

    await TestBed.configureTestingModule({
      imports: [BlogListPage],
      providers: [
        provideRouter([]),
        {
          provide: BlogContentService,
          useValue: {
            getPosts: getPostsMock,
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
      ],
    }).compileComponents();
  });

  it('deberia trackear la vista del indice del blog', () => {
    fixture = TestBed.createComponent(BlogListPage);

    expect(setPageSeoMock).toHaveBeenCalledWith({
      title: 'Blog técnico en español | Matias Galeano',
      description:
        'Posts técnicos en español sobre Angular, NestJS, AWS, arquitectura y decisiones de producto escritos desde proyectos reales.',
      canonicalUrl: 'https://matiasgaleano.dev/blog',
      ogImage: 'https://matiasgaleano.dev/assets/icons/icon-512.webp',
      type: 'website',
    });
    expect(trackEventMock).toHaveBeenCalledWith('view_blog_index', {
      post_count: 1,
    });
  });

  it('deberia trackear el click de una card', () => {
    fixture = TestBed.createComponent(BlogListPage);
    const component = fixture.componentInstance;

    component.trackPostClick(postsMock[0], 1);

    expect(trackEventMock).toHaveBeenCalledWith('click_blog_post_card', {
      post_slug: 'arquitectura-angular-real',
      post_title: 'Cómo estructuro mis proyectos Angular (arquitectura real)',
      position: 1,
    });
  });

  it('deberia exponer error cuando falla la carga', () => {
    getPostsMock.mockReturnValueOnce(throwError(() => new Error('boom')));

    fixture = TestBed.createComponent(BlogListPage);

    expect(fixture.componentInstance.errorMessage()).toBe('boom');
  });
});
