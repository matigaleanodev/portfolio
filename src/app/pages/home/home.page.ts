import { Component, inject } from '@angular/core';
import { ContactComponent } from '../../sections/contact/contact.component';
import { HeroComponent } from '../../sections/hero/hero.component';
import { ProjectsComponent } from '../../sections/projects/projects.component';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-home-page',
  imports: [HeroComponent, ProjectsComponent, ContactComponent],
  templateUrl: './home.page.html',
  styleUrl: './home.page.css',
})
export class HomePage {
  private readonly seo = inject(SeoService);

  constructor() {
    this.seo.setPageSeo({
      title: 'Matias Galeano · Software Developer',
      description:
        'Portfolio de Matias Galeano, Software Developer especializado en Angular, Ionic y NestJS. Desarrollo de productos digitales con foco en claridad, mantenimiento y decisiones técnicas bien pensadas.',
      canonicalUrl: 'https://matiasgaleano.dev/',
      ogImage: 'https://matiasgaleano.dev/assets/icons/icon-512.webp',
      type: 'website',
    });
  }
}
