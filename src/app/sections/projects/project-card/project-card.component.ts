import { Component, input } from '@angular/core';
import { Project } from '../../../models/project.model';
import { LucideAngularModule, Code, Server, BookOpen } from 'lucide-angular';

@Component({
  selector: 'project-card',
  imports: [LucideAngularModule],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.css',
})
export class ProjectCardComponent {
  readonly project = input.required<Project>();

  readonly icons: { [key: string]: any } = {
    code: Code,
    server: Server,
    bookopen: BookOpen,
  };
}
