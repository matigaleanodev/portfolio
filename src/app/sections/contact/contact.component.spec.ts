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
  const showMock = vi.fn<(message: string) => void>();
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

  it('muestra el éxito en contexto sin una segunda región que lo anuncie', () => {
    component.submitSucceeded.set(true);
    fixture.detectChanges();
    const success = fixture.nativeElement.querySelector('.feedback--success');

    expect(success).toBeTruthy();
    expect(success.closest('[role="status"], [role="alert"], [aria-live]')).toBeNull();
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
    expect(showMock).toHaveBeenCalledWith('Mensaje enviado correctamente');

    expect(component.form.get('name')?.value).toBe('');
    expect(component.form.get('email')?.value).toBe('');
    expect(component.form.get('message')?.value).toBe('');
    expect(component.form.get('company')?.value).toBe('');
  });

  const validValue = {
    name: 'Matias',
    email: 'matias@test.com',
    message: 'Hola esto es un mensaje válido',
    company: '',
  };

  for (const [status, expected] of [
    [429, 'Hay demasiados intentos. Esperá un momento y volvé a probar.'],
    [400, 'No pudimos aceptar los datos. Revisalos y volvé a enviar.'],
    [503, 'No se pudo enviar el mensaje. Intentalo nuevamente en unos minutos.'],
    [0, 'No se pudo conectar. Revisá tu conexión y volvé a probar.'],
  ] as const) {
    it(`muestra en contexto un error en español para el estado ${status}, sin toast`, () => {
      sendContactMock.mockReturnValueOnce(
        throwError(() => ({ status, error: { message: ['Rate limit'] }, message: 'Http failure' })),
      );
      component.form.setValue(validValue);

      component.submit();
      fixture.detectChanges();

      expect(component.submitError()).toBe(expected);
      expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(expected);
      expect(showMock).not.toHaveBeenCalled();
      expect(component.form.getRawValue()).toEqual(validValue);
      expect(trackEventMock).toHaveBeenCalledWith('contact_submit_error', { status });
    });
  }

  it('mientras envía usa Loading sin disabled nativo y deja los campos de solo lectura', () => {
    sendContactMock.mockReturnValueOnce(new Observable());
    component.form.setValue(validValue);

    component.submit();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.textContent).toContain('Enviando…');
    expect(el.querySelector<HTMLInputElement>('#contact-name')!.readOnly).toBe(true);
    expect(el.querySelector<HTMLTextAreaElement>('#contact-message')!.readOnly).toBe(true);
    component.submit();
    expect(sendContactMock).toHaveBeenCalledTimes(1);
  });

  it('deja el botón habilitado y al enviar inválido enfoca el primer campo con error', () => {
    document.body.appendChild(fixture.nativeElement);
    component.form.patchValue({ name: 'Matias', email: 'mal' });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
    component.submit();

    expect(document.activeElement?.id).toBe('contact-email');
    el.remove();
  });
});
