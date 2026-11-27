import { Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { Project } from '../../../models/project.model';
import { projectLinks } from '../project-links';

@Component({
  selector: 'app-project-card',
  imports: [LucideAngularModule],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.css',
})
export class ProjectCardComponent {
  readonly project = input.required<Project>();

  protected readonly links = projectLinks(this.project);
}
