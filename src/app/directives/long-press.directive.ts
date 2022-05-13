import { Directive, ElementRef, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { EMPTY, fromEvent, merge, Subscription, timer } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

@Directive({
  selector: '[appLongPress]',
})
export class LongPressDirective implements OnDestroy {
  @Input('appLongPressThreshold') threshold = 500;
  @Input('appLongPressInterval') interval = 100;
  @Output() appLongPress = new EventEmitter<void>();

  private longPressSubscription = Subscription.EMPTY;

  constructor(private elementRef: ElementRef) {
    const mouseDown = fromEvent<MouseEvent>(elementRef.nativeElement, 'mousedown').pipe(
      filter(event => event.button == 0),
      map(() => true),
    );

    const mouseUp = fromEvent<MouseEvent>(elementRef.nativeElement, 'mouseup').pipe(
      filter(event => event.button == 0),
      map(() => false),
    );

    const touchStart = fromEvent(elementRef.nativeElement, 'touchstart').pipe(map(() => true));

    const touchEnd = fromEvent(elementRef.nativeElement, 'touchend').pipe(map(() => false));

    this.longPressSubscription = merge(mouseDown, mouseUp, touchEnd, touchStart)
      .pipe(switchMap(state => (state ? timer(this.threshold, this.interval) : EMPTY)))
      .subscribe(() => this.appLongPress.emit());
  }

  ngOnDestroy(): void {
    this.longPressSubscription.unsubscribe();
  }
}
