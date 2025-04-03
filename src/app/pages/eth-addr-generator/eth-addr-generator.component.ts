import { Component, computed, signal } from '@angular/core';
import { EthAddressUtils } from '../../utils/EthAddressUtils';
import { BitSetComponent, DefaultMouseEnterStrategy } from '../../components/bit-set/bit-set.component';
import { BigIntUtils } from '../../utils/BigIntUtils';
import {
  BitSetControllerComponent,
  DefaultRandomBitSetGenInterval,
} from '../../components/bit-set-controller/bit-set-controller.component';
import { EthInfoComponent } from '../../components/eth-info/eth-info.component';
import { EthAddrHistoryComponent } from '../../components/eth-addr-history/eth-addr-history.component';
import { EthAccount } from '../../models/eth-account';

@Component({
  selector: 'app-eth-addr-generator',
  templateUrl: './eth-addr-generator.component.html',
  host: {
    '(window:resize)': 'onResize()',
    '(window:keydown)': 'onKeyDown($event)',
    '(window:keyup)': 'onKeyUp($event)',
  },
  imports: [BitSetComponent, BitSetControllerComponent, EthInfoComponent, EthAddrHistoryComponent],
})
export class EthAddrGeneratorComponent {
  readonly pkBitCount = 256;
  readonly addressBitCount = 160;
  readonly pkCols = 16;
  readonly addressCols = 10;
  readonly pkMin = EthAddressUtils.MinPkAddress;
  readonly pkMax = EthAddressUtils.MaxPkAddress;
  readonly bitCellSize = signal(0);
  readonly mouseEnterStrategy = signal(DefaultMouseEnterStrategy);
  readonly mouseMoveDisabled = signal(false);
  readonly pk = signal(BigIntUtils.random(this.pkMin, this.pkMax, this.pkBitCount));
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
