import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { BigIntUtils } from '../../utils/BigIntUtils';
import { DefaultMouseEnterStrategy, MouseEnterStrategy } from '../bit-set/bit-set.component';
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
  faRepeat,
} from '@fortawesome/free-solid-svg-icons';
import { interval, Subscription } from 'rxjs';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { deviceType } from 'detect-it';

@Component({
  selector: 'app-bit-set-controller',
  templateUrl: './bit-set-controller.component.html',
  styleUrls: [],
})
export class BitSetControllerComponent implements OnDestroy {
  @Input() size = 256;
  @Input() keyRangeStart = BigInt(0);
  @Input() keyRangeEnd = BigIntUtils.setBits(this.size);
  @Input() randomBitSetGenInterval = DefaultRandomBitSetGenInterval;
  @Output() bitSetChange = new EventEmitter<bigint>();
  @Output() mouseEnterStrategyChange = new EventEmitter<MouseEnterStrategy>();
  @Output() mouseMoveDisabledChange = new EventEmitter<boolean>();
  @Output() longRandomActiveChange = new EventEmitter<boolean>();
  @Input() gaLabel?: string;
  loadBitSetDialogVisible = false;
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
    faRepeat,
  };
  mouseEnterStrategies = [
    {
      icon: faMinus,
      value: MouseEnterStrategy.Clear,
      tooltip: 'Mouse clears',
    },
    {
      icon: faPlusMinus,
      value: MouseEnterStrategy.Flip,
      tooltip: 'Mouse flips',
    },
    {
      icon: faPlus,
      value: MouseEnterStrategy.Set,
      tooltip: 'Mouse sets',
    },
  ];
  deviceType = deviceType;
  private readonly gaCategory = 'bit_set_controller';
  private longRandomSubscription = Subscription.EMPTY;

  constructor(private gaService: GoogleAnalyticsService) {}

  private _longRandomActive = false;

  get longRandomActive(): boolean {
    return this._longRandomActive;
  }

  set longRandomActive(value: boolean) {
    this._longRandomActive = value;
    this.longRandomActiveChange.emit(value);
  }

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
    this.gaService.event('clear_all', this.gaCategory, this.gaLabel);
  }

  setAll() {
    this.bitSet = BigIntUtils.setBits(this.size);
    this.gaService.event('set_all', this.gaCategory, this.gaLabel);
  }

  random() {
    if (this.longRandomFirstClick) {
      this.longRandomFirstClick = false;
    } else if (this.longRandomActive) {
      this.longRandomSubscription.unsubscribe();
      this.longRandomActive = false;
    } else {
      this.bitSet = BigIntUtils.random(this.keyRangeStart, this.keyRangeEnd, this.size);
      this.gaService.event('random', this.gaCategory, this.gaLabel);
    }
  }

  longRandom() {
    if (this.longRandomActive) {
      return;
    }

    this.gaService.event('long_random', this.gaCategory, this.gaLabel);

    this.longRandomActive = true;
    this.longRandomFirstClick = true;

    this.longRandomSubscription = interval(this.randomBitSetGenInterval).subscribe(() => {
      this.bitSet = BigIntUtils.random(this.keyRangeStart, this.keyRangeEnd, this.size);
    });
  }

  rotateLeft() {
    this.bitSet = BigIntUtils.rotateLeft(this.bitSet, this.size, 1);
    this.gaService.event('rotate_left', this.gaCategory, this.gaLabel);
  }

  rotateRight() {
    this.bitSet = BigIntUtils.rotateRight(this.bitSet, this.size, 1);
    this.gaService.event('rotate_right', this.gaCategory, this.gaLabel);
  }

  rotateLeftLong() {
    this.bitSet = BigIntUtils.rotateLeft(this.bitSet, this.size, 1);
    this.gaService.event('rotate_left_long', this.gaCategory, this.gaLabel);
  }

  rotateRightLong() {
    this.bitSet = BigIntUtils.rotateRight(this.bitSet, this.size, 1);
    this.gaService.event('rotate_right_long', this.gaCategory, this.gaLabel);
  }

  invert() {
    this.bitSet = BigIntUtils.invert(this.bitSet, this.size);
    this.gaService.event('invert', this.gaCategory, this.gaLabel);
  }

  lock() {
    this.mouseMoveDisabled = !this.mouseMoveDisabled;
    this.gaService.event('lock', this.gaCategory, this.gaLabel);
  }

  changeMouseEnterStrategy(strategy: MouseEnterStrategy) {
    this.mouseEnterStrategy = strategy;

    switch (strategy) {
      case MouseEnterStrategy.Clear:
        this.gaService.event('mouse_enter_clear', this.gaCategory, this.gaLabel);
        break;
      case MouseEnterStrategy.Flip:
        this.gaService.event('mouse_enter_flip', this.gaCategory, this.gaLabel);
        break;
      case MouseEnterStrategy.Set:
        this.gaService.event('mouse_enter_set', this.gaCategory, this.gaLabel);
        break;
    }
  }

  openLoadBitSetDialog() {
    this.loadBitSetDialogVisible = true;
    this.gaService.event('load', this.gaCategory, this.gaLabel);
  }

  ngOnDestroy(): void {
    this.longRandomSubscription.unsubscribe();
  }
}

export const DefaultRandomBitSetGenInterval = 100;
