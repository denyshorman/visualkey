import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { BigIntUtils } from '../../utils/BigIntUtils';
import {
  DefaultFalseStateColor,
  DefaultMouseEnterStrategy,
  DefaultTrueStateColor,
  MouseEnterStrategy,
} from '../bit-set/bit-set.component';
import { faSquareMinus, faSquarePlus } from '@fortawesome/free-regular-svg-icons';
import {
  faAnglesLeft,
  faAnglesRight,
  faKey,
  faLock,
  faMinus,
  faPlus,
  faPlusMinus,
  faRepeat,
  faShuffle,
  faSquare,
} from '@fortawesome/free-solid-svg-icons';
import { interval, Subscription } from 'rxjs';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { primaryInput } from 'detect-it';

@Component({
  selector: 'app-bit-set-controller',
  templateUrl: './bit-set-controller.component.html',
  styleUrls: ['bit-set-controller.component.scss'],
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
  @Input({ required: true }) gaLabel!: string;
  loadBitSetDialogVisible = false;
  nftDialogVisible = false;
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
  mouseEnterStrategies = {
    [MouseEnterStrategy.Clear]: {
      icon: faMinus,
      color: DefaultFalseStateColor,
      tooltip: 'Clear Bit',
    },
    [MouseEnterStrategy.Flip]: {
      icon: faPlusMinus,
      color: undefined,
      tooltip: 'Flip Bit',
    },
    [MouseEnterStrategy.Set]: {
      icon: faPlus,
      color: DefaultTrueStateColor,
      tooltip: 'Set Bit',
    },
  };
  primaryInput = primaryInput;
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
    if (this.longRandomActive) {
      this.stopLongRandom();
      return;
    }

    this.bitSet = BigIntUtils.random(this.keyRangeStart, this.keyRangeEnd, this.size);
    this.gaService.event('random', this.gaCategory, this.gaLabel);
  }

  longRandom() {
    if (this.longRandomActive) {
      this.stopLongRandom();
      return;
    }

    this.gaService.event('long_random_start', this.gaCategory, this.gaLabel);

    this.longRandomActive = true;
    this.longRandomFirstClick = true;

    this.longRandomSubscription = interval(this.randomBitSetGenInterval).subscribe(() => {
      this.bitSet = BigIntUtils.random(this.keyRangeStart, this.keyRangeEnd, this.size);
    });
  }

  stopLongRandom() {
    this.longRandomSubscription.unsubscribe();
    this.longRandomActive = false;
    this.gaService.event('long_random_stop', this.gaCategory, this.gaLabel);
  }

  rotateLeft() {
    this.bitSet = BigIntUtils.rotateLeft(this.bitSet, this.size, 1);
    this.gaService.event('rotate_left', this.gaCategory, this.gaLabel);
  }

  rotateRight() {
    this.bitSet = BigIntUtils.rotateRight(this.bitSet, this.size, 1);
    this.gaService.event('rotate_right', this.gaCategory, this.gaLabel);
  }

  rotateLeftLongStarted() {
    this.gaService.event('rotate_left_long_started', this.gaCategory, this.gaLabel);
  }

  rotateLeftLong() {
    this.bitSet = BigIntUtils.rotateLeft(this.bitSet, this.size, 1);
  }

  rotateLeftLongEnded() {
    this.gaService.event('rotate_left_long_ended', this.gaCategory, this.gaLabel);
  }

  rotateRightLongStarted() {
    this.gaService.event('rotate_right_long_started', this.gaCategory, this.gaLabel);
  }

  rotateRightLong() {
    this.bitSet = BigIntUtils.rotateRight(this.bitSet, this.size, 1);
  }

  rotateRightLongEnded() {
    this.gaService.event('rotate_right_long_ended', this.gaCategory, this.gaLabel);
  }

  invert() {
    this.bitSet = BigIntUtils.invert(this.bitSet, this.size);
    this.gaService.event('invert', this.gaCategory, this.gaLabel);
  }

  lock() {
    this.mouseMoveDisabled = !this.mouseMoveDisabled;
    this.gaService.event('lock', this.gaCategory, this.gaLabel);
  }

  changeMouseEnterStrategy() {
    if (++this._mouseEnterStrategy >= 3) {
      this._mouseEnterStrategy = 0;
    }

    this.mouseEnterStrategyChange.emit(this._mouseEnterStrategy);

    switch (this._mouseEnterStrategy) {
      case MouseEnterStrategy.Clear:
        this.gaService.event('mouse_enter_clear', this.gaCategory, this.gaLabel);
        break;
      case MouseEnterStrategy.Flip:
        this.gaService.event('mouse_enter_flip', this.gaCategory, this.gaLabel);
        break;
      case MouseEnterStrategy.Set:
        this.gaService.event('mouse_enter_set', this.gaCategory, this.gaLabel);
        break;
      default:
        throw new Error('Unknown mouse enter strategy');
    }
  }

  openLoadBitSetDialog() {
    this.loadBitSetDialogVisible = true;
    this.gaService.event('load', this.gaCategory, this.gaLabel);
  }

  openNftDialog() {
    this.nftDialogVisible = true;
    this.gaService.event('open_nft_dialog', this.gaCategory, this.gaLabel);
  }

  ngOnDestroy(): void {
    this.longRandomSubscription.unsubscribe();
  }
}

export const DefaultRandomBitSetGenInterval = 100;
