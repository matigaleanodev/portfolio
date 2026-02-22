import { Component } from '@angular/core';
import { LucideAngularModule, ArrowUp } from 'lucide-angular';

@Component({
  selector: 'app-footer',
  imports: [LucideAngularModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  readonly arrowUpIcon = ArrowUp;

  readonly notion = 'https://matigaleano-dev.notion.site/Personal-Site-2faaa07ef7dd8008a753d336af47e26f';
  readonly linkedin = 'https://www.linkedin.com/in/matigaleanodev/';
  readonly github = 'https://github.com/matigaleanodev/';

  backToTop() {
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }
}
