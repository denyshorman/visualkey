import { EventEmitter, Injectable } from '@angular/core';
import { EthAddressUtils } from '../utils/EthAddressUtils';
import { ethers } from 'ethers';

@Injectable({
  providedIn: 'root',
})
export class EthAddrHistoryService {
  readonly history: Map<bigint, EthInfo> = new Map<bigint, EthInfo>();
  readonly pkAdded = new EventEmitter<bigint>();

  addAddress(pk: bigint) {
    if (EthAddressUtils.isPkValid(pk)) {
      if (this.history.has(pk)) {
        const info = this.history.get(pk);
        info!.addedTime = Date.now();
      } else {
        this.history.set(pk, new EthInfo(pk));
        this.pkAdded.emit(pk);
      }
    }
  }
}

class EthInfo {
  privateKey: bigint;
  addedTime: number;

  constructor(privateKey: bigint) {
    this.privateKey = privateKey;
    this.addedTime = Date.now();
  }

  private _publicKey?: string;

  get publicKey(): string {
    if (!this._publicKey) {
      const privateKeyStr = EthAddressUtils.bigIntToPkHex(this.privateKey);
      this._publicKey = ethers.utils.computePublicKey(privateKeyStr);
    }

    return this._publicKey;
  }

  private _address?: string;

  get address(): string {
    if (!this._address) {
      this._address = ethers.utils.computeAddress(this.publicKey);
    }

    return this._address;
  }
}
