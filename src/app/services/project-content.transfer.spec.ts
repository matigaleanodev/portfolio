import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { makeStateKey, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { Project } from '../models/project.model';
import { ProjectContentService } from './project-content.service';

describe('ProjectContentService: estado transferido', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('usa en forma síncrona los proyectos del prerender sin pedir el JSON', () => {
    const projects = [{ slug: 'a' }] as Project[];
    TestBed.inject(TransferState).set(makeStateKey<Project[]>('projects'), projects);
    let received: Project[] | undefined;

    TestBed.inject(ProjectContentService)
      .getProjects()
      .subscribe((value) => (received = value));

    expect(received).toEqual(projects);
    TestBed.inject(HttpTestingController).expectNone('/assets/projects.json');
  });

  it('sin estado transferido pide el JSON', async () => {
    const result = firstValueFrom(TestBed.inject(ProjectContentService).getProjects());
    TestBed.inject(HttpTestingController).expectOne('/assets/projects.json').flush([]);

    expect(await result).toEqual([]);
  });

  it('comparte una sola carga entre la lista y las fichas', () => {
    const service = TestBed.inject(ProjectContentService);
    const received: Project[][] = [];

    service.getProjects().subscribe((value) => received.push(value));
    service.getProjects().subscribe((value) => received.push(value));
    TestBed.inject(HttpTestingController).expectOne('/assets/projects.json').flush([]);

    expect(received).toHaveLength(2);
  });

  it('tras un error informa a ambos y vuelve a pedir el JSON', () => {
    const service = TestBed.inject(ProjectContentService);
    const http = TestBed.inject(HttpTestingController);
    let errors = 0;

    service.getProjects().subscribe({ error: () => errors++ });
    service.getProjects().subscribe({ error: () => errors++ });
    http.expectOne('/assets/projects.json').flush('', { status: 500, statusText: 'Error' });
    service.getProjects().subscribe();

    expect(errors).toBe(2);
    http.expectOne('/assets/projects.json');
  });
});
