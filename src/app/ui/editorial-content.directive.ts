import {
  Directive,
  ElementRef,
  Renderer2,
  SecurityContext,
  effect,
  inject,
  input,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { BlogPost } from '../models/blog.model';

@Directive({ selector: '[appEditorialContent]' })
export class EditorialContentDirective {
  readonly appEditorialContent = input.required<Pick<BlogPost, 'contentHtml' | 'headings'>>();
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly sanitizer = inject(DomSanitizer);

  constructor() {
    effect(() => {
      const post = this.appEditorialContent();
      const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, post.contentHtml) ?? '';
      let index = 0;
      // Conserva la sanitización de Angular; solo agrega IDs validados del índice editorial.
      const content = sanitized.replace(/<h([23])>/g, (tag: string) => {
        const heading = post.headings?.[index++];
        return heading && /^section-[a-z0-9-]+$/.test(heading.id)
          ? `${tag.slice(0, -1)} id="${heading.id}">`
          : tag;
      });
      this.renderer.setProperty(this.host.nativeElement, 'innerHTML', content);
    });
  }
}
