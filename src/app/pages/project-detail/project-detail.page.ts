import { afterNextRender, Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ArrowLeft, LucideAngularModule } from 'lucide-angular';
import { catchError, map, of, switchMap } from 'rxjs';

import { projectLinks } from '../../sections/projects/project-links';
import { ProjectContentService } from '../../services/project-content.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-project-detail-page',
  imports: [LucideAngularModule],
  templateUrl: './project-detail.page.html',
  styleUrl: './project-detail.page.css',
})
export class ProjectDetailPage {
  protected readonly backIcon = ArrowLeft;

  private readonly route = inject(ActivatedRoute);
  private readonly content = inject(ProjectContentService);
  private readonly title = viewChild<ElementRef<HTMLElement>>('title');
  private readonly slug = toSignal(this.route.paramMap.pipe(map((params) => params.get('slug'))), {
    requireSync: true,
  });

  protected readonly project = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) =>
        this.content.getProjects().pipe(
          map(
            (projects) => projects.find((project) => project.slug === params.get('slug')) ?? null,
          ),
          catchError(() => of(null)),
        ),
      ),
    ),
  );

  protected readonly links = projectLinks(this.project);

  constructor() {
    const seo = inject(SeoService);
    effect(() => {
      const project = this.project();
      if (project === undefined) return;

      seo.setPageSeo({
        title: project
          ? project.title + ' | Matias Galeano'
          : 'Proyecto no disponible | Matias Galeano',
        description: project?.excerpt ?? 'Explorá los proyectos de Matias Galeano.',
        canonicalUrl: 'https://matiasgaleano.dev/projects/' + encodeURIComponent(this.slug() ?? ''),
        ogImage:
          'https://matiasgaleano.dev' + (project?.coverImage ?? '/assets/icons/icon-512.webp'),
        type: 'website',
      });
    });

    if (inject(Router).navigated) {
      afterNextRender(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        this.title()?.nativeElement.focus({ preventScroll: true });
      });
    }
  }
}
