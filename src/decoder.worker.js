import { expose, Transfer } from 'threads/worker';
import { getDecoder } from './compression';

async async function decode(fileDirectory, buffer) {
  const decoder = await getDecoder(fileDirectory);
  const decoded = await decoder.decode(fileDirectory, buffer);
  return Transfer(decoded);
}

expose(decode);
