import { Injectable } from '@angular/core';

type GtagFn = (command: 'event', eventName: string, params?: Record<string, unknown>) => void;

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  trackEvent(eventName: string, params?: Record<string, unknown>): void {
    const analytics = (globalThis as { gtag?: GtagFn }).gtag;
    if (!analytics) return;

    analytics('event', eventName, {
      ...params,
    });
  }
}
