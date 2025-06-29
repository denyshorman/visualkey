import { pad, publicKeyToAddress, toHex } from 'viem/utils';
import { secp256k1 } from '@noble/curves/secp256k1';
import { Hex } from 'viem';

export const ETH_PK_BIT_COUNT = 256;
export const ETH_ADDR_BIT_COUNT = 160;
export const MIN_PK_ADDRESS = 1n;
export const MAX_PK_ADDRESS = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
export const MAX_UINT256 = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
export const DEFAULT_MULTICALL_ADDRESS = '0xca11bde05977b3631167028862be2a173976ca11';

export function isPkValid(pk: bigint): boolean {
  return pk >= MIN_PK_ADDRESS && pk < MAX_PK_ADDRESS;
}

export function bigIntToPkHex(pk: bigint): string {
  return '0x' + pk.toString(16).padStart(64, '0');
}

export function pkToPublicKey(pk: bigint): string {
  return toHex(secp256k1.getPublicKey(pk, false));
}

export function privateKeyToAddress(pk: bigint): string {
  const publicKey = pkToPublicKey(pk);
  return publicKeyToAddress(publicKey as Hex);
}

export function bigIntToAddrHex(addr: bigint): string {
  const hex = toHex(addr);
  return pad(hex, { size: 20 });
}
