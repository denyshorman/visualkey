import { Component, Input } from '@angular/core';
import { EthAddressUtils } from '../../utils/EthAddressUtils';

@Component({
  selector: 'app-eth-info',
  templateUrl: './eth-info.component.html',
  styleUrls: ['./eth-info.component.scss'],
})
export class EthInfoComponent {
  privateKeyHex?: string;
  address?: string;
  valid = false;

  private _privateKey?: bigint;

  @Input()
  get privateKey(): bigint | undefined {
    return this._privateKey;
  }

  set privateKey(pk: bigint | undefined) {
    this._privateKey = pk;
    this.valid = pk ? EthAddressUtils.isPkValid(pk) : false;

    if (this.valid) {
      this.privateKeyHex = EthAddressUtils.bigIntToPkHex(pk!);
      this.address = EthAddressUtils.privateKeyToAddress(pk!);
    } else {
      this.privateKeyHex = undefined;
      this.address = undefined;
    }
  }
}
