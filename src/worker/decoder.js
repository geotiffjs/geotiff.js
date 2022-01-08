/* global globalThis */
/* eslint-disable import/no-mutable-exports */
import { getDecoder } from '../compression/index.js';

const worker = globalThis;

worker.addEventListener('message', async (e) => {
  const { id, fileDirectory, buffer } = e.data;
  const decoder = await getDecoder(fileDirectory);
  const decoded = await decoder.decode(fileDirectory, buffer);
  worker.postMessage({ decoded, id }, [decoded]);
});

export let create;
