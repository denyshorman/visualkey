import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NetworkStatusService implements OnDestroy {
  private statusSubscription = Subscription.EMPTY;

  constructor() {
    this._status.next(window.navigator.onLine || true);

    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const status$ = merge(offline$, online$);

    this.statusSubscription = status$.subscribe(status => {
      this._status.next(status);
    });
  }

  private _status = new BehaviorSubject<boolean>(true);

  get status(): boolean {
    return this._status.value;
  }

  get status$(): Observable<boolean> {
    return this._status;
  }

  ngOnDestroy(): void {
    this.statusSubscription.unsubscribe();
  }
}
