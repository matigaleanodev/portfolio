import { Injectable } from '@angular/core';

type GtagFn = (command: 'event', eventName: string, params?: Record<string, unknown>) => void;

declare const gtag: GtagFn;

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  trackEvent(eventName: string, params?: Record<string, unknown>): void {
    gtag('event', eventName, {
      ...params,
    });
  }
}
