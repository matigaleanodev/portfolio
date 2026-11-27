import { Injectable, signal } from '@angular/core';
import { ToastState } from '../models/toast.model';

const VISIBLE_MS = 5000;
const EXIT_MS = 300;

/** Confirmaciones breves de éxito. Los errores se muestran en contexto. */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private autoHideTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private hideAnimationTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private readonly _state = signal<ToastState>({ message: '', visible: false, showing: false });

  readonly state = this._state.asReadonly();

  show(message: string) {
    this.clearTimers();
    this._state.set({ message, visible: true, showing: false });

    requestAnimationFrame(() => {
      this._state.update((s) => ({ ...s, showing: true }));
    });

    this.scheduleHide();
  }

  pause() {
    if (this.autoHideTimeoutId) clearTimeout(this.autoHideTimeoutId);
    this.autoHideTimeoutId = null;
  }

  resume() {
    if (!this._state().showing) return;

    this.pause();
    this.scheduleHide();
  }

  hide() {
    this.clearTimers();
    this._state.update((s) => ({ ...s, showing: false }));

    this.hideAnimationTimeoutId = setTimeout(() => {
      this._state.update((s) => ({ ...s, visible: false }));
      this.hideAnimationTimeoutId = null;
    }, EXIT_MS);
  }

  private scheduleHide() {
    this.autoHideTimeoutId = setTimeout(() => this.hide(), VISIBLE_MS);
  }

  private clearTimers() {
    this.pause();
    if (this.hideAnimationTimeoutId) clearTimeout(this.hideAnimationTimeoutId);
    this.hideAnimationTimeoutId = null;
  }
}
