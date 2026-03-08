import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BlogPostSummary } from '../../models/blog.model';
import { AnalyticsService } from '../../services/analytics.service';
import { ApiService } from '../../services/api.service';
import { BlogContentService } from '../../services/blog-content.service';
import { SeoService } from '../../services/seo.service';
import { BlogListPage } from './blog-list.page';

describe('BlogListPage', () => {
  let fixture: ComponentFixture<BlogListPage>;

  const postsMock: BlogPostSummary[] = [
    {
      slug: 'arquitectura-modo-playa',
      title: 'Cómo diseñé la arquitectura de Modo Playa',
      excerpt: 'Arquitectura multi-tenant real con MongoDB',
      date: '2026-03-07',
      tags: ['nestjs', 'mongodb'],
      coverImage: '/assets/blog/arquitectura-modo-playa/cover.webp',
      readingTimeMinutes: 4,
    },
    {
      slug: 'arquitectura-angular-real',
      title: 'Cómo estructuro mis proyectos Angular (arquitectura real)',
      excerpt: 'Framework personal',
      date: '2026-03-05',
      tags: ['angular'],
      coverImage: '/assets/blog/arquitectura-angular-real/cover.webp',
      readingTimeMinutes: 5,
    },
    {
      slug: 'desplegar-apis-docker-ec2',
      title: 'Cómo desplegar APIs con Docker en un EC2 (paso a paso)',
      excerpt: 'Deploy automático con GitHub Actions',
      date: '2026-03-02',
      tags: ['aws', 'docker'],
      coverImage: '/assets/blog/desplegar-apis-docker-ec2/cover.webp',
      readingTimeMinutes: 6,
    },
  ];

  const getPostsMock = vi.fn(() => of(postsMock));
  const subscribeToBlogMock = vi.fn(() =>
    of({
      message: 'Subscribed successfully',
      email: 'reader@example.com',
    }),
  );
  const trackEventMock = vi.fn();
  const setPageSeoMock = vi.fn();

  beforeEach(async () => {
    getPostsMock.mockReset();
    getPostsMock.mockReturnValue(of(postsMock));
    subscribeToBlogMock.mockReset();
    subscribeToBlogMock.mockReturnValue(
      of({
        message: 'Subscribed successfully',
        email: 'reader@example.com',
      }),
    );
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
          provide: ApiService,
          useValue: {
            subscribeToBlog: subscribeToBlogMock,
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
      post_count: 3,
    });
  });

  it('deberia trackear el click de una card', () => {
    fixture = TestBed.createComponent(BlogListPage);
    const component = fixture.componentInstance;

    component.trackPostClick(postsMock[0], 1);

    expect(trackEventMock).toHaveBeenLastCalledWith('click_blog_post_card', {
      post_slug: 'arquitectura-modo-playa',
      post_title: 'Cómo diseñé la arquitectura de Modo Playa',
      position: 1,
    });
  });

  it('deberia exponer error cuando falla la carga', () => {
    getPostsMock.mockReturnValueOnce(throwError(() => new Error('boom')));

    fixture = TestBed.createComponent(BlogListPage);

    expect(fixture.componentInstance.errorMessage()).toBe('boom');
  });

  it('deberia filtrar posts por busqueda local', () => {
    fixture = TestBed.createComponent(BlogListPage);
    const component = fixture.componentInstance;

    component.updateSearchQuery('mongodb');

    expect(component.filteredPosts()).toHaveLength(1);
    expect(component.filteredPosts()[0].slug).toBe('arquitectura-modo-playa');
    expect(trackEventMock).toHaveBeenCalledWith('search_blog_posts', {
      query_length: 7,
      result_count: 1,
    });
  });

  it('deberia reordenar posts por fecha ascendente', () => {
    fixture = TestBed.createComponent(BlogListPage);
    const component = fixture.componentInstance;

    component.updateSortOrder('oldest');

    expect(component.filteredPosts().map((post) => post.slug)).toEqual([
      'desplegar-apis-docker-ec2',
      'arquitectura-angular-real',
      'arquitectura-modo-playa',
    ]);
    expect(trackEventMock).toHaveBeenCalledWith('sort_blog_posts', {
      sort_order: 'oldest',
      result_count: 3,
    });
  });

  it('deberia suscribir un email valido y limpiar el campo', () => {
    fixture = TestBed.createComponent(BlogListPage);
    const component = fixture.componentInstance;

    component.subscriptionEmailControl.setValue('Reader@Example.com');
    component.submitSubscription();

    expect(subscribeToBlogMock).toHaveBeenCalledWith({
      email: 'reader@example.com',
    });
    expect(component.subscriptionSuccessMessage()).toBe('Subscribed successfully');
    expect(component.subscriptionError()).toBe('');
    expect(component.subscriptionEmailControl.value).toBe('');
    expect(trackEventMock).toHaveBeenCalledWith('blog_subscription_submit', {
      location: 'blog_hero_toolbar',
    });
    expect(trackEventMock).toHaveBeenCalledWith('blog_subscription_success', {
      location: 'blog_hero_toolbar',
    });
  });

  it('deberia exponer error de validacion si el email es invalido', () => {
    fixture = TestBed.createComponent(BlogListPage);
    const component = fixture.componentInstance;

    component.subscriptionEmailControl.setValue('invalid-email');
    component.submitSubscription();

    expect(subscribeToBlogMock).not.toHaveBeenCalled();
    expect(component.subscriptionError()).toBe('Ingresá un email válido para suscribirte.');
  });

  it('deberia exponer error del backend cuando falla la suscripcion', () => {
    subscribeToBlogMock.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 429,
            error: { error: 'Rate limit reached' },
          }),
      ),
    );

    fixture = TestBed.createComponent(BlogListPage);
    const component = fixture.componentInstance;

    component.subscriptionEmailControl.setValue('reader@example.com');
    component.submitSubscription();

    expect(component.subscriptionError()).toBe('Rate limit reached');
    expect(component.subscriptionSuccessMessage()).toBe('');
    expect(trackEventMock).toHaveBeenCalledWith('blog_subscription_error', {
      location: 'blog_hero_toolbar',
      status: 429,
    });
  });
});
