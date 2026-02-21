import { Component, computed, inject } from '@angular/core';
import { ProjectCardComponent } from './project-card/project-card.component';
import { ApiService } from '../../services/api.service';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-projects',
  imports: [ProjectCardComponent, NgStyle],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css',
})
export class ProjectsComponent {
  private readonly api = inject(ApiService);

  readonly projects = computed(() => this.api.projectsResource.value());

  readonly sortedProjects = computed(() => {
    const projects = this.projects();
    if (!projects) return [];

    return [...projects].sort(
      (a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER),
    );
  });
}
