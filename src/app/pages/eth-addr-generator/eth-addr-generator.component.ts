import { Component, computed, signal } from '@angular/core';
import { ETH_ADDR_BIT_COUNT, ETH_PK_BIT_COUNT, MAX_PK_ADDRESS, MIN_PK_ADDRESS } from '../../utils/eth-utils';
import { BitSetComponent, DefaultMouseEnterStrategy } from '../../components/bit-set/bit-set.component';
import { random } from '../../utils/big-int-utils';
import {
  BitSetControllerComponent,
  DefaultRandomBitSetGenInterval,
} from '../../components/bit-set-controller/bit-set-controller.component';
import { EthInfoComponent } from './eth-info/eth-info.component';
import { EthAddrHistoryComponent } from './eth-addr-history/eth-addr-history.component';
import { EthAccount } from '../../models/eth-account';

@Component({
  selector: 'app-eth-addr-generator',
  host: {
    class: 'flex flex-col items-center p-2 lg:px-8 lg:py-5',
    '(window:resize)': 'onResize()',
    '(window:keydown)': 'onKeyDown($event)',
    '(window:keyup)': 'onKeyUp($event)',
  },
  imports: [BitSetComponent, BitSetControllerComponent, EthInfoComponent, EthAddrHistoryComponent],
  template: `
    <div class="flex gap-5">
      <app-bit-set
        [bitCount]="pkBitCount"
        [gridCols]="pkCols"
        [(bitSet)]="pk"
        [bitCellSize]="bitCellSize()"
        [readOnly]="pkReadOnly()"
        [mouseEnterStrategy]="mouseEnterStrategy()"
        [mouseMoveDisabled]="mouseMoveDisabled()"
      ></app-bit-set>
      <app-bit-set
        [class.hidden]="!addressVisible()"
        [class.grayscale]="!ethAccount().isValid"
        [bitCount]="addressBitCount"
        [gridCols]="addressCols"
        [bitSet]="address()"
        [bitCellSize]="bitCellSize()"
        [mouseEnterStrategy]="mouseEnterStrategy()"
        [readOnly]="true"
      ></app-bit-set>
    </div>
    <app-bit-set-controller
      class="w-full mt-2"
      [bitCount]="pkBitCount"
      [(bitSet)]="pk"
      [keyRangeStart]="pkMin"
      [keyRangeEnd]="pkMax"
      [(mouseEnterStrategy)]="mouseEnterStrategy"
      [(mouseMoveDisabled)]="mouseMoveDisabled"
      (longRandomActiveChange)="pkReadOnly.set($event)"
      [randomBitSetGenInterval]="randomBitSetGenInterval()"
    ></app-bit-set-controller>
    <app-eth-info class="w-full mt-2" [ethAccount]="ethAccount()"></app-eth-info>
    <app-eth-addr-history
      class="self-stretch mt-1"
      [ethAccount]="ethAccount()"
      [(networkEnabled)]="networkEnabled"
    ></app-eth-addr-history>
  `,
})
export class EthAddrGeneratorComponent {
  readonly pkBitCount = ETH_PK_BIT_COUNT;
  readonly addressBitCount = ETH_ADDR_BIT_COUNT;
  readonly pkCols = 16;
  readonly addressCols = 10;
  readonly pkMin = MIN_PK_ADDRESS;
  readonly pkMax = MAX_PK_ADDRESS;
  readonly bitCellSize = signal(0);
  readonly mouseEnterStrategy = signal(DefaultMouseEnterStrategy);
  readonly mouseMoveDisabled = signal(false);
  readonly pk = signal(random(this.pkMin, this.pkMax, this.pkBitCount));
  readonly addressVisible = signal(false);
  readonly pkReadOnly = signal(false);
  readonly networkEnabled = signal(true);
  readonly randomBitSetGenInterval = computed(() => {
    return this.networkEnabled() ? DefaultRandomBitSetGenInterval : 0;
  });
  readonly ethAccount = computed(() => {
    return new EthAccount(this.pk());
  });
  readonly address = computed(() => {
    const account = this.ethAccount();
    return account.isValid ? BigInt(account.address) : BigInt(0);
  });

  constructor() {
    this.changeBitSize();
  }

  onResize() {
    this.changeBitSize();
  }

  onKeyDown(e: KeyboardEvent) {
    this.mouseMoveDisabledUpdate(e);
  }

  onKeyUp(e: KeyboardEvent) {
    this.mouseMoveDisabledUpdate(e);
  }

  private changeBitSize() {
    let bitSize = Math.floor((window.innerHeight / this.pkCols) * 0.4);

    if (bitSize * (this.pkCols + 4) > window.innerWidth) {
      bitSize = Math.floor((window.innerWidth / this.pkCols) * 0.85);
    }

    this.bitCellSize.set(bitSize);
    this.addressVisible.set((this.pkCols + this.addressCols + 4) * bitSize < window.innerWidth);
  }

  private mouseMoveDisabledUpdate(e: KeyboardEvent) {
    if (e.key === 'Control') {
      this.mouseMoveDisabled.update(v => !v);
    }
  }
}
