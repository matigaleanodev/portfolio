import { NgClass } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'toast',
  imports: [NgClass],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
})
export class ToastComponent {
  private readonly toast = inject(ToastService);

  readonly state = computed(() => this.toast.state());
}
