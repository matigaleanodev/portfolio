import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { catchError, of } from 'rxjs';

import { Project } from '../../../models/project.model';
import { ProjectContentService } from '../../../services/project-content.service';
import { projectLinks } from '../project-links';

@Component({
  selector: 'app-featured-project',
  imports: [LucideAngularModule],
  templateUrl: './featured-project.component.html',
  styleUrl: './featured-project.component.css',
})
export class FeaturedProjectComponent {
  // El error de carga lo informa la lista de proyectos; acá el panel no se muestra.
  private readonly projects = toSignal(
    inject(ProjectContentService)
      .getProjects()
      .pipe(catchError(() => of([] as Project[]))),
    { initialValue: [] as Project[] },
  );

  protected readonly project = computed(
    () =>
      [...this.projects()].sort((a, b) => a.order - b.order).find((item) => item.featured) ?? null,
  );

  protected readonly links = projectLinks(this.project);
}
