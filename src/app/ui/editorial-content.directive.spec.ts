import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EditorialContentDirective } from './editorial-content.directive';

@Component({
  imports: [EditorialContentDirective],
  template: '<div [appEditorialContent]="post"></div>',
})
class EditorialFixture {
  readonly post = {
    contentHtml:
      '<h2 id="section-uno">Uno</h2><script>alert(1)</script><p onclick="alert(1)">Texto</p><h3>Dos</h3>',
    headings: [
      { id: 'section-uno', title: 'Uno', level: 2 },
      { id: 'bad" onclick="alert(1)', title: 'Dos', level: 3 },
    ],
  };
}

@Component({
  imports: [EditorialContentDirective],
  template: '<div [appEditorialContent]="post"></div>',
})
class CodeFixture {
  readonly post = {
    contentHtml:
      '<pre><code class="language-bash">ls</code></pre><div class="table-scroll"><table><tbody><tr><td>a</td></tr></tbody></table></div><pre><code class="language-mermaid">flowchart LR</code></pre>',
    headings: [],
  };
}

describe('EditorialContentDirective', () => {
  it('debería conservar IDs seguros sin permitir scripts ni atributos ejecutables', () => {
    const fixture = TestBed.createComponent(EditorialFixture);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('h2')?.id).toBe('section-uno');
    expect(element.querySelector('h3')?.id).toBe('');
    expect(element.querySelector('script')).toBeNull();
    expect(element.querySelector('[onclick]')).toBeNull();
  });

  it('deberia preparar codigo y tablas en el HTML, antes de cualquier tarea del navegador', () => {
    const fixture = TestBed.createComponent(CodeFixture);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const pre = element.querySelector('.code-block > pre')!;
    expect(pre.getAttribute('role')).toBe('region');
    expect(pre.getAttribute('tabindex')).toBe('0');
    expect(pre.getAttribute('aria-label')).toBe('Código bash');
    const button = element.querySelector<HTMLButtonElement>('.code-toolbar button.code-copy')!;
    expect(button.type).toBe('button');
    expect(element.querySelector('.code-toolbar [role="status"]')).not.toBeNull();
    const table = element.querySelector('.table-scroll')!;
    expect(table.getAttribute('role')).toBe('region');
    expect(table.getAttribute('tabindex')).toBe('0');
    expect(table.getAttribute('aria-label')).toBeTruthy();
    expect(element.querySelector('.language-mermaid')!.closest('.code-block')).toBeNull();
  });
});
