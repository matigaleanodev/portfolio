import { Component, inject, input } from '@angular/core';
import { Project } from '../../../models/project.model';
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

  private readonly analytics = inject(AnalyticsService);

  readonly icons: Record<string, LucideIconData> = {
    code: Code,
    server: Server,
    bookopen: BookOpen,
    play: Play,
  };

  trackProjectClick(linkName: string): void {
    this.analytics.trackEvent('click_project_link', {
      project_name: this.project().name,
      link_name: linkName,
    });
  }
}
