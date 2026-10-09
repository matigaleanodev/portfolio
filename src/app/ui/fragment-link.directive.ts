import { DOCUMENT } from '@angular/common';
import { Directive, inject, input } from '@angular/core';
import { Router } from '@angular/router';

@Directive({
  selector: 'a[appFragmentLink]',
  host: {
    '[attr.href]': "router.url.split('#')[0] + '#' + appFragmentLink()",
    '(click)': 'navigate($event)',
  },
})
export class FragmentLinkDirective {
  protected readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  readonly appFragmentLink = input.required<string>();

  protected navigate(event: MouseEvent): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
      return;
    const target = this.document.getElementById(this.appFragmentLink());
    if (!target) return;
    event.preventDefault();
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
}
