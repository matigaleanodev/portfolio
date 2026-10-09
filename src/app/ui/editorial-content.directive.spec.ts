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
});
