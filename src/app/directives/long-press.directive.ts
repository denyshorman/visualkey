import { Directive, input, OnDestroy, output } from '@angular/core';

@Directive({
  selector: '[appLongPress]',
  host: {
    class: 'touch-none',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointerleave)': 'onPointerLeave($event)',
    '(pointercancel)': 'onPointerCancel($event)',
    '(contextmenu)': '$event.preventDefault()',
  },
})
export class LongPressDirective implements OnDestroy {
  threshold = input(500);
  interval = input(100);
  intervalEmit = input(false);

  shortClick = output<void>();
  pressStarted = output<void>();
  pressEnded = output<void>();
  press = output<void>();

  private pressTimeoutId: NodeJS.Timeout | undefined = undefined;
  private pressIntervalId: NodeJS.Timeout | undefined = undefined;
  private activePointerId: number | undefined = undefined;

  onPointerDown(e: PointerEvent) {
    if (!e.isPrimary) return;

    this.activePointerId = e.pointerId;

    if (e.target instanceof Element) {
      e.target.setPointerCapture(e.pointerId);
    }

    this.down();
  }

  onPointerUp(e: PointerEvent) {
    if (!e.isPrimary || e.pointerId !== this.activePointerId) return;

    this.activePointerId = undefined;
    this.up();
  }

  onPointerLeave(e: PointerEvent) {
    if (!e.isPrimary || e.pointerId !== this.activePointerId) return;

    this.up(false);
  }

  onPointerCancel(e: PointerEvent) {
    if (!e.isPrimary || e.pointerId !== this.activePointerId) return;

    this.activePointerId = undefined;
    this.up(false);
  }

  ngOnDestroy(): void {
    clearTimeout(this.pressTimeoutId);
    clearInterval(this.pressIntervalId);
  }

  private down() {
    this.pressTimeoutId = setTimeout(() => {
      this.pressTimeoutId = undefined;

      if (this.intervalEmit()) {
        this.pressStarted.emit();
        this.press.emit();
        this.pressIntervalId = setInterval(() => this.press.emit(), this.interval());
      } else {
        this.press.emit();
      }
    }, this.threshold());
  }

  private up(shortClickEmit = true) {
    if (this.pressTimeoutId !== undefined) {
      clearTimeout(this.pressTimeoutId);
      this.pressTimeoutId = undefined;

      if (shortClickEmit) {
        this.shortClick.emit();
      }
    } else if (this.intervalEmit() && this.pressIntervalId !== undefined) {
      clearInterval(this.pressIntervalId);
      this.pressIntervalId = undefined;
      this.pressEnded.emit();
    }
  }
}
