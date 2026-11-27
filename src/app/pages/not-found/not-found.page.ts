import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { SeoService } from '../../services/seo.service';
import { NotFoundStateComponent } from '../../ui/not-found-state/not-found-state.component';

@Component({
  selector: 'app-not-found-page',
  imports: [NotFoundStateComponent, RouterLink],
  templateUrl: './not-found.page.html',
})
export class NotFoundPage {
  /** Falso en el acceso directo: la navegación inicial todavía no terminó. */
  protected readonly arrivedByNavigation = inject(Router).navigated;

  constructor() {
    inject(SeoService).setPageSeo({
      title: 'Página no encontrada | Matias Galeano',
      description: 'La dirección no corresponde a ninguna página de matiasgaleano.dev.',
      noIndex: true,
    });
  }
}
