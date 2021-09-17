import { expose, Transfer } from 'threads/worker';
import { getDecoder } from './compression';

async function decode(fileDirectory, buffer) {
  const decoder = await getDecoder(fileDirectory);
  const decoded = await decoder.decode(fileDirectory, buffer);
  return Transfer(decoded);
}

expose(decode);
