import { Component, signal } from '@angular/core';
import { LucideAngularModule, ArrowUp } from 'lucide-angular';

@Component({
  selector: 'layout-footer',
  imports: [LucideAngularModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  readonly arrowUpIcon = ArrowUp;

  readonly notion = signal(
    'https://matigaleano-dev.notion.site/Personal-Site-2faaa07ef7dd8008a753d336af47e26f',
  );
  readonly linkedin = signal('https://www.linkedin.com/in/matigaleanodev/');
  readonly github = signal('https://github.com/matigaleanodev/');

  backToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
