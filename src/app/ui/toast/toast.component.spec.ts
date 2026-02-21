import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { ToastComponent } from './toast.component';
import { ToastService } from '../../services/toast.service';
import { ToastState } from '../../models/toast.model';

describe('ToastComponent', () => {
  let fixture: ComponentFixture<ToastComponent>;

  const stateWritable = signal<ToastState>({
    message: '',
    type: 'success',
    visible: false,
    showing: false,
  });

  const toastMock: Pick<ToastService, 'state'> = {
    state: stateWritable.asReadonly(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [{ provide: ToastService, useValue: toastMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
  });

  it('debería crearse', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('no debería renderizar nada cuando visible=false', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.fixed.top-6.right-6.z-50')).toBeNull();
  });

  it('debería renderizar el mensaje cuando visible=true', () => {
    stateWritable.set({
      message: 'Hola',
      type: 'success',
      visible: true,
      showing: true,
    });

    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('Hola');
  });

  it('debería aplicar clase de success cuando type=success', () => {
    stateWritable.set({
      message: 'Ok',
      type: 'success',
      visible: true,
      showing: true,
    });

    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const toast = el.querySelector('.px-6.py-4.rounded-md.shadow-lg') as HTMLElement;
    expect(toast.className).toContain('bg-emerald-600/75');
  });

  it('debería aplicar clase de error cuando type=error', () => {
    stateWritable.set({
      message: 'Error',
      type: 'error',
      visible: true,
      showing: true,
    });

    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const toast = el.querySelector('.px-6.py-4.rounded-md.shadow-lg') as HTMLElement;
    expect(toast.className).toContain('bg-rose-600/75');
  });

  it('debería aplicar clases de animación según showing', () => {
    stateWritable.set({
      message: 'Anim',
      type: 'success',
      visible: true,
      showing: false,
    });

    fixture.detectChanges();
    let el = fixture.nativeElement as HTMLElement;

    let toast = el.querySelector('.px-6.py-4.rounded-md.shadow-lg') as HTMLElement;
    expect(toast.className).toContain('opacity-0');
    expect(toast.className).toContain('-translate-y-4');
    expect(toast.className).toContain('scale-95');

    stateWritable.set({
      message: 'Anim',
      type: 'success',
      visible: true,
      showing: true,
    });

    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;

    toast = el.querySelector('.px-6.py-4.rounded-md.shadow-lg') as HTMLElement;
    expect(toast.className).toContain('opacity-100');
    expect(toast.className).toContain('translate-y-0');
    expect(toast.className).toContain('scale-100');
  });
});
