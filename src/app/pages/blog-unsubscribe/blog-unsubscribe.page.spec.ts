import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SubscriptionResponseDto } from '../../models/subscription.model';
import { AnalyticsService } from '../../services/analytics.service';
import { ApiService } from '../../services/api.service';
import { SeoService } from '../../services/seo.service';
import { BlogUnsubscribePage } from './blog-unsubscribe.page';

describe('BlogUnsubscribePage', () => {
  const unsubscribeFromBlogMock = vi.fn<() => Observable<SubscriptionResponseDto>>(() =>
    of({
      message: 'Unsubscribed successfully',
      email: 'reader@example.com',
    }),
  );
  const trackEventMock = vi.fn();
  const setPageSeoMock = vi.fn();
  const legacyDocument: Document & { portfolioUnsubscribeEmail?: string } = document;

  beforeEach(async () => {
    legacyDocument.portfolioUnsubscribeEmail = 'Reader@Example.com';
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
      ],
    }).compileComponents();
  });

  afterEach(() => {
    delete legacyDocument.portfolioUnsubscribeEmail;
  });

  it('debería mantener el SEO de la página de baja', () => {
    const fixture = TestBed.createComponent(BlogUnsubscribePage);
    fixture.detectChanges();

    expect(setPageSeoMock).toHaveBeenCalledWith({
      title: 'Baja de suscripción | Blog de Matias Galeano',
      description: 'Confirmación de baja para la suscripción del blog técnico de Matias Galeano.',
      canonicalUrl: 'https://matiasgaleano.dev/blog/unsubscribe',
      type: 'website',
    });
    expect(trackEventMock).toHaveBeenCalledWith('view_blog_unsubscribe', {
      email_prefilled: true,
    });
  });

  it('debería consumir el email que el arranque retiró de la URL sin enviar la baja', () => {
    legacyDocument.portfolioUnsubscribeEmail = 'Reader+Legacy@Example.com';
    const fixture = TestBed.createComponent(BlogUnsubscribePage);
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector<HTMLInputElement>('#unsubscribe-email')?.value).toBe(
      'reader+legacy@example.com',
    );
    expect(legacyDocument.portfolioUnsubscribeEmail).toBeUndefined();
    expect(unsubscribeFromBlogMock).not.toHaveBeenCalled();
  });

  it('deberia confirmar la baja y exponer estado final', () => {
    const fixture = TestBed.createComponent(BlogUnsubscribePage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.submit();

    expect(unsubscribeFromBlogMock).toHaveBeenCalledWith({
      email: 'reader@example.com',
    });
    expect(component.viewState()).toBe('unsubscribed');
    expect(trackEventMock).toHaveBeenCalledWith('blog_unsubscribe_submit', {
      email_prefilled: true,
    });
    expect(trackEventMock).toHaveBeenCalledWith('blog_unsubscribe_success', {
      email_prefilled: true,
    });
  });

  it('debería procesar un solo envío tras un doble click con confirmación inmediata', () => {
    const fixture = TestBed.createComponent(BlogUnsubscribePage);
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const submit = page.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    submit.click();
    submit.click();
    fixture.detectChanges();

    expect(unsubscribeFromBlogMock).toHaveBeenCalledExactlyOnceWith({
      email: 'reader@example.com',
    });
    expect(page.querySelector('h1')?.textContent).toContain('Tu suscripción fue dada de baja.');
    expect(page.textContent).not.toContain('Unsubscribed successfully');
  });

  it('debería informar si el email ya estaba dado de baja', () => {
    unsubscribeFromBlogMock.mockReturnValueOnce(of({ message: 'Already unsubscribed' }));
    const fixture = TestBed.createComponent(BlogUnsubscribePage);
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    page.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();

    expect(page.querySelector('h1')?.textContent).toContain('Tu email ya estaba dado de baja.');
  });

  it('debería anunciar el envío pendiente y procesar un solo intento', () => {
    const result = new Subject<SubscriptionResponseDto>();
    unsubscribeFromBlogMock.mockReturnValueOnce(result);
    const fixture = TestBed.createComponent(BlogUnsubscribePage);
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const submit = page.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    submit.click();
    submit.click();
    fixture.detectChanges();

    expect(unsubscribeFromBlogMock).toHaveBeenCalledTimes(1);
    expect(submit.getAttribute('aria-disabled')).toBe('true');
    expect(page.querySelector('[role="status"]')?.textContent).toContain('Confirmando la baja');
    result.complete();
  });

  it('debería exigir un email válido cuando el campo está vacío', () => {
    delete legacyDocument.portfolioUnsubscribeEmail;
    const fixture = TestBed.createComponent(BlogUnsubscribePage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.submit();

    expect(unsubscribeFromBlogMock).not.toHaveBeenCalled();
    expect(component.emailError()).toBe('Ingresá un email válido para confirmar la baja.');
  });

  it('debería mostrar un mensaje local ante el límite de intentos', () => {
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
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.submit();

    expect(component.submitError()).toBe(
      'Hay demasiados intentos de baja. Probá de nuevo más tarde.',
    );
    expect(trackEventMock).toHaveBeenCalledWith('blog_unsubscribe_error', {
      email_prefilled: true,
      status: 429,
    });
  });
});
