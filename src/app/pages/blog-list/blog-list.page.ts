import '../../locale';

import { DatePipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, CircleAlert, CircleCheck } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlogPostSummary } from '../../models/blog.model';
import { AnalyticsService } from '../../services/analytics.service';
import { ApiService } from '../../services/api.service';
import { BlogContentService } from '../../services/blog-content.service';
import { BlogListStateService, BlogSortOrder } from '../../services/blog-list-state.service';
import { SeoService } from '../../services/seo.service';

type SubscriptionStatus = 'idle' | 'submitting' | 'success' | 'already' | 'invalid' | 'error';

interface SubscriptionState {
  readonly status: SubscriptionStatus;
  readonly message: string;
}

const REANNOUNCE_DELAY_MS = 100;

const IDLE_SUBSCRIPTION_STATE: SubscriptionState = { status: 'idle', message: '' };

const SUBSCRIPTION_MESSAGES = {
  submitting: 'Enviando tu suscripción…',
  success: '¡Listo! Ya estás suscripto. Te va a llegar un mail con cada publicación nueva.',
  already: 'Ese correo ya estaba suscripto. No tenés que hacer nada más.',
  invalid: 'Ingresá un email válido para suscribirte.',
  rateLimited: 'Hiciste demasiados intentos. Esperá un rato y volvé a probar.',
  badGateway: 'No pudimos guardar tu suscripción. Probá de nuevo en unos minutos.',
  unavailable: 'La suscripción no está disponible en este momento. Probá de nuevo más tarde.',
  offline: 'No pudimos conectarnos. Revisá tu conexión y volvé a intentar.',
  generic: 'No pudimos procesar la suscripción. Probá de nuevo en unos minutos.',
} as const;

