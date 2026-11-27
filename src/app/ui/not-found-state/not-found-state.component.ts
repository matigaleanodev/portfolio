import { Component, ElementRef, afterNextRender, input, viewChild } from '@angular/core';

/** Estado compartido por las direcciones que no llevan a ningún contenido. */
@Component({
  selector: 'app-not-found-state',
  templateUrl: './not-found-state.component.html',
  styleUrl: './not-found-state.component.css',
})
export class NotFoundStateComponent {
  readonly heading = input.required<string>();
  readonly message = input.required<string>();
  /** Al llegar navegando el foco pasa al título; en el acceso directo se anuncia el mensaje. */
  readonly takeFocus = input(false);

  private readonly title = viewChild.required<ElementRef<HTMLElement>>('title');

  constructor() {
    afterNextRender(() => {
      if (!this.takeFocus()) return;
      window.scrollTo({ top: 0, behavior: 'instant' });
      this.title().nativeElement.focus({ preventScroll: true });
    });
  }
}
