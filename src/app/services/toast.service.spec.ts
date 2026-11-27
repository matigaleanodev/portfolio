import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);

    vi.useFakeTimers();

    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('debería crearse', () => {
    expect(service).toBeTruthy();
  });

  it('show debería setear visible=true y luego showing=true en el frame', () => {
    service.show('hola');

    const stateAfterShow = service.state();
    expect(stateAfterShow.message).toBe('hola');
    expect(stateAfterShow.visible).toBe(true);

    // requestAnimationFrame lo ejecutamos sync en el mock
    const stateAfterRaf = service.state();
    expect(stateAfterRaf.showing).toBe(true);
  });

  it('show debería auto-ocultarse recién a los 5000ms', () => {
    service.show('hola');

    vi.advanceTimersByTime(4999);
    expect(service.state().showing).toBe(true);

    vi.advanceTimersByTime(1);
    expect(service.state().showing).toBe(false);

    vi.advanceTimersByTime(300);
    expect(service.state().visible).toBe(false);
  });

  it('pause detiene el ocultamiento y resume reinicia el plazo', () => {
    service.show('hola');

    service.pause();
    vi.advanceTimersByTime(20000);
    expect(service.state().showing).toBe(true);

    service.resume();
    vi.advanceTimersByTime(5000);
    expect(service.state().showing).toBe(false);
  });

  it('hide debería poner showing=false y luego visible=false a los 300ms', () => {
    service.show('hola');

    service.hide();

    expect(service.state().showing).toBe(false);

    vi.advanceTimersByTime(300);

    expect(service.state().visible).toBe(false);
  });
});
