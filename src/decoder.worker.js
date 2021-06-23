import { expose, Transfer } from 'threads/worker';
import { getDecoder } from './compression/index.js';

async function decode(fileDirectory, buffer) {
  const decoder = getDecoder(fileDirectory);
  const decoded = await decoder.decode(fileDirectory, buffer);
  return Transfer(decoded);
}

expose(decode);
