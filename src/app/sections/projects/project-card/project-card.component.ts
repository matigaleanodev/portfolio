import { Component, computed, inject, input } from '@angular/core';
import { Project, ProjectLink } from '../../../models/project.model';
import { LucideAngularModule, Code, Server, BookOpen, Play, LucideIconData } from 'lucide-angular';
import { AnalyticsService } from '../../../services/analytics.service';

@Component({
  selector: 'app-project-card',
  imports: [LucideAngularModule],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.css',
})
export class ProjectCardComponent {
  readonly project = input.required<Project>();
  readonly index = input<number>(1);

  private readonly analytics = inject(AnalyticsService);

  readonly icons: Record<string, LucideIconData> = {
    code: Code,
    server: Server,
    bookopen: BookOpen,
    play: Play,
  };

  readonly primaryLink = computed<ProjectLink | null>(
    () => this.project().links.find((link) => link.primary) ?? this.project().links[0] ?? null,
  );

  readonly secondaryLinks = computed<ProjectLink[]>(() => {
    const primaryLink = this.primaryLink();

    return this.project().links.filter((link) => link !== primaryLink);
  });

  iconFor(iconName: string): LucideIconData {
    return this.icons[iconName] ?? Code;
  }

  trackProjectClick(linkName: string): void {
    this.analytics.trackEvent('click_project_link', {
      project_name: this.project().title,
      link_name: linkName,
    });
  }
}
