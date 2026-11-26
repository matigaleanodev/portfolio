import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterOutlet } from '@angular/router';

import { App } from './app';
import { FragmentLinkDirective } from './ui/fragment-link.directive';

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

@Component({ selector: 'app-chat', standalone: true, template: '' })
class ChatStubComponent {}

@Component({ selector: 'app-toast', standalone: true, template: '' })
class ToastStubComponent {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    })
      .overrideComponent(App, {
        set: {
          imports: [
            RouterOutlet,
            FragmentLinkDirective,
            HeaderStubComponent,
            FooterStubComponent,
            ProjectsStubComponent,
            HeroStubComponent,
            ContactStubComponent,
            ChatStubComponent,
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
    const skipLink = el.querySelector('.skip-link') as HTMLAnchorElement | null;
    const mainContent = el.querySelector('#main-content') as HTMLDivElement | null;

    expect(el.querySelector('app-header')).toBeTruthy();
    expect(el.querySelector('router-outlet')).toBeTruthy();
    expect(skipLink?.getAttribute('href')).toBe('/#main-content');
    expect(mainContent?.getAttribute('tabindex')).toBe('-1');
    expect(el.querySelector('app-footer')).toBeTruthy();
    expect(el.querySelector('app-chat')).toBeTruthy();
    expect(el.querySelector('app-toast')).toBeTruthy();
  });

  it('deja inerte el fondo solo mientras el chat es modal', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const chat = fixture.debugElement.query(By.css('app-chat'));
    const background = () =>
      ['.skip-link', '.app-shell'].map((s) => el.querySelector(s)!.hasAttribute('inert'));

    chat.triggerEventHandler('modalChange', true);
    fixture.detectChanges();
    expect(background()).toEqual([true, true]);
    expect(el.querySelector('app-chat')!.hasAttribute('inert')).toBe(false);

    chat.triggerEventHandler('modalChange', false);
    fixture.detectChanges();
    expect(background()).toEqual([false, false]);
  });
});
