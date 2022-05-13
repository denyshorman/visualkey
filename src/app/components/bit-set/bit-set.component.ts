import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { BigIntUtils } from '../../utils/BigIntUtils';
import {
  DefaultBitSize,
  DefaultFalseStateColor,
  DefaultMouseEnterStrategy,
  DefaultTrueStateColor,
} from '../bit/bit.component';

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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['cols'] || changes['size']) {
      this.bitsArray = this.newBitsArray();
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

  private newBitsArray(): BitInfo[] {
    const size = this.size;
    const bitsArray = new Array(size);
    const that = this;

    for (let i = 0; i < size; i++) {
      bitsArray[i] = {
        pos: [Math.floor(i / this.cols) + 1, (i % this.cols) + 1],
        get value(): boolean {
          return BigIntUtils.getBit(that.bitSet, size - i - 1);
        },
        set value(bit: boolean) {
          const bitSet = BigIntUtils.setBit(that.bitSet, size - i - 1, bit);
          if (bitSet != that.bitSet) {
            that.bitSet = bitSet;
            that.bitSetChange.emit(that.bitSet);
          }
        },
      } as BitInfo;
    }

    return bitsArray;
  }
}

interface BitInfo {
  pos: Array<number>;
  value: boolean;
}
