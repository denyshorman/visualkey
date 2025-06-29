import { Component, input, model, OnDestroy, signal, untracked } from '@angular/core';
import { invert, random, rotateLeft, rotateRight, setBits } from '../../utils/big-int-utils';
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
  faRepeat,
  faShuffle,
  faSquare
} from '@fortawesome/free-solid-svg-icons';
import { interval, Subscription } from 'rxjs';
import { AnalyticsService } from '../../services/analytics.service';
import { primaryInput } from 'detect-it';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LongPressDirective } from '../../directives/long-press.directive';
import { LoadBitSetDialogComponent } from '../load-bit-set-dialog/load-bit-set-dialog.component';
import { Tooltip } from 'primeng/tooltip';
import { Button } from 'primeng/button';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-bit-set-controller',
  host: {
    class: 'flex flex-wrap justify-center gap-1',
  },
  imports: [
    LoadBitSetDialogComponent,
    LongPressDirective,
    FaIconComponent,
    Tooltip,
    Button,
    NgClass,
  ],
  templateUrl: './bit-set-controller.component.html',
})
export class BitSetControllerComponent implements OnDestroy {
  readonly bitCount = input(256);
  readonly keyRangeStart = input(BigInt(0));
  readonly keyRangeEnd = input(setBits(untracked(this.bitCount)));
  readonly randomBitSetGenInterval = input(DefaultRandomBitSetGenInterval);
  readonly bitSet = model(BigInt(1));
  readonly mouseMoveDisabled = model(false);
  readonly mouseEnterStrategy = model(DefaultMouseEnterStrategy);
  readonly longRandomActive = model(false);
  readonly loadBitSetDialogVisible = signal(false);
  readonly icons = {
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
  readonly mouseEnterStrategies = {
    [MouseEnterStrategy.Clear]: {
      icon: faMinus,
      color: 'var(--app-bit-color-0)',
      tooltip: 'Clear Bit',
    },
    [MouseEnterStrategy.Flip]: {
      icon: faPlusMinus,
      color: undefined,
      tooltip: 'Flip Bit',
    },
    [MouseEnterStrategy.Set]: {
      icon: faPlus,
      color: 'var(--app-bit-color-1)',
      tooltip: 'Set Bit',
    },
  };
  readonly primaryInput = primaryInput;
  private longRandomSubscription = Subscription.EMPTY;

  constructor(private analytics: AnalyticsService) {}

  clearAll() {
    this.bitSet.set(BigInt(0));
    this.analytics.trackEvent('bitset_clear_all');
  }

  setAll() {
    this.bitSet.set(setBits(this.bitCount()));
    this.analytics.trackEvent('bitset_set_all');
  }

  random() {
    if (this.longRandomActive()) {
      this.stopLongRandom();
      return;
    }

    this.bitSet.set(random(this.keyRangeStart(), this.keyRangeEnd(), this.bitCount()));
    this.analytics.trackEvent('bitset_rnd');
  }

  longRandom() {
    if (this.longRandomActive()) {
      this.stopLongRandom();
      return;
    }

    this.analytics.trackEvent('bitset_long_rnd_start');

    this.longRandomActive.set(true);

    this.longRandomSubscription = interval(this.randomBitSetGenInterval()).subscribe(() => {
      this.bitSet.set(random(this.keyRangeStart(), this.keyRangeEnd(), this.bitCount()));
    });
  }

  stopLongRandom() {
    this.longRandomSubscription.unsubscribe();
    this.longRandomActive.set(false);
    this.analytics.trackEvent('bitset_long_rnd_stop');
  }

  rotateLeft() {
    this.bitSet.update(bitSet => rotateLeft(bitSet, this.bitCount(), 1));
    this.analytics.trackEvent('bitset_rotate_left');
  }

  rotateRight() {
    this.bitSet.update(bitSet => rotateRight(bitSet, this.bitCount(), 1));
    this.analytics.trackEvent('bitset_rotate_right');
  }

  rotateLeftLongStarted() {
    this.analytics.trackEvent('bitset_rotate_left_long_start');
  }

  rotateLeftLong() {
    this.bitSet.update(bitSet => rotateLeft(bitSet, this.bitCount(), 1));
  }

  rotateLeftLongEnded() {
    this.analytics.trackEvent('bitset_rotate_left_long_end');
  }

  rotateRightLongStarted() {
    this.analytics.trackEvent('bitset_rotate_right_long_start');
  }

  rotateRightLong() {
    this.bitSet.update(bitSet => rotateRight(bitSet, this.bitCount(), 1));
  }

  rotateRightLongEnded() {
    this.analytics.trackEvent('bitset_rotate_right_long_end');
  }

  invert() {
    this.bitSet.update(bitSet => invert(bitSet, this.bitCount()));
    this.analytics.trackEvent('bitset_invert');
  }

  lock() {
    this.mouseMoveDisabled.update(v => !v);
    this.analytics.trackEvent('bitset_lock_toggle');
  }

  changeMouseEnterStrategy() {
    this.mouseEnterStrategy.update(v => (v + 1) % 3);

    switch (this.mouseEnterStrategy()) {
      case MouseEnterStrategy.Clear:
        this.analytics.trackEvent('bitset_mouse_enter_clear');
        break;
      case MouseEnterStrategy.Flip:
        this.analytics.trackEvent('bitset_mouse_enter_flip');
        break;
      case MouseEnterStrategy.Set:
        this.analytics.trackEvent('bitset_mouse_enter_set');
        break;
      default:
        throw new Error('Unknown mouse enter strategy');
    }
  }

  openLoadBitSetDialog() {
    this.loadBitSetDialogVisible.set(true);
    this.analytics.trackEvent('bitset_load_dialog_open');
  }

  ngOnDestroy(): void {
    this.longRandomSubscription.unsubscribe();
  }
}

export const DefaultRandomBitSetGenInterval = 100;
