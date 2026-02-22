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
  private readonly projectsResource = this.api.projectsResource;

  readonly isLoading = computed(() =>
    typeof this.projectsResource.isLoading === 'function' ? this.projectsResource.isLoading() : false,
  );

  readonly errorMessage = computed(() =>
    typeof this.projectsResource.error === 'function' ? (this.projectsResource.error()?.message ?? '') : '',
  );

  readonly sortedProjects = computed(() => {
    if (typeof this.projectsResource.hasValue === 'function' && !this.projectsResource.hasValue()) {
      return [];
    }

    const projects = this.projectsResource.value();
    if (!projects) return [];

    return [...projects].sort(
      (a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER),
    );
  });
}
