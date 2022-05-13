export class EthAddressUtils {
  static readonly MinPkAddress = BigInt(1);
  static readonly MaxPkAddress = BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141');

  static isPkValid(pk: bigint): boolean {
    return pk >= EthAddressUtils.MinPkAddress && pk < EthAddressUtils.MaxPkAddress;
  }

  static bigIntToPkHex(pk: bigint): string {
    return '0x' + pk.toString(16).padStart(64, '0');
  }
}
