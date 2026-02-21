import { Component, Input } from '@angular/core';
import { NgStyle } from '@angular/common';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ProjectsComponent } from './projects.component';
import { ApiService } from '../../services/api.service';
import { Project } from '../../models/project.model';

@Component({
  selector: 'app-project-card',
  standalone: true,
  template: '',
})
class ProjectCardStubComponent {
  @Input({ required: true }) project!: Project;
}

describe('ProjectsComponent', () => {
  let fixture: ComponentFixture<ProjectsComponent>;

  const projectsValueMock = vi.fn<() => Project[] | null>();

  const apiMock: Pick<ApiService, 'projectsResource'> = {
    projectsResource: {
      value: projectsValueMock,
    } as unknown as ApiService['projectsResource'],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsComponent],
      providers: [{ provide: ApiService, useValue: apiMock }],
    })
      .overrideComponent(ProjectsComponent, {
        set: {
          // IMPORTANTE: no pisar NgStyle, si no ngStyle explota
          imports: [NgStyle, ProjectCardStubComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ProjectsComponent);
  });

  it('debería crearse', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('sortedProjects debería devolver [] cuando projects es null', () => {
    projectsValueMock.mockReturnValueOnce(null);

    expect(fixture.componentInstance.sortedProjects()).toEqual([]);
  });

  it('sortedProjects debería ordenar por order (undefined al final)', () => {
    projectsValueMock.mockReturnValueOnce([
      { name: 'B', order: 2 } as Project,
      { name: 'Sin order' } as Project,
      { name: 'A', order: 1 } as Project,
    ]);

    const sorted = fixture.componentInstance.sortedProjects();

    expect(sorted[0]?.name).toBe('A');
    expect(sorted[1]?.name).toBe('B');
    expect(sorted[2]?.name).toBe('Sin order');
  });

  it('debería renderizar un card por cada proyecto ordenado', () => {
    projectsValueMock.mockReturnValueOnce([
      { name: 'B', order: 2 } as Project,
      { name: 'A', order: 1 } as Project,
      { name: 'C', order: 3 } as Project,
    ]);

    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const cards = el.querySelectorAll('app-project-card');

    expect(cards.length).toBe(3);
  });
});
