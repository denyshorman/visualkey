export function getBit(num: bigint, pos: number): boolean {
  return (num & (BigInt(1) << BigInt(pos))) > 0;
}

export function setBit(num: bigint, pos: number, value: boolean) {
  if (value) {
    return num | (BigInt(1) << BigInt(pos));
  } else {
    return num & ~(BigInt(1) << BigInt(pos));
  }
}

export function invertBit(num: bigint, pos: number): bigint {
  const bit = getBit(num, pos);
  return setBit(num, pos, !bit);
}

export function setBits(count: number): bigint {
  let value = BigInt(0);
  for (let i = 0; i < count; i++) {
    value = setBit(value, i, true);
  }
  return value;
}

export function bitsCount(num: bigint): number {
  let n = num;
  let count = 0;
  while (n > 0) {
    count++;
    n = n >> BigInt(1);
  }
  return count;
}

export function rotateLeft(num: bigint, bitsCount: number, rotateCount: number): bigint {
  let value = num;
  let i = 0;
  while (i < rotateCount) {
    const lastBit = getBit(value, bitsCount - 1);
    value = value << BigInt(1);
    value = setBit(value, bitsCount, false);
    value = setBit(value, 0, lastBit);
    i++;
  }
  return value;
}

export function rotateRight(num: bigint, bitsCount: number, rotateCount: number): bigint {
  let value = num;
  let i = 0;
  while (i < rotateCount) {
    const firstBit = getBit(value, 0);
    value = value >> BigInt(1);
    value = setBit(value, bitsCount - 1, firstBit);
    i++;
  }
  return value;
}

export function random(min: bigint, max: bigint, bitCount?: number): bigint {
  const size = bitCount ?? bitsCount(max);

  const byteCount = Math.ceil(size / 8);
  const rndBytes = new Uint8Array(byteCount);
  const crypto = globalThis.crypto;

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

export function invert(num: bigint, bitsCount: number): bigint {
  let inverted = num;
  for (let bitIndex = 0; bitIndex < bitsCount; bitIndex++) {
    inverted = invertBit(inverted, bitIndex);
  }
  return inverted;
}

export function countLeadingZeroBits(num: bigint, length: number): number {
  let count = 0;
  for (let i = length - 1; i >= 0; i--) {
    if (getBit(num, i)) {
      break;
    }
    count++;
  }
  return count;
}
