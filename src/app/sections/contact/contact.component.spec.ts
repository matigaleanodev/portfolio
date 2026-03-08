import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Observable, of, throwError } from 'rxjs';

import { ContactComponent } from './contact.component';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ContactDto } from '../../models/contact.model';
import { AnalyticsService } from '../../services/analytics.service';

describe('ContactComponent', () => {
  let fixture: ComponentFixture<ContactComponent>;
  let component: ContactComponent;

  const sendContactMock = vi.fn<(dto: ContactDto) => Observable<unknown>>();
  const showMock = vi.fn<(message: string, type: 'success' | 'error') => void>();
  const trackEventMock = vi.fn<(eventName: string, params?: Record<string, unknown>) => void>();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [
        {
          provide: ApiService,
          useValue: { sendContact: sendContactMock },
        },
        {
          provide: ToastService,
          useValue: { show: showMock },
        },
        {
          provide: AnalyticsService,
          useValue: { trackEvent: trackEventMock },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;

    vi.clearAllMocks();
  });

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  it('no debería enviar si el formulario es inválido', () => {
    component.form.setValue({
      name: 'M',
      email: 'mal',
      message: 'hola',
      company: '',
    });

    component.submit();

    expect(sendContactMock).not.toHaveBeenCalled();
    expect(component.form.get('name')?.touched).toBe(true);
  });

  it('debería enviar, mostrar toast success y resetear el formulario en success', () => {
    sendContactMock.mockReturnValueOnce(of({}));

    component.form.setValue({
      name: 'Matias',
      email: 'matias@test.com',
      message: 'Hola esto es un mensaje válido',
      company: '',
    });

    component.submit();

    const expectedDto: ContactDto = {
      name: 'Matias',
      email: 'matias@test.com',
      message: 'Hola esto es un mensaje válido',
      company: '',
    };

    expect(sendContactMock).toHaveBeenCalledWith(expectedDto);
    expect(trackEventMock).toHaveBeenCalledWith(
      'contact_submit',
      expect.objectContaining({ message_length: expectedDto.message.length }),
    );
    expect(trackEventMock).toHaveBeenCalledWith('contact_submit_success');
    expect(showMock).toHaveBeenCalledWith('Mensaje enviado correctamente', 'success');

    expect(component.form.get('name')?.value).toBe('');
    expect(component.form.get('email')?.value).toBe('');
    expect(component.form.get('message')?.value).toBe('');
    expect(component.form.get('company')?.value).toBe('');
  });

  it('debería mostrar toast error cuando el backend falla', () => {
    sendContactMock.mockReturnValueOnce(
      throwError(() => ({ error: { message: 'No se pudo enviar' } })),
    );

    component.form.setValue({
      name: 'Matias',
      email: 'matias@test.com',
      message: 'Hola esto es un mensaje válido',
      company: '',
    });

    component.submit();

    expect(showMock).toHaveBeenCalledWith('No se pudo enviar', 'error');
    expect(trackEventMock).toHaveBeenCalledWith(
      'contact_submit_error',
      expect.objectContaining({ status: undefined }),
    );
  });

  it('debería resolver errores de validación del backend con message array', () => {
    sendContactMock.mockReturnValueOnce(
      throwError(() => ({ status: 429, error: { message: ['Rate limit'] } })),
    );

    component.form.setValue({
      name: 'Ma',
      email: 'matias@test.com',
      message: 'Hola esto es un mensaje válido',
      company: '',
    });

    component.submit();

    expect(component.submitError()).toBe('Rate limit');
  });
});
