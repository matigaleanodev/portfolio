import { afterNextRender, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { ChevronDown, LucideAngularModule } from 'lucide-angular';

import { FragmentLinkDirective } from '../../ui/fragment-link.directive';

@Component({
  selector: 'app-hero',
  imports: [FragmentLinkDirective, LucideAngularModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent {
  protected readonly scrollIcon = ChevronDown;

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const header = host.closest('.app-shell')?.querySelector('app-header');
      if (!header) return;

      const updateHeaderHeight = () => {
        host.style.setProperty(
          '--home-header-height',
          header.getBoundingClientRect().height + 'px',
        );
      };
      updateHeaderHeight();

      const observer = new ResizeObserver(updateHeaderHeight);
      observer.observe(header, { box: 'border-box' });
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
