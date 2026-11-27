import { Component, computed, ElementRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactDto } from '../../models/contact.model';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs';
import { AnalyticsService } from '../../services/analytics.service';
import { CircleAlert, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly analytics = inject(AnalyticsService);

  protected readonly errorIcon = CircleAlert;
  private readonly _loading = signal(false);
  readonly loading = computed(() => this._loading());
  readonly submitError = signal('');
  readonly submitSucceeded = signal(false);

  readonly form = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    message: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)],
    }),
    company: new FormControl<string>('', {
      nonNullable: true,
    }),
  });

  /** Nunca muestra el texto técnico del backend: traduce por estado HTTP. */
  private getErrorMessage(status: number | undefined): string {
    if (status === 429) return 'Hay demasiados intentos. Esperá un momento y volvé a probar.';
    if (status === 400) return 'No pudimos aceptar los datos. Revisalos y volvé a enviar.';
    if (status === 0) return 'No se pudo conectar. Revisá tu conexión y volvé a probar.';

    return 'No se pudo enviar el mensaje. Intentalo nuevamente en unos minutos.';
  }

  submit() {
    if (this.loading()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }

    this._loading.set(true);
    this.submitError.set('');
    this.submitSucceeded.set(false);

    const dto: ContactDto = this.form.getRawValue();
    this.analytics.trackEvent('contact_submit', {
      message_length: dto.message.trim().length,
    });

    this.api
      .sendContact(dto)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: () => {
          this.analytics.trackEvent('contact_submit_success');
          this.submitSucceeded.set(true);
          this.toast.show('Mensaje enviado correctamente');
          this.form.reset();
        },
        error: (err: unknown) => {
          const rawStatus = (err as { status?: unknown } | null)?.status;
          const status = typeof rawStatus === 'number' ? rawStatus : undefined;
          this.submitError.set(this.getErrorMessage(status));
          this.analytics.trackEvent('contact_submit_error', { status });
        },
      });
  }

  private focusFirstInvalid() {
    const name = (['name', 'email', 'message'] as const).find(
      (key) => this.form.controls[key].invalid,
    );
    if (name) this.host.nativeElement.querySelector<HTMLElement>(`#contact-${name}`)?.focus();
  }
}
