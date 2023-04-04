import { Directive, EventEmitter, HostListener, Input, OnDestroy, Output } from '@angular/core';

@Directive({
  selector: '[appLongPress]',
})
export class LongPressDirective implements OnDestroy {
  @Input() threshold = 500;
  @Input() interval = 100;
  @Input() intervalEmit = false;
  @Output() shortClick = new EventEmitter<void>();
  @Output() pressStarted = new EventEmitter<void>();
  @Output() pressEnded = new EventEmitter<void>();
  @Output() press = new EventEmitter<void>();

  private pressTimeoutId: NodeJS.Timeout | undefined = undefined;
  private pressIntervalId: NodeJS.Timeout | undefined = undefined;

  @HostListener('mousedown')
  onMouseDown() {
    this.down();
  }

  @HostListener('mouseup')
  onMouseUp() {
    this.up();
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.up(false);
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent) {
    this.down();
    e.preventDefault();
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(e: TouchEvent) {
    this.up();
    e.preventDefault();
  }

  ngOnDestroy(): void {
    clearTimeout(this.pressTimeoutId);
    clearInterval(this.pressIntervalId);
  }

  private down() {
    this.pressTimeoutId = setTimeout(() => {
      this.pressTimeoutId = undefined;

      if (this.intervalEmit) {
        this.pressStarted.emit();
        this.press.emit();
        this.pressIntervalId = setInterval(() => this.press.emit(), this.interval);
      } else {
        this.press.emit();
      }
    }, this.threshold);
  }

  private up(shortClickEmit: boolean = true) {
    if (this.pressTimeoutId !== undefined) {
      clearTimeout(this.pressTimeoutId);
      this.pressTimeoutId = undefined;

      if (shortClickEmit) {
        this.shortClick.emit();
      }
    } else if (this.intervalEmit && this.pressIntervalId !== undefined) {
      clearInterval(this.pressIntervalId);
      this.pressIntervalId = undefined;
      this.pressEnded.emit();
    }
  }
}
