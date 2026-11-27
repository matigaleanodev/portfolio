import { Component, inject } from '@angular/core';
import { ContactComponent } from '../../sections/contact/contact.component';
import { HeroComponent } from '../../sections/hero/hero.component';
import { ProjectsComponent } from '../../sections/projects/projects.component';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-home-page',
  imports: [HeroComponent, ProjectsComponent, ContactComponent],
  templateUrl: './home.page.html',
})
export class HomePage {
  private readonly seo = inject(SeoService);

  constructor() {
    this.seo.setPageSeo({
      title: 'Matias Galeano · Software Developer',
      description:
        'Portfolio de Matias Galeano, desarrollador full stack. Aplicaciones con Angular y TypeScript, servicios en AWS y un blog sobre decisiones técnicas.',
      canonicalUrl: 'https://matiasgaleano.dev/',
      type: 'website',
    });
  }
}
