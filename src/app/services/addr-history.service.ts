import { EventEmitter, Injectable } from '@angular/core';
import { EthAddressUtils } from '../utils/EthAddressUtils';

@Injectable({
  providedIn: 'root',
})
export class AddrHistoryService {
  readonly history: Map<bigint, Key> = new Map<bigint, Key>();
  readonly pkAdded = new EventEmitter<bigint>();

  private latestPk?: Key;

  // TODO: Limit the history size
  add(pk: bigint) {
    if (EthAddressUtils.isPkValid(pk)) {
      if (this.history.has(pk)) {
        const key = this.history.get(pk)!;
        key.addedTime = Date.now();
        this.latestPk = key;
      } else {
        const key = new Key(pk);
        this.latestPk = key;
        this.history.set(pk, key);
        this.pkAdded.emit(pk);
      }
    }
  }

  latest(): Key | undefined {
    return this.latestPk;
  }
}

export class Key {
  readonly privateKey: bigint;
  addedTime: number;

  constructor(privateKey: bigint) {
    this.privateKey = privateKey;
    this.addedTime = Date.now();
  }

  private _publicKey?: string;

  get publicKey(): string {
    if (!this._publicKey) {
      this._publicKey = EthAddressUtils.pkToPublicKey(this.privateKey);
    }

    return this._publicKey;
  }

  private _address?: string;

  get address(): string {
    if (!this._address) {
      this._address = EthAddressUtils.publicKeyToAddress(this.publicKey);
    }

    return this._address;
  }
}
