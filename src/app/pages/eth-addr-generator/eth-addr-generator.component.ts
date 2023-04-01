import { Component, HostListener } from '@angular/core';
import { EthAddrHistoryService } from '../../services/eth-addr-history.service';
import { EthAddressUtils } from '../../utils/EthAddressUtils';
import {
  DefaultFalseStateColor,
  DefaultMouseEnterStrategy,
  DefaultTrueStateColor,
} from '../../components/bit-set/bit-set.component';
import { BigIntUtils } from '../../utils/BigIntUtils';
import { DefaultRandomBitSetGenInterval } from '../../components/bit-set-controller/bit-set-controller.component';

@Component({
  selector: 'app-eth-addr-generator',
  templateUrl: './eth-addr-generator.component.html',
  styleUrls: ['./eth-addr-generator.component.scss'],
})
export class EthAddrGeneratorComponent {
  readonly pkSize = 256;
  readonly addressSize = 160;
  readonly pkCols = 16;
  readonly addressCols = 10;
  readonly pkMin = EthAddressUtils.MinPkAddress;
  readonly pkMax = EthAddressUtils.MaxPkAddress;
  mouseEnterStrategy = DefaultMouseEnterStrategy;
  pkFalseStateColor = DefaultFalseStateColor;
  pkTrueStateColor = DefaultTrueStateColor;
  addressFalseStateColor = DefaultFalseStateColor;
  addressTrueStateColor = DefaultTrueStateColor;
  bitSize!: number;
  address!: bigint;
  mouseMoveDisabled = false;
  pkValid!: boolean;
  addressVisible = false;
  pkReadOnly = false;
  randomBitSetGenInterval = DefaultRandomBitSetGenInterval;

  constructor(private ethAddrGenHistoryService: EthAddrHistoryService) {
    this.changeBitSize();
    this.pk = BigIntUtils.random(this.pkMin, this.pkMin, this.pkSize);
    this.pkValid = true;
  }

  private _networkRequestEnabled = true;

  get networkRequestEnabled(): boolean {
    return this._networkRequestEnabled;
  }

  set networkRequestEnabled(enabled: boolean) {
    this._networkRequestEnabled = enabled;

    if (enabled) {
      this.randomBitSetGenInterval = DefaultRandomBitSetGenInterval;
    } else {
      this.randomBitSetGenInterval = 0;
    }
  }

  private _pk!: bigint;

  get pk(): bigint {
    return this._pk;
  }

  set pk(pk: bigint) {
    this._pk = pk;
    this.ethAddrGenHistoryService.addAddress(pk);

    const ethInfo = this.ethAddrGenHistoryService.history.get(pk);

    if (ethInfo === undefined) {
      this.pkValid = false;
      this.address = BigInt(0);
    } else {
      this.pkValid = true;
      this.address = BigInt(ethInfo.address);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.changeBitSize();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    this.mouseMoveDisabledUpdate(e);
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent) {
    this.mouseMoveDisabledUpdate(e);
  }

  private changeBitSize() {
    this.bitSize = Math.floor((window.innerHeight / this.pkCols) * 0.4);

    if (this.bitSize * (this.pkCols + 4) > window.innerWidth) {
      this.bitSize = Math.floor((window.innerWidth / this.pkCols) * 0.85);
    }

    this.addressVisible = (this.pkCols + this.addressCols + 4) * this.bitSize < window.innerWidth;
  }

  private mouseMoveDisabledUpdate(e: KeyboardEvent) {
    if (e.key === 'Control') {
      this.mouseMoveDisabled = !this.mouseMoveDisabled;
    }
  }
}
