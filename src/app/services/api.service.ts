import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Project } from '../models/project.model';
import { ContactDto } from '../models/contact.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.API_URL;

  readonly projectsResource = httpResource<Project[]>(() => ({
    url: `${this.baseUrl}/projects`,
    method: 'GET',
    defaultValue: [],
  }));

  sendContact(dto: ContactDto) {
    return this.http.post(`${this.baseUrl}/contact`, dto);
  }
}
