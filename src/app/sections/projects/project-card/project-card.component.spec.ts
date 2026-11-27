import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { ProjectCardComponent } from './project-card.component';
import { Project } from '../../../models/project.model';

describe('ProjectCardComponent', () => {
  let fixture: ComponentFixture<ProjectCardComponent>;

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
    stack: ['Angular', 'Ionic', 'Capacitor', 'AWS'],
    links: [
      { label: 'Play Store', url: 'https://play.google.com', icon: 'play', primary: true },
      { label: 'GitHub', url: 'https://github.com', icon: 'code', primary: false },
      { label: 'API', url: 'https://api.example.com', icon: 'server', primary: false },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCardComponent);
    fixture.componentRef.setInput('project', projectMock);
  });

  it('debería crearse', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('debería renderizar el nombre, imagen, categoría y resumen', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('h3')?.textContent).toContain('Foodly Notes');
    expect(el.textContent).toContain('App publicada');

    const img = el.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('/assets/foodly.png');
    expect(img.getAttribute('alt')).toBe('Ilustración del producto: Foodly Notes');

    expect(el.textContent).toContain('Una app para recetas.');
    expect(el.textContent).not.toContain('Disponible en Google Play.');
    expect(el.textContent).not.toContain('Construi app y API.');
    expect(el.textContent).not.toContain('NestJS en AWS.');
  });

  it('debería renderizar las tecnologías cuando existen', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const chips = Array.from(el.querySelectorAll('.project-tech-chip')).map((chip) =>
      chip.textContent?.trim(),
    );

    expect(chips).toEqual(['Angular', 'Ionic', 'Capacitor']);
  });

  it('debería renderizar una sola acción para abrir la ficha', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const links = el.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('/projects/foodly-notes');
    expect(links[0].getAttribute('aria-label')).toBe('Ver proyecto Foodly Notes');
  });

  it('no debería renderizar el bloque de tecnologías si está vacío', () => {
    fixture.componentRef.setInput('project', { ...projectMock, stack: [] });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('Angular');
    expect(el.textContent).not.toContain('Ionic');
  });
});
