import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactDto } from '../../models/contact.model';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  private readonly _loading = signal(false);
  readonly loading = computed(() => this._loading());

  readonly form = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4)],
    }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    message: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)],
    }),
  });

  submit() {
    if (this.form.invalid || this.loading()) return;

    this._loading.set(true);

    const dto: ContactDto = this.form.getRawValue();

    this.api
      .sendContact(dto)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('Mensaje enviado correctamente', 'success');
          this.form.reset();
        },
        error: (err) => {
          this.toast.show(err.error.message, 'error');
        },
      });
  }
}
