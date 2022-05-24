import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

const queryParams = new URLSearchParams(location.search);
const disableGa = environment.production === queryParams.has('disablega');

if (disableGa) {
  (window as any)[`ga-disable-${environment.gaMeasurementId}`] = true;
}

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
