import { computed, inject, Signal } from '@angular/core';
import { BookOpen, Code, LucideIconData, Play, Server } from 'lucide-angular';

import { Project, ProjectLink } from '../../models/project.model';
import { AnalyticsService } from '../../services/analytics.service';

const ICONS: Record<string, LucideIconData> = {
  code: Code,
  server: Server,
  bookopen: BookOpen,
  play: Play,
};

/** Enlaces de un caso, compartidos por la tarjeta y el destacado. Requiere contexto de inyección. */
export function projectLinks(project: Signal<Project | null>) {
  const analytics = inject(AnalyticsService);
  const primary = computed<ProjectLink | null>(() => {
    const links = project()?.links ?? [];
    return links.find((link) => link.primary) ?? links[0] ?? null;
  });

  return {
    primary,
    secondary: computed(() => (project()?.links ?? []).filter((link) => link !== primary())),
    iconFor: (name?: string): LucideIconData => ICONS[name ?? ''] ?? Code,
    track: (linkName: string) =>
      analytics.trackEvent('click_project_link', {
        project_name: project()?.title,
        link_name: linkName,
      }),
  };
}
