import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ProjectCardComponent } from './project-card/project-card.component';
import { NgStyle } from '@angular/common';
import { ProjectContentService } from '../../services/project-content.service';
import { Project } from '../../models/project.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-projects',
  imports: [ProjectCardComponent, NgStyle],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css',
})
export class ProjectsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly projectContent = inject(ProjectContentService);

  readonly projects = signal<Project[]>([]);
  readonly errorMessage = signal('');

  constructor() {
    this.projectContent
      .getProjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (projects) => {
          this.projects.set(projects);
        },
        error: (error: unknown) => {
          const message = error instanceof Error ? error.message : 'Unexpected error loading projects.';
          this.errorMessage.set(message);
        },
      });
  }

  readonly sortedProjects = computed(() =>
    [...this.projects()].sort((a, b) => a.order - b.order),
  );
}
