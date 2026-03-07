import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ProjectContentService } from './project-content.service';

describe('ProjectContentService', () => {
  let service: ProjectContentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ProjectContentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse', () => {
    expect(service).toBeTruthy();
  });

  it('getProjects debería leer el catalogo estatico', () => {
    service.getProjects().subscribe((projects) => {
      expect(projects[0]?.slug).toBe('foodly-notes');
    });

    const req = httpMock.expectOne('/assets/projects.json');
    expect(req.request.method).toBe('GET');

    req.flush([
      {
        slug: 'foodly-notes',
        title: 'Foodly Notes',
        excerpt: 'Catalogo estatico',
        date: '2026-03-07',
        coverImage: '/assets/foodly-notes.webp',
        featured: true,
        order: 1,
        stack: ['Angular'],
        links: [],
      },
    ]);
  });
});
