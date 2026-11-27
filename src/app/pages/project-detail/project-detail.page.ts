import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ArrowLeft, LucideAngularModule } from 'lucide-angular';
import { catchError, map, of, switchMap, tap } from 'rxjs';

import { ProjectLinkComponent } from '../../sections/projects/project-link.component';
import { projectLinks } from '../../sections/projects/project-links';
import { ProjectContentService } from '../../services/project-content.service';
import { SeoService } from '../../services/seo.service';
import { NotFoundStateComponent } from '../../ui/not-found-state/not-found-state.component';

@Component({
  selector: 'app-project-detail-page',
  imports: [LucideAngularModule, NgTemplateOutlet, ProjectLinkComponent, NotFoundStateComponent],
  templateUrl: './project-detail.page.html',
  styleUrls: ['./project-detail.page.css', '../../sections/projects/project-tech-chip.css'],
})
export class ProjectDetailPage {
  protected readonly backIcon = ArrowLeft;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly content = inject(ProjectContentService);
  private readonly title = viewChild<ElementRef<HTMLElement>>('title');
  private readonly slug = toSignal(this.route.paramMap.pipe(map((params) => params.get('slug'))), {
    requireSync: true,
  });

  /** El contenido cargó y el slug no figura; una falla de lectura no cuenta. */
  protected readonly missing = signal(false);
  protected arrivedByNavigation = false;

  protected readonly project = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        this.missing.set(false);
        this.arrivedByNavigation = this.router.navigated;
        return this.content.getProjects().pipe(
          map(
            (projects) => projects.find((project) => project.slug === params.get('slug')) ?? null,
          ),
          tap((project) => this.missing.set(!project)),
          catchError(() => of(null)),
        );
      }),
    ),
  );

  protected readonly links = projectLinks(this.project);

  constructor() {
    const seo = inject(SeoService);
    effect(() => {
      const project = this.project();
      if (project === undefined) return;

      const description = project?.excerpt ?? 'Explorá los proyectos de Matias Galeano.';

      if (this.missing()) {
        seo.setPageSeo({
          title: 'Proyecto no encontrado | Matias Galeano',
          description,
          noIndex: true,
        });
        return;
      }

      const title = project
        ? project.title + ' | Matias Galeano'
        : 'Proyecto no disponible | Matias Galeano';

      seo.setPageSeo({
        title,
        description,
        canonicalUrl: 'https://matiasgaleano.dev/projects/' + encodeURIComponent(this.slug() ?? ''),
        ...(project
          ? {
              image: {
                url: 'https://matiasgaleano.dev' + project.coverImage,
                alt: 'Imagen del proyecto ' + project.title,
              },
            }
          : {}),
        type: 'website',
      });
    });

    if (this.router.navigated) {
      afterNextRender(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        this.title()?.nativeElement.focus({ preventScroll: true });
      });
    }
  }
}
