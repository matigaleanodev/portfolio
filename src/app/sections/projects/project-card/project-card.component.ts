import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Project } from '../../../models/project.model';

@Component({
  selector: 'app-project-card',
  imports: [RouterLink],
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.css', '../project-tech-chip.css'],
})
export class ProjectCardComponent {
  readonly project = input.required<Project>();
}
