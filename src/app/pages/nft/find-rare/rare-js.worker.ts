import { ETH_PK_BIT_COUNT, MAX_PK_ADDRESS, MIN_PK_ADDRESS } from '../../../utils/eth-utils';
import { random } from '../../../utils/big-int-utils';
import { EthAccount } from '../../../models/eth-account';

onmessage = ({ data }: MessageEvent<JsRareWorkerInput>) => {
  const { levelThreshold, batchSize } = data;

  while (true) {
    const foundKeys = [];

    for (let i = 0; i < batchSize; i++) {
      const privateKey = random(MIN_PK_ADDRESS, MAX_PK_ADDRESS, ETH_PK_BIT_COUNT);
      const ethAccount = new EthAccount(privateKey);

      if (ethAccount.addressLeadingBitsCount >= levelThreshold) {
        foundKeys.push({
          privateKeyHex: ethAccount.privateKeyHex,
          privateKeyNumber: ethAccount.privateKey,
          addressHex: ethAccount.address,
          addressNumber: ethAccount.addressBigInt,
          level: ethAccount.addressLeadingBitsCount,
        });
      }
    }

    postMessage(foundKeys);
  }
};

interface JsRareWorkerInput {
  levelThreshold: number;
  batchSize: number;
}
