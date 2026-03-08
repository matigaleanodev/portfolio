import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectContentService } from './project-content.service';

interface ProjectContentServicePrivateApi {
  readProjectsFile(): Promise<unknown>;
}

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

  it('getProjects debería leer el catálogo estático', () => {
    service.getProjects().subscribe((projects) => {
      expect(projects[0]?.slug).toBe('foodly-notes');
    });

    const req = httpMock.expectOne('/assets/projects.json');
    expect(req.request.method).toBe('GET');

    req.flush([
      {
        slug: 'foodly-notes',
        title: 'Foodly Notes',
        excerpt: 'Catálogo estático',
        date: '2026-03-07',
        coverImage: '/assets/foodly-notes.webp',
        featured: true,
        order: 1,
        stack: ['Angular'],
        links: [],
      },
    ]);
  });

  it('getProjects debería leer el catálogo desde archivo en SSR', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: PLATFORM_ID,
          useValue: 'server',
        },
      ],
    });

    service = TestBed.inject(ProjectContentService);
    httpMock = TestBed.inject(HttpTestingController);

    const projects = [
      {
        slug: 'foodly-notes',
        title: 'Foodly Notes',
        excerpt: 'Catálogo estático',
        date: '2026-03-07',
        coverImage: '/assets/foodly-notes.webp',
        featured: true,
        order: 1,
        stack: ['Angular'],
        links: [],
      },
    ];

    const readProjectsFileSpy = vi.spyOn(
      service as unknown as ProjectContentServicePrivateApi,
      'readProjectsFile',
    );
    readProjectsFileSpy.mockResolvedValueOnce(projects);

    const result = await new Promise((resolve) => {
      service.getProjects().subscribe(resolve);
    });

    expect(result).toEqual(projects);
    expect(readProjectsFileSpy).toHaveBeenCalledOnce();
    httpMock.expectNone('/assets/projects.json');
  });
});
