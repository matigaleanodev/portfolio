import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsService } from '../../services/analytics.service';
import { ApiService } from '../../services/api.service';
import { SeoService } from '../../services/seo.service';
import { BlogUnsubscribePage } from './blog-unsubscribe.page';

describe('BlogUnsubscribePage', () => {
  const unsubscribeFromBlogMock = vi.fn(() =>
    of({
      message: 'Unsubscribed successfully',
      email: 'reader@example.com',
    }),
  );
  const trackEventMock = vi.fn();
  const setPageSeoMock = vi.fn();

  beforeEach(async () => {
    unsubscribeFromBlogMock.mockReset();
    unsubscribeFromBlogMock.mockReturnValue(
      of({
        message: 'Unsubscribed successfully',
        email: 'reader@example.com',
      }),
    );
    trackEventMock.mockReset();
    setPageSeoMock.mockReset();

    await TestBed.configureTestingModule({
      imports: [BlogUnsubscribePage],
      providers: [
        provideRouter([]),
        {
          provide: ApiService,
          useValue: {
            unsubscribeFromBlog: unsubscribeFromBlogMock,
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
            queryParamMap: of(convertToParamMap({ email: 'Reader@Example.com' })),
          },
        },
      ],
    }).compileComponents();
  });

  it('deberia precargar el email desde query params y setear SEO', () => {
    const fixture = TestBed.createComponent(BlogUnsubscribePage);
    const component = fixture.componentInstance;

    expect(component.emailControl.value).toBe('reader@example.com');
    expect(component.hasPrefilledEmail()).toBe(true);
    expect(setPageSeoMock).toHaveBeenCalledWith({
      title: 'Baja de suscripción | Blog de Matias Galeano',
      description:
        'Confirmación de baja para la suscripción del blog técnico de Matias Galeano.',
      canonicalUrl: 'https://matiasgaleano.dev/blog/unsubscribe',
      ogImage: 'https://matiasgaleano.dev/assets/icons/icon-512.webp',
      type: 'website',
    });
    expect(trackEventMock).toHaveBeenCalledWith('view_blog_unsubscribe', {
      email_prefilled: true,
    });
  });

  it('deberia confirmar la baja y exponer estado final', () => {
    const fixture = TestBed.createComponent(BlogUnsubscribePage);
    const component = fixture.componentInstance;

    component.submit();

    expect(unsubscribeFromBlogMock).toHaveBeenCalledWith({
      email: 'reader@example.com',
    });
    expect(component.submitSuccessMessage()).toBe('Unsubscribed successfully');
    expect(component.viewState()).toBe('success');
    expect(trackEventMock).toHaveBeenCalledWith('blog_unsubscribe_submit', {
      email_prefilled: true,
    });
    expect(trackEventMock).toHaveBeenCalledWith('blog_unsubscribe_success', {
      email_prefilled: true,
    });
  });

  it('deberia exigir un email valido si no hay query param valido', async () => {
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [BlogUnsubscribePage],
      providers: [
        provideRouter([]),
        {
          provide: ApiService,
          useValue: {
            unsubscribeFromBlog: unsubscribeFromBlogMock,
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
            queryParamMap: of(convertToParamMap({})),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(BlogUnsubscribePage);
    const component = fixture.componentInstance;

    component.submit();

    expect(unsubscribeFromBlogMock).not.toHaveBeenCalled();
    expect(component.submitError()).toBe('Ingresá un email válido para confirmar la baja.');
  });

  it('deberia exponer el error del backend si falla la baja', () => {
    unsubscribeFromBlogMock.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 429,
            error: { error: 'Rate limit reached' },
          }),
      ),
    );

    const fixture = TestBed.createComponent(BlogUnsubscribePage);
    const component = fixture.componentInstance;

    component.submit();

    expect(component.submitError()).toBe('Rate limit reached');
    expect(trackEventMock).toHaveBeenCalledWith('blog_unsubscribe_error', {
      email_prefilled: true,
      status: 429,
    });
  });
});
