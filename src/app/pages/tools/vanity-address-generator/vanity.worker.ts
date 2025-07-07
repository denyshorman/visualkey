import init, { find_address_with_mask } from '@visualkey/find-rare-keys';
import { bigIntToAddrHex } from 'src/app/utils/eth-utils';
import { hexToBytes, numberToHex } from 'viem';
import { Hex } from 'viem';

export interface WorkerInput {
  valueMask: bigint;
  careMask: bigint;
  batchSize: number;
}

onmessage = async ({ data }: MessageEvent<WorkerInput>) => {
  const { valueMask, careMask, batchSize } = data;

  await init({ module_or_path: 'assets/wasm/find_rare_keys_bg.wasm' });

  const valueMaskBytes = hexToBytes(bigIntToAddrHex(valueMask) as Hex);
  const careMaskBytes = hexToBytes(bigIntToAddrHex(careMask) as Hex);
  const batchSizeBytes = hexToBytes(numberToHex(batchSize, { size: 4 }));

  const mask = new Uint8Array(44);
  mask.set(valueMaskBytes, 0);
  mask.set(careMaskBytes, 20);
  mask.set(batchSizeBytes, 40);

  while (true) {
    const foundKey = find_address_with_mask(mask);

    if (foundKey) {
      postMessage({ foundKey });
      break;
    } else {
      postMessage({});
    }
  }
};
