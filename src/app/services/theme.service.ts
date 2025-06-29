import { effect, Injectable, signal } from '@angular/core';
import { AnalyticsService } from './analytics.service';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly theme = signal<Theme>(this.loadThemeFromLocalStorage());

  constructor(private analyticsService: AnalyticsService) {
    effect(() => {
      const theme = this.theme();
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.setAttribute('data-ag-theme-mode', theme);
    });
  }

  toggle() {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
    this.analyticsService.trackEvent('theme_changed', { theme: this.theme() });
  }

  private loadThemeFromLocalStorage(): Theme {
    const storedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
    return storedTheme === 'light' ? 'light' : 'dark';
  }
}

export type Theme = 'light' | 'dark';

const LOCAL_STORAGE_THEME_KEY = 'app-theme';
