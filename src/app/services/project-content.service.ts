import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectContentService {
  private readonly http = inject(HttpClient);

  getProjects() {
    return this.http.get<Project[]>('/assets/projects.json');
  }
}
