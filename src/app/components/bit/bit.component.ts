import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-bit',
  templateUrl: './bit.component.html',
  styleUrls: ['./bit.component.scss'],
})
export class BitComponent {
  @Output() stateChange = new EventEmitter<boolean>();
  @Input() mouseEnterStrategy = DefaultMouseEnterStrategy;
  @Input() size = DefaultBitSize;
  @Input() falseStateColor = DefaultFalseStateColor;
  @Input() trueStateColor = DefaultTrueStateColor;
  @Input() readOnly = false;
  @Input() mouseMoveDisabled = false;

  private _state = DefaultBitState;

  @Input()
  get state(): boolean {
    return this._state;
  }

  set state(state: boolean) {
    if (this._state != state) {
      this._state = state;
      this.stateChange.emit(state);
    }
  }

  private static isLeftButtonPressed(e: MouseEvent): boolean {
    return e.buttons === 1 || e.button === 1;
  }

  mouseEnter(e: MouseEvent) {
    if (this.readOnly || (this.mouseMoveDisabled && !BitComponent.isLeftButtonPressed(e))) {
      return;
    } else {
      this.changeState();
    }
  }

  mouseDown() {
    if (this.readOnly) {
      return;
    }

    this.changeState();
  }

  touchIgnore(e: TouchEvent) {
    if (this.readOnly) {
      return;
    }

    e.preventDefault();
  }

  private changeState() {
    switch (this.mouseEnterStrategy) {
      case MouseEnterStrategy.Set:
        this.state = true;
        break;
      case MouseEnterStrategy.Clear:
        this.state = false;
        break;
      case MouseEnterStrategy.Flip:
        this.state = !this.state;
        break;
      default:
        throw new Error(`Unrecognized mouse enter strategy ${this.mouseEnterStrategy}`);
    }
  }
}

export enum MouseEnterStrategy {
  Set,
  Clear,
  Flip,
}

export const DefaultMouseEnterStrategy = MouseEnterStrategy.Flip;
export const DefaultFalseStateColor = '#ff0040';
export const DefaultTrueStateColor = '#30ff12';
export const DefaultBitSize = 20;
export const DefaultBitState = false;
