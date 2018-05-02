/* eslint-disable no-restricted-globals */

import { getDecoder } from './compression';

let fileDirectory = {};

async function decode(self, compression, buffer) {
  const decoder = getDecoder(compression, fileDirectory);
  const result = await decoder.decodeBlock(buffer);
  self.postMessage([result], [result]);
}

self.addEventListener('message', (event) => {
  const [name, ...args] = event.data;
  switch (name) {
    case 'init':
      fileDirectory = args[1];
      break;
    case 'decode':
      decode(self, ...args);
      break;
    default:
      break;
  }
});
