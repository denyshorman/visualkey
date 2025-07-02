import init, { generate_rare_keys_batch } from '@visualkey/find-rare-keys';

onmessage = async ({ data }: MessageEvent<WasmRareWorkerInput>) => {
  const { levelThreshold, batchSize } = data;

  await init({ module_or_path: 'assets/wasm/find_rare_keys_bg.wasm' });

  while (true) {
    const foundKeys = generate_rare_keys_batch(levelThreshold, batchSize);
    postMessage(foundKeys);
  }
};

interface WasmRareWorkerInput {
  levelThreshold: number;
  batchSize: number;
}
