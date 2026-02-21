import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Observable, of, throwError } from 'rxjs';

import { ContactComponent } from './contact.component';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ContactDto } from '../../models/contact.model';

describe('ContactComponent', () => {
  let fixture: ComponentFixture<ContactComponent>;
  let component: ContactComponent;

  const sendContactMock = vi.fn<(dto: ContactDto) => Observable<unknown>>();
  const showMock = vi.fn<(message: string, type: 'success' | 'error') => void>();

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
      name: 'Mat', // < 4
      email: 'mal',
      message: 'hola', // < 10
    });

    component.submit();

    expect(sendContactMock).not.toHaveBeenCalled();
  });

  it('debería enviar, mostrar toast success y resetear el formulario en success', () => {
    sendContactMock.mockReturnValueOnce(of({}));

    component.form.setValue({
      name: 'Matias',
      email: 'matias@test.com',
      message: 'Hola esto es un mensaje válido',
    });

    component.submit();

    const expectedDto: ContactDto = {
      name: 'Matias',
      email: 'matias@test.com',
      message: 'Hola esto es un mensaje válido',
    };

    expect(sendContactMock).toHaveBeenCalledWith(expectedDto);
    expect(showMock).toHaveBeenCalledWith('Mensaje enviado correctamente', 'success');

    expect(component.form.get('name')?.value).toBe('');
    expect(component.form.get('email')?.value).toBe('');
    expect(component.form.get('message')?.value).toBe('');
  });

  it('debería mostrar toast error cuando el backend falla', () => {
    sendContactMock.mockReturnValueOnce(
      throwError(() => ({ error: { message: 'No se pudo enviar' } })),
    );

    component.form.setValue({
      name: 'Matias',
      email: 'matias@test.com',
      message: 'Hola esto es un mensaje válido',
    });

    component.submit();

    expect(showMock).toHaveBeenCalledWith('No se pudo enviar', 'error');
  });
});
