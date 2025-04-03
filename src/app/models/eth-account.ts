import { EthAddressUtils } from '../utils/EthAddressUtils';

export class EthAccount {
  readonly privateKey: bigint;

  constructor(privateKey: bigint) {
    this.privateKey = privateKey;
  }

  private _isValid?: boolean;

  get isValid(): boolean {
    if (this._isValid === undefined) {
      this._isValid = EthAddressUtils.isPkValid(this.privateKey);
    }

    return this._isValid;
  }

  private _privateKeyHex?: string;

  get privateKeyHex(): string {
    if (!this._privateKeyHex) {
      this._privateKeyHex = EthAddressUtils.bigIntToPkHex(this.privateKey);
    }

    return this._privateKeyHex;
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
