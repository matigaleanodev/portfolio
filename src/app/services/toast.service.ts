import { Injectable, signal } from '@angular/core';
import { ToastState, ToastType } from '../models/toast.model';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly _state = signal<ToastState>({
    message: '',
    type: 'success',
    visible: false,
    showing: false,
  });

  readonly state = this._state.asReadonly();

  show(message: string, type: ToastType = 'success') {
    this._state.set({
      message,
      type,
      visible: true,
      showing: false,
    });

    requestAnimationFrame(() => {
      this._state.update((s) => ({ ...s, showing: true }));
    });

    setTimeout(() => this.hide(), 3000);
  }

  hide() {
    this._state.update((s) => ({ ...s, showing: false }));

    setTimeout(() => {
      this._state.update((s) => ({ ...s, visible: false }));
    }, 300);
  }
}
