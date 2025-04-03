import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from './services/analytics.service';
import { EthAddrGeneratorComponent } from './pages/eth-addr-generator/eth-addr-generator.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [EthAddrGeneratorComponent],
  template: '<app-eth-addr-generator></app-eth-addr-generator>',
  host: {
    '(window:appinstalled)': 'onAppInstalled()',
    '(window:keyup)': 'toggleTheme($event)',
  },
})
export class AppComponent implements OnInit {
  constructor(
    private themeService: ThemeService,
    private analyticsService: AnalyticsService,
  ) {}

  ngOnInit(): void {
    this.analyticsService.initialize();

    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.analyticsService.trackEvent('app_display_mode_standalone');
    }
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
