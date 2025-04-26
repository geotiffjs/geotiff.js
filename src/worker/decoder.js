/* global globalThis */
/* eslint-disable import/no-mutable-exports */
import { getDecoder } from '../compression/index.js';

const worker = globalThis;

worker.addEventListener('message', async (e) => {
  const { fileDirectory, buffer, ...extra } = e.data;
  try {
    const decoder = await getDecoder(fileDirectory);
    const decoded = await decoder.decode(fileDirectory, buffer);
    worker.postMessage({ decoded, ...extra }, [decoded]);
  } catch (error) {
    worker.postMessage({ error: error.message, ...extra });
  }
});
