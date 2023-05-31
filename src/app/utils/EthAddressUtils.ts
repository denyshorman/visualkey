import { toHex, publicKeyToAddress } from 'viem/utils';
import { secp256k1 } from '@noble/curves/secp256k1';
import { Hex } from 'viem';

export class EthAddressUtils {
  static readonly MinPkAddress = BigInt(1);
  static readonly MaxPkAddress = BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141');

  static isPkValid(pk: bigint): boolean {
    return pk >= EthAddressUtils.MinPkAddress && pk < EthAddressUtils.MaxPkAddress;
  }

  static bigIntToPkHex(pk: bigint): string {
    return '0x' + pk.toString(16).padStart(64, '0');
  }

  static pkToPublicKey(pk: bigint): string {
    return toHex(secp256k1.getPublicKey(pk, false));
  }

  static publicKeyToAddress(publicKey: string): string {
    return publicKeyToAddress(publicKey as Hex);
  }

  static privateKeyToAddress(pk: bigint): string {
    const publicKey = EthAddressUtils.pkToPublicKey(pk);
    return EthAddressUtils.publicKeyToAddress(publicKey);
  }
}
