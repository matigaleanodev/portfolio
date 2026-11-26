import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BlogPostSummary } from '../../models/blog.model';
import { SubscriptionEmailDto, SubscriptionResponseDto } from '../../models/subscription.model';
import { AnalyticsService } from '../../services/analytics.service';
import { ApiService } from '../../services/api.service';
import { BlogContentService } from '../../services/blog-content.service';
import { SeoService } from '../../services/seo.service';
import { BlogListPage } from './blog-list.page';

const FEEDBACK_ID = 'blog-subscription-feedback';

const MESSAGES = {
  submitting: 'Enviando tu suscripción…',
  success: '¡Listo! Ya estás suscripto. Te va a llegar un mail con cada publicación nueva.',
  already: 'Ese correo ya estaba suscripto. No tenés que hacer nada más.',
  invalid: 'Ingresá un email válido para suscribirte.',
  rateLimited: 'Hiciste demasiados intentos. Esperá un rato y volvé a probar.',
  badGateway: 'No pudimos guardar tu suscripción. Probá de nuevo en unos minutos.',
  unavailable: 'La suscripción no está disponible en este momento. Probá de nuevo más tarde.',
  offline: 'No pudimos conectarnos. Revisá tu conexión y volvé a intentar.',
  generic: 'No pudimos procesar la suscripción. Probá de nuevo en unos minutos.',
};

