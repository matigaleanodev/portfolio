import { Component, computed, inject, input } from '@angular/core';
import { BookOpen, Code, LucideAngularModule, LucideIconData, Play, Server } from 'lucide-angular';

import { ProjectLink } from '../../models/project.model';
import { AnalyticsService } from '../../services/analytics.service';

const ICONS: Record<string, LucideIconData> = {
  code: Code,
  server: Server,
  bookopen: BookOpen,
  play: Play,
};

@Component({
  selector: 'app-project-link',
  imports: [LucideAngularModule],
  template: `
    <a
      [href]="link().url"
      [attr.aria-label]="link().label + ' de ' + projectTitle() + ' (abre en una pestaña nueva)'"
      [class.link]="appearance() === 'text'"
      [class.link-primary]="appearance() !== 'text'"
      [class.project-link--outline]="appearance() === 'outline'"
      target="_blank"
      rel="noopener noreferrer"
      (click)="trackClick()"
    >
      <lucide-icon [img]="icon()" size="16" aria-hidden="true" />
      {{ link().label }}
    </a>
  `,
  styleUrl: './project-link.component.css',
})
export class ProjectLinkComponent {
  readonly link = input.required<ProjectLink>();
  readonly appearance = input<'text' | 'filled' | 'outline'>('text');
  readonly projectTitle = input.required<string>();

  private readonly analytics = inject(AnalyticsService);
  protected readonly icon = computed(() => ICONS[this.link().icon ?? ''] ?? Code);

  protected trackClick(): void {
    this.analytics.trackEvent('click_project_link', {
      project_name: this.projectTitle(),
      link_name: this.link().label,
    });
  }
}
