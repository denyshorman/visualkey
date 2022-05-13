import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { BigIntUtils } from '../../utils/BigIntUtils';
import { DefaultMouseEnterStrategy, MouseEnterStrategy } from '../bit/bit.component';
import { faSquareMinus, faSquarePlus } from '@fortawesome/free-regular-svg-icons';
import {
  faAnglesLeft,
  faAnglesRight,
  faKey,
  faLock,
  faMinus,
  faPlus,
  faPlusMinus,
  faShuffle,
  faSquare,
} from '@fortawesome/free-solid-svg-icons';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-bit-set-controller',
  templateUrl: './bit-set-controller.component.html',
  styleUrls: [],
})
export class BitSetControllerComponent implements OnDestroy {
  @Input() size = 256;
  @Input() keyRangeStart = BigInt(0);
  @Input() keyRangeEnd = BigIntUtils.setBits(this.size);
  @Output() bitSetChange = new EventEmitter<bigint>();
  @Output() mouseEnterStrategyChange = new EventEmitter<MouseEnterStrategy>();
  @Output() mouseMoveDisabledChange = new EventEmitter<boolean>();
  loadBitSetDialogVisible = false;
  longRandomActive = false;
  longRandomFirstClick = false;
  icons = {
    faSquareMinus,
    faSquarePlus,
    faAnglesLeft,
    faAnglesRight,
    faShuffle,
    faKey,
    faMinus,
    faPlus,
    faPlusMinus,
    faSquare,
    faLock,
  };
  mouseEnterStrategies = [
    {
      icon: faMinus,
      value: MouseEnterStrategy.Clear,
    },
    {
      icon: faPlusMinus,
      value: MouseEnterStrategy.Flip,
    },
    {
      icon: faPlus,
      value: MouseEnterStrategy.Set,
    },
  ];
  private longRandomSubscription = Subscription.EMPTY;

  private _mouseMoveDisabled = false;

  @Input()
  get mouseMoveDisabled(): boolean {
    return this._mouseMoveDisabled;
  }

  set mouseMoveDisabled(disabled: boolean) {
    if (this._mouseMoveDisabled != disabled) {
      this._mouseMoveDisabled = disabled;
      this.mouseMoveDisabledChange.emit(disabled);
    }
  }

  private _mouseEnterStrategy = DefaultMouseEnterStrategy;

  @Input()
  get mouseEnterStrategy(): MouseEnterStrategy {
    return this._mouseEnterStrategy;
  }

  set mouseEnterStrategy(strategy: MouseEnterStrategy) {
    if (this._mouseEnterStrategy != strategy) {
      this._mouseEnterStrategy = strategy;
      this.mouseEnterStrategyChange.emit(strategy);
    }
  }

  private _bitSet = BigInt(1);

  @Input()
  get bitSet(): bigint {
    return this._bitSet;
  }

  set bitSet(bitSet: bigint) {
    if (this._bitSet != bitSet) {
      this._bitSet = bitSet;
      this.bitSetChange.emit(bitSet);
    }
  }

  clearAll() {
    this.bitSet = BigInt(0);
  }

  setAll() {
    this.bitSet = BigIntUtils.setBits(this.size);
  }

  random() {
    if (this.longRandomFirstClick) {
      this.longRandomFirstClick = false;
    } else if (this.longRandomActive) {
      this.longRandomSubscription.unsubscribe();
      this.longRandomActive = false;
    } else {
      this.bitSet = BigIntUtils.random(this.keyRangeStart, this.keyRangeEnd, this.size);
    }
  }

  longRandom() {
    if (this.longRandomActive) {
      return;
    }

    this.longRandomActive = true;
    this.longRandomFirstClick = true;

    this.longRandomSubscription = interval(100).subscribe(() => {
      this.bitSet = BigIntUtils.random(this.keyRangeStart, this.keyRangeEnd, this.size);
    });
  }

  rotateLeft() {
    this.bitSet = BigIntUtils.rotateLeft(this.bitSet, this.size, 1);
  }

  rotateRight() {
    this.bitSet = BigIntUtils.rotateRight(this.bitSet, this.size, 1);
  }

  lock() {
    this.mouseMoveDisabled = !this.mouseMoveDisabled;
  }

  openLoadBitSetDialog() {
    this.loadBitSetDialogVisible = true;
  }

  ngOnDestroy(): void {
    this.longRandomSubscription.unsubscribe();
  }
}
