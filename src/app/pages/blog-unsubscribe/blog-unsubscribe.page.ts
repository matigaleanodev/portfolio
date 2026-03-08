import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AnalyticsService } from '../../services/analytics.service';
import { ApiService } from '../../services/api.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-blog-unsubscribe-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './blog-unsubscribe.page.html',
  styleUrl: './blog-unsubscribe.page.css',
})
export class BlogUnsubscribePage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly analytics = inject(AnalyticsService);
  private readonly seo = inject(SeoService);

  readonly emailControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  readonly isSubmitting = signal(false);
  readonly submitError = signal('');
  readonly submitSuccessMessage = signal('');
  readonly hasPrefilledEmail = signal(false);

  readonly viewState = computed<'idle' | 'success'>(() =>
    this.submitSuccessMessage() ? 'success' : 'idle',
  );

  constructor() {
    this.seo.setPageSeo({
      title: 'Baja de suscripción | Blog de Matias Galeano',
      description:
        'Confirmación de baja para la suscripción del blog técnico de Matias Galeano.',
      canonicalUrl: 'https://matiasgaleano.dev/blog/unsubscribe',
      ogImage: 'https://matiasgaleano.dev/assets/icons/icon-512.webp',
      type: 'website',
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const rawEmail = params.get('email')?.trim().toLowerCase() ?? '';
      this.hasPrefilledEmail.set(Boolean(rawEmail));
      this.emailControl.setValue(rawEmail);
      this.emailControl.markAsPristine();
      this.emailControl.markAsUntouched();
      this.submitError.set('');
      this.submitSuccessMessage.set('');

      this.analytics.trackEvent('view_blog_unsubscribe', {
        email_prefilled: Boolean(rawEmail),
      });
    });
  }

  submit(): void {
    if (this.isSubmitting()) {
      return;
    }

    if (this.emailControl.invalid) {
      this.emailControl.markAsTouched();
      this.submitError.set('Ingresá un email válido para confirmar la baja.');
      return;
    }

    const email = this.emailControl.getRawValue().trim().toLowerCase();

    this.isSubmitting.set(true);
    this.submitError.set('');
    this.submitSuccessMessage.set('');
    this.analytics.trackEvent('blog_unsubscribe_submit', {
      email_prefilled: this.hasPrefilledEmail(),
    });

    this.api
      .unsubscribeFromBlog({ email })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.submitSuccessMessage.set(
            response.message || 'Tu suscripción fue dada de baja correctamente.',
          );
          this.analytics.trackEvent('blog_unsubscribe_success', {
            email_prefilled: this.hasPrefilledEmail(),
          });
        },
        error: (error: unknown) => {
          const status =
            typeof (error as { status?: unknown })?.status === 'number'
              ? (error as { status: number }).status
              : undefined;

          this.submitError.set(this.getErrorMessage(error));
          this.analytics.trackEvent('blog_unsubscribe_error', {
            email_prefilled: this.hasPrefilledEmail(),
            status,
          });
        },
      });
  }

  private getErrorMessage(error: unknown): string {
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
        return 'Hay demasiados intentos de baja. Probá de nuevo más tarde.';
      }
    }

    return 'No se pudo procesar la baja en este momento.';
  }
}