@Component({
  selector: 'app-blog-list-page',
  imports: [RouterLink, DatePipe, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './blog-list.page.html',
  styleUrl: './blog-list.page.css',
})
export class BlogListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(ApiService);
  private readonly blogContent = inject(BlogContentService);
  private readonly analytics = inject(AnalyticsService);
  private readonly seo = inject(SeoService);

  private readonly injector = inject(Injector);
  private readonly listState = inject(BlogListStateService);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly resultsStatus = viewChild<ElementRef<HTMLElement>>('resultsStatus');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly reorderAnimations = new WeakMap<HTMLElement, Animation>();
  private reorderScheduled = false;

  protected readonly successIcon = CircleCheck;
  protected readonly errorIcon = CircleAlert;

  readonly posts = signal<BlogPostSummary[]>([]);
  readonly errorMessage = signal('');
  readonly isLoading = signal(false);
  readonly hasLoaded = signal(false);
  readonly searchQuery = this.listState.searchQuery.asReadonly();
  readonly sortOrder = this.listState.sortOrder.asReadonly();
  readonly subscriptionState = signal<SubscriptionState>(IDLE_SUBSCRIPTION_STATE);

  readonly subscriptionEmailControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  readonly isSubmittingSubscription = computed(
    () => this.subscriptionState().status === 'submitting',
  );

  readonly isSubscriptionInvalid = computed(() => this.subscriptionState().status === 'invalid');

  readonly filteredPosts = computed(() => {
    const query = this.normalizeSearch(this.searchQuery());
    const sortedPosts = [...this.posts()].sort((left, right) => {
      const comparison = left.date.localeCompare(right.date);
      return this.sortOrder() === 'oldest' ? comparison : -comparison;
    });

    if (!query) {
      return sortedPosts;
    }

    return sortedPosts.filter((post) => {
      const searchableContent = this.normalizeSearch(
        [post.title, post.excerpt, ...post.tags].join(' '),
      );
      return searchableContent.includes(query);
    });
  });

  readonly resultsLabel = computed(() => {
    if (this.isLoading()) return 'Cargando posts…';
    if (this.errorMessage()) return 'No pudimos cargar los posts.';
    const count = this.filteredPosts().length;
    if (count === 0) return 'Sin resultados';
    return count === 1 ? '1 post' : `${count} posts`;
  });

  constructor() {
    this.subscriptionEmailControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const { status } = this.subscriptionState();
        if (status !== 'submitting' && status !== 'idle') {
          this.subscriptionState.set(IDLE_SUBSCRIPTION_STATE);
        }
      });

    this.seo.setPageSeo({
      title: 'Blog técnico en español | Matias Galeano',
      description:
        'Posts técnicos en español sobre Angular, NestJS, AWS, arquitectura y decisiones de producto escritos desde proyectos reales.',
      canonicalUrl: 'https://matiasgaleano.dev/blog',
      ogImage: 'https://matiasgaleano.dev/assets/icons/icon-512.webp',
      type: 'website',
    });

    this.loadPosts();
  }

  /** Carga el índice; ignora repeticiones mientras hay una lectura pendiente. */
  loadPosts(): void {
    if (this.isLoading()) {
      return;
    }

    const isRetry = !!this.errorMessage();
    this.isLoading.set(true);

    this.blogContent
      .getPosts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (posts) => {
          this.posts.set(posts);
          this.errorMessage.set('');
          this.hasLoaded.set(true);
          this.isLoading.set(false);
          this.analytics.trackEvent('view_blog_index', {
            post_count: posts.length,
          });
          // El botón de reintento deja de mostrarse: el foco pasa al recuento.
          if (isRetry) this.focusAfterRender(this.resultsStatus);
        },
        error: (error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Unexpected error loading blog posts.';
          this.errorMessage.set(message);
          this.isLoading.set(false);
        },
      });
  }

  clearSearch(): void {
    this.updateSearchQuery('');
    this.searchInput()?.nativeElement.focus();
  }

  updateSearchQuery(query: string): void {
    this.listState.searchQuery.set(query);
    this.analytics.trackEvent('search_blog_posts', {
      query_length: query.trim().length,
      result_count: this.filteredPosts().length,
    });
  }

  updateSortOrder(order: BlogSortOrder): void {
    if (this.sortOrder() === order) {
      return;
    }

    this.scheduleReorderAnimation();
    this.listState.sortOrder.set(order);
    this.analytics.trackEvent('sort_blog_posts', {
      sort_order: order,
      result_count: this.filteredPosts().length,
    });
  }

  submitSubscription(): void {
    if (this.isSubmittingSubscription()) {
      return;
    }

    if (this.subscriptionEmailControl.invalid) {
      this.subscriptionEmailControl.markAsTouched();
      this.announceInvalidEmail();
      return;
    }

    const email = this.subscriptionEmailControl.getRawValue().trim().toLowerCase();

    this.subscriptionState.set({
      status: 'submitting',
      message: SUBSCRIPTION_MESSAGES.submitting,
    });
    this.analytics.trackEvent('blog_subscription_submit', {
      location: 'blog_index_subscription',
    });

    this.api.subscribeToBlog({ email }).subscribe({
      next: (response) => {
        // Un 2xx es una alta aceptada: un cuerpo nulo o inesperado no debe dejar el formulario en `submitting`.
        const alreadySubscribed = response?.message === 'Already subscribed';
        this.subscriptionState.set(
          alreadySubscribed
            ? { status: 'already', message: SUBSCRIPTION_MESSAGES.already }
            : { status: 'success', message: SUBSCRIPTION_MESSAGES.success },
        );
        this.subscriptionEmailControl.reset('', { emitEvent: false });
        this.analytics.trackEvent(
          alreadySubscribed ? 'blog_subscription_already_subscribed' : 'blog_subscription_success',
          { location: 'blog_index_subscription' },
        );
      },
      error: (error: unknown) => {
        const status = this.getHttpStatus(error);
        this.subscriptionState.set(this.getSubscriptionErrorState(status));
        this.analytics.trackEvent('blog_subscription_error', {
          location: 'blog_index_subscription',
          status,
        });
      },
    });
  }

  trackPostClick(post: BlogPostSummary, position: number): void {
    this.analytics.trackEvent('click_blog_post_card', {
      post_slug: post.slug,
      post_title: post.title,
      position,
    });
  }

  private focusAfterRender(target: () => ElementRef<HTMLElement> | undefined): void {
    afterNextRender({ write: () => target()?.nativeElement.focus() }, { injector: this.injector });
  }

  private scheduleReorderAnimation(): void {
    if (this.reorderScheduled) return;

    const host = this.host.nativeElement;
    const browser = host.ownerDocument.defaultView;
    const cards = [...host.querySelectorAll<HTMLElement>('.blog-card')];
    const canAnimate = browser?.matchMedia?.('(prefers-reduced-motion: reduce)').matches === false;
    // Si hay una animación en curso, la próxima parte desde la posición visible.
    const positions = canAnimate ? cards.map((card) => card.getBoundingClientRect()) : [];
    for (const card of cards) {
      this.reorderAnimations.get(card)?.cancel();
    }
    if (positions.length < 2) return;

    this.reorderScheduled = true;
    afterNextRender(
      {
        earlyRead: () =>
          cards.map((card, index) => {
            const { left, top } = card.getBoundingClientRect();
            return { card, x: positions[index].left - left, y: positions[index].top - top };
          }),
        write: (moves) => {
          this.reorderScheduled = false;
          for (const { card, x, y } of moves) {
            if (!card.isConnected || (!x && !y)) continue;
            const animation = card.animate(
              [{ transform: `translate(${x}px, ${y}px)` }, { transform: 'none' }],
              { duration: 300, easing: 'ease-in-out' },
            );
            this.reorderAnimations.set(card, animation);
          }
        },
      },
      { injector: this.injector },
    );
  }

  private normalizeSearch(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /** Vacía y repone un error repetido: la región viva solo anuncia cambios de contenido. */
  private announceInvalidEmail(): void {
    const invalid: SubscriptionState = {
      status: 'invalid',
      message: SUBSCRIPTION_MESSAGES.invalid,
    };

    if (this.subscriptionState().message !== invalid.message) {
      this.subscriptionState.set(invalid);
      return;
    }

    this.subscriptionState.set({ status: 'invalid', message: '' });
    setTimeout(() => {
      const { status, message } = this.subscriptionState();
      if (status === 'invalid' && !message) this.subscriptionState.set(invalid);
    }, REANNOUNCE_DELAY_MS);
  }

  private getHttpStatus(error: unknown): number | undefined {
    const status = (error as { status?: unknown } | null)?.status;
    return typeof status === 'number' ? status : undefined;
  }

  private getSubscriptionErrorState(status: number | undefined): SubscriptionState {
    switch (status) {
      case 400:
        return { status: 'invalid', message: SUBSCRIPTION_MESSAGES.invalid };
      case 429:
        return { status: 'error', message: SUBSCRIPTION_MESSAGES.rateLimited };
      case 502:
        return { status: 'error', message: SUBSCRIPTION_MESSAGES.badGateway };
      case 503:
        return { status: 'error', message: SUBSCRIPTION_MESSAGES.unavailable };
      case 0:
        return { status: 'error', message: SUBSCRIPTION_MESSAGES.offline };
      default:
        return { status: 'error', message: SUBSCRIPTION_MESSAGES.generic };
    }
  }
}
