import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { ApiService } from './api.service';
import { environment } from '../../environments/environment';
import { ContactDto } from '../models/contact.model';
import { ChatRequestDto } from '../models/chat.model';

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

  it('getChatStarters debería hacer GET a /chat/starters', () => {
    service.getChatStarters().subscribe((response) => {
      expect(response.suggestedQuestions).toEqual(['¿Qué tecnologías usás?']);
    });

    const req = httpMock.expectOne(`${environment.API_URL}/chat/starters`);
    expect(req.request.method).toBe('GET');

    req.flush({ suggestedQuestions: ['¿Qué tecnologías usás?'] });
  });

  it('sendChatMessage debería hacer POST a /chat con el dto', () => {
    const dto: ChatRequestDto = {
      message: '¿Qué tecnologías usás?',
      sessionId: 'test-session',
    };

    service.sendChatMessage(dto).subscribe((response) => {
      expect(response.answer).toContain('TypeScript');
      expect(response.source).toBe('faq');
    });

    const req = httpMock.expectOne(`${environment.API_URL}/chat`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);

    req.flush({
      answer: 'Trabajo con TypeScript',
      suggestedQuestions: ['¿Usás NestJS?'],
      source: 'faq',
    });
  });
});
