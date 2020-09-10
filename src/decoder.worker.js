import { expose, Transfer } from 'threads/worker';
import { getDecoder } from './compression';

function decode(fileDirectory, buffer) {
  const decoder = getDecoder(fileDirectory);
  return Transfer(decoder.decode(fileDirectory, buffer));
}

expose(decode);
