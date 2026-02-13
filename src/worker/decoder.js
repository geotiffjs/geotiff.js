/* global globalThis */
/* eslint-disable import/no-mutable-exports */
import { getDecoder } from '../compression/index.js';

const worker = globalThis;

worker.addEventListener('message', async (e) => {
  const { compression, decoderParameters, buffer, ...extra } = e.data;
  try {
    const decoder = await getDecoder(compression, decoderParameters);
    const decoded = await decoder.decode(buffer);
    worker.postMessage({ decoded, ...extra }, { transfer: [decoded] });
  } catch (error) {
    if (error instanceof Error) {
      worker.postMessage({ error: error.message, ...extra });
    } else {
      worker.postMessage({ error: String(error), ...extra });
    }
  }
});
