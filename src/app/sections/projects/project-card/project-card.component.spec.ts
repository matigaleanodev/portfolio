import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ProjectCardComponent } from './project-card.component';
import { AnalyticsService } from '../../../services/analytics.service';
import { Project } from '../../../models/project.model';

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

describe('ProjectCardComponent', () => {
  let fixture: ComponentFixture<ProjectCardComponent>;

  const analyticsMock: Pick<AnalyticsService, 'trackEvent'> = {
    trackEvent: vi.fn(),
  };

  const projectMock: Project = {
    slug: 'foodly-notes',
    title: 'Foodly Notes',
    excerpt: 'Una app para recetas.',
    productType: 'App publicada',
    primarySignal: 'Backend propio + cloud',
    proof: 'Disponible en Google Play.',
    role: 'Construi app y API.',
    architecture: 'NestJS en AWS.',
    date: '2026-03-07',
    coverImage: '/assets/foodly.png',
    featured: true,
    order: 1,
    stack: ['Angular', 'Ionic'],
    links: [
      { label: 'Play Store', url: 'https://play.google.com', icon: 'play', primary: true },
      { label: 'GitHub', url: 'https://github.com', icon: 'code', primary: false },
      { label: 'API', url: 'https://api.example.com', icon: 'server', primary: false },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCardComponent],
      providers: [{ provide: AnalyticsService, useValue: analyticsMock }],
    })
      .overrideComponent(ProjectCardComponent, {
        set: {
          imports: [LucideIconStubComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ProjectCardComponent);
    fixture.componentRef.setInput('project', projectMock);
  });

  it('debería crearse', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('debería renderizar el nombre, imagen y señales principales', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('h3')?.textContent).toContain('Foodly Notes');
    expect(el.textContent).toContain('App publicada');
    expect(el.textContent).toContain('Backend propio + cloud');

    const img = el.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('/assets/foodly.png');
    expect(img.getAttribute('alt')).toBe('Foodly Notes');

    expect(el.textContent).toContain('Una app para recetas.');
    expect(el.textContent).toContain('Disponible en Google Play.');
    expect(el.textContent).toContain('Construi app y API.');
    expect(el.textContent).toContain('NestJS en AWS.');
  });

  it('debería renderizar las tecnologías cuando existen', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const chips = Array.from(el.querySelectorAll('.project-tech-chip')).map((chip) =>
      chip.textContent?.trim(),
    );

    expect(chips).toEqual(['Angular', 'Ionic']);
  });

  it('debería renderizar un link por cada item y trackear el click', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const links = Array.from(el.querySelectorAll('a'));
    expect(links.length).toBe(3);
    expect(links[0]?.textContent).toContain('Play Store');

    links[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(analyticsMock.trackEvent).toHaveBeenCalledWith('click_project_link', {
      project_name: 'Foodly Notes',
      link_name: 'Play Store',
    });
  });

  it('no debería renderizar el bloque de tecnologías si está vacío', () => {
    fixture.componentRef.setInput('project', { ...projectMock, stack: [] });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('Angular');
    expect(el.textContent).not.toContain('Ionic');
  });
});
