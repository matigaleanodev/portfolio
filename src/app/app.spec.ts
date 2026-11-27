import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { afterEach, vi } from 'vitest';

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
      providers: [
        provideRouter([
          { path: '', component: HeroStubComponent },
          { path: 'blog', component: ProjectsStubComponent },
        ]),
      ],
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

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('deberia aplicar la transicion solo despues de la primera navegacion', async () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    // Solo interesa el estado: sin template no intervienen los enlaces dependientes de la URL.
    TestBed.overrideTemplate(App, '');
    const app = TestBed.createComponent(App).componentInstance;
    const router = TestBed.inject(Router);
    vi.useFakeTimers({ toFake: ['setTimeout'] });

    await router.navigateByUrl('/');
    expect(app.routeTransitionActive()).toBe(false);

    await router.navigateByUrl('/blog');
    expect(app.routeTransitionActive()).toBe(true);

    vi.advanceTimersByTime(620);
    expect(app.routeTransitionActive()).toBe(false);
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
