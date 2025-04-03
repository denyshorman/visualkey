import { effect, Injectable, signal } from '@angular/core';
import { AnalyticsService } from './analytics.service';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly theme = signal<Theme>(this.loadThemeFromLocalStorage());
  private readonly localStorageThemeKey = 'app-theme';

  constructor(private analyticsService: AnalyticsService) {
    effect(() => {
      const theme = this.theme();
      localStorage.setItem(this.localStorageThemeKey, theme);
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.setAttribute('data-ag-theme-mode', theme);
    });
  }

  toggle() {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
    this.analyticsService.trackEvent('theme_changed', { theme: this.theme() });
  }

  private loadThemeFromLocalStorage(): Theme {
    const storedTheme = localStorage.getItem(this.localStorageThemeKey);
    return storedTheme === 'light' ? 'light' : 'dark';
  }
}
