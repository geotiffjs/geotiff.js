import { expose } from 'threads/worker';
import { getDecoder } from './compression/index';

function decode(fileDirectory, buffer) {
  const decoder = getDecoder(fileDirectory);
  return decoder.decode(fileDirectory, buffer);
}

expose(decode);
