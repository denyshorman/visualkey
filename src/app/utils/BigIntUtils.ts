export class BigIntUtils {
  static getBit(num: bigint, pos: number): boolean {
    return (num & (BigInt(1) << BigInt(pos))) > 0;
  }

  static setBit(num: bigint, pos: number, value: boolean) {
    if (value) {
      return num | (BigInt(1) << BigInt(pos));
    } else {
      return num & ~(BigInt(1) << BigInt(pos));
    }
  }

  static invertBit(num: bigint, pos: number): bigint {
    const bit = BigIntUtils.getBit(num, pos);
    return BigIntUtils.setBit(num, pos, !bit);
  }

  static setBits(count: number): bigint {
    let value = BigInt(0);
    for (let i = 0; i < count; i++) {
      value = BigIntUtils.setBit(value, i, true);
    }
    return value;
  }

  static bitsCount(num: bigint): number {
    let n = num;
    let count = 0;
    while (n > 0) {
      count++;
      n = n >> BigInt(1);
    }
    return count;
  }

  static rotateLeft(num: bigint, bitsCount: number, rotateCount: number): bigint {
    let value = num;
    let i = 0;
    while (i < rotateCount) {
      const lastBit = BigIntUtils.getBit(value, bitsCount - 1);
      value = value << BigInt(1);
      value = BigIntUtils.setBit(value, bitsCount, false);
      value = BigIntUtils.setBit(value, 0, lastBit);
      i++;
    }
    return value;
  }

  static rotateRight(num: bigint, bitsCount: number, rotateCount: number): bigint {
    let value = num;
    let i = 0;
    while (i < rotateCount) {
      const firstBit = BigIntUtils.getBit(value, 0);
      value = value >> BigInt(1);
      value = BigIntUtils.setBit(value, bitsCount - 1, firstBit);
      i++;
    }
    return value;
  }

  static random(min: bigint, max: bigint, bitsCount?: number): bigint {
    const size = bitsCount ?? BigIntUtils.bitsCount(max);

    const byteCount = Math.ceil(size / 8);
    const rndBytes = new Uint8Array(byteCount);
    const crypto = window.crypto || window.msCrypto;

    if (crypto) {
      crypto.getRandomValues(rndBytes);
    } else {
      for (let i = 0; i < rndBytes.length; i++) {
        rndBytes[i] = Math.floor(Math.random() * 256);
      }
    }

    let rnd = 0n;

    for (const byte of rndBytes) {
      rnd = (rnd << 8n) | BigInt(byte);
    }

    if (rnd >= max || rnd < min) {
      rnd = min + (rnd % (max - min));
    }

    return rnd;
  }

  static invert(num: bigint, bitsCount: number): bigint {
    let inverted = num;
    for (let bitIndex = 0; bitIndex < bitsCount; bitIndex++) {
      inverted = BigIntUtils.invertBit(inverted, bitIndex);
    }
    return inverted;
  }
}
