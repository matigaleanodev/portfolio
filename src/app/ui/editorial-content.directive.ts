import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  PLATFORM_ID,
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
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

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
      this.prepareRegions();
    });
  }

  // Se arma junto con el HTML (también en el prerender) para que la barra no mueva la lectura.
  private prepareRegions(): void {
    const element = this.host.nativeElement;

    element.querySelectorAll('.table-scroll').forEach((table, index) => {
      this.makeRegion(table, `Tabla del artículo ${index + 1}`);
    });

    Array.from(element.querySelectorAll('pre')).forEach((pre) => {
      const code = pre.querySelector('code');
      if (!code || code.classList.contains('language-mermaid')) return;
      const language = code.className.match(/language-([\w-]+)/)?.[1] ?? 'texto';
      this.makeRegion(pre, `Código ${language}`);

      const wrapper = this.create('div', 'code-block');
      const toolbar = this.create('div', 'code-toolbar');
      const label = this.create('span', 'code-language');
      label.textContent = language;
      const status = this.create('p', 'code-status');
      status.setAttribute('role', 'status');
      status.setAttribute('aria-atomic', 'true');

      const button = this.create('button', 'btn btn--code code-copy');
      button.setAttribute('type', 'button');
      button.setAttribute('aria-label', `Copiar código ${language}`);
      button.setAttribute('data-language', language);
      // Sin JavaScript no puede copiar; la barra conserva su alto.
      if (!this.isBrowser) button.setAttribute('data-static', '');
      const slot = this.create('span', 'btn__slot');
      slot.setAttribute('aria-hidden', 'true');
      const text = this.create('span', 'btn__label');
      for (const [content, visible] of [
        ['Copiar', true],
        ['Copiando…', false],
      ] as const) {
        const option = this.create('span', '');
        option.textContent = content;
        option.setAttribute('data-idle', String(visible));
        if (!visible) option.setAttribute('aria-hidden', 'true');
        text.appendChild(option);
      }
      button.appendChild(slot);
      button.appendChild(text);

      toolbar.appendChild(label);
      toolbar.appendChild(status);
      toolbar.appendChild(button);
      pre.parentNode!.insertBefore(wrapper, pre);
      wrapper.appendChild(toolbar);
      wrapper.appendChild(pre);
    });
  }

  private makeRegion(element: Element, name: string): void {
    element.setAttribute('role', 'region');
    element.setAttribute('aria-label', name);
    element.setAttribute('tabindex', '0');
  }

  private create(tag: string, className: string): HTMLElement {
    const element = this.document.createElement(tag);
    if (className) element.className = className;
    return element;
  }
}
