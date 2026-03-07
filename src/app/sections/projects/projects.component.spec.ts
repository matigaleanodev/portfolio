import { Component, Input } from '@angular/core';
import { NgStyle } from '@angular/common';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ProjectsComponent } from './projects.component';
import { Project } from '../../models/project.model';
import { ProjectContentService } from '../../services/project-content.service';

@Component({
  selector: 'app-project-card',
  standalone: true,
  template: '',
})
class ProjectCardStubComponent {
  @Input({ required: true }) project!: Project;
}

const createProject = (overrides: Partial<Project>): Project => ({
  slug: 'project',
  title: 'Project',
  excerpt: 'Excerpt',
  date: '2026-03-07',
  coverImage: '/assets/project.webp',
  featured: false,
  order: 1,
  stack: [],
  links: [],
  ...overrides,
});

describe('ProjectsComponent', () => {
  let fixture: ComponentFixture<ProjectsComponent>;

  const getProjectsMock = vi.fn(() => of([] as Project[]));

  const projectContentMock: Pick<ProjectContentService, 'getProjects'> = {
    getProjects: getProjectsMock,
  };

  beforeEach(async () => {
    getProjectsMock.mockReset();
    getProjectsMock.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ProjectsComponent],
      providers: [{ provide: ProjectContentService, useValue: projectContentMock }],
    })
      .overrideComponent(ProjectsComponent, {
        set: {
          imports: [NgStyle, ProjectCardStubComponent],
        },
      })
      .compileComponents();
  });

  it('debería crearse', () => {
    fixture = TestBed.createComponent(ProjectsComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('sortedProjects debería devolver [] cuando no hay proyectos', () => {
    fixture = TestBed.createComponent(ProjectsComponent);

    expect(fixture.componentInstance.sortedProjects()).toEqual([]);
  });

  it('sortedProjects debería ordenar por order', () => {
    getProjectsMock.mockReturnValueOnce(
      of([
        createProject({ slug: 'b', title: 'B', order: 2 }),
        createProject({ slug: 'a', title: 'A', order: 1 }),
      ]),
    );

    fixture = TestBed.createComponent(ProjectsComponent);

    const sorted = fixture.componentInstance.sortedProjects();

    expect(sorted.map((project) => project.title)).toEqual(['A', 'B']);
  });

  it('debería renderizar un card por cada proyecto ordenado', () => {
    getProjectsMock.mockReturnValueOnce(
      of([
        createProject({ slug: 'b', title: 'B', order: 2 }),
        createProject({ slug: 'a', title: 'A', order: 1 }),
        createProject({ slug: 'c', title: 'C', order: 3 }),
      ]),
    );

    fixture = TestBed.createComponent(ProjectsComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const cards = el.querySelectorAll('app-project-card');

    expect(cards.length).toBe(3);
  });
});
