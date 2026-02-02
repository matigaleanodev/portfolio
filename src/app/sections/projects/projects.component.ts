import { Component, computed, signal } from '@angular/core';
import { Project } from '../../models/project.model';
import { ProjectCardComponent } from './project-card/project-card.component';

@Component({
  selector: 'projects',
  imports: [ProjectCardComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css',
})
export class ProjectsComponent {
  readonly projects = signal<Project[]>(PROJECTS);

  readonly sortedProjects = computed(() =>
    [...this.projects()].sort(
      (a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER),
    ),
  );
}

export const PROJECTS: Project[] = [
  {
    id: 'foodly-notes',
    name: 'Foodly Notes',
    image: '/assets/foodly-notes.png',
    description:
      'Foodly Notes es una aplicación de recetas pensada como producto real para el uso cotidiano. Su objetivo es ayudar a descubrir recetas nuevas de forma simple, guardarlas para más adelante y organizar todo lo necesario para cocinarlas. La experiencia está basada en el descubrimiento: explorar recetas, marcar favoritas, encontrar recetas similares y generar automáticamente una lista de compras a partir de lo que el usuario quiere cocinar.',
    technologies: ['Angular', 'Ionic', 'NestJS', 'MongoDB'],
    links: [
      {
        id: 'frontend',
        name: 'Repositorio Frontend',
        icon: 'code',
        color: '',
        url: 'https://github.com/matigaleanodev/foodly-notes',
      },
      {
        id: 'backend',
        name: 'Repositorio Backend',
        icon: 'server',
        color: '',
        url: 'https://github.com/matigaleanodev/foodly-notes-api',
      },
      {
        id: 'documentation',
        name: 'Documentación',
        icon: 'bookopen',
        color: '',
        url: 'https://matigaleano-dev.notion.site/Foodly-Notes-2f9aa07ef7dd80f0b9a0f2af1030bdb0',
      },
    ],
    highlight: true,
    order: 1,
  },
];
