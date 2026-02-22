import { Injectable, signal } from '@angular/core';
import { ToastState, ToastType } from '../models/toast.model';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private autoHideTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private hideAnimationTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private readonly _state = signal<ToastState>({
    message: '',
    type: 'success',
    visible: false,
    showing: false,
  });

  readonly state = this._state.asReadonly();

  show(message: string, type: ToastType = 'success') {
    this.clearTimers();

    this._state.set({
      message,
      type,
      visible: true,
      showing: false,
    });

    requestAnimationFrame(() => {
      this._state.update((s) => ({ ...s, showing: true }));
    });

    this.autoHideTimeoutId = setTimeout(() => this.hide(), 3000);
  }

  hide() {
    if (this.autoHideTimeoutId) {
      clearTimeout(this.autoHideTimeoutId);
      this.autoHideTimeoutId = null;
    }
    if (this.hideAnimationTimeoutId) {
      clearTimeout(this.hideAnimationTimeoutId);
      this.hideAnimationTimeoutId = null;
    }

    this._state.update((s) => ({ ...s, showing: false }));

    this.hideAnimationTimeoutId = setTimeout(() => {
      this._state.update((s) => ({ ...s, visible: false }));
      this.hideAnimationTimeoutId = null;
    }, 300);
  }

  private clearTimers() {
    if (this.autoHideTimeoutId) {
      clearTimeout(this.autoHideTimeoutId);
      this.autoHideTimeoutId = null;
    }
    if (this.hideAnimationTimeoutId) {
      clearTimeout(this.hideAnimationTimeoutId);
      this.hideAnimationTimeoutId = null;
    }
  }
}
