import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { ApiService } from './api.service';
import { environment } from '../../environments/environment';
import { ContactDto } from '../models/contact.model';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse', () => {
    expect(service).toBeTruthy();
  });

  it('sendContact debería hacer POST a /contact con el dto', () => {
    const dto: ContactDto = {
      name: 'Matías',
      email: 'matias@test.com',
      message: 'Hola',
    };

    service.sendContact(dto).subscribe();

    const req = httpMock.expectOne(`${environment.API_URL}/contact`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);

    req.flush({});
  });

  it('projectsResource debería existir', () => {
    expect(service.projectsResource).toBeTruthy();
  });
});
