/* eslint-disable no-restricted-globals */

import { getDecoder } from './compression';

async function decode(self, compression, buffer) {
  const decoder = getDecoder(compression);
  const result = await decoder.decodeBlock(buffer);
  self.postMessage([result], [result]);
}

self.addEventListener('message', (event) => {
  const [name, ...args] = event.data;
  switch (name) {
    case 'decode':
      decode(self, ...args);
      break;
    default:
      break;
  }
});
