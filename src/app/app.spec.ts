import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { App } from './app';

@Component({ selector: 'app-header', standalone: true, template: '' })
class HeaderStubComponent {}

@Component({ selector: 'app-footer', standalone: true, template: '' })
class FooterStubComponent {}

@Component({ selector: 'app-projects', standalone: true, template: '' })
class ProjectsStubComponent {}

@Component({ selector: 'app-hero', standalone: true, template: '' })
class HeroStubComponent {}

@Component({ selector: 'app-contact', standalone: true, template: '' })
class ContactStubComponent {}

@Component({ selector: 'app-toast', standalone: true, template: '' })
class ToastStubComponent {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    })
      .overrideComponent(App, {
        set: {
          imports: [
            HeaderStubComponent,
            FooterStubComponent,
            ProjectsStubComponent,
            HeroStubComponent,
            ContactStubComponent,
            ToastStubComponent,
          ],
        },
      })
      .compileComponents();
  });

  it('debería crearse', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('debería renderizar el layout base', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('app-header')).toBeTruthy();
    expect(el.querySelector('main')).toBeTruthy();

    expect(el.querySelector('app-hero')).toBeTruthy();
    expect(el.querySelector('app-projects')).toBeTruthy();
    expect(el.querySelector('app-contact')).toBeTruthy();

    expect(el.querySelector('app-footer')).toBeTruthy();
    expect(el.querySelector('app-toast')).toBeTruthy();
  });
});
