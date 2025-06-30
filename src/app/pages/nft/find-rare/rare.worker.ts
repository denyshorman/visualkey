import { ETH_PK_BIT_COUNT, MAX_PK_ADDRESS, MIN_PK_ADDRESS } from '../../../utils/eth-utils';
import { random } from '../../../utils/big-int-utils';
import { EthAccount } from '../../../models/eth-account';

onmessage = ({ data }: MessageEvent<RareWorkerInput>) => {
  while (true) {
    const privateKey = random(MIN_PK_ADDRESS, MAX_PK_ADDRESS, ETH_PK_BIT_COUNT);
    const ethAccount = new EthAccount(privateKey);

    if (ethAccount.addressLeadingBitsCount >= data.levelThreshold) {
      const msg = {
        privateKeyHex: ethAccount.privateKeyHex,
        privateKeyNumber: ethAccount.privateKey,
        addressHex: ethAccount.address,
        addressNumber: ethAccount.addressBigInt,
        level: ethAccount.addressLeadingBitsCount,
      } as RareWorkerOutput;

      postMessage(msg);
    }
  }
};

export interface RareWorkerInput {
  levelThreshold: number;
}

export interface RareWorkerOutput {
  privateKeyHex: string;
  privateKeyNumber: bigint;
  addressHex: string;
  addressNumber: bigint;
  level: number;
}
