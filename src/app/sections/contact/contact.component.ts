import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactDto } from '../../models/contact.model';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs';
import { NgClass } from '@angular/common';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly analytics = inject(AnalyticsService);

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

  private getErrorMessage(err: unknown): string {
    if (typeof err === 'object' && err !== null) {
      const error = err as {
        status?: unknown;
        message?: unknown;
        error?: { message?: unknown } | string | unknown;
      };

      if (typeof error.error === 'object' && error.error !== null) {
        const nested = error.error as { message?: unknown };
        if (typeof nested.message === 'string' && nested.message.trim()) return nested.message;
        if (Array.isArray(nested.message) && typeof nested.message[0] === 'string') {
          return nested.message[0];
        }
      }

      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }

      if (typeof error.message === 'string' && error.message.trim()) return error.message;
      if (Array.isArray(error.message) && typeof error.message[0] === 'string') {
        return error.message[0];
      }
      if (error.status === 429) return 'Hay demasiados intentos. Esperá un momento y volvé a probar.';
    }

    return 'No se pudo enviar el mensaje. Intentalo nuevamente.';
  }

  submit() {
    if (this.loading()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
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
          this.toast.show('Mensaje enviado correctamente', 'success');
          this.form.reset();
        },
        error: (err) => {
          const message = this.getErrorMessage(err);
          this.submitError.set(message);
          this.submitSucceeded.set(false);
          this.analytics.trackEvent('contact_submit_error', {
            status:
              typeof (err as { status?: unknown })?.status === 'number'
                ? (err as { status: number }).status
                : undefined,
          });
          this.toast.show(message, 'error');
        },
      });
  }
}
