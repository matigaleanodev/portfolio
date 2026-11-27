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
});
