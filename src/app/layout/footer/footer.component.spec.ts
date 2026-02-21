import { Component, Input } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { FooterComponent } from './footer.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'lucide-icon',
  standalone: true,
  template: '',
})
class LucideIconStubComponent {
  @Input() img: unknown;
  @Input() size: unknown;
}

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
    })
      .overrideComponent(FooterComponent, {
        set: {
          imports: [LucideIconStubComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debería crearse', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('debería renderizar los links con sus href correctos', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const github = el.querySelector('a[aria-label="GitHub"]') as HTMLAnchorElement;
    const linkedin = el.querySelector('a[aria-label="LinkedIn"]') as HTMLAnchorElement;
    const notion = el.querySelector('a[aria-label="Notion"]') as HTMLAnchorElement;

    expect(github).toBeTruthy();
    expect(linkedin).toBeTruthy();
    expect(notion).toBeTruthy();

    expect(github.getAttribute('href')).toBe('https://github.com/matigaleanodev/');
    expect(linkedin.getAttribute('href')).toBe('https://www.linkedin.com/in/matigaleanodev/');
    expect(notion.getAttribute('href')).toBe(
      'https://matigaleano-dev.notion.site/Personal-Site-2faaa07ef7dd8008a753d336af47e26f',
    );
  });

  it('backToTop debería llamar a window.scrollTo con smooth', () => {
    const scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {
      /* empty */
    });

    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const btn = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Volver arriba'),
    ) as HTMLButtonElement;

    expect(btn).toBeTruthy();

    btn.click();

    expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
