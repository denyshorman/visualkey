import { afterNextRender, Component, DestroyRef } from '@angular/core';
import { AnalyticsService } from './services/analytics.service';
import { ThemeService } from './services/theme.service';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MenuBarComponent } from './components/menu-bar/menu-bar.component';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Meta } from '@angular/platform-browser';
import { filter, map, mergeMap } from 'rxjs';

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
    private activatedRoute: ActivatedRoute,
    private metaTagService: Meta,
    private destroyRef: DestroyRef,
  ) {
    afterNextRender(() => {
      this.analyticsService.initialize();

      if (window.matchMedia('(display-mode: standalone)').matches) {
        this.analyticsService.trackEvent('app_display_mode_standalone');
      }

      const routerEventsSubscription = this.router.events
        .pipe(
          filter(event => event instanceof NavigationEnd),
          map(() => {
            let route = this.activatedRoute;

            while (route.firstChild) {
              route = route.firstChild;
            }

            return route;
          }),
          filter(route => route.outlet === 'primary'),
          mergeMap(route => route.data),
        )
        .subscribe(data => {
          const description = data['description'];

          if (description) {
            this.metaTagService.updateTag({ name: 'description', content: description });
          } else {
            this.metaTagService.removeTag("name='description'");
          }

          this.analyticsService.trackEvent('page_view', {
            page_location: window.location.href,
          });
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
