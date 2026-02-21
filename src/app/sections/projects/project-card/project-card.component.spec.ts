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
    id: '',
    name: 'Foodly Notes',
    image: '/assets/foodly.png',
    description: 'Una app para recetas.',
    technologies: ['Angular', 'Ionic'],
    links: [
      { name: 'GitHub', url: 'https://github.com', icon: 'code', id: '', color: '' },
      { name: 'Demo', url: 'https://demo.com', icon: 'play', id: '', color: '' },
    ],
    order: 1,
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

  it('debería renderizar el nombre, imagen y descripción', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('h3')?.textContent).toContain('Foodly Notes');

    const img = el.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('/assets/foodly.png');
    expect(img.getAttribute('alt')).toBe('Foodly Notes');

    expect(el.textContent).toContain('Una app para recetas.');
  });

  it('debería renderizar las tecnologías cuando existen', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('Angular · Ionic');
  });

  it('debería renderizar un link por cada item y trackear el click', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const links = Array.from(el.querySelectorAll('a'));
    expect(links.length).toBe(2);

    links[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(analyticsMock.trackEvent).toHaveBeenCalledWith('click_project_link', {
      project_name: 'Foodly Notes',
      link_name: 'GitHub',
    });
  });

  it('no debería renderizar el bloque de tecnologías si está vacío', () => {
    fixture.componentRef.setInput('project', { ...projectMock, technologies: [] });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('Angular');
    expect(el.textContent).not.toContain('Ionic');
  });
});
