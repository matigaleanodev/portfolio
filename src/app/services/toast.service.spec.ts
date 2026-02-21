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
    service.show('hola', 'success');

    const stateAfterShow = service.state();
    expect(stateAfterShow.message).toBe('hola');
    expect(stateAfterShow.type).toBe('success');
    expect(stateAfterShow.visible).toBe(true);

    // requestAnimationFrame lo ejecutamos sync en el mock
    const stateAfterRaf = service.state();
    expect(stateAfterRaf.showing).toBe(true);
  });

  it('show debería auto-ocultarse a los 3000ms', () => {
    service.show('hola');

    // a los 3000ms llama hide()
    vi.advanceTimersByTime(3000);

    const stateAfterHideCall = service.state();
    expect(stateAfterHideCall.showing).toBe(false);

    // y 300ms después visible=false
    vi.advanceTimersByTime(300);

    const finalState = service.state();
    expect(finalState.visible).toBe(false);
  });

  it('hide debería poner showing=false y luego visible=false a los 300ms', () => {
    service.show('hola');

    service.hide();

    expect(service.state().showing).toBe(false);

    vi.advanceTimersByTime(300);

    expect(service.state().visible).toBe(false);
  });
});
