import { publicKeyToAddress } from 'viem/utils';
import { bigIntToPkHex, ETH_ADDR_BIT_COUNT, isPkValid, pkToPublicKey } from '../utils/eth-utils';
import { Hex } from 'viem';
import { countLeadingZeroBits } from '../utils/big-int-utils';

export class EthAccount {
  readonly privateKey: bigint;

  constructor(privateKey: bigint) {
    this.privateKey = privateKey;
  }

  private _isValid?: boolean;

  get isValid(): boolean {
    if (this._isValid === undefined) {
      this._isValid = isPkValid(this.privateKey);
    }

    return this._isValid;
  }

  private _privateKeyHex?: string;

  get privateKeyHex(): string {
    if (!this._privateKeyHex) {
      this._privateKeyHex = bigIntToPkHex(this.privateKey);
    }

    return this._privateKeyHex;
  }

  private _publicKey?: string;

  get publicKey(): string {
    if (!this._publicKey) {
      this._publicKey = pkToPublicKey(this.privateKey);
    }

    return this._publicKey;
  }

  private _address?: string;

  get address(): string {
    if (!this._address) {
      this._address = publicKeyToAddress(this.publicKey as Hex);
    }

    return this._address;
  }

  private _addressBigInt?: bigint;

  get addressBigInt(): bigint {
    if (!this._addressBigInt) {
      this._addressBigInt = BigInt(this.address);
    }

    return this._addressBigInt;
  }

  private _addressLeadingBitsCount?: number;

  get addressLeadingBitsCount(): number {
    if (this._addressLeadingBitsCount === undefined) {
      this._addressLeadingBitsCount = countLeadingZeroBits(this.addressBigInt, ETH_ADDR_BIT_COUNT);
    }

    return this._addressLeadingBitsCount;
  }
}
