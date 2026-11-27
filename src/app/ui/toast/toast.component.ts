import { Component, inject } from '@angular/core';
import { Check, LucideAngularModule, X } from 'lucide-angular';

import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  imports: [LucideAngularModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
})
export class ToastComponent {
  protected readonly toast = inject(ToastService);
  protected readonly checkIcon = Check;
  protected readonly closeIcon = X;

  private hovered = false;
  private focused = false;
  private returnTarget: HTMLElement | null = null;

  protected hold(source: 'hover' | 'focus', held: boolean) {
    if (source === 'hover') this.hovered = held;
    else this.focused = held;

    if (held) this.toast.pause();
    else if (!this.hovered && !this.focused) this.toast.resume();
  }

  protected focusEntered(event: FocusEvent) {
    const slot = event.currentTarget as HTMLElement;
    const from = event.relatedTarget as HTMLElement | null;
    if (from && !slot.contains(from)) this.returnTarget = from;
    this.hold('focus', true);
  }

  /** Al quitar el botón no llegan mouseleave ni focusout, y el foco quedaría en body. */
  protected close() {
    if (this.focused) {
      const target = this.returnTarget?.isConnected
        ? this.returnTarget
        : document.getElementById('main-content');
      target?.focus();
    }
    this.returnTarget = null;
    this.hovered = this.focused = false;
    this.toast.hide();
  }
}
