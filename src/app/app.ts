import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, PLATFORM_ID, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { ToastComponent } from './ui/toast/toast.component';
import { ChatComponent } from './sections/chat/chat.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    ChatComponent,
    ToastComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  readonly routeTransitionActive = signal(false);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (!(event instanceof NavigationEnd)) {
        return;
      }

      this.routeTransitionActive.set(false);

      if (!isPlatformBrowser(this.platformId) || typeof requestAnimationFrame !== 'function') {
        return;
      }

      requestAnimationFrame(() => {
        this.routeTransitionActive.set(true);

        setTimeout(() => {
          this.routeTransitionActive.set(false);
        }, 620);
      });
    });
  }
}
