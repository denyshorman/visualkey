import { afterNextRender, Component, DestroyRef } from '@angular/core';
import { AnalyticsService } from './services/analytics.service';
import { ThemeService } from './services/theme.service';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MenuBarComponent } from './components/menu-bar/menu-bar.component';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MenuBarComponent, Toast, ConfirmDialog],
  host: {
    class: 'flex flex-col min-h-dvh',
    '(window:appinstalled)': 'onAppInstalled()',
    '(window:keyup)': 'toggleTheme($event)',
  },
  template: `
    <app-menu-bar />
    <main class="grow flex flex-col">
      <router-outlet />
      <p-confirmdialog />
      <p-toast position="bottom-right" />
    </main>
  `,
})
export class AppComponent {
  constructor(
    private themeService: ThemeService,
    private analyticsService: AnalyticsService,
    private router: Router,
    private destroyRef: DestroyRef,
  ) {
    afterNextRender(() => {
      this.analyticsService.initialize();

      if (window.matchMedia('(display-mode: standalone)').matches) {
        this.analyticsService.trackEvent('app_display_mode_standalone');
      }

      const routerEventsSubscription = this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.analyticsService.trackEvent('page_view', {
            page_location: window.location.href,
          });
        }
      });

      this.destroyRef.onDestroy(() => {
        routerEventsSubscription.unsubscribe();
      });
    });
  }

  onAppInstalled() {
    this.analyticsService.trackEvent('app_installed');
  }

  toggleTheme(event: KeyboardEvent) {
    if (event.key === 't') {
      this.themeService.toggle();
    }
  }
}
