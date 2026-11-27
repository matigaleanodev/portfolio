import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectContentService } from '../../services/project-content.service';
import { SeoService } from '../../services/seo.service';
import { ProjectDetailPage } from './project-detail.page';

describe('ProjectDetailPage · metadatos', () => {
  const project = {
    slug: 'nora',
    title: 'Nora',
    excerpt: 'Registro de trabajos.',
    productType: 'App móvil',
    primarySignal: 'Offline',
    proof: 'Uso',
    role: 'Aporte',
    architecture: 'Arquitectura',
    date: '2026-01-01',
    coverImage: '/assets/nora.png',
    featured: false,
    order: 1,
    stack: [],
    links: [],
  };
  const getProjects = vi.fn();
  const setPageSeo = vi.fn();
  const paramMap$ = new BehaviorSubject(convertToParamMap({ slug: 'nora' }));

  beforeEach(() => {
    getProjects.mockReset().mockReturnValue(of([project]));
    setPageSeo.mockReset();
    paramMap$.next(convertToParamMap({ slug: 'nora' }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ProjectContentService, useValue: { getProjects } },
        { provide: SeoService, useValue: { setPageSeo } },
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$ } },
      ],
    });
  });

  function render() {
    TestBed.createComponent(ProjectDetailPage).detectChanges();
    return setPageSeo.mock.lastCall![0];
  }

  it('declara la imagen del proyecto sin atribuirle dimensiones ajenas', () => {
    expect(render()).toEqual({
      title: 'Nora | Matias Galeano',
      description: 'Registro de trabajos.',
      canonicalUrl: 'https://matiasgaleano.dev/projects/nora',
      image: {
        url: 'https://matiasgaleano.dev/assets/nora.png',
        alt: 'Imagen del proyecto Nora',
      },
      type: 'website',
    });
  });

  it('excluye del indice un proyecto inexistente', () => {
    paramMap$.next(convertToParamMap({ slug: 'no-existe' }));

    expect(render()).toEqual({
      title: 'Proyecto no disponible | Matias Galeano',
      description: 'Explorá los proyectos de Matias Galeano.',
      noIndex: true,
    });
  });

  it('no excluye del indice un proyecto cuyo contenido fallo al cargar', () => {
    getProjects.mockReturnValue(throwError(() => new Error('sin red')));

    const payload = render();

    expect(payload.noIndex).toBeUndefined();
    expect(payload.canonicalUrl).toBe('https://matiasgaleano.dev/projects/nora');
  });
});
