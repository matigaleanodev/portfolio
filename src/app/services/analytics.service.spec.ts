import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AnalyticsService } from './analytics.service';

type GtagFn = (command: 'event', eventName: string, params?: Record<string, unknown>) => void;

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const globalWithGtag = (): { gtag?: GtagFn } => globalThis as unknown as { gtag?: GtagFn };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnalyticsService);
  });

  afterEach(() => {
    delete globalWithGtag().gtag;
  });

  it('debería crearse', () => {
    expect(service).toBeTruthy();
  });

  it('debería llamar a gtag con el evento y los params', () => {
    const gtagMock = vi.fn<GtagFn>();
    globalWithGtag().gtag = gtagMock;

    service.trackEvent('click_project_link', { foo: 'bar' });

    expect(gtagMock).toHaveBeenCalledWith('event', 'click_project_link', {
      foo: 'bar',
    });
  });

  it('debería llamar a gtag con un objeto vacío cuando no hay params', () => {
    const gtagMock = vi.fn<GtagFn>();
    globalWithGtag().gtag = gtagMock;

    service.trackEvent('page_view');

    expect(gtagMock).toHaveBeenCalledWith('event', 'page_view', {});
  });
});
