import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';

export class CustomRouteReuseStrategy implements RouteReuseStrategy {
  private storedHandles = new Map<string, DetachedRouteHandle>();

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    const key = this.getRouteKey(route);

    if (key != null && handle) {
      const instance = (handle as any)?.componentRef?.instance; // eslint-disable-line

      if (instance && typeof instance.detach === 'function') {
        instance.detach();
      }

      this.storedHandles.set(key, handle);
    }
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const key = this.getRouteKey(route);

    if (key == null || !this.storedHandles.has(key)) {
      return null;
    }

    return this.storedHandles.get(key) ?? null;
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const key = this.getRouteKey(route);
    return key != null && this.storedHandles.has(key);
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return route.data['reuseRoute'] === true;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  private getRouteKey(route: ActivatedRouteSnapshot): string | null {
    if (!route.routeConfig) {
      return null;
    }

    const subpaths = route.pathFromRoot
      .flatMap(r => r.url)
      .map(segment => segment.path)
      .join('/');

    return `${route.pathFromRoot.length}-${subpaths}`;
  }
}
