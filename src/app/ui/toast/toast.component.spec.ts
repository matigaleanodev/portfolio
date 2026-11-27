import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastState } from '../../models/toast.model';
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from './toast.component';

describe('ToastComponent', () => {
  let fixture: ComponentFixture<ToastComponent>;
  const state = signal<ToastState>({ message: '', visible: false, showing: false });
  const mock = { state: state.asReadonly(), hide: vi.fn(), pause: vi.fn(), resume: vi.fn() };
  const element = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    vi.clearAllMocks();
    state.set({ message: '', visible: false, showing: false });
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [{ provide: ToastService, useValue: mock }],
    }).compileComponents();
    fixture = TestBed.createComponent(ToastComponent);
    fixture.detectChanges();
  });

  const show = (showing = true) => {
    state.set({ message: 'Hola', visible: true, showing });
    fixture.detectChanges();
  };

  it('mantiene una región de estado antes de recibir mensajes', () => {
    const region = element().querySelector('[role="status"]');

    expect(region).toBeTruthy();
    expect(element().querySelector('.toast')).toBeNull();
    show();
    expect(element().querySelector('[role="status"]')).toBe(region);
    expect(region!.textContent).toContain('Hola');
  });

  it('permite cerrar con un botón de icono con nombre', () => {
    show();
    element().querySelector<HTMLButtonElement>('button[aria-label="Cerrar aviso"]')!.click();

    expect(mock.hide).toHaveBeenCalled();
  });

  it('pausa con puntero o foco y reanuda al salir', () => {
    show();
    const toast = element().querySelector('.toast')!;

    toast.dispatchEvent(new MouseEvent('mouseenter'));
    toast.dispatchEvent(new FocusEvent('focusin'));
    expect(mock.pause).toHaveBeenCalledTimes(2);

    toast.dispatchEvent(new MouseEvent('mouseleave'));
    toast.dispatchEvent(new FocusEvent('focusout'));
    expect(mock.resume).toHaveBeenCalledTimes(1);
  });

  it('no reanuda mientras quede puntero o foco encima', () => {
    show();
    mock.resume.mockClear();
    const toast = element().querySelector('.toast')!;

    toast.dispatchEvent(new FocusEvent('focusin'));
    toast.dispatchEvent(new MouseEvent('mouseenter'));
    toast.dispatchEvent(new MouseEvent('mouseleave'));
    expect(mock.resume).not.toHaveBeenCalled();

    toast.dispatchEvent(new FocusEvent('focusout'));
    expect(mock.resume).toHaveBeenCalledTimes(1);
  });

  it('al cerrar con el foco adentro lo devuelve al control anterior', () => {
    const previous = document.createElement('button');
    document.body.append(previous, element());
    show();
    const close = element().querySelector<HTMLButtonElement>('button')!;
    previous.focus();
    close.focus();
    close.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: previous }));

    close.click();

    expect(document.activeElement).toBe(previous);
    previous.remove();
  });

  it('refleja la transición de entrada', () => {
    show(false);
    expect(element().querySelector('.toast--showing')).toBeNull();
    show();
    expect(element().querySelector('.toast--showing')).toBeTruthy();
  });
});
