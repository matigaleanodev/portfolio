import { DOCUMENT } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, CircleAlert, CircleCheck } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AnalyticsService } from '../../services/analytics.service';
import { ApiService } from '../../services/api.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-blog-unsubscribe-page',
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './blog-unsubscribe.page.html',
  styleUrl: './blog-unsubscribe.page.css',
})
export class BlogUnsubscribePage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT) as Document & { portfolioUnsubscribeEmail?: string };
  private readonly api = inject(ApiService);
  private readonly analytics = inject(AnalyticsService);
  private readonly seo = inject(SeoService);
  private readonly emailInput = viewChild<ElementRef<HTMLInputElement>>('emailInput');
  private readonly errorFeedback = viewChild<ElementRef<HTMLElement>>('errorFeedback');
  private readonly successHeading = viewChild<ElementRef<HTMLElement>>('successHeading');

  protected readonly successIcon = CircleCheck;
  protected readonly errorIcon = CircleAlert;

  readonly emailControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
  readonly form = new FormGroup({ email: this.emailControl });

  readonly isReady = signal(false);
  readonly isSubmitting = signal(false);
  readonly emailError = signal('');
  readonly submitError = signal('');
  readonly hasPrefilledEmail = signal(false);
  readonly viewState = signal<'idle' | 'unsubscribed' | 'already-unsubscribed'>('idle');

  constructor() {
    this.seo.setPageSeo({
      title: 'Baja de suscripción | Blog de Matias Galeano',
      description: 'Confirmación de baja para la suscripción del blog técnico de Matias Galeano.',
      noIndex: true,
    });

    afterNextRender({
      write: () => {
        const email = this.document.portfolioUnsubscribeEmail?.trim().toLowerCase() ?? '';
        delete this.document.portfolioUnsubscribeEmail;
        if (email && this.emailControl.pristine) {
          this.emailControl.setValue(email);
          this.hasPrefilledEmail.set(true);
        }
        this.isReady.set(true);
        this.analytics.trackEvent('view_blog_unsubscribe', {
          email_prefilled: this.hasPrefilledEmail(),
        });
      },
    });
  }

  submit(): void {
    if (!this.isReady() || this.isSubmitting() || this.viewState() !== 'idle') {
      return;
    }

    this.submitError.set('');
    if (this.emailControl.invalid) {
      this.emailControl.markAsTouched();
      this.emailError.set('Ingresá un email válido para confirmar la baja.');
      this.focusAfterRender(this.emailInput);
      return;
    }

    const email = this.emailControl.getRawValue().trim().toLowerCase();

    this.isSubmitting.set(true);
    this.emailError.set('');
    this.analytics.trackEvent('blog_unsubscribe_submit', {
      email_prefilled: this.hasPrefilledEmail(),
    });

    this.api
      .unsubscribeFromBlog({ email })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.viewState.set(
            response.message === 'Already unsubscribed' ? 'already-unsubscribed' : 'unsubscribed',
          );
          this.focusAfterRender(this.successHeading);
          this.analytics.trackEvent('blog_unsubscribe_success', {
            email_prefilled: this.hasPrefilledEmail(),
          });
        },
        error: (error: unknown) => {
          const status =
            typeof (error as { status?: unknown })?.status === 'number'
              ? (error as { status: number }).status
              : undefined;

          this.submitError.set(
            status === 429
              ? 'Hay demasiados intentos de baja. Probá de nuevo más tarde.'
              : 'No se pudo procesar la baja en este momento. Probá de nuevo más tarde.',
          );
          this.focusAfterRender(this.errorFeedback);
          this.analytics.trackEvent('blog_unsubscribe_error', {
            email_prefilled: this.hasPrefilledEmail(),
            status,
          });
        },
      });
  }

  private focusAfterRender(target: () => ElementRef<HTMLElement> | undefined): void {
    afterNextRender({ write: () => target()?.nativeElement.focus() }, { injector: this.injector });
  }
}