describe('BlogListPage', () => {
  let fixture: ComponentFixture<BlogListPage>;

  const form = (): HTMLFormElement =>
    fixture.nativeElement.querySelector('.blog-toolbar__subscribe-form');
  const emailInput = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('#blog-subscription-email');
  const submitButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('.blog-toolbar__subscribe-button');
  const feedback = (): HTMLElement => fixture.nativeElement.querySelector(`#${FEEDBACK_ID}`);
  const feedbackText = (): string => feedback().textContent?.trim() ?? '';

  const nativeSubmit = (): Event => {
    const event = new Event('submit', { bubbles: true, cancelable: true });
    form().dispatchEvent(event);
    return event;
  };

  it('debería validar al enviar el formulario nativo sin navegar', () => {
    fixture = TestBed.createComponent(BlogListPage);
    fixture.detectChanges();

    const event = nativeSubmit();
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(true);
    expect(feedbackText()).toBe(MESSAGES.invalid);
    expect(subscribeToBlogMock).not.toHaveBeenCalled();
  });

  it('debería ignorar acentos, mayúsculas y espacios al buscar', () => {
    fixture = TestBed.createComponent(BlogListPage);
    fixture.componentInstance.updateSearchQuery('  COMO DISENE  ');
    expect(fixture.componentInstance.filteredPosts().map((post) => post.slug)).toEqual([
      'arquitectura-modo-playa',
    ]);
  });

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
  const subscribeToBlogMock = vi.fn<
    (dto: SubscriptionEmailDto) => Observable<SubscriptionResponseDto>
  >(() =>
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

  describe('suscripción', () => {
    it('deberia suscribir un email nuevo, mostrar el mensaje de exito y limpiar el campo', () => {
      fixture = TestBed.createComponent(BlogListPage);
      fixture.detectChanges();
      const component = fixture.componentInstance;

      component.subscriptionEmailControl.setValue('Reader@Example.com');
      component.submitSubscription();
      fixture.detectChanges();

      expect(subscribeToBlogMock).toHaveBeenCalledWith({
        email: 'reader@example.com',
      });
      expect(feedbackText()).toBe(MESSAGES.success);
      expect(emailInput().value).toBe('');
      expect(trackEventMock).toHaveBeenCalledWith('blog_subscription_submit', {
        location: 'blog_index_subscription',
      });
      expect(trackEventMock).toHaveBeenCalledWith('blog_subscription_success', {
        location: 'blog_index_subscription',
      });
    });

    it('deberia informar que el correo ya estaba suscripto y limpiar el campo', () => {
      subscribeToBlogMock.mockReturnValueOnce(of({ message: 'Already subscribed' }));
      fixture = TestBed.createComponent(BlogListPage);
      fixture.detectChanges();

      fixture.componentInstance.subscriptionEmailControl.setValue('reader@example.com');
      fixture.componentInstance.submitSubscription();
      fixture.detectChanges();

      expect(feedbackText()).toBe(MESSAGES.already);
      expect(emailInput().value).toBe('');
      expect(emailInput().getAttribute('aria-invalid')).toBe('false');
      expect(emailInput().getAttribute('aria-describedby')).toBeNull();
    });

    it('deberia mostrar error de validacion local sin llamar a la API', () => {
      fixture = TestBed.createComponent(BlogListPage);
      fixture.detectChanges();
      const component = fixture.componentInstance;

      component.subscriptionEmailControl.setValue('invalid-email');
      component.submitSubscription();
      fixture.detectChanges();

      expect(subscribeToBlogMock).not.toHaveBeenCalled();
      expect(feedbackText()).toBe(MESSAGES.invalid);
      expect(emailInput().value).toBe('invalid-email');
      expect(emailInput().getAttribute('aria-invalid')).toBe('true');
      expect(emailInput().getAttribute('aria-describedby')).toBe(FEEDBACK_ID);
    });

    it('deberia marcar el campo como invalido ante un 400 y conservar el valor', () => {
      subscribeToBlogMock.mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: { message: 'email must be an email' },
            }),
        ),
      );
      fixture = TestBed.createComponent(BlogListPage);
      fixture.detectChanges();

      fixture.componentInstance.subscriptionEmailControl.setValue('reader@example.com');
      fixture.componentInstance.submitSubscription();
      fixture.detectChanges();

      expect(feedbackText()).toBe(MESSAGES.invalid);
      expect(emailInput().value).toBe('reader@example.com');
      expect(emailInput().getAttribute('aria-invalid')).toBe('true');
      expect(emailInput().getAttribute('aria-describedby')).toBe(FEEDBACK_ID);
      expect(trackEventMock).toHaveBeenCalledWith('blog_subscription_error', {
        location: 'blog_index_subscription',
        status: 400,
      });
    });

    it.each([
      ['429', 429, MESSAGES.rateLimited],
      ['502', 502, MESSAGES.badGateway],
      ['503', 503, MESSAGES.unavailable],
      ['status 0', 0, MESSAGES.offline],
      ['otro status', 500, MESSAGES.generic],
    ])(
      'deberia mostrar mensaje de %s sin texto tecnico, conservar el valor y no marcar el campo',
      (_label, status, expected) => {
        subscribeToBlogMock.mockReturnValueOnce(
          throwError(
            () =>
              new HttpErrorResponse({
                status,
                error: { error: 'Rate limit reached', message: 'internal details' },
              }),
          ),
        );
        fixture = TestBed.createComponent(BlogListPage);
        fixture.detectChanges();

        fixture.componentInstance.subscriptionEmailControl.setValue('reader@example.com');
        fixture.componentInstance.submitSubscription();
        fixture.detectChanges();

        expect(feedbackText()).toBe(expected);
        expect(feedbackText()).not.toContain('Rate limit reached');
        expect(feedbackText()).not.toContain('internal details');
        expect(emailInput().value).toBe('reader@example.com');
        expect(emailInput().getAttribute('aria-invalid')).toBe('false');
        expect(emailInput().getAttribute('aria-describedby')).toBeNull();
        expect(trackEventMock).toHaveBeenCalledWith('blog_subscription_error', {
          location: 'blog_index_subscription',
          status,
        });
      },
    );

    it('deberia mostrar mensaje generico ante un error que no es HTTP', () => {
      subscribeToBlogMock.mockReturnValueOnce(throwError(() => new Error('boom')));
      fixture = TestBed.createComponent(BlogListPage);
      fixture.detectChanges();

      fixture.componentInstance.subscriptionEmailControl.setValue('reader@example.com');
      fixture.componentInstance.submitSubscription();
      fixture.detectChanges();

      expect(feedbackText()).toBe(MESSAGES.generic);
      expect(feedbackText()).not.toContain('boom');
      expect(emailInput().value).toBe('reader@example.com');
    });

    it('deberia ignorar envios duplicados mientras se envia', () => {
      const response$ = new Subject<SubscriptionResponseDto>();
      subscribeToBlogMock.mockReturnValueOnce(response$.asObservable());
      fixture = TestBed.createComponent(BlogListPage);
      fixture.detectChanges();
      const component = fixture.componentInstance;

      component.subscriptionEmailControl.setValue('reader@example.com');
      component.submitSubscription();
      component.submitSubscription();
      fixture.detectChanges();

      expect(subscribeToBlogMock).toHaveBeenCalledTimes(1);
      expect(submitButton().disabled).toBe(false);
      expect(submitButton().getAttribute('aria-disabled')).toBe('true');
      expect(submitButton().textContent?.trim()).toBe('Enviando…');
      expect(emailInput().readOnly).toBe(true);
      expect(feedbackText()).toBe(MESSAGES.submitting);

      response$.next({ message: 'Subscribed successfully' });
      response$.complete();
      fixture.detectChanges();

      expect(submitButton().getAttribute('aria-disabled')).not.toBe('true');
      expect(emailInput().readOnly).toBe(false);
      expect(feedbackText()).toBe(MESSAGES.success);
    });

    it('deberia volver a idle al editar el campo tras un error', () => {
      subscribeToBlogMock.mockReturnValueOnce(
        throwError(() => new HttpErrorResponse({ status: 503 })),
      );
      fixture = TestBed.createComponent(BlogListPage);
      fixture.detectChanges();

      fixture.componentInstance.subscriptionEmailControl.setValue('reader@example.com');
      fixture.componentInstance.submitSubscription();
      fixture.detectChanges();
      expect(feedbackText()).toBe(MESSAGES.unavailable);

      fixture.componentInstance.subscriptionEmailControl.setValue('reader@example.co');
      fixture.detectChanges();

      expect(feedbackText()).toBe('');
      expect(emailInput().getAttribute('aria-invalid')).toBe('false');
    });

    it('deberia volver a idle al editar el campo tras un error de validacion', () => {
      fixture = TestBed.createComponent(BlogListPage);
      fixture.detectChanges();

      fixture.componentInstance.subscriptionEmailControl.setValue('invalid');
      fixture.componentInstance.submitSubscription();
      fixture.detectChanges();
      expect(emailInput().getAttribute('aria-invalid')).toBe('true');

      fixture.componentInstance.subscriptionEmailControl.setValue('reader@example.com');
      fixture.detectChanges();

      expect(feedbackText()).toBe('');
      expect(emailInput().getAttribute('aria-invalid')).toBe('false');
      expect(emailInput().getAttribute('aria-describedby')).toBeNull();
    });

    it('deberia mantener una unica region de feedback persistente y vacia al inicio', () => {
      fixture = TestBed.createComponent(BlogListPage);
      fixture.detectChanges();

      const region = feedback();
      expect(fixture.nativeElement.querySelectorAll(`#${FEEDBACK_ID}`)).toHaveLength(1);
      expect(region.getAttribute('role')).toBe('status');
      expect(region.getAttribute('aria-atomic')).toBe('true');
      expect(feedbackText()).toBe('');
      expect(form().querySelector('[role="alert"]')).toBeNull();
      expect(form().querySelector('[aria-live]')).toBeNull();

      fixture.componentInstance.subscriptionEmailControl.setValue('invalid');
      fixture.componentInstance.submitSubscription();
      fixture.detectChanges();

      expect(feedback()).toBe(region);
      expect(feedbackText()).toBe(MESSAGES.invalid);
    });

    it('deberia mantener el mensaje de exito despues de limpiar el campo', () => {
      fixture = TestBed.createComponent(BlogListPage);
      fixture.detectChanges();

      fixture.componentInstance.subscriptionEmailControl.setValue('reader@example.com');
      fixture.componentInstance.submitSubscription();
      fixture.detectChanges();

      expect(emailInput().value).toBe('');
      expect(feedbackText()).toBe(MESSAGES.success);
    });

    it('deberia enviar el formulario nativo y mostrar el resultado', () => {
      fixture = TestBed.createComponent(BlogListPage);
      fixture.detectChanges();

      fixture.componentInstance.subscriptionEmailControl.setValue('reader@example.com');
      const event = nativeSubmit();
      fixture.detectChanges();

      expect(event.defaultPrevented).toBe(true);
      expect(subscribeToBlogMock).toHaveBeenCalledTimes(1);
      expect(feedbackText()).toBe(MESSAGES.success);
    });
  });

  it('vuelve a anunciar el mismo email inválido al reenviarlo', () => {
    vi.useFakeTimers();
    try {
      fixture = TestBed.createComponent(BlogListPage);
      const component = fixture.componentInstance;
      component.subscriptionEmailControl.setValue('invalido');
      component.submitSubscription();
      fixture.detectChanges();
      const region = fixture.nativeElement.querySelector('#blog-subscription-feedback');
      const message = 'Ingresá un email válido para suscribirte.';
      expect(region.textContent.trim()).toBe(message);

      component.submitSubscription();
      fixture.detectChanges();
      expect(region.textContent.trim()).toBe('');
      expect(component.isSubscriptionInvalid()).toBe(true);
      vi.advanceTimersByTime(150);
      fixture.detectChanges();
      expect(region.textContent.trim()).toBe(message);
    } finally {
      vi.useRealTimers();
    }
  });

  it('no repone el error si el campo se editó antes del nuevo anuncio', () => {
    vi.useFakeTimers();
    try {
      fixture = TestBed.createComponent(BlogListPage);
      const component = fixture.componentInstance;
      component.subscriptionEmailControl.setValue('invalido');
      component.submitSubscription();
      component.submitSubscription();
      component.subscriptionEmailControl.setValue('invalido2');
      vi.advanceTimersByTime(150);
      expect(component.subscriptionState().status).toBe('idle');
    } finally {
      vi.useRealTimers();
    }
  });

  it('no cuenta un correo ya suscripto como alta nueva', () => {
    subscribeToBlogMock.mockReturnValueOnce(of({ message: 'Already subscribed' }));
    fixture = TestBed.createComponent(BlogListPage);
    const component = fixture.componentInstance;
    component.subscriptionEmailControl.setValue('reader@example.com');
    component.submitSubscription();
    const events = trackEventMock.mock.calls.map(([name]) => name);
    expect(events).not.toContain('blog_subscription_success');
    expect(trackEventMock).toHaveBeenCalledWith('blog_subscription_already_subscribed', {
      location: 'blog_index_subscription',
    });
  });
});
