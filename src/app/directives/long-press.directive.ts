import { Directive, ElementRef, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { concat, EMPTY, fromEvent, merge, of, Subscription, timer } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

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

    const mouseUp = merge(
      fromEvent<MouseEvent>(window, 'mouseup'),
      fromEvent<MouseEvent>(elementRef.nativeElement, 'mouseup'),
      fromEvent<MouseEvent>(elementRef.nativeElement, 'mouseleave'),
    ).pipe(
      filter(event => event.button == 0),
      map(() => false),
      first(),
    );

    const mouseClick = mouseDown.pipe(switchMap(value => merge(concat(of(value), mouseUp))));

    const touchStart = fromEvent<TouchEvent>(elementRef.nativeElement, 'touchstart').pipe(map(() => true));

    const touchEnd = merge(
      fromEvent<TouchEvent>(window, 'touchend'),
      fromEvent<TouchEvent>(elementRef.nativeElement, 'touchend'),
    ).pipe(
      map(() => false),
      first(),
    );

    const touch = touchStart.pipe(switchMap(value => merge(concat(of(value), touchEnd))));

    this.longPressSubscription = merge(mouseClick, touch)
      .pipe(switchMap(state => (state ? timer(this.threshold, this.interval) : EMPTY)))
      .subscribe(() => this.appLongPress.emit());
  }

  ngOnDestroy(): void {
    this.longPressSubscription.unsubscribe();
  }
}
