import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { BigIntUtils } from '../../utils/BigIntUtils';

@Component({
  selector: 'app-bit-set',
  templateUrl: './bit-set.component.html',
  styleUrls: ['./bit-set.component.scss'],
})
export class BitSetComponent implements OnChanges {
  @Input() bitSet = BigInt(0);
  @Output() bitSetChange = new EventEmitter<bigint>();
  @Input() cols!: number;
  @Input() size!: number;
  @Input() bitSize = DefaultBitSize;
  @Input() falseStateColor = DefaultFalseStateColor;
  @Input() trueStateColor = DefaultTrueStateColor;
  @Input() mouseEnterStrategy = DefaultMouseEnterStrategy;
  @Input() readOnly = false;
  @Input() mouseMoveDisabled = false;
  bitsArray: BitInfo[] = [];
  private prevTouchElem?: Element;

  private static isLeftButtonPressed(e: MouseEvent): boolean {
    return e.buttons === 1 || e.button === 1;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['cols'] || changes['size']) {
      this.bitsArray = this.newBitsArray();
    }

    if (changes['bitSet']) {
      this.updateBitsArray();
    }
  }

  touchMove(e: TouchEvent) {
    if (this.readOnly) {
      return;
    }

    e.preventDefault();

    for (let i = 0; i < e.touches.length; i++) {
      const el = document.elementFromPoint(e.touches[i].pageX, e.touches[i].pageY);
      if (el && this.prevTouchElem != el) {
        this.prevTouchElem = el;
        el.dispatchEvent(new MouseEvent('mouseenter', { buttons: 1 }));
      }
    }
  }

  touchStart(e: TouchEvent) {
    if (this.readOnly) {
      return;
    }

    e.preventDefault();

    if (this.prevTouchElem === undefined) {
      e.target?.dispatchEvent(new MouseEvent('mousedown'));
    }

    this.prevTouchElem = undefined;
  }

  mouseEnter(e: MouseEvent, bit: BitInfo) {
    if (this.readOnly || (this.mouseMoveDisabled && !BitSetComponent.isLeftButtonPressed(e))) {
      return;
    } else {
      this.changeBitState(bit);
    }
  }

  mouseDown(bit: BitInfo) {
    if (this.readOnly) {
      return;
    }

    this.changeBitState(bit);
  }

  private newBitsArray(): BitInfo[] {
    const size = this.size;
    const bitsArray = new Array(size);
    const that = this;

    for (let i = 0; i < size; i++) {
      bitsArray[i] = {
        pos: [Math.floor(i / this.cols) + 1, (i % this.cols) + 1],
        valueCache: BigIntUtils.getBit(that.bitSet, size - i - 1),
        get value(): boolean {
          return bitsArray[i].valueCache;
        },
        set value(bit: boolean) {
          const bitSet = BigIntUtils.setBit(that.bitSet, size - i - 1, bit);
          if (bitSet != that.bitSet) {
            bitsArray[i].valueCache = bit;
            that.bitSet = bitSet;
            that.bitSetChange.emit(that.bitSet);
          }
        },
      } as BitInfo;
    }

    return bitsArray;
  }

  private updateBitsArray() {
    let bitSet = this.bitSet;
    let i = this.size - 1;
    while (bitSet > 0) {
      this.bitsArray[i].valueCache = (bitSet & BigInt(1)) > 0;
      bitSet = bitSet >> BigInt(1);
      i--;
    }
    while (i >= 0) {
      this.bitsArray[i].valueCache = false;
      i--;
    }
  }

  private changeBitState(bit: BitInfo) {
    switch (this.mouseEnterStrategy) {
      case MouseEnterStrategy.Set:
        bit.value = true;
        break;
      case MouseEnterStrategy.Clear:
        bit.value = false;
        break;
      case MouseEnterStrategy.Flip:
        bit.value = !bit.value;
        break;
      default:
        throw new Error(`Unrecognized mouse enter strategy ${this.mouseEnterStrategy}`);
    }
  }
}

interface BitInfo {
  pos: Array<number>;
  value: boolean;
  valueCache: boolean;
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
