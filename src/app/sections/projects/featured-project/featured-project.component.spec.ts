import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FeaturedProjectComponent } from './featured-project.component';
import { Project } from '../../../models/project.model';
import { ProjectContentService } from '../../../services/project-content.service';
import { AnalyticsService } from '../../../services/analytics.service';

const project = (slug: string, featured: boolean): Project => ({
  slug,
  title: `Caso ${slug}`,
  excerpt: `Resumen ${slug}`,
  productType: 'Plataforma',
  primarySignal: `Decisión ${slug}`,
  proof: `Uso ${slug}`,
  role: `Aporte ${slug}`,
  architecture: `Arquitectura ${slug}`,
  date: '2026-03-07',
  coverImage: `/assets/${slug}.webp`,
  featured,
  order: 1,
  stack: ['Angular'],
  links: [
    { label: 'Google Play', url: 'https://play.google.com', primary: true },
    { label: 'Repositorio', url: 'https://github.com/x' },
  ],
});

describe('FeaturedProjectComponent', () => {
  const trackEvent = vi.fn();

  beforeEach(async () => {
    trackEvent.mockReset();
    await TestBed.configureTestingModule({
      imports: [FeaturedProjectComponent],
      providers: [
        {
          provide: ProjectContentService,
          useValue: { getProjects: () => of([project('otro', false), project('destacado', true)]) },
        },
        { provide: AnalyticsService, useValue: { trackEvent } },
      ],
    }).compileComponents();
  });

  const render = () => {
    const fixture = TestBed.createComponent(FeaturedProjectComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('muestra el caso destacado con texto, figura y leyenda', () => {
    const el = render();

    expect(el.querySelector('h2')?.textContent).toContain('Caso destacado');
    expect(el.querySelector('figure img')?.getAttribute('src')).toBe('/assets/destacado.webp');
    expect(el.querySelector('figcaption')?.textContent).toContain('Ilustración del producto');
    expect(el.textContent).not.toContain('Caso otro');
  });

  it('conserva todos los datos y enlaces del caso', () => {
    const el = render();

    for (const text of ['Resumen', 'Decisión', 'Uso', 'Aporte', 'Arquitectura']) {
      expect(el.textContent).toContain(`${text} destacado`);
    }
    expect(el.querySelectorAll('a').length).toBe(2);
  });

  it('deja visibles decisión y uso y pliega solo arquitectura y tecnologías', () => {
    const el = render();
    const details = el.querySelector('details')!;

    for (const text of ['Resumen', 'Decisión', 'Uso', 'Aporte']) {
      expect(details.textContent).not.toContain(`${text} destacado`);
    }
    expect(details.textContent).toContain('Arquitectura destacado');
    expect(details.textContent).toContain('Angular');
    expect(details.querySelector('summary')?.textContent).toContain('Arquitectura y tecnologías');
  });

  it('ubica la figura antes de las acciones y agrupa los enlaces secundarios', () => {
    const el = render();
    const figure = el.querySelector('figure')!;
    const action = el.querySelector('a')!;

    expect(figure.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const list = el.querySelector('ul[aria-label="Más enlaces de Caso destacado"]')!;
    expect(list.querySelectorAll('li a')).toHaveLength(1);
  });

  it('registra el clic en sus enlaces', () => {
    const el = render();
    el.querySelector('a')!.dispatchEvent(new MouseEvent('click'));

    expect(trackEvent).toHaveBeenCalledWith('click_project_link', {
      project_name: 'Caso destacado',
      link_name: 'Google Play',
    });
  });
});
