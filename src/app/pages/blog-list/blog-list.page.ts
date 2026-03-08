import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { BlogPostSummary } from '../../models/blog.model';
import { AnalyticsService } from '../../services/analytics.service';
import { ApiService } from '../../services/api.service';
import { BlogContentService } from '../../services/blog-content.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-blog-list-page',
  imports: [RouterLink, DatePipe, ReactiveFormsModule],
  templateUrl: './blog-list.page.html',
  styleUrl: './blog-list.page.css',
})
export class BlogListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(ApiService);
  private readonly blogContent = inject(BlogContentService);
  private readonly analytics = inject(AnalyticsService);
  private readonly seo = inject(SeoService);

  readonly posts = signal<BlogPostSummary[]>([]);
  readonly errorMessage = signal('');
  readonly searchQuery = signal('');
  readonly sortOrder = signal<'newest' | 'oldest'>('newest');
  readonly subscriptionError = signal('');
  readonly subscriptionSuccessMessage = signal('');
  readonly isSubmittingSubscription = signal(false);

  readonly subscriptionEmailControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  readonly filteredPosts = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const sortedPosts = [...this.posts()].sort((left, right) => {
      const comparison = left.date.localeCompare(right.date);
      return this.sortOrder() === 'oldest' ? comparison : -comparison;
    });

    if (!query) {
      return sortedPosts;
    }

    return sortedPosts.filter((post) => {
      const searchableContent = [post.title, post.excerpt, ...post.tags].join(' ').toLowerCase();
      return searchableContent.includes(query);
    });
  });

  readonly resultsLabel = computed(() => {
    const count = this.filteredPosts().length;
    return count === 1 ? '1 post' : `${count} posts`;
  });

  constructor() {
    this.seo.setPageSeo({
      title: 'Blog técnico en español | Matias Galeano',
      description:
        'Posts técnicos en español sobre Angular, NestJS, AWS, arquitectura y decisiones de producto escritos desde proyectos reales.',
      canonicalUrl: 'https://matiasgaleano.dev/blog',
      ogImage: 'https://matiasgaleano.dev/assets/icons/icon-512.webp',
      type: 'website',
    });

    this.blogContent
      .getPosts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (posts) => {
          this.posts.set(posts);
          this.analytics.trackEvent('view_blog_index', {
            post_count: posts.length,
          });
        },
        error: (error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Unexpected error loading blog posts.';
          this.errorMessage.set(message);
        },
      });
  }

  updateSearchQuery(query: string): void {
    this.searchQuery.set(query);
    this.analytics.trackEvent('search_blog_posts', {
      query_length: query.trim().length,
      result_count: this.filteredPosts().length,
    });
  }

  updateSortOrder(order: 'newest' | 'oldest'): void {
    if (this.sortOrder() === order) {
      return;
    }

    this.sortOrder.set(order);
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
      this.subscriptionError.set('Ingresá un email válido para suscribirte.');
      this.subscriptionSuccessMessage.set('');
      return;
    }

    const email = this.subscriptionEmailControl.getRawValue().trim().toLowerCase();

    this.isSubmittingSubscription.set(true);
    this.subscriptionError.set('');
    this.subscriptionSuccessMessage.set('');
    this.analytics.trackEvent('blog_subscription_submit', {
      location: 'blog_hero_toolbar',
    });

    this.api
      .subscribeToBlog({ email })
      .pipe(finalize(() => this.isSubmittingSubscription.set(false)))
      .subscribe({
        next: (response) => {
          this.subscriptionSuccessMessage.set(
            response.message || 'Suscripción confirmada correctamente.',
          );
          this.subscriptionEmailControl.reset('');
          this.analytics.trackEvent('blog_subscription_success', {
            location: 'blog_hero_toolbar',
          });
        },
        error: (error: unknown) => {
          const status =
            typeof (error as { status?: unknown })?.status === 'number'
              ? (error as { status: number }).status
              : undefined;

          const message = this.getSubscriptionErrorMessage(error);
          this.subscriptionError.set(message);
          this.analytics.trackEvent('blog_subscription_error', {
            location: 'blog_hero_toolbar',
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

  private getSubscriptionErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null) {
      const httpError = error as {
        status?: unknown;
        message?: unknown;
        error?: { message?: unknown; error?: unknown } | string | unknown;
      };

      if (typeof httpError.error === 'object' && httpError.error !== null) {
        const nested = httpError.error as { message?: unknown; error?: unknown };

        if (typeof nested.error === 'string' && nested.error.trim()) {
          return nested.error;
        }

        if (typeof nested.message === 'string' && nested.message.trim()) {
          return nested.message;
        }
      }

      if (typeof httpError.error === 'string' && httpError.error.trim()) {
        return httpError.error;
      }

      if (typeof httpError.message === 'string' && httpError.message.trim()) {
        return httpError.message;
      }

      if (httpError.status === 429) {
        return 'Hay demasiados intentos de suscripción. Probá de nuevo más tarde.';
      }
    }

    return 'No se pudo procesar la suscripción en este momento.';
  }
}
