import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private initialized = false;

  initialize() {
    if (this.initialized) {
      return;
    }

    const queryParams = new URLSearchParams(location.search);
    const enableAnalytics = environment.production !== queryParams.has('disableanalytics');

    if (enableAnalytics) {
      let script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${environment.gaMeasurementId}`;
      document.head.appendChild(script);

      script = document.createElement('script');
      script.innerHTML = `
        window.dataLayer=window.dataLayer||[];
        function gtag(){dataLayer.push(arguments)}
        gtag('js',new Date());
        gtag('config','${environment.gaMeasurementId}');
      `;
      document.head.appendChild(script);

      this.initialized = true;
    }
  }

  trackEvent(name: string, params?: Record<string, unknown>) {
    if (this.initialized && typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
    }
  }
}
